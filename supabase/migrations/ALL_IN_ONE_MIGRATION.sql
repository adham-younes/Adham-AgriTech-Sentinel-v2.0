-- ============================================================================
-- COMPLETE MIGRATION - All-in-One Script
-- ============================================================================
--  هذا السكريبت يحتوي على جميع الترحيلات في ملف واحد
-- This script contains all migrations in a single file
--
-- IMPORTANT: تطبيق بخطوة واحدة في Supabase Dashboard → SQL Editor
-- IMPORTANT: Apply in one step in Supabase Dashboard → SQL Editor
-- ============================================================================

-- ============================================================================
-- SECTION 1: HOTFIX - Add Missing irrigation_type Column
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'fields' 
    AND column_name = 'irrigation_type'
  ) THEN
    ALTER TABLE public.fields 
    ADD COLUMN irrigation_type TEXT CHECK (irrigation_type IN ('drip', 'sprinkler', 'flood', 'manual'));
    RAISE NOTICE '✅ Added irrigation_type column';
  ELSE
    RAISE NOTICE 'ℹ️ irrigation_type column already exists';
  END IF;
END $$;

-- ============================================================================
-- SECTION 2: Enable PostGIS Extension
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    RAISE EXCEPTION '❌ PostGIS extension failed to enable';
  ELSE
    RAISE NOTICE '✅ PostGIS extension enabled';
  END IF;
END $$;

-- ============================================================================
-- SECTION 3: Helper Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT p.organization_id INTO org_id
  FROM public.profiles p
  WHERE p.id = auth.uid();
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

RAISE NOTICE '✅ Helper functions created';

-- ============================================================================
-- SECTION 4: Create Organizations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

RAISE NOTICE '✅ Organizations table created';

-- ============================================================================
-- SECTION 5: Add Multi-tenancy Columns
-- ============================================================================

DO $$
BEGIN
  -- Add organization_id to profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added organization_id to profiles';
  END IF;

  -- Add organization_id to farms
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'farms' 
    AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.farms 
    ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added organization_id to farms';
  END IF;
END $$;

-- ============================================================================
-- SECTION 6: Add PostGIS Geometry Column
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'fields' 
    AND column_name = 'geom'
  ) THEN
    ALTER TABLE public.fields 
    ADD COLUMN geom GEOMETRY(Polygon, 4326);
    RAISE NOTICE '✅ Added geom column to fields';
  END IF;
END $$;

-- ============================================================================
-- SECTION 7: Create Performance Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_farms_organization_id ON public.farms(organization_id);
CREATE INDEX IF NOT EXISTS idx_fields_geom ON public.fields USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_fields_farm_id ON public.fields(farm_id);
CREATE INDEX IF NOT EXISTS idx_field_analytics_multi ON public.field_analytics(field_id, acquisition_date DESC, metric_type);

RAISE NOTICE '✅ Performance indexes created';

-- ============================================================================
-- SECTION 8: Data Migration
-- ============================================================================

DO $$
DECLARE
  default_org_id UUID;
  field_record RECORD;
  center_point GEOMETRY;
  field_polygon GEOMETRY;
BEGIN
  -- Create default organization if none exists
  IF NOT EXISTS (SELECT 1 FROM public.organizations LIMIT 1) THEN
    INSERT INTO public.organizations (name)
    VALUES ('Default Organization')
    RETURNING id INTO default_org_id;
    
    -- Migrate existing users
    UPDATE public.profiles 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
    
    -- Migrate existing farms
    UPDATE public.farms 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
    
    RAISE NOTICE '✅ Created default organization and migrated data';
  END IF;

  -- Migrate lat/lng to PostGIS geometry
  FOR field_record IN 
    SELECT id, latitude, longitude 
    FROM public.fields 
    WHERE geom IS NULL 
    AND latitude IS NOT NULL 
    AND longitude IS NOT NULL
  LOOP
    center_point := ST_SetSRID(
      ST_MakePoint(field_record.longitude, field_record.latitude), 
      4326
    );
    
    field_polygon := ST_Buffer(center_point::geography, 50)::geometry;
    
    UPDATE public.fields 
    SET geom = field_polygon
    WHERE id = field_record.id;
  END LOOP;
  
  RAISE NOTICE '✅ Migrated coordinates to PostGIS geometry';
END $$;

-- ============================================================================
-- SECTION 9: Row-Level Security Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Allow users to see profiles in their own organization" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow full access to own organization's farms" ON public.farms;
DROP POLICY IF EXISTS "Allow full access to own organization's fields" ON public.fields;
DROP POLICY IF EXISTS "Allow full access to own organization's analytics" ON public.field_analytics;
DROP POLICY IF EXISTS "Allow users to view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Allow organization admins to update their organization" ON public.organizations;

-- Profiles policies
CREATE POLICY "Allow users to see profiles in their own organization"
ON public.profiles FOR SELECT
USING (
  organization_id = public.get_current_org_id() 
  OR organization_id IS NULL
  OR id = auth.uid()
);

CREATE POLICY "Allow users to update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Allow users to insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- Farms policies
CREATE POLICY "Allow full access to own organization's farms"
ON public.farms FOR ALL
USING (
  organization_id = public.get_current_org_id() 
  OR organization_id IS NULL
);

-- Fields policies
CREATE POLICY "Allow full access to own organization's fields"
ON public.fields FOR ALL
USING (
  farm_id IN (
    SELECT id FROM public.farms 
    WHERE organization_id = public.get_current_org_id() 
    OR organization_id IS NULL
  )
);

-- Field analytics policies
CREATE POLICY "Allow full access to own organization's analytics"
ON public.field_analytics FOR ALL
USING (
  field_id IN (
    SELECT f.id 
    FROM public.fields f
    JOIN public.farms fm ON f.farm_id = fm.id
    WHERE fm.organization_id = public.get_current_org_id() 
    OR fm.organization_id IS NULL
  )
);

-- Organizations policies
CREATE POLICY "Allow users to view their organization"
ON public.organizations FOR SELECT
USING (id = public.get_current_org_id());

CREATE POLICY "Allow organization admins to update their organization"
ON public.organizations FOR UPDATE
USING (id = public.get_current_org_id());

RAISE NOTICE '✅ RLS policies created';

-- ============================================================================
-- SECTION 10: Security Fixes
-- ============================================================================

-- RLS on spatial_ref_sys
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'spatial_ref_sys'
  ) THEN
    ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow public read access to spatial_ref_sys" ON public.spatial_ref_sys;
    CREATE POLICY "Allow public read access to spatial_ref_sys"
    ON public.spatial_ref_sys FOR SELECT
    TO public
    USING (true);
    
    RAISE NOTICE '✅ RLS enabled on spatial_ref_sys';
  END IF;
END $$;

-- ============================================================================
-- SECTION 11: Final Verification
-- ============================================================================

DO $$
DECLARE
  org_count INTEGER;
  profile_count INTEGER;
  farm_count INTEGER;
  field_count INTEGER;
  field_with_geom_count INTEGER;
  irrigation_col_exists BOOLEAN;
BEGIN
  -- Check all required components
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
    RAISE EXCEPTION '❌ Organizations table missing';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'organization_id') THEN
    RAISE EXCEPTION '❌ profiles.organization_id missing';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'farms' AND column_name = 'organization_id') THEN
    RAISE EXCEPTION '❌ farms.organization_id missing';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fields' AND column_name = 'geom') THEN
    RAISE EXCEPTION '❌ fields.geom missing';
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'fields' 
    AND column_name = 'irrigation_type'
  ) INTO irrigation_col_exists;
  
  IF NOT irrigation_col_exists THEN
    RAISE EXCEPTION '❌ fields.irrigation_type missing';
  END IF;
  
  -- Get counts
  SELECT COUNT(*) INTO org_count FROM public.organizations;
  SELECT COUNT(*) INTO profile_count FROM public.profiles WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO farm_count FROM public.farms WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO field_count FROM public.fields;
  SELECT COUNT(*) INTO field_with_geom_count FROM public.fields WHERE geom IS NOT NULL;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 MIGRATION COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PostGIS: ENABLED';
  RAISE NOTICE '✅ irrigation_type: FIXED';
  RAISE NOTICE '✅ Organizations: %', org_count;
  RAISE NOTICE '✅ Profiles linked: %', profile_count;
  RAISE NOTICE '✅ Farms linked: %', farm_count;
  RAISE NOTICE '✅ Total fields: %', field_count;
  RAISE NOTICE '✅ Fields with geometry: %', field_with_geom_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '👉 You can now create fields successfully!';
  RAISE NOTICE '========================================';
END $$;
