-- ============================================================================
-- OPERATION: SYSTEM RESURRECTION
-- Migration: Create satellite_readings table and add eosda_id to fields
-- Date: 2025-12-05
-- ============================================================================

-- ============================================================================
-- SECTION 1: Create satellite_readings table
-- ============================================================================
-- This table stores satellite imagery analysis data (NDVI, EVI, NDWI, moisture)
-- for each field over time, enabling historical trend analysis and AI predictions.

CREATE TABLE IF NOT EXISTS public.satellite_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id UUID REFERENCES public.fields(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  
  -- Vegetation Indices
  ndvi_mean FLOAT,          -- Normalized Difference Vegetation Index (mean)
  ndvi_min FLOAT,           -- NDVI minimum value in field
  ndvi_max FLOAT,           -- NDVI maximum value in field
  evi_mean FLOAT,           -- Enhanced Vegetation Index (for dense canopy)
  savi_mean FLOAT,          -- Soil Adjusted Vegetation Index (early growth)
  ndwi_mean FLOAT,          -- Normalized Difference Water Index
  
  -- Soil & Environmental
  moisture FLOAT,           -- Soil moisture percentage (0-100)
  cloud_coverage FLOAT DEFAULT 0, -- Cloud coverage percentage (0-100)
  
  -- Metadata
  source TEXT DEFAULT 'eosda',    -- Data source: eosda, sentinel, landsat
  scene_id TEXT,                  -- Original scene ID for reference
  image_url TEXT,                 -- URL to rendered image/tile
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE public.satellite_readings IS 'Stores satellite imagery analysis data (NDVI, EVI, moisture) for fields over time';

-- ============================================================================
-- SECTION 2: Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.satellite_readings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can SELECT satellite data for fields belonging to their organization
CREATE POLICY "Users can read satellite data for their fields"
  ON public.satellite_readings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.fields f
      JOIN public.farms fm ON f.farm_id = fm.id
      WHERE f.id = satellite_readings.field_id
      AND (fm.organization_id = public.get_current_org_id() OR fm.organization_id IS NULL)
    )
  );

-- RLS Policy: Users can INSERT satellite data for their fields
CREATE POLICY "Users can insert satellite data for their fields"
  ON public.satellite_readings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fields f
      JOIN public.farms fm ON f.farm_id = fm.id
      WHERE f.id = satellite_readings.field_id
      AND (fm.organization_id = public.get_current_org_id() OR fm.organization_id IS NULL)
    )
  );

-- ============================================================================
-- SECTION 3: Create Performance Indexes
-- ============================================================================

-- Primary lookup: field_id + date (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_satellite_readings_field_date 
ON public.satellite_readings(field_id, date DESC);

-- Secondary: date range queries across all fields
CREATE INDEX IF NOT EXISTS idx_satellite_readings_date 
ON public.satellite_readings(date DESC);

-- Tertiary: source filtering
CREATE INDEX IF NOT EXISTS idx_satellite_readings_source 
ON public.satellite_readings(source);

-- ============================================================================
-- SECTION 4: Add eosda_id column to fields table
-- ============================================================================
-- This column links our fields to EOSDA's internal view_id for API requests

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'fields' 
    AND column_name = 'eosda_id'
  ) THEN
    ALTER TABLE public.fields ADD COLUMN eosda_id TEXT;
    RAISE NOTICE 'Added eosda_id column to fields table';
  ELSE
    RAISE NOTICE 'eosda_id column already exists in fields table';
  END IF;
END $$;

-- Index for fast lookups by EOSDA ID
CREATE INDEX IF NOT EXISTS idx_fields_eosda_id 
ON public.fields(eosda_id);

-- ============================================================================
-- SECTION 5: Verification
-- ============================================================================

DO $$
BEGIN
  -- Verify satellite_readings table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'satellite_readings'
  ) THEN
    RAISE EXCEPTION 'satellite_readings table was not created!';
  END IF;
  
  -- Verify eosda_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'fields' 
    AND column_name = 'eosda_id'
  ) THEN
    RAISE EXCEPTION 'eosda_id column was not added to fields!';
  END IF;
  
  RAISE NOTICE '✅ Migration successful: satellite_readings table created, eosda_id column added';
END $$;
