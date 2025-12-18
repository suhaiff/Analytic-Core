# Supabase Integration - Quick Reference

## Files Modified/Created

### New Files Created:
✅ `server/supabaseService.js` - Complete Supabase service layer (312 lines)
✅ `MIGRATION_DATAVERSE_TO_SUPABASE.md` - Full migration guide with setup instructions
✅ `supabase-schema.sql` - Complete database schema ready to deploy
✅ `setup-supabase.sh` - Interactive setup script for configuration

### Files Updated:
✅ `server/index.js` - All endpoints now use Supabase instead of Dataverse
✅ `.env.example` - Updated with Supabase configuration template

### Files NOT Changed (Still Compatible):
- `package.json` - Already has `@supabase/supabase-js` dependency
- All frontend components - No changes needed
- All API routes - Work exactly the same way

---

## 🚀 Quick Start (5 Minutes)

### 1. Create Supabase Project
```bash
# Go to https://app.supabase.com
# Click "New Project" and wait for it to initialize
```

### 2. Get Your Credentials
```
Project Settings → API tab
- Copy Project URL → SUPABASE_URL
- Copy Service Role Key → SUPABASE_KEY
```

### 3. Create Database Tables
```bash
# Go to SQL Editor → New Query
# Copy/paste entire contents of supabase-schema.sql
# Click "Run"
```

### 4. Configure Your App
```bash
# Option A: Interactive setup
bash setup-supabase.sh

# Option B: Manual setup
cp .env.example .env
# Edit .env with your SUPABASE_URL and SUPABASE_KEY
```

### 5. Start the Server
```bash
npm install  # If needed
npm run dev
```

### 6. Test the API
```bash
# Try signup
curl -X POST http://localhost:3001/api/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"pass123"}'

# Try login
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'
```

---

## 📚 Service Layer API Reference

All methods are in `server/supabaseService.js`:

### User Management
```javascript
// Get all users
await supabaseService.getUsers()

// Get user by email
await supabaseService.getUserByEmail(email)

// Create new user
await supabaseService.createUser(name, email, password, role)

// Delete user
await supabaseService.deleteUser(userId)
```

### Dashboards
```javascript
// Create dashboard
await supabaseService.createDashboard(userId, name, dataModel, chartConfigs)

// Get user's dashboards
await supabaseService.getDashboardsByUser(userId)

// Get all dashboards (admin)
await supabaseService.getAllDashboards()

// Delete dashboard
await supabaseService.deleteDashboard(dashboardId)
```

### File Management
```javascript
// Create file record
await supabaseService.createFile(userId, originalName, mimeType, fileSize, sheetCount)

// Create sheet
await supabaseService.createSheet(fileId, sheetName, sheetIndex, rowCount, columnCount)

// Add row data
await supabaseService.createExcelData(sheetId, rowIndex, rowData)

// Get all files (admin)
await supabaseService.getAllUploads()

// Get file content
await supabaseService.getFileContent(fileId)

// Log upload
await supabaseService.createFileUploadLog(fileId, date, time, path, status, errorMsg)
```

### Configuration Logging
```javascript
// Log data configuration
await supabaseService.createDataConfigLog(fileName, columns, joinConfigs)
```

---

## 🔑 Environment Variables

Required in `.env`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key-here
PORT=3001                                      # Optional, defaults to 3001
FRONTEND_URL=http://localhost:3000            # Optional, for CORS
```

---

## 🗄️ Database Schema

7 main tables:
1. `users` - User accounts and authentication
2. `dashboards` - User dashboards with configurations
3. `uploaded_files` - File metadata and upload tracking
4. `excel_sheets` - Worksheet metadata
5. `excel_data` - Individual row data from Excel files
6. `file_upload_logs` - Upload attempt logs
7. `data_configuration_logs` - Data model configuration logs

All tables include:
- ✅ Foreign key relationships with CASCADE delete
- ✅ Proper indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Timestamps with timezone support

---

## ⚠️ Important Security Notes

1. **Never commit `.env`** - It's in `.gitignore`
2. **Use Service Role Key for server-side** (not Anon Key)
3. **Hash passwords in production:**
   ```javascript
   const bcrypt = require('bcrypt');
   const hashed = await bcrypt.hash(password, 10);
   ```
4. **Enable Row Level Security (RLS)** - Already set up in schema
5. **Rotate API keys regularly** in Supabase dashboard
6. **Use different keys for dev/staging/production**

---

## 🔄 Comparison: Before vs After

| Feature | Dataverse | Supabase |
|---------|-----------|----------|
| **Setup Time** | 30+ minutes | 5 minutes |
| **Cost** | $$$ | Generous free tier |
| **Authentication** | Complex OAuth | Simple API keys |
| **Database Type** | No-code platform | PostgreSQL |
| **API Type** | OData | PostgREST (SQL-like) |
| **Learning Curve** | Steep | Moderate |
| **Scaling** | Enterprise | Automatic |
| **Data Export** | Limited | Full SQL access |

---

## 🐛 Troubleshooting

### "SUPABASE_URL not found"
```bash
# Check .env exists
ls -la .env

# Check it has the right values
cat .env | grep SUPABASE

# If missing, run setup again
bash setup-supabase.sh
```

### "PostgreSQL error: relation not found"
```bash
# Tables weren't created. Go to Supabase SQL Editor and run:
# Copy entire contents of supabase-schema.sql and execute
```

### "Authentication error"
```bash
# Check that you're using SERVICE ROLE KEY, not ANON KEY
# Anon key is for client-side, Service Role is for server-side
```

### "Connection refused"
```bash
# Make sure Supabase project is running
# Go to https://app.supabase.com and check project status
# Check SUPABASE_URL doesn't have typos
```

### File uploads not working
```bash
# Check that excel_sheets and excel_data tables exist
# Check file size isn't exceeding Supabase limits
# Check server logs for specific errors
```

---

## 📞 Getting Help

### Documentation
- 📖 [Supabase Docs](https://supabase.com/docs)
- 📖 [PostgREST API](https://postgrest.org/)
- 📖 [supabase-js SDK](https://supabase.com/docs/reference/javascript)

### Debugging
1. Check server logs: `npm run dev`
2. Check Supabase logs: Dashboard → Logs → Edge Function Logs
3. Enable verbose logging in Node.js: `DEBUG=* npm run dev`

### If Something Breaks
1. **Backend issue**: Check `server/supabaseService.js` for correct method calls
2. **Database issue**: Check Supabase Dashboard → SQL Editor → Query
3. **Connection issue**: Verify `.env` credentials are correct
4. **Data issue**: Check file format and data types match schema

---

## ✨ Next Steps

- [ ] Set up Supabase project
- [ ] Run database schema SQL
- [ ] Configure `.env`
- [ ] Start backend server
- [ ] Test API endpoints
- [ ] (Optional) Set up Row Level Security (RLS)
- [ ] (Optional) Hash passwords with bcrypt
- [ ] (Optional) Migrate data from Dataverse
- [ ] (Optional) Deploy to production

---

## 📊 Architecture

```
Frontend (React)
    ↓
API Endpoints (Express)
    ↓
supabaseService.js
    ↓
@supabase/supabase-js (SDK)
    ↓
Supabase API
    ↓
PostgreSQL Database
```

All communication is **encrypted** and **authenticated** with your API key.

---

**Status**: ✅ Migration Complete!
**Last Updated**: December 17, 2025
**Version**: 1.0
