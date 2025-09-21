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
const REGION = process.env.AWS_REGION || "us-east-1";
const TEXT_MODEL = process.env.TEXT_MODEL;
const IMAGE_MODEL = process.env.IMAGE_MODEL;
const S3_BUCKET = process.env.S3_BUCKET;

// ====== Cognito Configuration ======
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET;
const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN;
const REDIRECT_URI = process.env.REDIRECT_URI;
// ====== Server Configuration ======
const PORT = process.env.PORT || 8081;
const app = express();

// ====== Middleware Setup ======
app.use(express.json());
app.use(bodyParser.json());
app.use(
  cors({
    origin: "http://localhost:8080",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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

      Output should always be structured, useful, and ready to deploy in a content calendar or automation pipeline.`
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
  res.redirect(`http://localhost:8080/Callback?code=${code}`);
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

    req.session.tokens = tokens;
    res.json({ success: true });
  } catch (err) {
    console.error("Token exchange error:", err);
    res.status(500).json({ error: "Token exchange failed" });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    const logoutUrl = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=http://localhost:8080`;
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

// ====== Health Check Route ======
app.get("/health", (req, res) => res.json({ ok: true, pid: process.pid }));

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Unified server running on http://localhost:${PORT}`);
  console.log(`Region: ${REGION}`);
});
