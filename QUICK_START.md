# 🚀 Quick Start - Digital Ocean Deployment

**Your Configuration:**
- ✅ SSH: Key-based authentication to root@139.59.32.39
- ✅ Database: Keeping Supabase (no local DB)
- ✅ Domain: Using IP address (no domain)
- ✅ Fresh Ubuntu droplet

**Estimated Time:** 30-45 minutes

---

## Step 1: Setup the Droplet (One-Time, ~10 minutes)

### 1.1 Copy setup script to droplet
```bash
scp server-setup.sh root@139.59.32.39:/root/
```

### 1.2 SSH into droplet and run setup
```bash
ssh root@139.59.32.39
```

Once logged in:
```bash
cd /root
chmod +x server-setup.sh
./server-setup.sh
```

⏰ **Wait 5-10 minutes** - The script will install:
- Node.js 18
- Docker & Docker Compose
- Nginx (reverse proxy)
- Configure firewall

### 1.3 Exit SSH session
```bash
exit
```

---

## Step 2: Create Environment File (~5 minutes)

### 2.1 SSH back into droplet
```bash
ssh root@139.59.32.39
```

### 2.2 Create the .env file
```bash
nano /var/www/insightai-backend/server/.env
```

### 2.3 Copy this content and update secrets:
```env
# Supabase Configuration
SUPABASE_URL=https://lueqkftnwavumkvtivdn.supabase.co
SUPABASE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE

# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://analytic-core.netlify.app

# Google Sheets API
GOOGLE_SERVICE_ACCOUNT_EMAIL=dashboard-sheets-reader@diesel-skyline-479213-f1.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# SharePoint Configuration
SHAREPOINT_TENANT_ID=d96cb34e-74be-402e-83f8-b2d504c4bcfa
SHAREPOINT_CLIENT_ID=86b1ff66-4fa0-4747-8654-19eb1d92760f
SHAREPOINT_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
SHAREPOINT_SCOPE=https://graph.microsoft.com/.default
SHAREPOINT_ENABLED=true
SHAREPOINT_ENCRYPTION_KEY=12345678901234567890123456789012

# SharePoint OAuth (New)
SHAREPOINT_OAUTH_TENANT_ID=d96cb34e-74be-402e-83f8-b2d504c4bcfa
SHAREPOINT_OAUTH_CLIENT_ID=8db93065-9fc4-456f-ac7c-79d0d6be3ab1
SHAREPOINT_OAUTH_CLIENT_SECRET=YOUR_OAUTH_CLIENT_SECRET_HERE
SHAREPOINT_REDIRECT_URI=http://139.59.32.39:3001/auth/sharepoint/callback
```

**Press:** `Ctrl+X`, then `Y`, then `Enter` to save.

### 2.4 Exit SSH
```bash
exit
```

---

## Step 3: Deploy Backend (~5 minutes)

From your **local machine**:

```bash
./deploy.sh
```

This will:
1. ✅ Sync your code to the droplet
2. ✅ Build Docker image
3. ✅ Start the backend container
4. ✅ Show deployment status

---

## Step 4: Verify Deployment (~2 minutes)

### 4.1 Test from local machine
```bash
./test-deployment.sh
```

### 4.2 Manual test
```bash
curl http://139.59.32.39:3001/api/users
```

You should see a JSON response!

### 4.3 Check logs (if needed)
```bash
ssh root@139.59.32.39 "docker-compose -f /var/www/insightai-backend/docker-compose.yml logs"
```

---

## Step 5: Update External Services (~5 minutes)

### 5.1 Update Supabase CORS

1. Go to: https://app.supabase.com
2. Select your project
3. **Settings** → **API** → **CORS Settings**
4. **Add origin:** `http://139.59.32.39:3001`
5. **Save**

### 5.2 Update SharePoint OAuth Redirect URI

1. Go to: https://portal.azure.com
2. **Azure Active Directory** → **App Registrations**
3. Find app: `8db93065-9fc4-456f-ac7c-79d0d6be3ab1`
4. **Authentication** → **Redirect URIs**
5. **Add:** `http://139.59.32.39:3001/auth/sharepoint/callback`
6. **Save**

---

## Step 6: Update Frontend (~5 minutes)

### 6.1 Update Netlify Environment Variables

1. Go to: https://app.netlify.com
2. Select site: **analytic-core**
3. **Site settings** → **Environment variables**
4. Add/Update:
   - **Key:** `VITE_API_URL`
   - **Value:** `http://139.59.32.39:3001`
5. **Save**

### 6.2 Trigger Netlify Rebuild

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait for deployment to complete (~2 minutes)

---

## Step 7: Final Testing (~5 minutes)

### 7.1 Open your frontend
```
https://analytic-core.netlify.app
```

### 7.2 Test all features:
- [ ] Login/Signup
- [ ] File upload (Excel)
- [ ] Google Sheets import
- [ ] SharePoint connection
- [ ] Dashboard creation
- [ ] Admin panel

---

## ✅ Success! You're Done!

Your backend is now running on Digital Ocean:
- **Backend URL:** http://139.59.32.39:3001
- **Frontend URL:** https://analytic-core.netlify.app
- **Database:** Supabase (unchanged)

---

## 🎯 Next Steps (Optional)

### Monitor Your Backend
```bash
# Check if running
ssh root@139.59.32.39 "docker-compose -f /var/www/insightai-backend/docker-compose.yml ps"

# View logs
ssh root@139.59.32.39 "docker-compose -f /var/www/insightai-backend/docker-compose.yml logs -f"

# Restart if needed
ssh root@139.59.32.39 "docker-compose -f /var/www/insightai-backend/docker-compose.yml restart"
```

### Future Deployments
Whenever you update your code:
```bash
./deploy.sh
```
That's it! The script handles everything.

### Shut Down Render
Once you've verified everything works for 24-48 hours:
1. Go to Render dashboard
2. Stop/delete your backend service
3. Save ~$7-15/month! 💰

---

## 🆘 Troubleshooting

### Backend not responding?
```bash
ssh root@139.59.32.39
docker-compose -f /var/www/insightai-backend/docker-compose.yml logs
```

### CORS errors?
- Verify Supabase CORS includes `http://139.59.32.39:3001`
- Verify frontend uses `http://139.59.32.39:3001` in config
- Clear browser cache

### Port 3001 blocked?
```bash
ssh root@139.59.32.39
ufw status
ufw allow 3001/tcp
```

---

**Need help?** Just ask! I'm here to help if anything goes wrong. 😊
