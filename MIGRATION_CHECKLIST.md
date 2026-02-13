# Digital Ocean Migration Checklist

## ✅ Pre-Deployment (What I Need From You)

- [ ] **SSH Access Confirmed** - Can you run: `ssh root@139.59.32.39`?
- [ ] **Do you have a domain?** - If yes, what is it? (for SSL setup)
- [ ] **Database Choice** - Keep Supabase or migrate to Digital Ocean PostgreSQL?
- [ ] **Deployment Method** - Prefer Docker or PM2?

## 📦 Files Created (All Done ✅)

- [x] `Dockerfile` - Container configuration
- [x] `docker-compose.yml` - Docker orchestration
- [x] `ecosystem.config.js` - PM2 configuration
- [x] `server-setup.sh` - Server initialization script
- [x] `deploy.sh` - Deployment automation script
- [x] `test-deployment.sh` - Testing script
- [x] `server/.env.production` - Production env template
- [x] `.agent/workflows/deploy-to-digital-ocean.md` - Detailed workflow
- [x] `DEPLOYMENT_GUIDE.md` - This comprehensive guide
- [x] Updated CORS in `server/index.js` to include Digital Ocean IP

## 🚀 Deployment Steps

### 1. Initial Server Setup (One-Time)
- [ ] Copy `server-setup.sh` to droplet: `scp server-setup.sh root@139.59.32.39:/root/`
- [ ] SSH into droplet: `ssh root@139.59.32.39`
- [ ] Run setup: `chmod +x /root/server-setup.sh && /root/server-setup.sh`
- [ ] Wait 5-10 minutes for completion
- [ ] Exit SSH

### 2. Configure Environment Variables
- [ ] SSH into droplet: `ssh root@139.59.32.39`
- [ ] Create env file: `nano /var/www/insightai-backend/server/.env`
- [ ] Copy contents from `server/.env.production`
- [ ] Replace all placeholders with actual values:
  - [ ] `SUPABASE_KEY`
  - [ ] `GOOGLE_PRIVATE_KEY`
  - [ ] `SHAREPOINT_CLIENT_SECRET`
  - [ ] `SHAREPOINT_OAUTH_CLIENT_SECRET`
  - [ ] Update `SHAREPOINT_REDIRECT_URI` to `http://139.59.32.39:3001/auth/sharepoint/callback`
- [ ] Save and exit

### 3. Deploy Backend
- [ ] From local machine, run: `./deploy.sh`
- [ ] Wait for deployment to complete
- [ ] Check for any errors

### 4. Verify Deployment
- [ ] Run test script: `./test-deployment.sh`
- [ ] Manual test: `curl http://139.59.32.39:3001/api/users`
- [ ] Check logs: `ssh root@139.59.32.39 "docker-compose -f /var/www/insightai-backend/docker-compose.yml logs"`

### 5. Update External Services

#### Supabase
- [ ] Go to https://app.supabase.com
- [ ] Select your project
- [ ] Settings → API → CORS Settings
- [ ] Add origin: `http://139.59.32.39:3001`
- [ ] Save changes

#### SharePoint OAuth (Azure AD)
- [ ] Go to https://portal.azure.com
- [ ] Azure Active Directory → App Registrations
- [ ] Select: `8db93065-9fc4-456f-ac7c-79d0d6be3ab1`
- [ ] Authentication → Redirect URIs → Add URI
- [ ] Add: `http://139.59.32.39:3001/auth/sharepoint/callback`
- [ ] Save changes

### 6. Update Frontend (Netlify)
- [ ] Go to your Netlify dashboard
- [ ] Select: `analytic-core`
- [ ] Site settings → Environment variables
- [ ] Update/Add: `VITE_API_URL=http://139.59.32.39:3001`
- [ ] Trigger new deployment
- [ ] Verify frontend can communicate with new backend

### 7. Final Testing
- [ ] Open frontend: https://analytic-core.netlify.app
- [ ] Test login functionality
- [ ] Test file upload
- [ ] Test Google Sheets integration
- [ ] Test SharePoint integration
- [ ] Test dashboard creation
- [ ] Check admin panel

### 8. Cleanup
- [ ] Monitor logs for 24-48 hours
- [ ] Verify all features working correctly
- [ ] Once stable, shut down Render server (save money!)
- [ ] Update documentation with new URLs

## 🎁 Optional Enhancements

### SSL/HTTPS Setup (If You Have a Domain)
- [ ] Point domain to `139.59.32.39` (A record)
- [ ] SSH into droplet
- [ ] Update Nginx: `nano /etc/nginx/sites-available/insightai`
- [ ] Change `server_name` to your domain
- [ ] Test Nginx: `nginx -t`
- [ ] Reload Nginx: `systemctl reload nginx`
- [ ] Install SSL: `certbot --nginx -d api.yourdomain.com`
- [ ] Update `SHAREPOINT_REDIRECT_URI` to use `https://`
- [ ] Update frontend env to use `https://`

### Database Migration (If Moving from Supabase)
- [ ] Create Digital Ocean Managed Database
- [ ] Export data from Supabase
- [ ] Import to Digital Ocean PostgreSQL
- [ ] Update `.env` with new database credentials
- [ ] Redeploy backend
- [ ] Verify data integrity

### Automated Backups
- [ ] Set up Digital Ocean automated droplet snapshots
- [ ] Configure Supabase automated backups (if keeping Supabase)
- [ ] Set up log rotation on droplet

### Monitoring
- [ ] Install monitoring tools (optional):
  - [ ] PM2 monitoring: `pm2 plus`
  - [ ] Digital Ocean monitoring (built-in)
  - [ ] Uptime monitoring: UptimeRobot / Pingdom

## 🐛 Common Issues & Solutions

### Issue: Can't connect to droplet
**Solution:** 
```bash
# Set up SSH key
ssh-copy-id root@139.59.32.39
```

### Issue: Port 3001 blocked
**Solution:**
```bash
ssh root@139.59.32.39
ufw allow 3001/tcp
ufw reload
```

### Issue: Docker not starting
**Solution:**
```bash
ssh root@139.59.32.39
cd /var/www/insightai-backend
docker-compose logs
# Check for specific errors
```

### Issue: CORS errors in frontend
**Solution:**
1. Verify backend CORS includes frontend URL
2. Verify Supabase CORS includes backend URL
3. Check browser console for specific blocked origin
4. Clear browser cache and retry

### Issue: SharePoint OAuth not working
**Solution:**
1. Verify redirect URI in Azure AD matches exactly
2. Check redirect URI in `.env` file
3. Must be `http://` or `https://` (not both)
4. URL must be accessible from browser

## 📊 Deployment Status

**Current Status:** ⏸️ Awaiting Initial Setup

**Last Updated:** [Fill this in after each major step]

**Notes:**
- Droplet IP: 139.59.32.39
- Frontend: https://analytic-core.netlify.app  
- Old Backend (Render): https://analyticcore-server.onrender.com
- New Backend (Digital Ocean): http://139.59.32.39:3001

---

## 📞 What I Need From You Next

Please answer these questions so I can proceed:

1. **SSH Access:** Can you successfully SSH into the droplet? (`ssh root@139.59.32.39`)
   
2. **Domain:** Do you have a domain you want to use? (e.g., api.yourdomain.com)
   - If no: We'll use IP address with HTTP
   - If yes: Please share domain and we'll set up SSL

3. **Database:** 
   - Option A: Keep using Supabase (easier, no migration)
   - Option B: Migrate to Digital Ocean PostgreSQL (more integrated)
   
4. **Deployment Method:**
   - Option A: Docker (recommended, easier updates)
   - Option B: PM2 (lighter weight, simpler)

5. **Timeline:** When do you want to do this?
   - Now (I can guide you through it live)
   - Later (I'll provide instructions for you to follow)

Once you answer these, I can help you complete the deployment! 🚀
