import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    server: {
      host: '::',
      port: 8080,
      proxy: !isProduction ? {
        '/generate': {
          target: 'http://localhost:8081',
          changeOrigin: true,
          rewrite: (path) => path,
        },
        '/api': {
          target: 'http://localhost:8081',
          changeOrigin: true,
        },
      } : undefined,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    define: {
      __IS_PRODUCTION__: isProduction,
    },
  };
});