# How to Fix Supabase Connection Error

## Problem
Your Supabase URL `lueqkftnwavumkvtivdn.supabase.co` cannot be reached. The project likely no longer exists.

## Solution: Create a New Supabase Project

### Step 1: Go to Supabase
1. Visit https://app.supabase.com
2. Sign in with your account
3. Click "New Project"

### Step 2: Create Project
1. Choose an organization
2. **Project Name**: `insightai` (or any name)
3. **Database Password**: Create a strong password (SAVE THIS!)
4. **Region**: Choose closest to you
5. Click "Create new project"
6. Wait 2-3 minutes for setup to complete

### Step 3: Get Your Credentials

#### Get URL:
1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** tab
3. Copy the **Project URL** (starts with `https://`)
   - Example: `https://xyzabc123.supabase.co`

#### Get Service Role Key:
1. On the same **API** page
2. Find **Project API keys** section
3. Copy the **`service_role`** key (NOT the `anon` key!)
   - It's the longer key at the bottom
   - Should start with `eyJhbGci...`

### Step 4: Update Your .env File

Replace lines 3 and 5 in `/home/Suhaif/Downloads/insightai/.env`:

```
SUPABASE_URL=https://YOUR_NEW_PROJECT_URL.supabase.co
SUPABASE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
```

### Step 5: Create Database Tables

You need to run the SQL schema in your new Supabase project:

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Copy and paste the contents of `/home/Suhaif/Downloads/insightai/supabase-schema.sql`
4. Click **Run**

This will create all necessary tables:
- users
- dashboards
- uploaded_files
- excel_sheets
- excel_data
- file_upload_logs
- data_configuration_logs
- sharepoint_tokens

### Step 6: Restart Server

```bash
cd /home/Suhaif/Downloads/insightai/server
npm start
```

The error should be gone!

---

## Quick Reference

**What you need from Supabase:**
1. ✅ Project URL (from Settings → API)
2. ✅ Service Role Key (from Settings → API, the LONGER key)
3. ✅ Run the schema SQL (from SQL Editor)

**Files to update:**
- `/home/Suhaif/Downloads/insightai/.env` (lines 3 & 5)

**Verification:**
When the server starts, you should see:
```
✓ Supabase client initialized successfully
Server running on port 3001 with Supabase integration
```

If you see warnings about missing credentials, the .env file wasn't updated correctly.
