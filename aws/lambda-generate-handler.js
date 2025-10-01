const { invokeModel } = require('./bedrock-lambda');

const REGION = process.env.REGION || 'us-east-1';
const TEXT_MODEL = process.env.TEXT_MODEL;

function mapFrontendToBedrockMessages(frontendMessages = [], instruction = null) {
  const out = [];
  if (instruction) {
    out.push({
      role: "user",
      content: [{ text: instruction }],
    });
  }
  for (const m of frontendMessages) {
    const role = m.role === "assistant" ? "assistant" : "user";
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
      `You are BrewPost assistant — a professional-grade social media strategist and planner for Instagram content.`
    ),
  };
  return await invokeModel(REGION, TEXT_MODEL, payload, 'application/json');
}

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://v2.dldudazkiseq7.amplifyapp.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { messages } = body;

    if (!Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Provide messages array" })
      };
    }

    const resp = await generateTextFromBedrock(messages);
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
      body: JSON.stringify({ ok: true, text })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "generate_failed", detail: err.message })
    };
  }
};