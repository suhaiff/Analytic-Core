---
description: Deploy backend to Digital Ocean Droplet
---

# Deploy Backend to Digital Ocean Droplet

This workflow guides you through deploying the InsightAI backend to your Digital Ocean droplet (139.59.32.39).

## Prerequisites

- Digital Ocean Droplet IP: `139.59.32.39`
- SSH access to the droplet
- Domain (optional, for SSL)

## Initial Setup (One-Time Only)

### 1. Connect to your droplet
```bash
ssh root@139.59.32.39
```

### 2. Copy the server setup script to the droplet
On your local machine:
```bash
scp server-setup.sh root@139.59.32.39:/root/
```

### 3. Run the setup script on the droplet
On the droplet:
```bash
chmod +x /root/server-setup.sh
bash /root/server-setup.sh
```

This will install:
- Node.js 18
- PM2 (process manager)
- Docker & Docker Compose
- Nginx (reverse proxy)
- UFW (firewall)
- Certbot (for SSL)

**Note:** This takes 5-10 minutes.

### 4. Set up environment variables
On the droplet:
```bash
nano /var/www/insightai-backend/server/.env
```

Copy the contents from `server/.env.production`, then update:
- Replace all `your_*_here` placeholders with actual secrets
- Update `SHAREPOINT_REDIRECT_URI` if you have a domain
- Save and exit (Ctrl+X, then Y, then Enter)

## Deployment Methods

Choose ONE of the following deployment methods:

### Option A: Automated Deployment (Recommended)

On your local machine:
```bash
chmod +x deploy.sh
./deploy.sh
```

This script will:
1. Sync your code to the droplet
2. Build and restart the application
3. Show you the deployment status

### Option B: Manual Deployment with Docker

1. **Sync code to droplet:**
```bash
rsync -avz --exclude 'node_modules' --exclude '.git' ./ root@139.59.32.39:/var/www/insightai-backend
```

2. **Deploy on droplet:**
```bash
ssh root@139.59.32.39
cd /var/www/insightai-backend
docker-compose down
docker-compose build
docker-compose up -d
```

3. **Check logs:**
```bash
docker-compose logs -f
```

### Option C: Manual Deployment with PM2

1. **Sync code to droplet:**
```bash
rsync -avz --exclude 'node_modules' --exclude '.git' ./ root@139.59.32.39:/var/www/insightai-backend
```

2. **Deploy on droplet:**
```bash
ssh root@139.59.32.39
cd /var/www/insightai-backend/server
npm ci --only=production
pm2 start ../ecosystem.config.js
pm2 save
```

3. **Check logs:**
```bash
pm2 logs insightai-backend
```

## Post-Deployment

### 1. Test the backend
```bash
curl http://139.59.32.39:3001/api/health
```

### 2. Update frontend configuration
Update your frontend environment variables to point to:
- Without domain: `http://139.59.32.39:3001`
- With domain: `https://api.yourdomain.com`

### 3. Update CORS settings

#### Update Supabase CORS:
1. Go to https://app.supabase.com
2. Select your project
3. Settings → API → CORS
4. Add: `http://139.59.32.39:3001` (or your domain)

#### Update SharePoint Redirect URI:
1. Go to Azure AD → App Registrations
2. Select your app
3. Authentication → Redirect URIs
4. Add: `http://139.59.32.39:3001/auth/sharepoint/callback`

## SSL Setup (If You Have a Domain)

### 1. Point your domain to the droplet
In your domain registrar, create an A record:
```
api.yourdomain.com → 139.59.32.39
```

### 2. Update Nginx configuration
On the droplet:
```bash
nano /etc/nginx/sites-available/insightai
```
Change `server_name 139.59.32.39;` to `server_name api.yourdomain.com;`

### 3. Install SSL certificate
```bash
certbot --nginx -d api.yourdomain.com
```

### 4. Update environment variables
Update `SHAREPOINT_REDIRECT_URI` to use `https://api.yourdomain.com`

## Monitoring & Maintenance

### Check application status
```bash
# Docker
docker-compose ps

# PM2
pm2 status
```

### View logs
```bash
# Docker
docker-compose logs -f

# PM2
pm2 logs insightai-backend
```

### Restart application
```bash
# Docker
docker-compose restart

# PM2
pm2 restart insightai-backend
```

### Update application
Run the deployment again using your chosen method above.

## Troubleshooting

### Port 3001 not accessible
```bash
ufw status
ufw allow 3001/tcp
```

### Nginx not working
```bash
nginx -t
systemctl restart nginx
```

### Out of memory
Upgrade droplet or optimize PM2 config in `ecosystem.config.js`

### Check disk space
```bash
df -h
```

## Rollback

If deployment fails:

### Docker
```bash
docker-compose down
# Deploy previous version
docker-compose up -d
```

### PM2
```bash
pm2 stop insightai-backend
# Restore previous code
pm2 start insightai-backend
```
