import fetch from "node-fetch";

export async function invokeModelViaHttp(region, modelId, bodyJson, accept = "application/json") {
  const API_KEY = process.env.BEARER_TOKEN_BEDROCK;
  if (!API_KEY) throw new Error("Missing AWS_BEARER_TOKEN_BEDROCK env var");

  const encodedModel = encodeURIComponent(modelId);
  const url = `https://bedrock-runtime.${region}.amazonaws.com/model/${encodedModel}/invoke`;

  console.log('DEBUG: Bedrock invoke url:', url); // remove in production
  console.log('DEBUG: Bedrock modelId (raw):', modelId);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: accept,
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(bodyJson),
  });

  const text = await res.text();
  if (!res.ok) {
    // include response body so you can inspect server error
    throw new Error(`Bedrock error ${res.status}: ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
