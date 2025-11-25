# Fix Vercel Environment Variables - URGENT

## The Problem
Your app is deployed but showing "Application error: a server-side exception has occurred" because Supabase environment variables are missing.

## The Solution
Add these environment variables to your Vercel project:

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com/dashboard
2. Click on your `adham-agritech` project
3. Go to **Settings** → **Environment Variables**

### Step 2: Add These Variables

**Variable 1:**
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://nptpmiljdljxjbgoxyqn.supabase.co`
- **Environment:** Check all (Production, Preview, Development)

**Variable 2:**
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wdHBtaWxqZGxqeGpiZ294eXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTQxNTIsImV4cCI6MjA3ODc5MDE1Mn0.jUEKrMu2xXQ5xLJABr8pJH1fuEDfSVPOjmFCmk5jOSA`
- **Environment:** Check all (Production, Preview, Development)

### Step 3: Redeploy
After adding the variables, Vercel will automatically trigger a new deployment. Wait for it to complete (about 1-2 minutes).

### Step 4: Verify
Visit your dashboard at: https://adham-agritech-oi0wqm8l8-adhamlouxors-projects.vercel.app/dashboard

The error should be gone and you should see your dashboard with data from Supabase.

---

## Quick Copy-Paste

```bash
NEXT_PUBLIC_SUPABASE_URL=https://nptpmiljdljxjbgoxyqn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wdHBtaWxqZGxqeGpiZ294eXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTQxNTIsImV4cCI6MjA3ODc5MDE1Mn0.jUEKrMu2xXQ5xLJABr8pJH1fuEDfSVPOjmFCmk5jOSA
```
