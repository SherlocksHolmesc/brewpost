import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import pkg from "aws-sdk";
import { invokeModelViaHttp } from "./src/server/bedrock.js";

dotenv.config();

// Configure AWS credentials
if (process.env.ACCESS_KEY_ID && process.env.SECRET_ACCESS_KEY) {
  pkg.config.update({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: process.env.REGION || 'us-east-1'
  });
  console.log('✅ AWS credentials configured');
} else {
  console.warn('⚠️ AWS credentials not found in environment variables');
}

const { S3, DynamoDB } = pkg;
const app = express();
const PORT = process.env.PORT || 8080;
const REGION = process.env.REGION || "us-east-1";
const TEXT_MODEL = process.env.TEXT_MODEL;
const IMAGE_MODEL = process.env.IMAGE_MODEL;
const S3_BUCKET = process.env.S3_BUCKET;
const SCHEDULES_TABLE = process.env.SCHEDULES_TABLE || "Schedules";

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const FRONTEND_URL = process.env.FRONTEND_URL;
const REDIRECT_URI = process.env.REDIRECT_URI;

// Cognito configuration
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET;
const COGNITO_DOMAIN =
  process.env.COGNITO_DOMAIN ||
  "https://us-east-1lnmmjkyb9.auth.us-east-1.amazoncognito.com";

// CORS configuration
app.use(cors({
  origin: FRONTEND_URL,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(bodyParser.json());
app.use(express.json());

// Configure session
app.use(session({
  secret: process.env.SESSION_SECRET || "supersecret",
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: isProduction,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  },
}));

const s3 = new S3({ region: REGION });
const DDB = new DynamoDB.DocumentClient({ region: REGION });

// ============ COGNITO AUTH ROUTES ============

app.get("/api/auth/login", (req, res) => {
  const authUrl = `${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+phone&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.redirect(authUrl);
});

app.post("/api/auth/exchange", async (req, res) => {
  const { code } = req.body;

  try {
    const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokens = await response.json();

    if (tokens.error) {
      return res.status(400).json(tokens);
    }

    req.session.tokens = tokens;
    res.json({ success: true, tokens });
  } catch (err) {
    console.error("Token exchange error:", err);
    res.status(500).json({ error: "Token exchange failed" });
  }
});

app.get("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    const logoutUrl = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(FRONTEND_URL)}`;
    res.redirect(logoutUrl);
  });
});

app.get("/api/auth/status", (req, res) => {
  res.json({ authenticated: !!req.session.tokens });
});

// ============ BEDROCK FUNCTIONALITY ============

function mapFrontendToBedrockMessages(frontendMessages = [], instruction = null) {
  const out = [];
  if (instruction) {
    out.push({ role: "user", content: [{ text: instruction }] });
  }
  for (const m of frontendMessages) {
    const role = m.type === "ai" ? "assistant" : "user";
    out.push({ role, content: [{ text: String(m.content) }] });
  }
  return out;
}

async function generateTextFromBedrock(messagesArray) {
  const payload = {
    messages: mapFrontendToBedrockMessages(messagesArray, 
      `INSTRUCTION: You are BrewPost assistant. Generate content plans in this EXACT format:

## Post 1
**Title:** [Clean, professional title with NO emojis]
**Caption:** [Write a short, engaging caption in one brief paragraph (3-5 sentences max). Include one key insight. Add 2-3 emojis and hashtags.]
**Image Prompt:** [Detailed visual description including specific elements like lighting, composition, colors, style, mood, and any text overlays. Be specific about the setting, objects, people, and overall aesthetic. Make it 2-3 sentences long.]

## Post 2
**Title:** [Clean, professional title with NO emojis]
**Caption:** [Write a short, engaging caption in one brief paragraph (3-5 sentences max). Include one key insight. Add 2-3 emojis and hashtags.]
**Image Prompt:** [Detailed visual description including specific elements like lighting, composition, colors, style, mood, and any text overlays. Be specific about the setting, objects, people, and overall aesthetic. Make it 2-3 sentences long.]

[Continue for 7 posts total]

RULES:
- Generate exactly 7 posts
- Use "Post 1", "Post 2", etc. (not weekdays)
- Titles must be clean and professional with NO emojis
- Write short captions (one brief paragraph, 2-3 sentences max)
- Include storytelling, insights, and value in captions
- Add emojis and hashtags only in captions, not titles
- Make image prompts detailed and specific (2-3 sentences)
- NO extra explanations or introductions
- Start directly with "## Post 1"`
    ),
  };
  return invokeModelViaHttp(REGION, TEXT_MODEL, payload, "application/json");
}

async function generateImageFromBedrock(promptText, opts = {}) {
  const payload = {
    taskType: "TEXT_IMAGE",
    textToImageParams: { text: String(promptText ?? "") },
    imageGenerationConfig: {
      seed: opts.seed ?? Math.floor(Math.random() * 858993460),
      quality: opts.quality ?? "standard",
      width: opts.width ?? 832,
      height: opts.height ?? 1216,
      numberOfImages: opts.numberOfImages ?? 1,
    },
  };
  return invokeModelViaHttp(REGION, IMAGE_MODEL, payload, "application/json");
}

async function uploadBase64ToS3(base64, keyPrefix = "generated/") {
  const bucket = S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET env var not set");

  const matches = base64.match(/^data:(.+);base64,(.+)$/);
  let mime = "image/png";
  let data = base64;
  let ext = "png";
  if (matches) {
    mime = matches[1];
    data = matches[2];
    if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
    else if (mime.includes("png")) ext = "png";
  }
  const buffer = Buffer.from(data, "base64");
  const key = `${keyPrefix}${Date.now()}.${ext}`;

  try {
    await s3.putObject({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mime,
    }).promise();

    const presignedUrl = s3.getSignedUrl("getObject", {
      Bucket: bucket,
      Key: key,
      Expires: 864000, // 10 days
    });

    return presignedUrl;
  } catch (err) {
    console.error("S3 putObject failed:", err);
    throw new Error("S3 upload failed: " + (err?.message || JSON.stringify(err)));
  }
}

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, messages } = req.body;
    if (!prompt && !Array.isArray(messages)) {
      return res.status(400).json({ error: "Provide prompt or messages." });
    }

    const userText = typeof prompt === "string" ? prompt : 
      Array.isArray(messages) ? messages[messages.length - 1]?.content : "";

    const isImage = typeof userText === "string" && /image|cover|banner|foto|gambar/i.test(userText);

    if (isImage && IMAGE_MODEL) {
      const imageResp = await generateImageFromBedrock(userText);
      const maybeB64 = imageResp?.images?.[0] || imageResp?.outputs?.[0]?.body || 
        imageResp?.b64_image || imageResp?.image_base64 || imageResp?.base64;

      if (!maybeB64) {
        return res.status(500).json({ error: "No base64 found in image response", raw: imageResp });
      }

      const cleaned = typeof maybeB64 === "string" ? maybeB64.replace(/^"*|"*$/g, "") : maybeB64;
      const url = await uploadBase64ToS3(cleaned);
      return res.json({ ok: true, imageUrl: url, raw: imageResp });
    } else {
      const frontendMessages = Array.isArray(messages) ? messages : [{ role: "user", content: prompt }];
      const resp = await generateTextFromBedrock(frontendMessages);

      let text = null;
      try {
        const arr = resp?.output?.message?.content || [];
        for (const c of arr) {
          if (c?.text) {
            text = c.text;
            break;
          }
        }
      } catch (e) {}

      if (!text) text = JSON.stringify(resp).slice(0, 4000);
      return res.json({ ok: true, text, raw: resp });
    }
  } catch (err) {
    console.error("GENERATE ERROR", err?.stack || err);
    const msg = err?.message || String(err);
    if (msg.includes("403") || /access denied|not authorized/i.test(msg)) {
      return res.status(403).json({ error: "403 - Access denied to model", detail: msg });
    }
    return res.status(500).json({ error: "generate_failed", detail: msg });
  }
});

// Nova Canvas image generation endpoint
app.post("/api/generate-image-nova", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    console.log('Generating image with Nova Canvas for prompt:', prompt);
    
    // Use Nova Canvas model (amazon.nova-canvas-v1:0)
    const novaCanvasModel = "amazon.nova-canvas-v1:0";
    
    const payload = {
      taskType: "TEXT_IMAGE",
      textToImageParams: { text: String(prompt) },
      imageGenerationConfig: {
        seed: Math.floor(Math.random() * 858993460),
        quality: "premium", // Use premium quality for Nova Canvas
        width: 1024,
        height: 1024,
        numberOfImages: 1,
      },
    };

    const imageResp = await invokeModelViaHttp(REGION, novaCanvasModel, payload, "application/json");
    const maybeB64 = imageResp?.images?.[0] || imageResp?.outputs?.[0]?.body || 
      imageResp?.b64_image || imageResp?.image_base64 || imageResp?.base64;

    if (!maybeB64) {
      console.error('No base64 found in Nova Canvas response:', imageResp);
      return res.status(500).json({ error: "No base64 found in image response", raw: imageResp });
    }

    const cleaned = typeof maybeB64 === "string" ? maybeB64.replace(/^"*|"*$/g, "") : maybeB64;
    const fullBase64 = cleaned.startsWith('data:') ? cleaned : `data:image/png;base64,${cleaned}`;
    const url = await uploadBase64ToS3(fullBase64, "nova-canvas/");
    
    console.log('Nova Canvas image generated successfully:', url);
    return res.json({ ok: true, imageUrl: url, raw: imageResp });
  } catch (err) {
    console.error("NOVA CANVAS GENERATE ERROR", err?.stack || err);
    const msg = err?.message || String(err);
    if (msg.includes("403") || /access denied|not authorized/i.test(msg)) {
      return res.status(403).json({ error: "403 - Access denied to Nova Canvas model", detail: msg });
    }
    return res.status(500).json({ error: "nova_canvas_generate_failed", detail: msg });
  }
});

// Enhanced prompt generation endpoint
app.post("/api/generate-enhanced-prompt", async (req, res) => {
  try {
    const { title, content, postType } = req.body;
    if (!title && !content) {
      return res.status(400).json({ error: "Title or content is required" });
    }

    // Create enhanced prompt using AI
    const promptInstruction = `Create a detailed, professional image generation prompt for a social media ${postType || 'promotional'} post. 

Post Title: ${title || 'N/A'}
Post Content: ${content || 'N/A'}

Generate a comprehensive prompt that includes:
- Visual style (modern, professional, eye-catching)
- Color scheme (vibrant, brand-appropriate)
- Layout elements (text placement, composition)
- Specific details about imagery
- Typography style
- Overall mood and atmosphere

Make it suitable for Nova Canvas image generation. Focus on creating realistic, professional marketing materials without placeholder text. The prompt should be 2-3 sentences maximum but highly descriptive.`;

    const messages = [{ type: 'user', content: promptInstruction }];
    const aiResponse = await generateTextFromBedrock(messages);
    
    let enhancedPrompt = null;
    try {
      const arr = aiResponse?.output?.message?.content || [];
      for (const c of arr) {
        if (c?.text) {
          enhancedPrompt = c.text.trim();
          break;
        }
      }
    } catch (e) {
      console.error('Error parsing AI response:', e);
    }

    if (!enhancedPrompt) {
      return res.status(500).json({ error: "Failed to generate enhanced prompt" });
    }

    console.log('Enhanced prompt generated:', enhancedPrompt);
    return res.json({ ok: true, enhancedPrompt });
  } catch (err) {
    console.error("ENHANCED PROMPT GENERATE ERROR", err?.stack || err);
    const msg = err?.message || String(err);
    return res.status(500).json({ error: "enhanced_prompt_generate_failed", detail: msg });
  }
});

// Canvas image generation from node prompt
app.post("/api/canvas-generate-from-node", async (req, res) => {
  try {
    const { nodeId, imagePrompt, title, content } = req.body;
    if (!imagePrompt && !title && !content) {
      return res.status(400).json({ error: "Node must have imagePrompt, title, or content" });
    }

    // Create a comprehensive prompt from node data
    let finalPrompt = imagePrompt || '';
    if (!finalPrompt && title) {
      finalPrompt = `Create a professional social media image for: ${title}`;
      if (content) {
        finalPrompt += `. Content context: ${content.substring(0, 200)}`;
      }
    }
    
    // Only add basic enhancement if no detailed prompt exists
    if (!imagePrompt && finalPrompt.length < 100) {
      finalPrompt += '. Professional, high-quality, social media ready, modern design, vibrant colors';
    }
    
    console.log('Generating image from node:', nodeId, 'with prompt:', finalPrompt);
    
    // Use Nova Canvas model
    const novaCanvasModel = "amazon.nova-canvas-v1:0";
    
    const payload = {
      taskType: "TEXT_IMAGE",
      textToImageParams: { text: finalPrompt },
      imageGenerationConfig: {
        seed: Math.floor(Math.random() * 858993460),
        quality: "premium",
        width: 1024,
        height: 1024,
        numberOfImages: 1,
      },
    };

    const imageResp = await invokeModelViaHttp(REGION, novaCanvasModel, payload, "application/json");
    const maybeB64 = imageResp?.images?.[0] || imageResp?.outputs?.[0]?.body || 
      imageResp?.b64_image || imageResp?.image_base64 || imageResp?.base64;

    if (!maybeB64) {
      console.error('No base64 found in Nova Canvas response:', imageResp);
      return res.status(500).json({ error: "No base64 found in image response", raw: imageResp });
    }

    const cleaned = typeof maybeB64 === "string" ? maybeB64.replace(/^"*|"*$/g, "") : maybeB64;
    const fullBase64 = cleaned.startsWith('data:') ? cleaned : `data:image/png;base64,${cleaned}`;
    const url = await uploadBase64ToS3(fullBase64, "node-images/");
    
    console.log('Node image generated successfully:', url);
    return res.json({ ok: true, imageUrl: url, nodeId, prompt: finalPrompt });
  } catch (err) {
    console.error("NODE IMAGE GENERATE ERROR", {
      message: err?.message,
      stack: err?.stack,
      name: err?.name,
      code: err?.code,
      statusCode: err?.statusCode,
      requestId: err?.requestId
    });
    const msg = err?.message || String(err);
    return res.status(500).json({ 
      error: "node_image_generate_failed", 
      detail: msg,
      fullError: {
        message: err?.message,
        name: err?.name,
        code: err?.code
      }
    });
  }
});

app.get("/health", (req, res) => res.json({ ok: true, pid: process.pid }));

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Allowed origins: ${[FRONTEND_URL, 'http://localhost:8082', 'http://localhost:8080'].filter(Boolean).join(', ')}`);
  console.log(`Redirect URI: ${REDIRECT_URI}`);
});

app.get("/api/schedules/list", async (req, res) => {
  try {
    // Determine userId from session, header, or query param
    const userId =
      (req.session && req.session.tokens && req.session.tokens.id_token_payload && req.session.tokens.id_token_payload.sub) ||
      req.headers['x-user-id'] ||
      req.query.userId ||
      null;

    const readFuncUrl = process.env.SCHEDULES_READ_LAMBDA_FUNC_URL || process.env.PUBLIC_UPLOADER_FUNC_URL || null;

    // NEW DEBUG: log invocation info to help trace 500 responses
    console.log(`[schedules/list] called. userId=${userId}, query.userId=${req.query.userId}, header.x-user-id=${req.headers['x-user-id']}, readFuncUrl=${!!readFuncUrl}, SCHEDULES_TABLE=${SCHEDULES_TABLE}`);

    if (readFuncUrl) {
      // Require a userId to avoid exposing all data via function URL
      if (!userId) {
        return res.status(400).json({ ok: false, error: 'missing_userid', detail: 'Provide userId in session/header/query to list schedules' });
      }

      try {
        const funcHeaders = { 'Content-Type': 'application/json' };
        if (process.env.SCHEDULES_READ_LAMBDA_FUNC_URL_AUTH) {
          funcHeaders['Authorization'] = process.env.SCHEDULES_READ_LAMBDA_FUNC_URL_AUTH;
        }

        // call the per-user function URL
        const resp = await fetch(readFuncUrl, {
          method: 'POST',
          headers: funcHeaders,
          body: JSON.stringify({ action: 'listByUser', userId })
        });

        // parse body safely
        let body = null;
        let rawText = null;
        try {
          body = await resp.json();
        } catch (parseErr) {
          rawText = await resp.text().catch(() => null);
          console.warn('[schedules/list] function URL returned non-JSON or parse failed; rawText length=', rawText ? rawText.length : 0);
        }

        if (!resp.ok) {
          console.error('[schedules/list] Per-user Function URL returned non-200:', resp.status, body ?? rawText);
          // ensure we return serializable detail
          const detail = body ?? rawText ?? `HTTP ${resp.status}`;
          return res.status(500).json({ ok: false, error: 'function_url_error', status: resp.status, detail });
        }

        // Accept many common shapes from function URL:
        let schedulesRaw = null;
        if (Array.isArray(body)) {
          schedulesRaw = body;
        } else if (body && Array.isArray(body.schedules)) {
          schedulesRaw = body.schedules;
        } else if (body && Array.isArray(body.Items)) {
          schedulesRaw = body.Items;
        } else if (body && Array.isArray(body.items)) {
          schedulesRaw = body.items;
        } else if (body && Array.isArray(body.scheduled)) {
          schedulesRaw = body.scheduled;
        } else if (body && Array.isArray(body.data)) {
          schedulesRaw = body.data;
        }

        if (schedulesRaw !== null) {
          console.log('[schedules/list] Raw schedules from Lambda:', schedulesRaw);
          console.log('[schedules/list] First raw item:', schedulesRaw[0]);
          console.log('[schedules/list] First item title:', schedulesRaw[0]?.title);
          
          const items = (schedulesRaw || []).map(it => {
            console.log('[schedules/list] Mapping item:', it);
            console.log('[schedules/list] Item title field:', it.title, 'Type:', typeof it.title);
            return {
              scheduleId: it.scheduleId ?? it.id ?? it.ID ?? it.nodeId ?? null,
              userId: it.userId ?? userId,
              status: it.status ?? it.state ?? null,
              createdAt: it.createdAt ?? it.created_at ?? null,
              scheduledDate: it.scheduledDate ?? it.scheduled_date ?? it.scheduledAt ?? null,
              title: it.title ?? 'Untitled',
              content: it.content ?? null,
              imageUrl: it.imageUrl ?? null,
              type: it.type ?? 'post',
              raw: it
            };
          });
          console.log('[schedules/list] Mapped items:', items);
          return res.json({ ok: true, schedules: items });
        }

        // unexpected shape — stringify/capture for debugging
        const detail = body ?? rawText ?? 'empty_response';
        console.warn('[schedules/list] Per-user Function URL returned unexpected shape:', detail);
        return res.status(500).json({ ok: false, error: 'unexpected_function_response', detail: (typeof detail === 'string' ? detail : JSON.stringify(detail)) });
      } catch (funcErr) {
        console.error('[schedules/list] Per-user Function URL call failed:', funcErr && (funcErr.message || funcErr));
        // fallthrough to try DynamoDB query below
      }
    }

    // No function URL or function call failed: attempt to query DynamoDB by userId (preferred to scan)
    if (userId) {
      try {
        const q = {
          TableName: SCHEDULES_TABLE,
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': userId }
        };
        const data = await DDB.query(q).promise();
        const items = (data.Items || []).map(it => ({
          scheduleId: it.scheduleId ?? it.id ?? it.ID,
          userId: it.userId ?? userId,
          status: it.status ?? null,
          createdAt: it.createdAt ?? null,
          scheduledDate: it.scheduledDate ?? null,
          title: it.title ?? 'Untitled',
          content: it.content ?? null,
          imageUrl: it.imageUrl ?? null
        }));
        return res.json({ ok: true, schedules: items });
      } catch (queryErr) {
        console.warn('DynamoDB query by userId failed, will attempt scan as fallback:', queryErr && queryErr.message ? queryErr.message : queryErr);
        // If query failed due to permissions or table key mismatch, we will try scan below (with auth detection).
      }
    }

    // Fallback: scan the table (existing behavior) — keep auth detection
    try {
      const data = await DDB.scan({ TableName: SCHEDULES_TABLE }).promise();
      const items = (data.Items || []).map(it => ({
        scheduleId: it.scheduleId ?? it.id ?? it.ID,
        userId: it.userId ?? null,
        status: it.status ?? null,
        createdAt: it.createdAt ?? null,
        scheduledDate: it.scheduledDate ?? null,
        title: it.title ?? 'Untitled',
        content: it.content ?? null,
        imageUrl: it.imageUrl ?? null
      }));
      return res.json({ ok: true, schedules: items });
    } catch (scanErr) {
      console.error("Failed to list schedules (scan):", scanErr);

      const msg = scanErr && scanErr.message ? String(scanErr.message) : String(scanErr);
      const isScanDenied = /not authorized to perform: dynamodb:Scan/i.test(msg) ||
                           /is not authorized to perform: dynamodb:Scan/i.test(msg) ||
                           (/dynamodb:Scan/i.test(msg) && /not authorized|AccessDenied/i.test(msg));

      if (isScanDenied) {
        const detail = {
          message: msg,
          hint: 'The server identity is missing permission "dynamodb:Scan" (or related read actions) on the schedules table. Prefer attaching the per-user Lambda or grant read permissions to the server identity.'
        };
        console.error('DynamoDB Scan authorization error detected:', detail);
        return res.status(403).json({ ok: false, error: 'DynamoDBScanAuthorizationError', detail });
      }

      return res.status(500).json({ ok: false, error: "Failed to list schedules", detail: msg });
    }
  } catch (err) {
    console.error("Unhandled error in schedules list:", err);
    return res.status(500).json({ ok: false, error: 'list_failed', detail: err && err.message ? err.message : String(err) });
  }
});

app.post("/api/schedules/create-all", async (req, res) => {
  const { nodes } = req.body;
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return res.status(400).json({ ok: false, error: "No nodes provided" });
  }

  const lambdaName = process.env.SCHEDULES_LAMBDA_NAME || process.env.SCHEDULES_LAMBDA_ARN;
  const lambdaFuncUrl = process.env.SCHEDULES_LAMBDA_FUNC_URL || null; // <-- new env var
  if (!lambdaName && !lambdaFuncUrl) {
    console.error('SCHEDULES_LAMBDA_NAME/SCHEDULES_LAMBDA_ARN or SCHEDULES_LAMBDA_FUNC_URL not configured');
    return res.status(500).json({
      ok: false,
      error: 'schedules_lambda_not_configured',
      detail: 'Set SCHEDULES_LAMBDA_NAME or SCHEDULES_LAMBDA_ARN or SCHEDULES_LAMBDA_FUNC_URL in environment to the Lambda function or its function URL.'
    });
  }

  try {
    const userId =
      (req.session && req.session.tokens && req.session.tokens.id_token_payload && req.session.tokens.id_token_payload.sub) ||
      req.headers['x-user-id'] ||
      req.body.userId ||
      'anonymous';

    // NEW: validate nodes are non-empty and add quick debug logging
    if (!Array.isArray(nodes) || nodes.length === 0) {
      console.warn('create-all called with empty nodes array, aborting.');
      return res.status(400).json({ ok: false, error: 'nodes_empty', detail: 'No nodes provided to schedule' });
    }

    const payload = {
      action: 'createAll',
      userId,
      nodes: nodes.map(node => ({
        ...node,
        type: node.type || 'post' // ensure type is included
      })),
      nodes_count: Array.isArray(nodes) ? nodes.length : 0,
      debug: {
        schedulesTable: SCHEDULES_TABLE,
        region: REGION
      }
    };

    // Optional debug: print minimal preview if enabled via env
    if (process.env.SCHEDULES_DEBUG === 'true') {
      console.log('Dispatching schedules payload: nodes_count=', payload.nodes_count, 'firstNodePreview=', nodes[0] ? { id: nodes[0].id, title: nodes[0].title } : null, 'debug=', payload.debug);
    }

    // Try SDK invoke first if configured
    if (lambdaName) {
      try {
        const lambda = new pkg.Lambda({ region: REGION });
        const invokeResp = await lambda.invoke({
          FunctionName: lambdaName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify(payload)
        }).promise();

        let parsed;
        try { parsed = invokeResp.Payload ? JSON.parse(String(invokeResp.Payload)) : null; } catch (e) { parsed = null; }

        if (invokeResp.FunctionError) {
          console.error('Schedules lambda reported function error via SDK:', parsed || invokeResp);
          if (lambdaFuncUrl && /AccessDenied|not authorized|AccessDeniedException/i.test(JSON.stringify(parsed || ''))) {
            console.warn('Attempting fallback to Lambda function URL due to function error.');
          } else {
            return res.status(500).json({ ok: false, error: 'schedules_lambda_error', detail: parsed || invokeResp });
          }
        } else {
          console.log('Schedules lambda SDK response (parsed):', parsed);
          // If lambda says ok but returned no scheduled items, surface the full payload for debugging
          if (parsed && parsed.ok && Array.isArray(parsed.scheduled) && parsed.scheduled.length === 0) {
            console.warn('Lambda returned ok but scheduled array empty. Surface full lambda response to caller for inspection.');
            return res.status(200).json({ ok: true, warning: 'lambda_ok_but_no_items', lambdaResponse: parsed });
          }
          return res.status(parsed && parsed.ok === false ? 500 : 200).json(parsed);
        }
      } catch (sdkErr) {
        const msg = sdkErr && sdkErr.message ? sdkErr.message : String(sdkErr);
        console.error('Lambda SDK invoke failed:', msg);

        // Detect explicit missing lambda:InvokeFunction permission and handle it
        const isInvokeDenied = /not authorized to perform: lambda:InvokeFunction/i.test(msg) ||
                               /is not authorized to perform: lambda:InvokeFunction/i.test(msg);

        if (isInvokeDenied) {
          console.warn('Detected missing lambda:InvokeFunction permission for current identity.');

          // If function URL is available, fall back to HTTP POST
          if (lambdaFuncUrl) {
            console.warn('Falling back to configured Lambda Function URL:', lambdaFuncUrl);
            // allow flow to continue to Function URL invocation below
          } else {
            // No fallback available — return actionable guidance to the caller
            const detail = {
              message: msg,
              hint: 'The server process identity is missing permission "lambda:InvokeFunction" on the dispatcher Lambda. Attach a policy allowing lambda:InvokeFunction for the function ARN to the IAM user/role (see aws/allow-invoke-lambda-policy.json).'
            };
            console.error('Lambda invoke authorization error (no fallback):', detail);
            return res.status(403).json({ ok: false, error: 'lambda_invoke_authorization_error', detail });
          }
        } else {
          // For other SDK errors, only fallback if it's a general access denied and we have a function URL
          if (/access denied|not authorized|AccessDenied|AccessDeniedException/i.test(msg) && lambdaFuncUrl) {
            console.warn('Lambda SDK invoke denied; falling back to Lambda function URL:', lambdaFuncUrl);
            // fallthrough to HTTP invocation below
          } else {
            return res.status(500).json({ ok: false, error: 'invoke_failed', detail: msg });
          }
        }
      }
    }

    // Fallback: call Lambda Function URL via HTTP POST if available
    if (lambdaFuncUrl) {
      try {
        const funcHeaders = { 'Content-Type': 'application/json' };
        if (process.env.SCHEDULES_LAMBDA_FUNC_URL_AUTH) {
          funcHeaders['Authorization'] = process.env.SCHEDULES_LAMBDA_FUNC_URL_AUTH;
        }

        // Log call for debugging
        console.log(`POST ${lambdaFuncUrl} with nodes_count=${payload.nodes_count}`);

        const resp = await fetch(lambdaFuncUrl, {
          method: 'POST',
          headers: funcHeaders,
          body: JSON.stringify(payload)
        });
        const result = await resp.json().catch(() => null);
        if (!resp.ok) {
          console.error('Function URL returned non-200:', resp.status, result);
          return res.status(500).json({ ok: false, error: 'function_url_error', status: resp.status, detail: result });
        }
        console.log('Function URL response:', result);

        // treat generic success without scheduled items as actionable failure
        const hasScheduledArray = result && (Array.isArray(result.scheduled) || Array.isArray(result.results));
        const reportedSuccess = result && (result.ok === true || result.success === true);
        if (reportedSuccess && !hasScheduledArray) {
          console.error('Function URL responded success but did not return scheduled items:', result);
          return res.status(500).json({
            ok: false,
            error: 'lambda_success_no_items',
            detail: 'Lambda function responded with success but did not return any scheduled items. Check Lambda logs and that the function received nodes (nodes_count).',
            nodes_count_sent: payload.nodes_count,
            lambdaResponse: result
          });
        }

        // Normalize the response format
        const normalizedResult = {
          ...result,
          scheduled: result.scheduled || result.results || []
        };
        return res.status(result && result.ok === false ? 500 : 200).json(normalizedResult);
      } catch (httpErr) {
        console.error('Function URL POST failed:', httpErr);
        return res.status(500).json({ ok: false, error: 'function_url_invoke_failed', detail: httpErr && httpErr.message ? httpErr.message : String(httpErr) });
      }
    }

    // Should not reach here
    return res.status(500).json({ ok: false, error: 'no_invoke_path_available' });
  } catch (err) {
    console.error('Failed to invoke schedules lambda/path:', err);
    return res.status(500).json({ ok: false, error: 'invoke_failed', detail: err && err.message ? err.message : String(err) });
  }
});