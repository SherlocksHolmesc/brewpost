// API configuration for different environments
export const API_CONFIG = {
  // Local development
  local: {
    baseUrl: 'http://localhost:8081',
    generateEndpoint: '/generate'
  },
  
  // Production (Amplify)
  production: {
    baseUrl: 'https://v2.dldudazkiseq7.amplifyapp.com',
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