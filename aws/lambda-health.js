// AWS Lambda function for health check
exports.handler = async (event) => {
  console.log('Health check invoked');

  // Handle CORS preflight
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_BASE_URL || 'https://v2.dldudazkiseq7.amplifyapp.com',
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

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ 
      ok: true, 
      timestamp: new Date().toISOString(),
      region: process.env.REGION || 'unknown'
    })
  };
};