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
  --exclude 'uploads/*' \
  ./ ${DROPLET_USER}@${DROPLET_IP}:${APP_DIR}

echo "🔧 Deploying on droplet..."
ssh ${DROPLET_USER}@${DROPLET_IP} << 'ENDSSH'
cd /var/www/insightai-backend

if [ "$DEPLOY_METHOD" = "docker" ]; then
  echo "🐳 Using Docker deployment..."
  docker-compose down
  docker-compose build
  docker-compose up -d
  echo "✅ Docker containers started"
else
  echo "⚙️  Using PM2 deployment..."
  cd server
  npm ci --only=production
  pm2 restart ../ecosystem.config.js --update-env
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
