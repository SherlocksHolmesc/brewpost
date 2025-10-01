# Chatbot Deployment Guide

## Problem
Your chatbot works locally but fails when deployed to AWS because:
1. Local development proxies `/generate` to `localhost:8081`
2. Production deployment has no backend server running
3. Lambda functions exist but aren't connected to the frontend

## Solution: Deploy Lambda Backend

### Step 1: Install Prerequisites
```bash
# Install AWS CLI (if not already installed)
# Download from: https://aws.amazon.com/cli/

# Install SAM CLI
# Download from: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

# Verify installations
aws --version
sam --version
```

### Step 2: Configure AWS Credentials
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region (us-east-1)
```

### Step 3: Deploy Lambda Functions
```bash
cd aws
./deploy-lambda.ps1
```

Or manually:
```bash
cd aws
sam build
sam deploy --guided
```

### Step 4: Update Frontend Configuration
1. After deployment, note the API Gateway URL from the output
2. Update `src/config/api.ts`:
   ```typescript
   production: {
     baseUrl: 'https://YOUR_ACTUAL_API_ID.execute-api.us-east-1.amazonaws.com/dev',
     generateEndpoint: '/generate'
   }
   ```

### Step 5: Redeploy Frontend
```bash
npm run build
# Push changes to trigger Amplify rebuild
git add .
git commit -m "Update API configuration for production"
git push
```

## Alternative: Use Existing Unified Server

If you prefer to use your existing `unified-server.js`, you need to:

1. **Deploy server to AWS** (EC2, ECS, or Lambda)
2. **Update frontend config** to point to the deployed server
3. **Ensure CORS** allows your Amplify domain

### Quick Fix for Unified Server:
Update `vite.config.ts` to handle production:
```typescript
proxy: {
  '/generate': {
    target: process.env.NODE_ENV === 'production' 
      ? 'https://your-server-domain.com' 
      : 'http://localhost:8081',
    changeOrigin: true,
  }
}
```

## Environment Variables Needed

For Lambda deployment, ensure these are set in your AWS environment:
- `TEXT_MODEL`: Your Bedrock text model ARN
- `IMAGE_MODEL`: Your Bedrock image model ID  
- `S3_BUCKET`: Bucket for generated images
- `FRONTEND_BASE_URL`: Your Amplify app URL

## Testing

1. **Local**: `npm run dev` - should work with localhost:8081
2. **Production**: Deploy and test on your Amplify URL

## Troubleshooting

- **CORS errors**: Check `FRONTEND_BASE_URL` matches your Amplify domain
- **403 errors**: Verify IAM permissions for Bedrock and S3
- **404 errors**: Confirm API Gateway URL is correct in config