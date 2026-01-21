# SharePoint Per-User OAuth Integration

## Overview

This document describes the SharePoint integration that uses **per-user OAuth 2.0 authentication** for multi-tenant SaaS applications. Each user connects their own SharePoint account, ensuring data isolation and security.

## Architecture

### Authentication Model
- **OAuth 2.0 Authorization Code Flow with Delegated Permissions**
- **NOT** using Client Credentials (service account)
- Each user must explicitly authorize the application
- Tokens are stored encrypted per user in the database

### Key Components

1. **`sharepointOAuthService.js`** - Handles OAuth flow, token management, and refresh
2. **`sharepointService.js`** - Extended with per-user methods using OAuth tokens
3. **OAuth Endpoints** in `server/index.js`:
   - `GET /auth/sharepoint/start` - Initiates OAuth flow
   - `GET /auth/sharepoint/callback` - Handles OAuth callback
   - `GET /api/sharepoint/connection-status` - Check connection status
   - `DELETE /api/sharepoint/disconnect` - Revoke connection
   - `POST /api/sharepoint/user/sites` - Get user's sites
   - `POST /api/sharepoint/user/lists` - Get user's lists
   - `POST /api/sharepoint/user/import` - Import using user's token

4. **Database Table** - `sharepoint_connections`:
   ```sql
   - user_id (FK to users)
   - tenant_id
   - access_token (encrypted)
   - refresh_token (encrypted)
   - expires_at
   ```

### Security Features

✅ **Token Encryption** - AES-256-CBC encryption for all stored tokens
✅ **Per-User Isolation** - Each user sees only their own SharePoint data
✅ **Automatic Token Refresh** - Tokens refreshed automatically before expiry
✅ **Graceful Expiration Handling** - Invalid/revoked tokens handled cleanly
✅ **Row-Level Security** - Database policies prevent cross-user access

## Setup Instructions

### 1. Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: "AnalyticCore SharePoint Connector"
   - **Supported account types**: **Accounts in any organizational directory (Multitenant)**
   - **Redirect URI**: `https://your-backend.com/auth/sharepoint/callback`
     - For local dev: `http://localhost:3001/auth/sharepoint/callback`

5. After creation, note down:
   - **Application (client) ID**
   - **Directory (tenant) ID** (or use `common` for multitenant)

### 2. Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add a description and set expiration
4. **Copy the secret value immediately** (you won't be able to see it again)

### 3. Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph** > **Delegated permissions**
4. Add the following permissions:
   - `User.Read` - Basic user profile
   - `Sites.Read.All` - Read user's SharePoint sites
   - `offline_access` - Refresh tokens

5. Click **Grant admin consent** for your organization

**⚠️ IMPORTANT**: Use **Delegated** permissions, NOT Application permissions!

### 4. Environment Variables

Add to your `.env` file:

```bash
# SharePoint OAuth Configuration
SHAREPOINT_OAUTH_TENANT_ID=common  # or your specific tenant ID
SHAREPOINT_OAUTH_CLIENT_ID=your-application-client-id
SHAREPOINT_OAUTH_CLIENT_SECRET=your-client-secret-value
SHAREPOINT_REDIRECT_URI=http://localhost:3001/auth/sharepoint/callback
SHAREPOINT_ENCRYPTION_KEY=your-32-character-encryption-key-here

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:5173
```

Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### 5. Database Migration

Run the migration SQL:

```bash
# Connect to your Supabase project SQL editor and run:
cat server/migrations/001_add_sharepoint_oauth.sql
```

Or apply directly in Supabase SQL Editor.

### 6. Update Frontend URL

Make sure `FRONTEND_URL` in your `.env` matches your actual frontend domain:
- **Local**: `http://localhost:5173`
- **Production**: `https://your-production-frontend.com`

## User Flow

### First-Time Connection

1. User clicks "Import from SharePoint"
2. Sees "Connect SharePoint Account" screen
3. Clicks "Connect SharePoint Account" button
4. Redirected to Microsoft login page
5. Signs in with their Microsoft account
6. Grants permissions to the app
7. Redirected back to application
8. Can now browse their SharePoint sites and import data

### Subsequent Imports

1. User clicks "Import from SharePoint"
2. Directly sees their SharePoint sites (token auto-refreshed if needed)
3. Selects site and list
4. Imports data

## API Endpoints

### Check Connection Status
```http
GET /api/sharepoint/connection-status?userId=123
Response: { "connected": true, "oauthConfigured": true }
```

### Initiate OAuth Flow
```http
GET /auth/sharepoint/start?userId=123
Response: Redirect to Microsoft login
```

### Get User's Sites
```http
POST /api/sharepoint/user/sites
Body: { "userId": 123 }
Response: { "sites": [...] }
```

### Get User's Lists
```http
POST /api/sharepoint/user/lists
Body: { "userId": 123, "siteId": "..." }
Response: { "lists": [...] }
```

### Import List Data
```http
POST /api/sharepoint/user/import
Body: {
  "userId": 123,
  "siteId": "...",
  "listId": "...",
  "listName": "My List",
  "siteName": "My Site"
}
Response: { "fileId": 456, "data": [[...]], ... }
```

### Disconnect SharePoint
```http
DELETE /api/sharepoint/disconnect
Body: { "userId": 123 }
Response: { "message": "SharePoint account disconnected successfully" }
```

## Token Management

### Automatic Refresh

Tokens are automatically refreshed when:
- Current token expires within 5 minutes
- User makes any SharePoint API request

The refresh happens transparently - no user action required.

### Token Storage

Tokens are stored in `sharepoint_connections` table:
- **Encrypted** at rest using AES-256-CBC
- **One connection per user** (enforced by UNIQUE constraint)
- **Automatically deleted** if user is deleted (CASCADE)

### Token Revocation

Users can disconnect anytime:
- Deletes stored tokens from database
- User must re-authorize to use SharePoint again
- Previous imports remain accessible

## Backward Compatibility

### Legacy Service Account Support

The old service-account (client credentials) endpoints are still available:
- `POST /api/sharepoint/sites` (service account)
- `POST /api/sharepoint/lists` (service account)
- `POST /api/sharepoint/import` (service account)

These can be used for admin/internal imports if needed.

### Migration Path

1. Set up OAuth configuration
2. Existing users see "Connect SharePoint" screen
3. New imports use OAuth
4. Old imports continue to work
5. Eventually deprecate service account if not needed

## Troubleshooting

### "SharePoint OAuth is not properly configured"

**Cause**: Missing or invalid environment variables

**Solution**:
1. Check all required env vars are set
2. Ensure `SHAREPOINT_ENCRYPTION_KEY` is exactly 32 characters
3. Verify `SHAREPOINT_REDIRECT_URI` matches Azure AD app

### "Invalid token" or "401 Unauthorized"

**Cause**: Token expired or revoked

**Solution**:
- User will be automatically prompted to reconnect
- Tokens should auto-refresh; if not, check refresh token is valid

### "User has not connected their SharePoint account"

**Cause**: User hasn't authorized the app yet

**Solution**:
- User needs to click "Connect SharePoint Account"
- Complete OAuth flow

### OAuth callback shows error

**Cause**: Various (permissions, redirect URI mismatch, etc.)

**Solution**:
1. Check Azure AD app redirect URI matches exactly
2. Verify delegated permissions are granted
3. Check tenant ID is correct (or use `common`)
4. Review browser console and server logs

## Testing

### Local Testing

1. Start backend: `cd server && node index.js`
2. Start frontend: `npm run dev`
3. Create test user
4. Try SharePoint import flow

### Multi-User Testing

1. Create multiple test users
2. Each should connect their own SharePoint
3. Verify users only see their own data
4. Test token refresh (wait for token to expire)

### Security Testing

- ✅ Tokens encrypted in database
- ✅ Different users cannot access each other's connections
- ✅ Invalid tokens handled gracefully
- ✅ Disconnected users cannot access SharePoint

## Production Deployment

### Environment Variables

Update production `.env`:
```bash
SHAREPOINT_OAUTH_TENANT_ID=common
SHAREPOINT_OAUTH_CLIENT_ID=prod-client-id
SHAREPOINT_OAUTH_CLIENT_SECRET=prod-secret
SHAREPOINT_REDIRECT_URI=https://api.yourdomain.com/auth/sharepoint/callback
SHAREPOINT_ENCRYPTION_KEY=prod-32-char-key
FRONTEND_URL=https://yourdomain.com
```

### Azure AD Production App

1. Create separate app registration for production
2. Use production redirect URI
3. Grant admin consent
4. Store credentials securely (env vars, secrets manager)

### Database

1. Run migration on production database
2. Verify Row-Level Security policies are active
3. Monitor `sharepoint_connections` table size

### Monitoring

Monitor:
- Token refresh failures
- OAuth errors in logs
- Connection status checks
- Import success/failure rates

## Support

For issues or questions:
1. Check server logs: `cd server && tail -f server.log`
2. Check browser console for frontend errors
3. Verify Azure AD app configuration
4. Review this documentation

## Summary

✅ **Per-user OAuth** - Each user connects their own SharePoint
✅ **Secure** - Tokens encrypted, RLS enabled, auto-refresh
✅ **Multi-tenant** - Supports users from any organization
✅ **Backward compatible** - Existing imports unaffected
✅ **Best practices** - Follows Microsoft OAuth guidelines

Users now have full control over their SharePoint data access! 🚀
