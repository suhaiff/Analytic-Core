#!/bin/bash

# Optimized Server Setup Script for Digital Ocean Droplet
# Configured for: Supabase (no local DB), HTTP (no domain), Docker deployment
# Run this ONCE on your droplet after first login

set -e

echo "🔧 Starting Digital Ocean Droplet Setup..."
echo "📋 Configuration: Supabase DB | No Domain | Docker Deployment"
echo ""

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install essentials
echo "🛠️  Installing essential packages..."
apt install -y curl wget git ufw nginx

# Install Node.js 18
echo "📥 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify installations
echo "✅ Verifying Node.js installation..."
node --version
npm --version

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify Docker
echo "✅ Verifying Docker installation..."
docker --version
docker-compose --version

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /var/www/insightai-backend
mkdir -p /var/www/insightai-backend/server/uploads
mkdir -p /var/www/insightai-backend/logs

# Set proper permissions
chown -R root:root /var/www/insightai-backend
chmod -R 755 /var/www/insightai-backend

# Configure firewall
echo "🔥 Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3001/tcp
ufw --force enable

# Configure Nginx as reverse proxy
echo "🌐 Configuring Nginx reverse proxy..."
cat > /etc/nginx/sites-available/insightai << 'EOF'
server {
    listen 80;
    server_name 139.59.32.39;

    # Increase timeout for large file uploads
    client_max_body_size 100M;
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Large file uploads support
        proxy_request_buffering off;
    }
}
EOF

# Enable Nginx site
ln -sf /etc/nginx/sites-available/insightai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx

# Enable Docker to start on boot
systemctl enable docker

echo ""
echo "✅ Server setup completed successfully!"
echo ""
echo "📊 Installation Summary:"
echo "  ✓ Node.js $(node --version)"
echo "  ✓ npm $(npm --version)"
echo "  ✓ Docker $(docker --version | cut -d' ' -f3)"
echo "  ✓ Docker Compose $(docker-compose --version | cut -d' ' -f3)"
echo "  ✓ Nginx installed and configured"
echo "  ✓ Firewall enabled (ports: 22, 80, 443, 3001)"
echo ""
echo "📝 Next Steps:"
echo "  1. EXIT this SSH session"
echo "  2. From your local machine, run: ./deploy.sh"
echo "  3. The deploy script will:"
echo "     - Copy your code to the droplet"
echo "     - Set up environment variables"
echo "     - Start the backend with Docker"
echo ""
echo "🌐 Your backend will be accessible at:"
echo "   http://139.59.32.39:3001 (direct)"
echo "   http://139.59.32.39 (via Nginx proxy)"
echo ""
echo "⚠️  IMPORTANT: After deployment, you'll need to:"
echo "   - Update Supabase CORS to allow http://139.59.32.39:3001"
echo "   - Update SharePoint OAuth redirect URI"
echo "   - Update Netlify frontend environment variables"
echo ""
