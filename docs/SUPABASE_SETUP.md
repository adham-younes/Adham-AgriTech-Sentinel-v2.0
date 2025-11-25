## Supabase Setup Guide

Use this checklist after copying the production credentials that were shared:

1. **Create a SQL session**
   - Grab the database password from **Supabase → Project Settings → Database → Connection info**.
   - Build a connection string (replace `<password>`):

     ```bash
     export SUPABASE_DB_URL="postgresql://postgres:<password>@db.mxnkwudqxtgduhenrgvm.supabase.co:5432/postgres"
     ```

   - Open a shell with access to `psql` (WSL2, macOS, Linux, or Git Bash on Windows).

2. **Apply the full schema**

   ```bash
   psql "$SUPABASE_DB_URL" -f scripts/013_supabase_schema.sql
   ```

   The script creates/updates every table the app touches (`profiles`, `farms`, `fields`, `soil_analysis`, `crop_monitoring`,
   `field_satellite_snapshots`, `notifications`, `ai_chat_history`, `reports`, `marketplace_*`, `forum_*`, `irrigation_*`, `usage_metrics`, …),
   sets row-level security, triggers, and helper functions.

3. **Verify environment variables**

   Place the new keys inside `.env.local` (or Vercel Project Settings):

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://mxnkwudqxtgduhenrgvm.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   The service role key allows background jobs (usage analytics, EOSDA snapshot ingestion) to bypass RLS where needed; **never** expose it on the client.

4. **Seed optional reference data (optional)**

   - Use the Supabase SQL editor or `psql` to insert starter farms/fields if you want demo content.
   - Example:

     ```sql
     insert into public.farms (user_id, name, location, total_area, latitude, longitude)
     values ('<auth-user-uuid>', 'Demo Farm', 'Cairo', 120, 30.0444, 31.2357);
     ```

5. **Re-run the app**

   - `npm install` (ensures `@supabase/ssr` + `pgcrypto` usage).
   - `npm run db:setup` *(optional helper if you wire it)* or simply `npm run dev`.
   - The dashboard, satellite monitor, forum, marketplace, notifications, and AI assistant now read/write real Supabase data instead of the previous in-memory mocks.

> 💡 If you prefer the Supabase CLI, run `supabase db push --db-url "$SUPABASE_DB_URL"` after copying `scripts/013_supabase_schema.sql` into `supabase/migrations/<timestamp>__init.sql`.
