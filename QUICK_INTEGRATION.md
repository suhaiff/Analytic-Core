# 🚀 Quick Integration Setup

Your AnalyticCore app is deployed on Netlify + Render! Follow these steps to complete the integration.

## 📝 What You Need

1. Your **Netlify site URL** (e.g., `https://your-site.netlify.app`)
2. Access to both Netlify and Render dashboards
3. 5-10 minutes

---

## ⚡ Quick Setup (3 Steps)

### Step 1: Add Environment Variable in Netlify

```bash
# In Netlify Dashboard:
Site Settings → Environment variables → Add a variable

Key:   VITE_API_URL
Value: https://analyticcore-server.onrender.com

Then: Trigger a new deploy
```

### Step 2: Add Netlify URL to Render

```bash
# In Render Dashboard:
Your Service → Environment → Add Environment Variable

Key:   FRONTEND_URL
Value: https://your-site-name.netlify.app  # ← Your Netlify URL

Then: Wait for automatic redeploy (2-3 minutes)
```

### Step 3: Push Backend Changes

```bash
cd /home/Suhaif/Downloads/insightai

# Verify changes
git status

# Commit and push
git add .
git commit -m "Configure CORS for Netlify frontend"
git push origin main

# Render will automatically deploy in 2-3 minutes
```

---

## ✅ Verification

After all 3 steps are complete:

1. **Open your Netlify site**
2. **Press F12** (open DevTools)
3. **Check Console** - you should see:
   ```
   API Configuration: {
     API_URL: "https://analyticcore-server.onrender.com",
     ...
   }
   ```

4. **Try logging in** with your credentials
5. **Test file upload**
6. **Create a dashboard**

---

## 🎯 If Something Doesn't Work

### CORS Error?
- Make sure you added `FRONTEND_URL` in Render
- Make sure Render has redeployed
- Clear browser cache (Ctrl+Shift+Delete)

### Still connecting to localhost?
- Make sure you added `VITE_API_URL` in Netlify
- Make sure you redeployed Netlify
- Hard refresh (Ctrl+F5)

### 502 Bad Gateway?
- Render service is waking up (wait 30-50 seconds)
- This only happens after 15min of inactivity (free tier)

---

## 📚 Full Guide

For detailed troubleshooting and advanced configuration, see:
**`NETLIFY_RENDER_INTEGRATION.md`**

---

**Ready? Start with Step 1 above! 🚀**
