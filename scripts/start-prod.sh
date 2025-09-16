#!/bin/bash
set -euo pipefail

# Production startup script that uses environment variables from Replit Secrets
# This bypasses the hardcoded credentials in package.json start script

echo "🚀 Starting production server with environment variables..."
echo "NODE_ENV: ${NODE_ENV:-production}"

# Start the application using environment variables from Replit Secrets
exec env NODE_ENV=production node dist/index.js