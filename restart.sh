#!/bin/bash
pkill -f unified-server || true
cd /home/brewpost/brewpost
aws secretsmanager get-secret-value --secret-id env --query SecretString --output text | tr -d '"' > .env
echo "Environment variables loaded:"
wc -l .env
PORT=8080 nohup node unified-server.js > server.log 2>&1 &
echo "Server restarted on port 8080"