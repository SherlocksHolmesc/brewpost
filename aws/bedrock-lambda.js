// AWS Bedrock service helper for Lambda environment
const AWS = require('aws-sdk');

// Initialize Bedrock Runtime client with automatic IAM role credentials
const bedrock = new AWS.BedrockRuntime({
  region: process.env.AWS_REGION || 'us-east-1'
});

/**
 * Invoke a Bedrock model using AWS SDK (Lambda-optimized)
 * @param {string} region - AWS region
 * @param {string} modelId - Bedrock model ID
 * @param {object} bodyJson - Request payload
 * @param {string} accept - Accept header (default: application/json)
 * @returns {Promise<object>} - Parsed response
 */
async function invokeModelViaAWS(region, modelId, bodyJson, accept = "application/json") {
  console.log('Invoking Bedrock model:', modelId);
  console.log('Region:', region);

  const params = {
    modelId: modelId,
    body: JSON.stringify(bodyJson),
    contentType: 'application/json',
    accept: accept
  };

  try {
    const response = await bedrock.invokeModel(params).promise();
    const responseBody = response.body.toString();
    
    try {
      return JSON.parse(responseBody);
    } catch (parseError) {
      console.warn('Failed to parse Bedrock response as JSON:', parseError);
      return responseBody;
    }
  } catch (error) {
    console.error('Bedrock invocation error:', error);
    
    // Enhanced error handling for common AWS issues
    if (error.code === 'AccessDeniedException') {
      throw new Error(`Access denied to Bedrock model ${modelId}. Check IAM permissions.`);
    } else if (error.code === 'ValidationException') {
      throw new Error(`Invalid request to Bedrock: ${error.message}`);
    } else if (error.code === 'ThrottlingException') {
      throw new Error(`Bedrock request throttled: ${error.message}`);
    } else if (error.code === 'ModelNotReadyException') {
      throw new Error(`Bedrock model ${modelId} is not ready`);
    }
    
    throw error;
  }
}

/**
 * Legacy HTTP-based invocation (fallback for non-Lambda environments)
 * This is the original implementation from bedrock.js
 */
async function invokeModelViaHttp(region, modelId, bodyJson, accept = "application/json") {
  const fetch = require("node-fetch");
  const API_KEY = process.env.AWS_BEARER_TOKEN_BEDROCK;
  
  if (!API_KEY) {
    throw new Error("Missing AWS_BEARER_TOKEN_BEDROCK env var");
  }

  const encodedModel = encodeURIComponent(modelId);
  const url = `https://bedrock-runtime.${region}.amazonaws.com/model/${encodedModel}/invoke`;

  console.log('DEBUG: Bedrock invoke url:', url);
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
    throw new Error(`Bedrock error ${res.status}: ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Smart invoke function that chooses the best method based on environment
 * Uses AWS SDK in Lambda, falls back to HTTP with bearer token in other environments
 */
function invokeModel(region, modelId, bodyJson, accept = "application/json") {
  // Check if we're in a Lambda environment (AWS_LAMBDA_FUNCTION_NAME is set in Lambda)
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    console.log('Using AWS SDK for Bedrock invocation (Lambda environment)');
    return invokeModelViaAWS(region, modelId, bodyJson, accept);
  } else {
    console.log('Using HTTP Bearer token for Bedrock invocation (local/server environment)');
    return invokeModelViaHttp(region, modelId, bodyJson, accept);
  }
}

module.exports = {
  invokeModel,
  invokeModelViaAWS,
  invokeModelViaHttp
};