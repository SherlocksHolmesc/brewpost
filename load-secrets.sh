#!/bin/bash

# Load secrets from AWS Secrets Manager
SECRET_VALUE=$(aws secretsmanager get-secret-value --secret-id env --region us-east-1 --query SecretString --output text)

# Export environment variables
export $(echo $SECRET_VALUE | jq -r 'to_entries[] | "\(.key)=\(.value)"')

# Start the server with loaded environment
pm2 start unified-server.js --name unified-server