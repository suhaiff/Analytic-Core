# 🎯 Your Deployment Checklist

## 📍 Your Setup
- **Frontend**: https://analytic-core.netlify.app
- **Backend**: https://analyticcore-server.onrender.com
- **Database**: Microsoft Dataverse

---

## ✅ Step 1: Configure Netlify

### Add Environment Variable

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site: **analytic-core**
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable**
5. Enter:
   ```
   Key:   VITE_API_URL
   Value: https://analyticcore-server.onrender.com
   ```
6. **Scopes**: Check all three (Production, Deploy Previews, Branch deploys)
7. Click **Create variable**

### Redeploy Your Site

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait 1-2 minutes for deployment to complete

---

## ✅ Step 2: Push Backend Changes

The CORS configuration has already been updated in your code.

### Commit and Push:

```bash
cd /home/Suhaif/Downloads/insightai

# Check what changed
git status

# Stage all changes
git add .

# Commit
git commit -m "Configure CORS for Netlify: analytic-core.netlify.app"

# Push to GitHub
git push origin main
```

### Wait for Render to Deploy

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your service: **analyticcore-server**
3. Watch the **Events** tab for automatic deployment
4. Wait 2-3 minutes for deployment to complete

---

## ✅ Step 3: Test Your Integration

### Open Your Site

Go to: **https://analytic-core.netlify.app**

### Check Console (F12)

You should see:
```
API Configuration: {
  API_URL: "https://analyticcore-server.onrender.com",
  API_BASE: "https://analyticcore-server.onrender.com/api",
  environment: "production"
}
```

### Test Features

1. **Login**
   - Email: `sohib.vtab@gmail.com`
   - Password: `Admin123`
   - Should login successfully ✅

2. **Upload a file**
   - Go to Data Config
   - Upload an Excel file
   - Should process successfully ✅

3. **Create a dashboard**
   - Configure your data
   - Build charts
   - Save dashboard
   - Should save successfully ✅

---

## 🐛 Troubleshooting

### Issue: CORS Error in Console

**Error**: `Access to fetch at 'https://analyticcore-server.onrender.com/api/...' from origin 'https://analytic-core.netlify.app' has been blocked by CORS policy`

**Solution**:
- Make sure you completed Step 2 (pushed code to GitHub)
- Wait for Render to finish deploying (check Render dashboard)
- Clear browser cache and refresh (Ctrl+Shift+Delete)

### Issue: Still Connecting to Localhost

**Symptom**: App tries to connect to `localhost:3001`

**Solution**:
- Make sure you completed Step 1 (added environment variable in Netlify)
- Make sure you redeployed in Netlify
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)

### Issue: First Request Takes 30-50 Seconds

**Symptom**: Login or first API call is very slow

**This is normal!** 
- Render free tier sleeps after 15 minutes of inactivity
- First request wakes it up (30-50 seconds)
- Subsequent requests are fast
- Happens every time after 15min of no activity

**Solutions**:
- Just wait (it's the free tier trade-off)
- Use [UptimeRobot](https://uptimerobot.com) to ping every 5 minutes (keeps it awake)
- Upgrade to Render paid plan ($7/month) for instant responses

### Issue: Login Works But Other Features Don't

**Check**:
- Open browser DevTools → Network tab
- Try the feature again
- Look for failed requests (red)
- Check the error message

**Common causes**:
- Backend is still deploying
- Environment variables missing in Render
- Dataverse credentials issue

---

## 📊 Expected Timeline

- **Step 1**: 3-5 minutes
- **Step 2**: 2 minutes + 2-3 minutes deploy
- **Step 3**: 2-3 minutes testing
- **Total**: ~10-15 minutes

---

## ✅ Completion Checklist

After completing all steps, verify:

- [ ] Environment variable `VITE_API_URL` added in Netlify
- [ ] Netlify site redeployed
- [ ] Backend changes committed and pushed to GitHub
- [ ] Render service automatically redeployed
- [ ] Console shows correct API URL (not localhost)
- [ ] Login works on live site
- [ ] File upload works
- [ ] Dashboard creation works
- [ ] No CORS errors in console

---

## 🎉 You're Done!

Once all checkboxes are ✅, your app is fully integrated and live!

**Live URL**: https://analytic-core.netlify.app

Share it with your users! 🚀

---

## 📞 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review browser console for specific errors
3. Check Render logs for backend errors
4. Verify all environment variables are set correctly

**Common issues are covered in**: `NETLIFY_RENDER_INTEGRATION.md`
