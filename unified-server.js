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

const { S3 } = pkg;
const app = express();
const PORT = process.env.PORT || 8080;
const REGION = process.env.REGION || "us-east-1";
const TEXT_MODEL = process.env.TEXT_MODEL;
const IMAGE_MODEL = process.env.IMAGE_MODEL;
const S3_BUCKET = process.env.S3_BUCKET;

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const FRONTEND_URL = process.env.FRONTEND_URL;
const REDIRECT_URI = process.env.REDIRECT_URI;

// Cognito configuration
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET;
const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN;

// CORS configuration
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:8082', 'http://localhost:8080'].filter(Boolean),
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
      `INSTRUCTION: You are BrewPost assistant — a professional-grade social media strategist and planner for Instagram content.`
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

      if (!text) {
        text = JSON.stringify(resp).slice(0, 4000);
      }
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