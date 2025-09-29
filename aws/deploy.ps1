# BrewPost AI Backend Deployment Script
param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [string]$StackName = "brewpost-ai-backend",
    
    [Parameter(Mandatory=$false)]
    [string]$S3DeployBucket = "brewpost-deployment-artifacts",
    
    [Parameter(Mandatory=$false)]
    [string]$FrontendUrl = "https://main.d3rq5op2806z3.amplifyapp.com"
)

Write-Host "🚀 Deploying BrewPost AI Backend to AWS..." -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "Stack Name: $StackName-$Environment" -ForegroundColor Yellow

# Check if AWS CLI is installed
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Error "AWS CLI is not installed. Please install it first."
    exit 1
}

# Check if SAM CLI is installed
if (-not (Get-Command sam -ErrorAction SilentlyContinue)) {
    Write-Error "SAM CLI is not installed. Please install it first."
    exit 1
}

# Change to aws directory
$awsDir = Join-Path $PSScriptRoot "aws"
if (-not (Test-Path $awsDir)) {
    Write-Error "AWS directory not found at $awsDir"
    exit 1
}

Set-Location $awsDir

Write-Host "📦 Building SAM application..." -ForegroundColor Blue
sam build

if ($LASTEXITCODE -ne 0) {
    Write-Error "SAM build failed"
    exit 1
}

Write-Host "🚀 Deploying to AWS..." -ForegroundColor Blue
sam deploy --guided --stack-name "$StackName-$Environment" --region $Region --parameter-overrides "Environment=$Environment" "FrontendBaseUrl=$FrontendUrl" --capabilities CAPABILITY_IAM

if ($LASTEXITCODE -ne 0) {
    Write-Error "SAM deployment failed"
    exit 1
}

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green

# Get the API Gateway URL from CloudFormation outputs
Write-Host "📋 Getting API Gateway URL..." -ForegroundColor Blue
$apiUrl = aws cloudformation describe-stacks --stack-name "$StackName-$Environment" --region $Region --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" --output text

if ($apiUrl) {
    Write-Host "🌐 API Gateway URL: $apiUrl" -ForegroundColor Green
    Write-Host "📄 Health Check: $apiUrl/health" -ForegroundColor Cyan
    Write-Host "🤖 Generate Endpoint: $apiUrl/generate" -ForegroundColor Cyan
    
    # Test the health endpoint
    Write-Host "🩺 Testing health endpoint..." -ForegroundColor Blue
    try {
        $healthResponse = Invoke-RestMethod -Uri "$apiUrl/health" -Method Get
        Write-Host "✅ Health check passed: $($healthResponse | ConvertTo-Json)" -ForegroundColor Green
    } catch {
        Write-Warning "⚠️ Health check failed: $($_.Exception.Message)"
    }
} else {
    Write-Warning "Could not retrieve API Gateway URL from CloudFormation outputs"
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Magenta
Write-Host "1. Update your frontend environment variables with the API Gateway URL" -ForegroundColor White
Write-Host "2. Replace localhost:8081 references with the new API URL" -ForegroundColor White
Write-Host "3. Test the AI generation functionality" -ForegroundColor White
Write-Host ""
Write-Host "Environment Variable to add:" -ForegroundColor Yellow
Write-Host "REACT_APP_API_BASE_URL=$apiUrl" -ForegroundColor Cyan