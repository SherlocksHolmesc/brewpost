// API configuration for different environments
export const API_CONFIG = {
  // Local development
  local: {
    baseUrl: 'http://localhost:8081',
    generateEndpoint: '/generate'
  },
  
  // Production (Lambda Function URL)
  production: {
    baseUrl: 'https://2oecunoueu3ke5zrtquduibkuy0mfbnf.lambda-url.us-east-1.on.aws',
    generateEndpoint: ''
  }
};

// Determine current environment
const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';

export const currentConfig = isProduction ? API_CONFIG.production : API_CONFIG.local;

// Helper function to get the full API URL
export const getApiUrl = (endpoint: string) => {
  return `${currentConfig.baseUrl}${endpoint}`;
};