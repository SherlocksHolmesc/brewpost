// Environment configuration
export const getEnvironmentConfig = () => {
  const isProduction = import.meta.env.PROD;
  const environment = import.meta.env.VITE_ENVIRONMENT || (isProduction ? 'production' : 'local');
  
  const config = {
    local: {
      backendUrl: 'http://localhost:8081',
      frontendUrl: 'http://localhost:8080',
    },
    production: {
      backendUrl: 'https://main.d3rq5op2806z3.amplifyapp.com',
      frontendUrl: 'https://main.d3rq5op2806z3.amplifyapp.com',
    }
  };

  return {
    environment,
    isProduction,
    backendUrl: import.meta.env.VITE_BACKEND_URL || config[environment as keyof typeof config]?.backendUrl || config.local.backendUrl,
    frontendUrl: import.meta.env.VITE_FRONTEND_URL || config[environment as keyof typeof config]?.frontendUrl || config.local.frontendUrl,
  };
};

export const ENV = getEnvironmentConfig();