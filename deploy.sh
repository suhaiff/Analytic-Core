#!/bin/bash

# InsightAI Backend Deployment Script for Digital Ocean
# Usage: ./deploy.sh

set -e

echo "🚀 Starting deployment to Digital Ocean Droplet..."

# Configuration
DROPLET_IP="139.59.32.39"
DROPLET_USER="root"
APP_DIR="/var/www/insightai-backend"
DEPLOY_METHOD="docker" # Change to "pm2" if you prefer PM2

echo "📦 Building locally..."
# Optional: Run tests here if you have them
# npm test

echo "📤 Syncing files to droplet..."
rsync -avz --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '*.log' \
  --exclude '.env' \
  --exclude 'server/AnalyticCore-Server/node_modules/*' \
  --exclude 'server/AnalyticCore-Server/ml-service/.venv/*' \
  --exclude '*.zip' \
  --exclude 'uploads/*' \
  ./ ${DROPLET_USER}@${DROPLET_IP}:${APP_DIR}

echo "🔧 Deploying on droplet..."
ssh ${DROPLET_USER}@${DROPLET_IP} << ENDSSH
set -e
cd /var/www/insightai-backend

if [ "${DEPLOY_METHOD}" = "docker" ]; then
  echo "🐳 Using Docker deployment..."
  docker-compose up -d --build --remove-orphans
  echo "✅ Docker container deployed"
  
  # Health check
  echo "🏥 Waiting for backend to become healthy..."
  for i in {1..15}; do
    if curl -s -f http://localhost:3001/api/health > /dev/null; then
      echo "✅ Backend is healthy and responding!"
      break
    fi
    if [ \$i -eq 15 ]; then
      echo "⚠️ Health check taking longer than expected, please verify logs."
    fi
    sleep 2
  done
else
  echo "⚙️  Using PM2 deployment..."
  cd server/AnalyticCore-Server
  npm ci --only=production
  cd ../..
  pm2 restart ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs
  pm2 save
  echo "✅ PM2 process restarted"
fi

echo "🧹 Cleaning up..."
docker system prune -f || true

ENDSSH

echo "✅ Deployment completed successfully!"
echo "🌐 Backend should be available at: http://${DROPLET_IP}:3001"
echo ""
echo "📝 Next steps:"
echo "  1. Check logs: ssh ${DROPLET_USER}@${DROPLET_IP} 'docker-compose logs -f'"
echo "  2. Test endpoint: curl http://${DROPLET_IP}:3001/api/health"
