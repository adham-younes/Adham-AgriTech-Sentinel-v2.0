-- ============================================================================
-- Field Insight Platform - Complete Schema Alignment Migration
-- ============================================================================
-- This migration script aligns the current Supabase database schema with
-- the Field Insight technical design specifications.
--
-- Key changes:
-- 1. Enable PostGIS for geospatial data handling
-- 2. Create organizations table for multi-tenancy
-- 3. Add organization_id columns to profiles and farms
-- 4. Add PostGIS geom column to fields
-- 5. Implement Row-Level Security (RLS) policies
-- 6. Create performance indexes
-- 7. Migrate existing data to new structure
-- ============================================================================

-- ============================================================================
-- SECTION 1: Enable PostGIS Extension
-- ============================================================================
-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify PostGIS is working
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    RAISE EXCEPTION 'PostGIS extension failed to enable';
  END IF;
END $$;

-- ============================================================================
-- SECTION 2: Helper Functions
-- ============================================================================

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Function to get current user's organization ID (for RLS)
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

-- ============================================================================
-- SECTION 3: Create Organizations Table
-- ============================================================================

-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add updated_at trigger to organizations
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 4: Alter Existing Tables for Multi-tenancy
-- ============================================================================

-- Add organization_id to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add organization_id to farms table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'farms' 
    AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.farms 
    ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- SECTION 5: Add PostGIS Geometry Column to Fields
-- ============================================================================

-- Add geom column to fields table if it doesn't exist
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
  END IF;
END $$;

-- ============================================================================
-- SECTION 6: Create Indexes for Performance
-- ============================================================================

-- Index on profiles.organization_id
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id 
ON public.profiles(organization_id);

-- Index on farms.organization_id
CREATE INDEX IF NOT EXISTS idx_farms_organization_id 
ON public.farms(organization_id);

-- Spatial index on fields.geom (GIST for PostGIS)
CREATE INDEX IF NOT EXISTS idx_fields_geom 
ON public.fields USING GIST (geom);

-- Index on fields.farm_id for efficient joins
CREATE INDEX IF NOT EXISTS idx_fields_farm_id 
ON public.fields(farm_id);

-- Composite index on field_analytics for time-series queries
CREATE INDEX IF NOT EXISTS idx_field_analytics_multi 
ON public.field_analytics(field_id, acquisition_date DESC, metric_type);

-- ============================================================================
-- SECTION 7: Data Migration
-- ============================================================================

-- Create a default organization if none exists
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Check if there are any organizations
  IF NOT EXISTS (SELECT 1 FROM public.organizations LIMIT 1) THEN
    -- Create default organization
    INSERT INTO public.organizations (name)
    VALUES ('Default Organization')
    RETURNING id INTO default_org_id;
    
    -- Migrate existing users to default organization
    UPDATE public.profiles 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
    
    -- Migrate existing farms to default organization
    UPDATE public.farms 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
    
    RAISE NOTICE 'Created default organization and migrated existing data';
  END IF;
END $$;

-- Migrate latitude/longitude to PostGIS geometry
-- This converts center point (lat/lng) to a simple 100m x 100m polygon
-- You may need to adjust this based on your actual field boundary data
DO $$
DECLARE
  field_record RECORD;
  center_point GEOMETRY;
  field_polygon GEOMETRY;
BEGIN
  FOR field_record IN 
    SELECT id, latitude, longitude 
    FROM public.fields 
    WHERE geom IS NULL 
    AND latitude IS NOT NULL 
    AND longitude IS NOT NULL
  LOOP
    -- Create a point from lat/lng
    center_point := ST_SetSRID(
      ST_MakePoint(field_record.longitude, field_record.latitude), 
      4326
    );
    
    -- Create a simple 100m x 100m square polygon around the center point
    -- (approximately 0.0009 degrees ~ 100m at equator)
    field_polygon := ST_Buffer(center_point::geography, 50)::geometry;
    
    -- Update the geom column
    UPDATE public.fields 
    SET geom = field_polygon
    WHERE id = field_record.id;
  END LOOP;
  
  RAISE NOTICE 'Migrated lat/lng coordinates to PostGIS geometry';
END $$;

-- ============================================================================
-- SECTION 8: Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to make this script idempotent)
DROP POLICY IF EXISTS "Allow users to see profiles in their own organization" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow full access to own organization's farms" ON public.farms;
DROP POLICY IF EXISTS "Allow full access to own organization's fields" ON public.fields;
DROP POLICY IF EXISTS "Allow full access to own organization's analytics" ON public.field_analytics;
DROP POLICY IF EXISTS "Allow users to view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Allow organization admins to update their organization" ON public.organizations;

-- RLS Policy for profiles: Users can see profiles in their organization
CREATE POLICY "Allow users to see profiles in their own organization"
ON public.profiles FOR SELECT
USING (
  organization_id = public.get_current_org_id() 
  OR organization_id IS NULL
  OR id = auth.uid()
);

-- RLS Policy for profiles: Users can update their own profile
CREATE POLICY "Allow users to update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

-- RLS Policy for profiles: Users can insert their own profile
CREATE POLICY "Allow users to insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- RLS Policy for farms: Full access to own organization's farms
CREATE POLICY "Allow full access to own organization's farms"
ON public.farms FOR ALL
USING (
  organization_id = public.get_current_org_id() 
  OR organization_id IS NULL
);

-- RLS Policy for fields: Access through farms (organization isolation)
CREATE POLICY "Allow full access to own organization's fields"
ON public.fields FOR ALL
USING (
  farm_id IN (
    SELECT id FROM public.farms 
    WHERE organization_id = public.get_current_org_id() 
    OR organization_id IS NULL
  )
);

-- RLS Policy for field_analytics: Access through fields->farms (organization isolation)
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

-- RLS Policy for organizations: Users can view their own organization
CREATE POLICY "Allow users to view their organization"
ON public.organizations FOR SELECT
USING (
  id = public.get_current_org_id()
);

-- RLS Policy for organizations: Organization admins can update their organization
-- Note: This is a simplified policy. You may want to add an 'admin' role check
CREATE POLICY "Allow organization admins to update their organization"
ON public.organizations FOR UPDATE
USING (
  id = public.get_current_org_id()
);

-- ============================================================================
-- SECTION 9: Verify Schema Alignment
-- ============================================================================

-- Verify that all required columns exist
DO $$
BEGIN
  -- Check organizations table
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
    RAISE EXCEPTION 'Organizations table does not exist';
  END IF;
  
  -- Check organization_id in profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'organization_id') THEN
    RAISE EXCEPTION 'profiles.organization_id column does not exist';
  END IF;
  
  -- Check organization_id in farms
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'farms' AND column_name = 'organization_id') THEN
    RAISE EXCEPTION 'farms.organization_id column does not exist';
  END IF;
  
  -- Check geom in fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fields' AND column_name = 'geom') THEN
    RAISE EXCEPTION 'fields.geom column does not exist';
  END IF;
  
  RAISE NOTICE 'Schema alignment verification successful!';
END $$;

-- ============================================================================
-- SECTION 10: Post-Migration Summary
-- ============================================================================

-- Display migration summary
DO $$
DECLARE
  org_count INTEGER;
  profile_count INTEGER;
  farm_count INTEGER;
  field_count INTEGER;
  field_with_geom_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO org_count FROM public.organizations;
  SELECT COUNT(*) INTO profile_count FROM public.profiles WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO farm_count FROM public.farms WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO field_count FROM public.fields;
  SELECT COUNT(*) INTO field_with_geom_count FROM public.fields WHERE geom IS NOT NULL;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Organizations: %', org_count;
  RAISE NOTICE 'Profiles with org: %', profile_count;
  RAISE NOTICE 'Farms with org: %', farm_count;
  RAISE NOTICE 'Total fields: %', field_count;
  RAISE NOTICE 'Fields with geometry: %', field_with_geom_count;
  RAISE NOTICE '========================================';
END $$;
