# 🚀 Digital Ocean Deployment Guide

## Migration from Render to Digital Ocean

Your backend is currently on **Render** and needs to be migrated to your **Digital Ocean Droplet** at `139.59.32.39`.

---

## 📋 What I've Created For You

I've created all the necessary files for deployment:

### 1. **Deployment Files**
- `Dockerfile` - Containerizes your Node.js backend
- `docker-compose.yml` - Manages Docker deployment
- `ecosystem.config.js` - PM2 process manager configuration (alternative to Docker)
- `.dockerignore` - Excludes unnecessary files from Docker builds

### 2. **Setup Scripts**
- `server-setup.sh` - One-time server initialization script
- `deploy.sh` - Automated deployment script
- `test-deployment.sh` - Tests if deployment is working

### 3. **Configuration**  
- `server/.env.production` - Production environment template
- `.agent/workflows/deploy-to-digital-ocean.md` - Detailed deployment workflow

---

## 🎯 Quick Start (Choose Your Method)

### Method A: Fully Automated (Easiest) ✨

**Prerequisites:**
- SSH key authentication set up (or you'll need to enter password multiple times)

```bash
# 1. Copy setup script to droplet
scp server-setup.sh root@139.59.32.39:/root/

# 2. SSH into droplet and run setup
ssh root@139.59.32.39
cd /root
chmod +x server-setup.sh
./server-setup.sh
# Wait 5-10 minutes for installation
exit

# 3. Back on your local machine, run automated deployment
./deploy.sh
```

### Method B: Step-by-Step (More Control) 📝

Follow the detailed workflow:
```bash
# View the complete workflow
cat .agent/workflows/deploy-to-digital-ocean.md
```

Or just type `/deploy-to-digital-ocean` to follow the interactive workflow.

---

## ⚙️ Configuration Required

### 1. **Update Environment Variables on Droplet**

After running `server-setup.sh`, you need to create the `.env` file on your droplet:

```bash
ssh root@139.59.32.39
nano /var/www/insightai-backend/server/.env
```

Copy contents from `server/.env.production` and update:
- All `your_*_here` placeholders with real values
- `SHAREPOINT_REDIRECT_URI` to use your droplet IP or domain

### 2. **Update External Services**

#### Supabase CORS Settings:
1. Go to https://app.supabase.com
2. Select your project → Settings → API → CORS
3. **Add:** `http://139.59.32.39:3001`

#### SharePoint OAuth Redirect URI:
1. Go to Azure AD → App Registrations
2. Select your integration app
3. Authentication → Redirect URIs
4. **Add:** `http://139.59.32.39:3001/auth/sharepoint/callback`

### 3. **Update Frontend Configuration**

Update your frontend (Netlify) to point to the new backend:

```env
# In your frontend .env or environment variables
VITE_API_URL=http://139.59.32.39:3001
# OR if you set up a domain and SSL:
# VITE_API_URL=https://api.yourdomain.com
```

Then redeploy your frontend on Netlify.

---

## 🐳 Deployment Methods

You can choose **Docker** (recommended) or **PM2**:

### Using Docker (Recommended)
```bash
ssh root@139.59.32.39
cd /var/www/insightai-backend
docker-compose up -d
docker-compose logs -f  # View logs
```

### Using PM2 (Alternative)
```bash
ssh root@139.59.32.39
cd /var/www/insightai-backend/server
npm ci --only=production
pm2 start ../ecosystem.config.js
pm2 logs  # View logs
```

---

## 🧪 Testing Your Deployment

### From Your Local Machine:
```bash
./test-deployment.sh
```

### Manual Tests:
```bash
# Test basic connectivity
curl http://139.59.32.39:3001

# Test API endpoint
curl http://139.59.32.39:3001/api/users
```

### From Browser:
Visit: `http://139.59.32.39:3001/api/users`

---

## 🔒 Setting Up SSL (Optional but Recommended)

If you have a domain:

### 1. Point Domain to Droplet  
Create an A record in your domain registrar:
```
api.yourdomain.com → 139.59.32.39
```

### 2. Update Nginx Config
```bash
ssh root@139.59.32.39
nano /etc/nginx/sites-available/insightai
```
Change: `server_name 139.59.32.39;` to `server_name api.yourdomain.com;`

### 3. Install SSL Certificate
```bash
certbot --nginx -d api.yourdomain.com
```

### 4. Update Environment Variables
Update `SHAREPOINT_REDIRECT_URI` and frontend URL to use `https://`

---

## 📊 Monitoring & Logs

### Check Application Status:
```bash
# Docker
ssh root@139.59.32.39 "docker-compose -f /var/www/insightai-backend/docker-compose.yml ps"

# PM2
ssh root@139.59.32.39 "pm2 status"
```

### View Logs:
```bash
# Docker
ssh root@139.59.32.39 "docker-compose -f /var/www/insightai-backend/docker-compose.yml logs -f"

# PM2
ssh root@139.59.32.39 "pm2 logs insightai-backend"
```

---

## 🔄 Future Deployments

After the initial setup, deploying updates is simple:

```bash
# Just run the deployment script
./deploy.sh
```

This script will:
1. Sync your latest code to the droplet
2. Rebuild the application
3. Restart the backend
4. Clean up old images

---

## 🆘 Troubleshooting

### Can't SSH into droplet?
```bash
# Add your SSH key to droplet
ssh-copy-id root@139.59.32.39
```

### Port 3001 blocked?
```bash
ssh root@139.59.32.39
ufw allow 3001/tcp
ufw reload
```

### Backend not starting?
```bash
# Check logs for errors
ssh root@139.59.32.39
docker-compose -f /var/www/insightai-backend/docker-compose.yml logs
# OR
pm2 logs insightai-backend
```

### Environment variables not loading?
```bash
# Verify .env file exists and has correct values
ssh root@139.59.32.39
cat /var/www/insightai-backend/server/.env
```

### Still using old Render URL?
Make sure to:
1. Update frontend environment variables on Netlify
2. Redeploy frontend
3. Clear browser cache

---

## 📝 Next Steps

1. ✅ **Run `server-setup.sh`** on your droplet (one-time)
2. ✅ **Create `/var/www/insightai-backend/server/.env`** with production values
3. ✅ **Run `./deploy.sh`** to deploy your backend
4. ✅ **Update Supabase CORS** to include `http://139.59.32.39:3001`
5. ✅ **Update SharePoint OAuth** redirect URI
6. ✅ **Update Netlify frontend** environment variables
7. ✅ **Test** with `./test-deployment.sh`
8. ⭐ (Optional) **Set up domain and SSL**
9. 🎉 **Done!**

---

## 💡 Tips

- **Keep Render running** until you've fully tested Digital Ocean
- **Test everything** before shutting down Render
- **Backup your database** (Supabase handles this, but verify)
- **Save your `.env` file** securely (don't commit to Git)
- **Monitor logs** for the first few days after migration

---

## 🤝 Need Help?

If something goes wrong:
1. Check the detailed workflow: `.agent/workflows/deploy-to-digital-ocean.md`
2. Review logs on the droplet
3. Test with `./test-deployment.sh`
4. Ask me for help! 😊

---

**Your Droplet IP:** `139.59.32.39`  
**Backend Port:** `3001`  
**Backend URL:** `http://139.59.32.39:3001`  
**Frontend:** `https://analytic-core.netlify.app`

Good luck with your migration! 🚀
