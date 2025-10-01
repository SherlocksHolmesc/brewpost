# Deploy Lambda functions for BrewPost AI Chatbot
param(
    [string]$Environment = "dev",
    [string]$StackName = "brewpost-ai-chatbot",
    [string]$Region = "us-east-1"
)

Write-Host "Deploying BrewPost AI Chatbot Lambda functions..." -ForegroundColor Green

# Check if AWS CLI is installed
if (!(Get-Command "aws" -ErrorAction SilentlyContinue)) {
    Write-Error "AWS CLI is not installed or not in PATH"
    exit 1
}

# Check if SAM CLI is installed
if (!(Get-Command "sam" -ErrorAction SilentlyContinue)) {
    Write-Error "SAM CLI is not installed or not in PATH"
    exit 1
}

# Set AWS region
$env:AWS_DEFAULT_REGION = $Region

try {
    # Build the SAM application
    Write-Host "Building SAM application..." -ForegroundColor Yellow
    sam build

    # Deploy the stack
    Write-Host "Deploying stack: $StackName" -ForegroundColor Yellow
    sam deploy --stack-name $StackName --region $Region --capabilities CAPABILITY_IAM --parameter-overrides Environment=$Environment

    # Get the API Gateway URL from stack outputs
    Write-Host "Getting API Gateway URL..." -ForegroundColor Yellow
    $apiUrl = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" --output text

    if ($apiUrl) {
        Write-Host "✅ Deployment successful!" -ForegroundColor Green
        Write-Host "API Gateway URL: $apiUrl" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Update src/config/api.ts with the API Gateway URL above"
        Write-Host "2. Replace 'YOUR_API_GATEWAY_ID' with the actual API Gateway ID"
        Write-Host "3. Rebuild and redeploy your frontend"
    } else {
        Write-Warning "Could not retrieve API Gateway URL from stack outputs"
    }

} catch {
    Write-Error "Deployment failed: $_"
    exit 1
}