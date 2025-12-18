# Migration Guide: Dataverse → Supabase

This guide walks you through migrating your InsightAI application from Microsoft Dataverse to Supabase.

## Overview

The migration replaces:
- **Dataverse** (Microsoft Dynamics 365) → **Supabase** (PostgreSQL-based)
- Complex OAuth token management → Simple API key authentication
- OData API calls → PostgREST API calls
- Custom Dataverse table structure → PostgreSQL relational schema

## ✅ What's Been Completed

1. **Created `supabaseService.js`** - New service layer with all CRUD operations
2. **Updated `server/index.js`** - All endpoints now use Supabase instead of Dataverse
3. **Updated `.env.example`** - New configuration template for Supabase
4. **Dependency Check** - `@supabase/supabase-js` is already in `package.json`

## 🚀 Setup Instructions

### Step 1: Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Choose a name, password, and region
4. Wait for the project to initialize (2-3 minutes)

### Step 2: Get Your Credentials

1. In your Supabase project, click **"Project Settings"** (bottom left)
2. Go to the **"API"** tab
3. Copy these values:
   - **Project URL** → `SUPABASE_URL`
   - **Service Role Key** → `SUPABASE_KEY` (use for server-side operations)

⚠️ **IMPORTANT**: Use the **Service Role Key**, NOT the Anon Key, for server-side operations!

### Step 3: Create Database Tables

Copy and run the following SQL in the Supabase SQL Editor (or go to "SQL Editor" → "New Query"):

```sql
-- Create users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dashboards table
CREATE TABLE dashboards (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    data_model JSONB DEFAULT '{}',
    chart_configs JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create uploaded_files table
CREATE TABLE uploaded_files (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    sheet_count INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create excel_sheets table
CREATE TABLE excel_sheets (
    id BIGSERIAL PRIMARY KEY,
    file_id BIGINT NOT NULL REFERENCES uploaded_files(id) ON DELETE CASCADE,
    sheet_name VARCHAR(255) NOT NULL,
    sheet_index INT,
    row_count INT,
    column_count INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create excel_data table
CREATE TABLE excel_data (
    id BIGSERIAL PRIMARY KEY,
    sheet_id BIGINT NOT NULL REFERENCES excel_sheets(id) ON DELETE CASCADE,
    row_index INT,
    row_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create file_upload_logs table
CREATE TABLE file_upload_logs (
    id BIGSERIAL PRIMARY KEY,
    file_id BIGINT,
    upload_date VARCHAR(10),
    upload_time VARCHAR(10),
    file_path VARCHAR(255),
    status VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create data_configuration_logs table
CREATE TABLE data_configuration_logs (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255),
    columns TEXT,
    join_configs TEXT,
    config_date VARCHAR(10),
    config_time VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_dashboards_user_id ON dashboards(user_id);
CREATE INDEX idx_uploaded_files_user_id ON uploaded_files(user_id);
CREATE INDEX idx_excel_sheets_file_id ON excel_sheets(file_id);
CREATE INDEX idx_excel_data_sheet_id ON excel_data(sheet_id);
CREATE INDEX idx_file_upload_logs_file_id ON file_upload_logs(file_id);
```

### Step 4: Update Your .env File

Copy your `.env.example` to `.env` and update it:

```bash
# Copy the template
cp .env.example .env

# Edit .env with your Supabase credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key-here
PORT=3001
FRONTEND_URL=http://localhost:3000
```

⚠️ **CRITICAL**: Make sure `.env` is in `.gitignore` - NEVER commit this file!

### Step 5: Install Dependencies

```bash
# Install server dependencies
npm install

# If you need to reinstall everything
rm -rf node_modules package-lock.json
npm install
```

### Step 6: Start the Server

```bash
# Development with hot reload
npm run dev

# Production
npm start
```

You should see: `Server running on port 3001 with Supabase integration`

## 🔄 Migrating Existing Data from Dataverse

If you have existing data in Dataverse, you'll need to migrate it:

### Option 1: Manual Export → Import
1. Export data from Dataverse as CSV
2. Use Supabase's import tool (in "SQL Editor")
3. Manually map the data

### Option 2: Use a Migration Script
Create a script that:
1. Connects to your Dataverse environment
2. Reads all users, dashboards, files, etc.
3. Inserts them into Supabase

Contact support for a migration script if needed.

## 📋 API Changes

### Authentication
**Before (Dataverse):**
```javascript
const user = await dataverseService.getUserByEmail(email);
```

**After (Supabase):**
```javascript
const user = await supabaseService.getUserByEmail(email);
```

✅ **No endpoint changes needed!** All API endpoints (`/api/login`, `/api/dashboards`, etc.) work the same way.

## 🔒 Security Best Practices

1. **Never commit `.env`** - It's in `.gitignore` for a reason!
2. **Use Service Role Key for server**, Anon Key for client (if using Supabase client library)
3. **Enable Row Level Security (RLS)** in Supabase for fine-grained access control:
   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
   ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
   ```
4. **Hash passwords** - In production, use bcrypt:
   ```javascript
   const bcrypt = require('bcrypt');
   const hashedPassword = await bcrypt.hash(password, 10);
   ```

## 🐛 Troubleshooting

### "Missing required environment variable: SUPABASE_URL"
- Make sure your `.env` file exists and has `SUPABASE_URL` set
- Restart the server after updating `.env`

### "PGRST116: No rows found" in signup/login
- Check that your users table exists
- Verify the email/password are correct
- Check Supabase logs: Project Settings → Logs

### File uploads failing
- Verify all tables exist (especially `uploaded_files`, `excel_sheets`, `excel_data`)
- Check file size limits in Supabase
- Check server logs for specific errors

### Connection timeout
- Verify `SUPABASE_URL` is correct (should start with `https://`)
- Check your internet connection
- Verify Supabase project is active

## 📞 Support

### Useful Links
- **Supabase Docs**: https://supabase.com/docs
- **Supabase Dashboard**: https://app.supabase.com
- **PostgREST API Docs**: https://postgrest.org/en/v12/
- **supabase-js Library**: https://supabase.com/docs/reference/javascript/introduction

### Getting Help
1. Check Supabase Dashboard → "Logs" for error messages
2. Review server console output
3. Check `.env` configuration is correct
4. Verify all tables were created successfully

## 🎯 Next Steps

1. ✅ Set up Supabase project
2. ✅ Create database tables (SQL script above)
3. ✅ Update `.env` file
4. ✅ Install dependencies and start server
5. ✅ Test login/signup endpoints
6. ✅ Test file uploads
7. ✅ Test dashboard creation
8. (Optional) Migrate existing data from Dataverse
9. (Optional) Deploy to production

## 🚢 Deployment

When deploying to production (Render, Vercel, etc.):

1. Set environment variables in your hosting platform
2. Use a strong, secure Supabase API key
3. Consider enabling Row Level Security (RLS)
4. Set up backups in Supabase
5. Monitor logs regularly

## ✨ Summary of Changes

| Aspect | Dataverse | Supabase |
|--------|-----------|----------|
| **Auth** | OAuth 2.0 | API Keys |
| **Database** | Dataverse Tables | PostgreSQL |
| **API** | OData | PostgREST |
| **Service File** | `dataverseService.js` | `supabaseService.js` |
| **Dependencies** | `axios` | `@supabase/supabase-js` |
| **Setup Complexity** | High (OAuth, tenants) | Low (API keys) |

---

**Migration completed successfully!** Your application is now using Supabase instead of Dataverse.
