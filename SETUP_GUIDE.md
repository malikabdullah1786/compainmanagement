# SMS Marketing Platform - Setup & Testing Guide

## 📋 Prerequisites

Before you start, make sure you have:
- **Node.js** (v18+) - for frontend
- **Python** (v3.10+) - for backend
- **Supabase Account** - [supabase.com](https://supabase.com)
- **Twilio Account** - [twilio.com](https://twilio.com) (for SMS)

---

## 🗄️ Step 1: Database Setup (Supabase)

### 1.1 Reset Database (if needed)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy contents of `database_reset.sql` and run it
5. Wait for completion

### 1.2 Create Database Tables
1. In SQL Editor, copy contents of `database_complete.sql`
2. Run it
3. You should see: "Created 7 tables successfully"

### 1.3 Create Superadmin User
1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter email (e.g., `admin@yourcompany.com`) and password
4. Click **Create user**
5. Copy the **User UID**
6. Go back to **SQL Editor** and run:
```sql
UPDATE public.user_profiles 
SET role = 'superadmin', is_verified = true 
WHERE id = 'paste-your-user-id-here';
```

### 1.4 Disable Email Confirmation
1. Go to **Authentication** → **Providers**
2. Click on **Email**
3. Turn **OFF** "Confirm email"
4. Click **Save**

---

## 🔧 Step 2: Backend Setup (Python FastAPI)

### 2.1 Create Backend Environment File
Create `.env` file in the root folder (`c:\Users\malik\OneDrive\Desktop\sms\.env`):

```env
# Environment
ENV=dev

# Supabase Configuration
SUPABASE_URL=https://ezzpqgwtyctlfxejnrbw.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6enBxZ3d0eWN0bGZ4ZWpucmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTEwNzMsImV4cCI6MjA4NTAyNzA3M30.MRDjF6wqdBdQi2q2Y0n5XyTiv3bThqh_m9d3u7nOsuI
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6enBxZ3d0eWN0bGZ4ZWpucmJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ1MTA3MywiZXhwIjoyMDg1MDI3MDczfQ.frT__2zisJecf2WFHScirvCXWQSgDOzu7neEZNpb88I

# Twilio Configuration (get from twilio.com/console)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_MESSAGING_SERVICE_SID=your-messaging-service-sid

# API Configuration
API_BASE_URL=http://localhost:8000
SECRET_KEY=your-random-secret-key-here
```

### 2.2 Install Backend Dependencies
Open terminal in `c:\Users\malik\OneDrive\Desktop\sms`:
```bash
pip install -r requirements.txt
```

### 2.3 Start Backend Server
```bash
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

**Keep this terminal open!**

---

## 🎨 Step 3: Frontend Setup (Next.js)

### 3.1 Check Frontend Environment File
The file `frontend\.env.local` should already have your Supabase keys.

### 3.2 Install Frontend Dependencies
Open a NEW terminal in `c:\Users\malik\OneDrive\Desktop\sms\frontend`:
```bash
npm install
```

### 3.3 Start Frontend Development Server
```bash
npm run dev
```

You should see:
```
▲ Next.js 16.x.x
- Local:        http://localhost:3000
```

---

## 🧪 Step 4: Test the Application

### 4.1 Open the Application
Open browser and go to: **http://localhost:3000**

### 4.2 Test Signup Flow
1. Click **Sign up**
2. Enter:
   - Business Name: "Test Restaurant"
   - Email: `test@example.com`
   - Password: `password123`
3. Click **Create Account**
4. You should see the **Pending Approval** page

### 4.3 Test Admin Approval
1. Login as superadmin: `admin@yourcompany.com`
2. You'll be redirected to `/admin/dashboard`
3. You should see the test user in "Pending Approvals"
4. Click **Approve**

### 4.4 Test Restaurant Dashboard
1. Logout (click your profile → Logout)
2. Login as the test user: `test@example.com`
3. You should now see the **Restaurant Dashboard**

### 4.5 Test Import Customers
1. Go to **Customers** page
2. Click **Import CSV**
3. Create a test CSV file:
```csv
phone,first_name,last_name,opt_in_status
+1234567890,John,Doe,opted_in
+1234567891,Jane,Smith,opted_in
+1234567892,Bob,Wilson,opted_in
```
4. Upload the CSV
5. Customers should appear in the list

### 4.6 Test Create Campaign
1. Go to **Campaigns** → **New Campaign**
2. Fill in:
   - Campaign Name: "Test Promo"
   - Message: "Hey {first_name}! Special offer just for you!"
3. Select audience segment
4. Schedule or send now

---

## 🔍 Verify Backend API

### API Endpoints
With backend running, you can test these URLs:

- **API Docs**: http://localhost:8000/docs
- **List Customers**: http://localhost:8000/customers?restaurant_id=YOUR_RESTAURANT_ID
- **List Campaigns**: http://localhost:8000/campaigns?restaurant_id=YOUR_RESTAURANT_ID

---

## ⚠️ Common Issues

### Issue: "No restaurant associated with your account"
**Solution**: Run database_reset.sql, then database_complete.sql, then re-signup

### Issue: Backend can't connect to Supabase
**Solution**: Check `.env` file has correct `SUPABASE_SERVICE_KEY`

### Issue: Frontend can't reach backend
**Solution**: Ensure backend is running on port 8000 and `NEXT_PUBLIC_API_URL=http://localhost:8000` in frontend `.env.local`

### Issue: User stuck on pending approval
**Solution**: Login as superadmin and approve the user

---

## 📁 Project Structure

```
sms/
├── .env                    # Backend environment variables
├── main.py                 # FastAPI entry point
├── database.py             # Supabase connection
├── routers/                # API routes
│   ├── customers.py
│   ├── campaigns.py
│   └── restaurants.py
├── services/               # Business logic
│   ├── twilio_service.py
│   └── campaign_service.py
├── database_complete.sql   # Full database setup
├── database_reset.sql      # Database cleanup
└── frontend/               # Next.js frontend
    ├── .env.local          # Frontend environment
    ├── src/
    │   ├── app/            # Pages
    │   ├── components/     # UI components
    │   ├── lib/            # Utilities, API, queries
    │   └── contexts/       # React contexts
    └── package.json
```

---

## 🚀 Running Both Servers

**Terminal 1 - Backend:**
```bash
cd c:\Users\malik\OneDrive\Desktop\sms
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd c:\Users\malik\OneDrive\Desktop\sms\frontend
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API Docs: http://localhost:8000/docs
