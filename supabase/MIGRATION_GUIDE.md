# Database Migration Guide

This guide explains how to apply the schema alignment migrations to your Supabase database.

## Overview

The migrations align your database schema with the Field Insight technical design:

1. **complete_schema_alignment.sql** - Main migration for multi-tenancy and PostGIS integration
2. **fix_security_warnings.sql** - Security enhancements and fixes

## Prerequisites

- Supabase project access
- PostgreSQL client or Supabase SQL Editor access
- Backup of your database (recommended)

## Migration Files

### 1. complete_schema_alignment.sql

This is the comprehensive migration that includes:

- ✅ PostGIS extension enablement
- ✅ Organizations table creation
- ✅ Helper functions (get_current_org_id, update_updated_at_column)
- ✅ Schema modifications (organization_id columns)
- ✅ PostGIS geom column for fields
- ✅ Performance indexes (GIST, composite, etc.)
- ✅ Data migration (default organization, lat/lng to geometry)
- ✅ Row-Level Security (RLS) policies
- ✅ Verification checks

### 2. fix_security_warnings.sql

Security enhancements:

- ✅ Fix mutable search_path on functions
- ✅ RLS on spatial_ref_sys table
- ⚠️ Optional: Move PostGIS to dedicated schema (commented out)

## Application Methods

### Method 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `complete_schema_alignment.sql`
5. Click **Run** to execute
6. Repeat for `fix_security_warnings.sql`
7. Check the output for success messages and migration summary

### Method 2: Supabase CLI

```bash
# Navigate to project directory
cd /Users/adham/ai_agriculture_projects/Adham-AgriTech-Full-Stack

# Apply main migration
supabase db execute --file supabase/migrations/complete_schema_alignment.sql

# Apply security fixes
supabase db execute --file supabase/migrations/fix_security_warnings.sql
```

### Method 3: psql Command Line

```bash
# Connect to your Supabase database
psql "postgresql://[user]:[password]@[host]:5432/postgres"

# Execute migrations
\i supabase/migrations/complete_schema_alignment.sql
\i supabase/migrations/fix_security_warnings.sql
```

## Verification

After running the migrations, verify the changes:

### 1. Check Tables

```sql
-- Verify organizations table exists
SELECT * FROM public.organizations LIMIT 5;

-- Check profiles have organization_id
SELECT id, organization_id FROM public.profiles LIMIT 5;

-- Check farms have organization_id
SELECT id, name, organization_id FROM public.farms LIMIT 5;

-- Verify fields have geom column
SELECT id, name, ST_AsText(geom) as geometry FROM public.fields LIMIT 5;
```

### 2. Check RLS Policies

```sql
-- View all RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 3. Check Indexes

```sql
-- List all indexes on key tables
SELECT 
  tablename, 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'farms', 'fields', 'field_analytics', 'organizations')
ORDER BY tablename, indexname;
```

### 4. Check Functions

```sql
-- Verify helper functions exist
SELECT proname, prosecdef, provolatile 
FROM pg_proc 
WHERE proname IN ('get_current_org_id', 'update_updated_at_column');
```

## Migration Summary Output

After successful migration, you should see:

```
NOTICE:  ========================================
NOTICE:  MIGRATION COMPLETE!
NOTICE:  ========================================
NOTICE:  Organizations: 1
NOTICE:  Profiles with org: X
NOTICE:  Farms with org: Y
NOTICE:  Total fields: Z
NOTICE:  Fields with geometry: Z
NOTICE:  ========================================
```

## Rollback (Emergency Only)

If you need to rollback (not recommended after data migration):

```sql
-- Drop RLS policies
DROP POLICY IF EXISTS "Allow users to see profiles in their own organization" ON public.profiles;
DROP POLICY IF EXISTS "Allow full access to own organization's farms" ON public.farms;
-- ... (drop other policies)

-- Remove organization_id columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS organization_id;
ALTER TABLE public.farms DROP COLUMN IF EXISTS organization_id;

-- Remove geom column from fields
ALTER TABLE public.fields DROP COLUMN IF EXISTS geom;

-- Drop organizations table
DROP TABLE IF EXISTS public.organizations CASCADE;

-- Drop helper functions
DROP FUNCTION IF EXISTS public.get_current_org_id();
DROP FUNCTION IF EXISTS public.update_updated_at_column();
```

## Troubleshooting

### Issue: PostGIS extension fails to enable

**Solution:** Ensure you have permissions to create extensions. Contact Supabase support if needed.

### Issue: organization_id column already exists

**Solution:** The migration script is idempotent and checks for existing columns. This is normal.

### Issue: RLS policies conflict

**Solution:** The script drops existing policies before recreating them. Review the policy names if you have custom policies.

### Issue: Data migration fails for lat/lng to geom

**Solution:** Check that your fields table has valid latitude and longitude values. Adjust the ST_Buffer distance if needed.

## Post-Migration Steps

1. ✅ Update your application code to use `organization_id` in queries
2. ✅ Test RLS policies by creating test users in different organizations
3. ✅ Verify geospatial queries work with the new `geom` column
4. ✅ Monitor performance of new indexes
5. ✅ Run security audit using Supabase dashboard

## Security Recommendations

After migration:

1. Enable "Leaked Password Protection" in Supabase Auth settings
2. Review all RLS policies for your use case
3. Consider adding admin roles for organization management
4. Implement audit logging for sensitive operations
5. Regularly review access patterns using Supabase Analytics

## Next Steps

- [ ] Run functional tests (user creation, farm creation, field creation)
- [ ] Test EOSDA integration with new schema
- [ ] Verify UI/UX works with multi-tenancy
- [ ] Perform load testing with realistic data volumes
- [ ] Document organization management workflows

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review PostGIS documentation: https://postgis.net/documentation/
- Check migration logs in SQL Editor
