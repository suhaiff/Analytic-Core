---
description: SharePoint Import Integration Plan
---

# SharePoint Per-User OAuth Integration Implementation Plan

## Overview
Convert SharePoint integration from service-account (client credentials) to per-user delegated OAuth,
matching the Google Sheets pattern.

## Current State
- ✅ Google Sheets uses Service Account (NOT OAuth - this is different from requirement)
- ✅ SharePoint uses Client Credentials (service account)
- ❌ SharePoint needs to be per-user OAuth with delegated permissions

## Implementation Steps

### 1. Database Schema Changes
Add new table: `sharepoint_connections`
```sql
CREATE TABLE sharepoint_connections (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255),
    access_token TEXT NOT NULL,  -- encrypted
    refresh_token TEXT NOT NULL,  -- encrypted
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sharepoint_connections_user_id ON sharepoint_connections(user_id);
```

Update `uploaded_files` table to add source_info column if not exists:
```sql
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS source_info JSONB DEFAULT '{}';
```

### 2. Backend OAuth Endpoints
Create new endpoints in `server/index.js`:

- `GET /auth/sharepoint/start` - Initiates OAuth flow
- `GET /auth/sharepoint/callback` - Handles OAuth callback
- `GET /api/sharepoint/connection-status` - Check if user has connected SharePoint
- `DELETE /api/sharepoint/disconnect` - Revoke SharePoint connection

### 3. Token Management Service
Create `server/sharepointOAuthService.js`:
- Token encryption/decryption
- Token refresh logic
- Per-user token retrieval
- Connection status check

### 4. Update SharePoint Service
Modify `server/sharepointService.js`:
- Add methods to accept user access token
- Keep existing service-account methods for backward compatibility
- Add per-user data fetching methods

### 5. Frontend Changes
Update `components/Landing.tsx`:
- Add connection check before showing data
- Show "Connect SharePoint" button if not connected
- Show site/list selector if connected
- Match Google Sheets UI pattern

### 6. Environment Variables
Update `.env` and `.env.example`:
```
# OAuth 2.0 (Delegated - per user)
SHAREPOINT_OAUTH_CLIENT_ID=...
SHAREPOINT_OAUTH_CLIENT_SECRET=...
SHAREPOINT_OAUTH_TENANT_ID=...
SHAREPOINT_REDIRECT_URI=https://your-backend/auth/sharepoint/callback
```

### 7. Azure App Registration
Update Azure AD App:
- Set to Multitenant
- Add Redirect URI: `https://<backend>/auth/sharepoint/callback`
- Change from Application to Delegated permissions:
  - User.Read
  - Sites.Read.All
  - offline_access

## Security Requirements
- ✅ Tokens encrypted at rest (AES-256-CBC)
- ✅ Per-user token isolation
- ✅ Automatic token refresh
- ✅ Graceful handling of expired/revoked tokens
- ✅ No cross-user data leakage

## Testing Checklist
- [ ] Google Sheets still works
- [ ] SQL import still works
- [ ] SharePoint requires user login
- [ ] Multiple users see different data
- [ ] Token refresh works automatically
- [ ] Expired token handling works
- [ ] Disconnect/revoke works

## Success Criteria
1. New users must explicitly connect SharePoint
2. Each user sees only their own SharePoint data
3. Existing import workflows remain unchanged
4. OAuth follows Microsoft best practices
5. No security regressions
