# Quick Reference: Database Migration

## Apply Migrations

### Via Supabase Dashboard (Recommended)

1. Go to https://app.supabase.com/project/vqawbzhtrcxojkgzvqit
2. Navigate to **SQL Editor**
3. Open `complete_schema_alignment.sql` and run it
4. Open `fix_security_warnings.sql` and run it
5. Verify output shows "MIGRATION COMPLETE!"

### Via Command Line

```bash
# Coming soon - requires Supabase CLI access
```

## Verify Migration

```sql
-- Check organizations
SELECT * FROM public.organizations;

-- Check profiles have org_id
SELECT id, organization_id FROM public.profiles LIMIT 5;

-- Check farms have org_id
SELECT id, name, organization_id FROM public.farms LIMIT 5;

-- Check fields have geometry
SELECT id, name, ST_AsText(geom) FROM public.fields WHERE geom IS NOT NULL LIMIT 5;

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
```

## Files

- **Migration Script:** `supabase/migrations/complete_schema_alignment.sql`
- **Security Fixes:** `supabase/migrations/fix_security_warnings.sql`
- **Full Guide:** `supabase/MIGRATION_GUIDE.md`

## Support

For detailed instructions, troubleshooting, and rollback procedures, see [MIGRATION_GUIDE.md](file:///Users/adham/ai_agriculture_projects/Adham-AgriTech-Full-Stack/supabase/MIGRATION_GUIDE.md)
