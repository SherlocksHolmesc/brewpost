#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const environment = process.argv[2] || 'production';

console.log(`🚀 Deploying to ${environment} environment...`);

// Set environment variables for build
process.env.NODE_ENV = environment;
process.env.VITE_ENVIRONMENT = environment;

try {
  // Build the application
  console.log('📦 Building application...');
  execSync(`npm run build:${environment}`, { stdio: 'inherit' });

  // Copy server files to dist for Amplify
  console.log('📋 Copying server files...');
  const serverFiles = [
    'unified-server.js',
    'package.json',
    'package-lock.json'
  ];

  serverFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join('dist', file));
    }
  });

  // Copy src/server directory
  if (fs.existsSync('src/server')) {
    execSync('xcopy /E /I src\\server dist\\src\\server', { stdio: 'inherit' });
  }

  console.log('✅ Build completed successfully!');
  console.log('📁 Files are ready in the dist/ directory');
  
  if (environment === 'production') {
    console.log('🌐 Push to your repository to trigger Amplify deployment');
  }

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}