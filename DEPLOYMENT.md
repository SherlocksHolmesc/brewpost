# Deployment Guide

This application is configured to work both locally and on AWS Amplify.

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env` to `.env.local` and update values for local development
   - Ensure `VITE_BACKEND_URL=http://localhost:8081`

3. **Run development server:**
   ```bash
   # Run both frontend and backend
   npm run dev:full
   
   # Or run separately
   npm run dev:server  # Backend on port 8081
   npm run dev         # Frontend on port 8080
   ```

## AWS Amplify Deployment

### Prerequisites
- AWS Amplify app connected to your Git repository
- Environment variables configured in Amplify Console

### Environment Variables in Amplify Console
Set these in your Amplify app's Environment Variables:

```
VITE_BACKEND_URL=https://your-amplify-domain.amplifyapp.com
VITE_FRONTEND_URL=https://your-amplify-domain.amplifyapp.com
VITE_ENVIRONMENT=production
NODE_ENV=production

# Copy all other variables from your .env file
BEARER_TOKEN_BEDROCK=...
S3_BUCKET=...
COGNITO_CLIENT_ID=...
# etc.
```

### Deployment Steps

1. **Update your domain in configuration files:**
   - Update `FRONTEND_BASE_URL` in `.env`
   - Update URLs in `unified-server.js` CORS configuration
   - Update `.env.production` with your actual Amplify domain

2. **Deploy:**
   ```bash
   # Build for production
   npm run deploy:prod
   
   # Commit and push to trigger Amplify build
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

3. **Amplify will automatically:**
   - Install dependencies
   - Build the React app
   - Start the Express server
   - Serve both frontend and backend

## Environment Configuration

The app automatically detects the environment:
- **Local**: Uses `http://localhost:8081` for backend
- **Production**: Uses your Amplify domain for backend

## Troubleshooting

### CORS Issues
- Ensure your Amplify domain is added to the CORS configuration in `unified-server.js`
- Check that `FRONTEND_BASE_URL` environment variable is set correctly

### Backend Not Starting
- Check Amplify build logs for Node.js errors
- Ensure all environment variables are set in Amplify Console
- Verify `unified-server.js` is being executed

### API Calls Failing
- Check that `VITE_BACKEND_URL` points to the correct domain
- Ensure backend server is running on the expected port
- Verify AWS credentials and permissions are configured

## Architecture

```
┌─────────────────┐    ┌──────────────────┐
│   React App     │    │   Express API    │
│   (Port 8080)   │◄──►│   (Port 8081)    │
│                 │    │                  │
│ - Frontend UI   │    │ - AI Generation  │
│ - Routing       │    │ - Authentication │
│ - State Mgmt    │    │ - AWS Services   │
└─────────────────┘    └──────────────────┘
         │                       │
         └───────────────────────┘
              AWS Amplify
         (Single Domain Hosting)
```