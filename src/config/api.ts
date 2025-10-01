// API configuration for different environments
export const API_CONFIG = {
  // Local development
  local: {
    baseUrl: 'http://localhost:8081',
    generateEndpoint: '/generate'
  },
  
  // Production (AWS Lambda)
  production: {
    // Replace with your actual API Gateway URL from CloudFormation outputs
    baseUrl: 'https://YOUR_API_GATEWAY_ID.execute-api.us-east-1.amazonaws.com/dev',
    generateEndpoint: '/generate'
  }
};

// Determine current environment
const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';

export const currentConfig = isProduction ? API_CONFIG.production : API_CONFIG.local;

// Helper function to get the full API URL
export const getApiUrl = (endpoint: string) => {
  return `${currentConfig.baseUrl}${endpoint}`;
};