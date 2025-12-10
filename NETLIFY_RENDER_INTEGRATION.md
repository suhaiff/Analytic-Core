# 🎯 Netlify + Render Integration Guide

Your app is deployed on:
- **Frontend**: Netlify
- **Backend**: Render (`https://analyticcore-server.onrender.com/`)

## ✅ Step 1: Update Netlify Environment Variable

### In Netlify Dashboard:

1. Go to your site → **Site settings** → **Environment variables**
2. Click **Add a variable**
3. Add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://analyticcore-server.onrender.com`
   - **Scopes**: Select all (Production, Deploy Previews, Branch deploys)

4. Click **Save**
5. **Trigger a redeploy**:
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**

---

## ✅ Step 2: Update Backend CORS Settings

Your backend on Render needs to allow requests from your Netlify frontend.

### Find Your Netlify URL

It's probably something like:
- `https://your-site-name.netlify.app`
- Or your custom domain

### Update CORS in `server/index.js`:

Find this section (around lines 10-15):

```javascript
const cors = require('cors');

app.use(cors());
```

Replace it with:

```javascript
const cors = require('cors');

// Allow specific origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://your-site-name.netlify.app',  // ← Add your Netlify URL here
  // Add your custom domain if you have one:
  // 'https://your-custom-domain.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### Then:
1. **Commit and push** to GitHub
2. Render will automatically redeploy

---

## ✅ Step 3: Verify Integration

### Test the Connection:

1. **Open your Netlify site**
2. **Open Browser DevTools** (F12)
3. **Go to Console tab**
4. You should see: `API Configuration: { API_URL: "https://analyticcore-server.onrender.com", ... }`

### Test Login:

1. Try logging in with your credentials
2. If you see CORS errors, check step 2
3. If you see connection errors, check the Render URL

---

## 🐛 Troubleshooting

### Issue: CORS Policy Error

**Error message**: `Access to fetch at 'https://analyticcore-server.onrender.com/api/...' from origin 'https://your-site.netlify.app' has been blocked by CORS policy`

**Solution**:
1. Verify you added your Netlify URL to `allowedOrigins` in backend
2. Commit and push changes
3. Wait for Render to redeploy
4. Clear browser cache and try again

### Issue: 404 Not Found

**Error**: `GET https://analyticcore-server.onrender.com/api/users 404`

**Solution**:
1. Check that your backend is actually running on Render
2. Go to Render dashboard → your service → check logs
3. Make sure environment variables are set in Render

### Issue: Cold Start (15-30 second delay)

**Symptom**: First request takes 30-50 seconds

**Cause**: Free tier on Render sleeps after 15 minutes of inactivity

**Solutions**:
1. **Wait it out** (it's free!)
2. **Add a loading message** to your frontend
3. **Use a pingservice** like UptimeRobot to keep it awake
4. **Upgrade to paid plan** ($7/month) for instant responses

###  Issue: Environment variable not working

**Symptom**: Still connecting to localhost

**Solution**:
1. Verify environment variable is set in Netlify
2. Trigger a new deploy in Netlify
3. Clear browser cache (Ctrl+Shift+Del)
4. Hard refresh (Ctrl+F5)

---

## 📋 Checklist

- [ ] Added `VITE_API_URL` environment variable in Netlify
- [ ] Redeployed Netlify site
- [ ] Updated CORS in `server/index.js` with Netlify URL
- [ ] Committed and pushed backend changes
- [ ] Waited for Render to redeploy
- [ ] Tested login on live site
- [ ] Tested file upload
- [ ] Tested dashboard creation

---

## 🎉 Your App is Fully Integrated!

**Frontend**: Your Netlify URL
**Backend**: `https://analyticcore-server.onrender.com/`
**Database**: Microsoft Dataverse

All three parts are now connected and working together!

---

## 📊 Monitoring

### Netlify:
- Check deploy logs: Site → Deploys → Click on latest deploy
- View analytics: Site → Analytics

### Render:
- Check server logs: Service → Logs
- Monitor health: Service → Dashboard

---

## 🚀 Next Steps

1. **Test thoroughly** - Try all features
2. **Add custom domain** (optional)
3. **Set up monitoring** (UptimeRobot for backend)
4. **Share with users!**

---

**Need help?** Check which specific error you're seeing and follow the troubleshooting steps above.
