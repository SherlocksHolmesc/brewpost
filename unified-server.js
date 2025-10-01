import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import pkg from "aws-sdk";
import { invokeModelViaHttp } from "./src/server/bedrock.js";

dotenv.config();

const { S3 } = pkg;

// ====== AWS Configuration ======
const REGION = process.env.REGION || "us-east-1";
const TEXT_MODEL = process.env.TEXT_MODEL;
const IMAGE_MODEL = process.env.IMAGE_MODEL;
const S3_BUCKET = process.env.S3_BUCKET;

// ====== Cognito Configuration ======
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET;
const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN || "https://us-east-1lnmmjkyb9.auth.us-east-1.amazoncognito.com";
const REDIRECT_URI = process.env.REDIRECT_URI;
// ====== Server Configuration ======
const PORT = process.env.PORT || 8081;
const HOST = process.env.HOST || '0.0.0.0';
const app = express();

// ====== Middleware Setup ======
app.use(express.json());
app.use(bodyParser.json());
app.use(
  cors({
    origin: [
      "http://localhost:8080", 
      "https://main.d3rq5op2806z3.amplifyapp.com",
      "https://v2.dldudazkiseq7.amplifyapp.com"
    ],
    methods: ["GET", "POST", "OPTIONS"],
    // NEW: allow x-user-id so frontend can send userId header, and allow credentials for session cookies
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
    credentials: true,
  })
);

// Session configuration for auth
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret", // Change this in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // set true if using HTTPS
  })
);

// S3 client setup
const s3 = new S3({ region: REGION });

// ====== Helper Functions ======
function mapFrontendToBedrockMessages(
  frontendMessages = [],
  instruction = null
) {
  const out = [];
  if (instruction) {
    out.push({
      role: "user",
      content: [{ text: instruction }],
    });
  }
  for (const m of frontendMessages) {
    const role = m.type === "ai" ? "assistant" : "user";
    out.push({
      role,
      content: [{ text: String(m.content) }],
    });
  }
  return out;
}

async function generateTextFromBedrock(messagesArray) {
  const payload = {
    messages: mapFrontendToBedrockMessages(
      messagesArray,
      `INSTRUCTION: You are BrewPost assistant — a professional-grade **social media strategist and planner** for Instagram content.

      You operate in TWO MODES:

      1. PLANNER MODE:
      - Generate a 7-day weekly content plan (Monday–Sunday)
      - One post per day — **NO reels or carousels**. Only **single static image posts**
      - Each post must include:
        - **Title**: Strong, curiosity-driven line that must be **visibly placed inside the image**
        - **Caption**: Write a storytelling or educational caption (aim for blog-style or micro-essay length). It should be engaging, unique, non-repetitive, and include **2–3 relevant emojis** + strategic hashtags. Avoid filler or generic tips — write like a thought leader.
        - **Image Prompt**: Describe the visual content of the post, including how the **title should appear inside the image** (font size/placement/vibe optional but encouraged)

      2. STRATEGIST MODE:
      - When given goals, ideas, or raw themes, help by:
        - Brainstorming compelling **title options**
        - Crafting detailed **image prompt suggestions** (including embedded text/title)
        - Recommending the **tone, structure, or opening hook** of the caption
        - Offering complete **caption drafts** with strong strategic positioning

      GENERAL RULES:
      - Always clarify if the user’s goal is ambiguous.
      - **Never repeat ideas or reuse phrasing** — each output should feel tailor-made.
      - Think like a senior creative strategist — **sharp, persuasive, and brand-aware**
      - Focus on real content value, storytelling power, and audience psychology.

      Output format (critical):
      - Respond ONLY with plain text. 
      - DO NOT use Markdown headings (#, ##, ###, ####), bold (**…**), italics (*…*), code fences (\`\`\`), or --- separators.`
    ),
  };
  return invokeModelViaHttp(REGION, TEXT_MODEL, payload, "application/json");
}

async function generateImageFromBedrock(promptText, opts = {}) {
  const payload = {
    taskType: "TEXT_IMAGE",
    textToImageParams: {
      text: String(promptText ?? ""),
    },
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
    await s3
      .putObject({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mime,
      })
      .promise();

    const presignedUrl = s3.getSignedUrl("getObject", {
      Bucket: bucket,
      Key: key,
      Expires: 3600,
    });

    return presignedUrl;
  } catch (err) {
    console.error("S3 putObject failed:", err);
    throw new Error(
      "S3 upload failed: " +
        (err && err.message ? err.message : JSON.stringify(err))
    );
  }
}

// ====== Authentication Routes ======
app.get("/login", (req, res) => {
  const authUrl = `${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+phone&redirect_uri=${REDIRECT_URI}`;
  res.redirect(authUrl);
});

app.get("/Callback", (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("No code received from Cognito");
  }
  res.redirect(`${FRONTEND_URL}/Callback?code=${code}`);
});

app.post("/api/auth/exchange", async (req, res) => {
  const { code } = req.body;

  try {
    const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
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

    // store tokens in server session
    req.session.tokens = tokens;

    // NEW: also return the tokens to the client so the frontend can decode id_token and set localStorage.userId
    // This keeps the session on server for auth while allowing the SPA to derive the user's sub for per-user fetches during development.
    return res.json({ success: true, tokens });
  } catch (err) {
    console.error("Token exchange error:", err);
    res.status(500).json({ error: "Token exchange failed" });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    const logoutUrl = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=http://localhost:8080/`;
    res.redirect(logoutUrl);
  });
});

// ====== AI Generation Routes ======
app.post("/generate", async (req, res) => {
  try {
    const { prompt, messages } = req.body;
    if (!prompt && !Array.isArray(messages)) {
      return res.status(400).json({ error: "Provide prompt or messages." });
    }

    const userText =
      typeof prompt === "string"
        ? prompt
        : Array.isArray(messages)
        ? messages[messages.length - 1]?.content
        : "";

    const isImage =
      typeof userText === "string" &&
      /image|cover|banner|foto|gambar/i.test(userText);

    if (isImage && IMAGE_MODEL) {
      const imageResp = await generateImageFromBedrock(userText);
      console.log(
        "DEBUG: imageResp:",
        JSON.stringify(imageResp).slice(0, 2000)
      );

      const maybeB64 =
        (imageResp && imageResp.images && imageResp.images[0]) ||
        imageResp?.outputs?.[0]?.body ||
        imageResp?.b64_image ||
        imageResp?.image_base64 ||
        imageResp?.base64 ||
        null;

      if (!maybeB64) {
        return res.status(500).json({
          error: "No base64 found in image response",
          raw: imageResp,
        });
      }

      const cleaned =
        typeof maybeB64 === "string"
          ? maybeB64.replace(/^"+|"+$/g, "")
          : maybeB64;
      const url = await uploadBase64ToS3(cleaned);
      return res.json({ ok: true, imageUrl: url, raw: imageResp });
    } else {
      const frontendMessages = Array.isArray(messages)
        ? messages
        : [{ role: "user", content: prompt }];
      const resp = await generateTextFromBedrock(frontendMessages);

      let text = null;
      try {
        const arr = resp?.output?.message?.content || [];
        for (const c of arr) {
          if (c && c.text) {
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
    console.error("GENERATE ERROR", err && err.stack ? err.stack : err);
    const msg = err && err.message ? err.message : String(err);
    if (msg.includes("403") || /access denied|not authorized/i.test(msg)) {
      return res
        .status(403)
        .json({ error: "403 - Access denied to model", detail: msg });
    }
    return res.status(500).json({ error: "generate_failed", detail: msg });
  }
});

// ====== Schedules / Calendar endpoints ======
const DDB = new pkg.DynamoDB.DocumentClient({ region: REGION });
const SNS = new pkg.SNS({ region: REGION });
const SCHEDULES_TABLE = process.env.SCHEDULES_TABLE || "Schedules";
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || process.env.SNS_TOPIC_ARN || null;

// small helper: retry with exponential backoff
async function retryable(fn, attempts = 3, baseDelay = 200) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const delay = baseDelay * Math.pow(2, i);
      console.warn(`Retryable attempt ${i + 1} failed, retrying in ${delay}ms:`, err && err.message ? err.message : err);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// Create multiple schedules: persist to DynamoDB and publish SNS message per node
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
      nodes,
      // include count and debug info so Lambda logs can be correlated
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
        const hasScheduledArray = result && Array.isArray(result.scheduled);
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

        return res.status(result && result.ok === false ? 500 : 200).json(result ?? { ok: true, scheduled: [] });
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

// List schedules (simple scan; prefer per-user Lambda function URL or query by userId)
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
    return res.status(500).json({ ok: false, error: 'list_failed', detail: err && err.message ? err.message : String(err) });
  }
});

// Update schedule
app.put("/api/schedules/update/:id", async (req, res) => {
  const id = req.params.id;
  const body = req.body || {};
  try {
    const updateParams = {
      TableName: SCHEDULES_TABLE,
      Key: { scheduleId: id }, // <-- use scheduleId as the key
      UpdateExpression: "SET #t = :t, #s = :s, scheduledDate = :sd, content = :c, imageUrl = :i",
      ExpressionAttributeNames: { "#t": "title", "#s": "status" },
      ExpressionAttributeValues: {
        ":t": body.title || "Untitled",
        ":s": body.status || "scheduled",
        ":sd": body.scheduledDate ? (typeof body.scheduledDate === "string" ? body.scheduledDate : new Date(body.scheduledDate).toISOString()) : null,
        ":c": body.content || "",
        ":i": body.imageUrl || null,
      },
      ReturnValues: "ALL_NEW",
    };

    const result = await DDB.update(updateParams).promise();
    return res.json({ ok: true, updated: result.Attributes });
  } catch (err) {
    console.error("Failed to update schedule:", err);
    return res.status(500).json({ ok: false, error: "Failed to update schedule", detail: err && err.message ? err.message : String(err) });
  }
});

// Delete schedule
app.delete("/api/schedules/delete/:id", async (req, res) => {
  const id = req.params.id;
  try {
    // delete by scheduleId (PK)
    await DDB.delete({ TableName: SCHEDULES_TABLE, Key: { scheduleId: id } }).promise();

    // Notify SNS to remove the EventBridge rule / scheduler if your Lambda handles deletion
    if (SNS_TOPIC_ARN) {
      try {
        await SNS.publish({
          TopicArn: SNS_TOPIC_ARN,
          Message: JSON.stringify({ action: "delete-schedule", scheduleId: id }),
        }).promise();
      } catch (snsErr) {
        console.warn("SNS publish failed on delete for scheduleId", id, snsErr);
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete schedule:", err);
    return res.status(500).json({ ok: false, error: "Failed to delete schedule", detail: err && err.message ? err.message : String(err) });
  }
});

// ====== Health Check Route ======
app.get("/health", (req, res) => res.json({ ok: true, pid: process.pid }));

// Start the server
app.listen(PORT, HOST, () => {
  console.log(`✅ Unified server running on http://${HOST}:${PORT}/`);
  console.log(`Region: ${REGION}`);
});