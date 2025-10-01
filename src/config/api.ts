// API configuration for different environments
export const API_CONFIG = {
  // Local development
  local: {
    baseUrl: 'http://localhost:8081',
    generateEndpoint: '/generate'
  },
  
  // Production (AWS Lambda)
  production: {
    // Use same domain for API calls (unified server running on same instance)
    baseUrl: '',
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