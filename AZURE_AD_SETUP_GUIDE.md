# Azure AD App Registration - Quick Setup Guide

## Step-by-Step Azure Portal Configuration

### 1. Create App Registration

1. **Navigate to Azure Portal**
   - Go to https://portal.azure.com
   - Search for "Azure Active Directory" or use left menu

2. **Start Registration**
   - Click **App registrations** (left menu)
   - Click **+ New registration**

3. **Configure Registration**
   ```
   Name: AnalyticCore SharePoint Connector
   
   Supported account types: 
   ✅ Accounts in any organizational directory (Any Azure AD directory - Multitenant)
   
   Redirect URI:
   Platform: Web
   URI: http://localhost:3001/auth/sharepoint/callback
   
   (Add production URI later: https://api.yourdomain.com/auth/sharepoint/callback)
   ```

4. **Click "Register"**

### 2. Copy Application Details

After registration, you'll see the **Overview** page:

```
📋 Copy these values:

Application (client) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
→ Use as: SHAREPOINT_OAUTH_CLIENT_ID

Directory (tenant) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
→ Use as: SHAREPOINT_OAUTH_TENANT_ID (or use "common" for multitenant)
```

### 3. Create Client Secret

1. **Navigate to Certificates & secrets**
   - Click **Certificates & secrets** (left menu)

2. **Create New Secret**
   - Click **+ New client secret**
   - Description: `AnalyticCore Production`
   - Expires: Choose duration (6 months, 12 months, or 24 months recommended)
   - Click **Add**

3. **Copy Secret Value IMMEDIATELY**
   ```
   📋 Value: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   → Use as: SHAREPOINT_OAUTH_CLIENT_SECRET
   
   ⚠️ WARNING: You can only see this ONCE! Copy it now!
   ```

### 4. Add API Permissions

1. **Navigate to API Permissions**
   - Click **API permissions** (left menu)

2. **Add Microsoft Graph Permissions**
   - Click **+ Add a permission**
   - Select **Microsoft Graph**
   - Select **Delegated permissions** (NOT Application!)

3. **Select Permissions**
   Search and check these three permissions:
   ```
   ✅ User.Read (Sign in and read user profile)
   ✅ Sites.Read.All (Read items in all site collections)
   ✅ offline_access (Maintain access to data you have given it access to)
   ```

4. **Add Permissions**
   - Click **Add permissions**

5. **Grant Admin Consent** (Important!)
   - Click **Grant admin consent for [Your Organization]**
   - Click **Yes** to confirm
   - All permissions should now show "Granted for [Your Organization]" with green checkmarks

### 5. Configure Redirect URIs (Production)

When deploying to production:

1. **Navigate to Authentication**
   - Click **Authentication** (left menu)

2. **Add Production Redirect URI**
   - Click **+ Add a platform** (if needed) or **+ Add URI**
   - Add: `https://api.yourdomain.com/auth/sharepoint/callback`
   - Click **Save**

Both dev and prod URIs can coexist:
```
✅ http://localhost:3001/auth/sharepoint/callback (Development)
✅ https://api.yourdomain.com/auth/sharepoint/callback (Production)
```

### 6. Manifest Configuration (Optional - For Advanced Users)

You can verify multitenant support in the manifest:

1. **Navigate to Manifest**
   - Click **Manifest** (left menu)

2. **Check These Values**
   ```json
   "signInAudience": "AzureADMultipleOrgs"
   ```

This confirms your app accepts sign-ins from any Azure AD directory.

## Environment Variables Setup

Create/update your `.env` file:

```bash
# SharePoint OAuth Configuration
SHAREPOINT_OAUTH_TENANT_ID=common  # or your specific tenant ID
SHAREPOINT_OAUTH_CLIENT_ID=<Application (client) ID from step 2>
SHAREPOINT_OAUTH_CLIENT_SECRET=<Secret value from step 3>
SHAREPOINT_REDIRECT_URI=http://localhost:3001/auth/sharepoint/callback
SHAREPOINT_ENCRYPTION_KEY=<generate with command below>

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:5173
```

### Generate Encryption Key

Run this command to generate a secure 32-character key:

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Copy the output and use as `SHAREPOINT_ENCRYPTION_KEY`.

## Verification Checklist

✅ **App Registration Created**
- Multitenant support enabled
- Redirect URI configured

✅ **Credentials Obtained**
- Client ID copied
- Client Secret copied (and saved securely!)
- Tenant ID copied

✅ **API Permissions Configured**
- User.Read (Delegated)
- Sites.Read.All (Delegated)
- offline_access (Delegated)
- Admin consent granted (green checkmarks)

✅ **Environment Variables Set**
- All OAuth variables in `.env`
- Encryption key generated (32 chars)
- Frontend URL configured

✅ **Database Migration Applied**
- `sharepoint_connections` table created
- RLS policies enabled

## Testing the Setup

### 1. Start Your Application

```bash
# Terminal 1 - Backend
cd server
node index.js

# Terminal 2 - Frontend
npm run dev
```

### 2. Test OAuth Flow

1. Open browser to your frontend (e.g., http://localhost:5173)
2. Log in to your application
3. Click "Other Import Options"
4. Click "Import from SharePoint"
5. You should see "Connect to SharePoint" screen
6. Click "Connect SharePoint Account"
7. You should be redirected to Microsoft login
8. Sign in with your Microsoft/Office 365 account
9. Grant permissions when prompted
10. You should be redirected back to your app
11. You should now see your SharePoint sites

### 3. Verify in Database

Check that token was stored:

```sql
SELECT user_id, tenant_id, connected_at, expires_at 
FROM sharepoint_connections;
```

You should see one row per connected user (tokens are encrypted).

## Troubleshooting

### "AADSTS50011: The redirect URI does not match"

**Fix**: Redirect URI in Azure AD must exactly match your `SHAREPOINT_REDIRECT_URI`
- Check for http vs https
- Check for trailing slashes
- Check port numbers

### "AADSTS65001: User consent required"

**Fix**: Make sure you clicked "Grant admin consent" in API permissions

### "Encryption key must be exactly 32 characters"

**Fix**: Use the node command provided above to generate a proper key

### "SharePoint OAuth is not properly configured"

**Fix**: Check all environment variables are set correctly:
- `SHAREPOINT_OAUTH_CLIENT_ID`
- `SHAREPOINT_OAUTH_CLIENT_SECRET`
- `SHAREPOINT_OAUTH_TENANT_ID`
- `SHAREPOINT_REDIRECT_URI`
- `SHAREPOINT_ENCRYPTION_KEY` (exactly 32 chars)

## Production Deployment

When deploying to production:

1. **Create Production App Registration**
   - Separate app for production (recommended)
   - Or add production redirect URI to existing app

2. **Update Environment Variables**
   ```bash
   SHAREPOINT_OAUTH_CLIENT_ID=<production-client-id>
   SHAREPOINT_OAUTH_CLIENT_SECRET=<production-secret>
   SHAREPOINT_REDIRECT_URI=https://api.yourdomain.com/auth/sharepoint/callback
   SHAREPOINT_ENCRYPTION_KEY=<production-key-different-from-dev>
   FRONTEND_URL=https://yourdomain.com
   ```

3. **Grant Admin Consent** (if new app registration)

4. **Test thoroughly** before releasing to users

## Security Best Practices

✅ **Different secrets for dev/prod**
✅ **Rotate secrets regularly** (before expiration)
✅ **Store secrets securely** (never commit to git)
✅ **Monitor app usage** in Azure AD
✅ **Review permissions** periodically
✅ **Enable logging** for OAuth flows

## Need Help?

- **Azure AD Documentation**: https://learn.microsoft.com/en-us/azure/active-directory/
- **Microsoft Graph API**: https://learn.microsoft.com/en-us/graph/
- **OAuth 2.0 Best Practices**: https://learn.microsoft.com/en-us/azure/active-directory/develop/

---

**You're all set!** 🎉

Once you complete these steps, your users can connect their SharePoint accounts and import data securely.
