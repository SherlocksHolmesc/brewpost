// AWS Lambda function for AI generation
const AWS = require('aws-sdk');
const { invokeModel } = require('./bedrock-lambda');

// Environment variables
const REGION = process.env.REGION || 'us-east-1';
const TEXT_MODEL = process.env.TEXT_MODEL;
const IMAGE_MODEL = process.env.IMAGE_MODEL;
const S3_BUCKET = process.env.S3_BUCKET;

// Initialize AWS services
const s3 = new AWS.S3({ region: REGION });

function mapFrontendToBedrockMessages(frontendMessages = [], instruction = null) {
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
      - Always clarify if the user's goal is ambiguous.
      - **Never repeat ideas or reuse phrasing** — each output should feel tailor-made.
      - Think like a senior creative strategist — **sharp, persuasive, and brand-aware**
      - Focus on real content value, storytelling power, and audience psychology.

      Output should always be structured, useful, and ready to deploy in a content calendar or automation pipeline.`
    ),
  };

  try {
    return await invokeModel(REGION, TEXT_MODEL, payload, 'application/json');
  } catch (error) {
    console.error('Bedrock text generation error:', error);
    throw error;
  }
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

  try {
    return await invokeModel(REGION, IMAGE_MODEL, payload, 'application/json');
  } catch (error) {
    console.error('Bedrock image generation error:', error);
    throw error;
  }
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

    // Generate a presigned URL for reading (valid 3600s)
    const presignedUrl = s3.getSignedUrl("getObject", {
      Bucket: bucket,
      Key: key,
      Expires: 3600,
    });

    return presignedUrl;
  } catch (err) {
    console.error("S3 putObject failed:", err);
    throw new Error("S3 upload failed: " + (err && err.message ? err.message : JSON.stringify(err)));
  }
}

exports.handler = async (event) => {
  console.log('Lambda invoked with event:', JSON.stringify(event, null, 2));

  // Handle CORS preflight
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_BASE_URL || 'https://main.d3rq5op2806z3.amplifyapp.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Parse the request body
    let body;
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (e) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    const { prompt, messages } = body;

    // Validate input
    if (!prompt && !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Provide prompt or messages." })
      };
    }

    const userText = typeof prompt === "string"
      ? prompt
      : Array.isArray(messages)
      ? messages[messages.length - 1]?.content
      : "";

    const isImage = typeof userText === "string" && /image|cover|banner|foto|gambar/i.test(userText);

    if (isImage && IMAGE_MODEL) {
      console.log('Generating image for prompt:', userText);
      
      const imageResp = await generateImageFromBedrock(userText);
      console.log("DEBUG: imageResp:", JSON.stringify(imageResp).slice(0, 2000));

      const maybeB64 = (imageResp && imageResp.images && imageResp.images[0]) ||
        imageResp?.outputs?.[0]?.body ||
        imageResp?.b64_image ||
        imageResp?.image_base64 ||
        imageResp?.base64 ||
        null;

      if (!maybeB64) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({
            error: "No base64 found in image response",
            raw: imageResp,
          })
        };
      }

      const cleaned = typeof maybeB64 === "string" ? maybeB64.replace(/^"+|"+$/g, "") : maybeB64;
      const url = await uploadBase64ToS3(cleaned);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ ok: true, imageUrl: url, raw: imageResp })
      };

    } else {
      console.log('Generating text for messages:', messages);
      
      const frontendMessages = Array.isArray(messages) ? messages : [{ role: "user", content: prompt }];
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

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ ok: true, text, raw: resp })
      };
    }

  } catch (err) {
    console.error("GENERATE ERROR", err && err.stack ? err.stack : err);
    const msg = (err && err.message) ? err.message : String(err);

    if (msg.includes("403") || /access denied|not authorized/i.test(msg)) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: "403 - Access denied to model", detail: msg })
      };
    }

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "generate_failed", detail: msg })
    };
  }
};