-- Migration: Create productivity_maps table for caching EOSDA zoning results
-- This table stores productivity maps generated via the EOSDA Zoning API

CREATE TABLE IF NOT EXISTS productivity_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  zmap_id TEXT NOT NULL,
  vegetation_index TEXT NOT NULL CHECK (vegetation_index IN ('NDVI', 'NDWI', 'EVI', 'NDMI')),
  zone_quantity INTEGER NOT NULL CHECK (zone_quantity IN (3, 5, 7)),
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  zones JSONB,
  shapefile_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(field_id, zmap_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_productivity_maps_field_id 
ON productivity_maps(field_id);

CREATE INDEX IF NOT EXISTS idx_productivity_maps_status 
ON productivity_maps(status);

CREATE INDEX IF NOT EXISTS idx_productivity_maps_created_at 
ON productivity_maps(created_at DESC);

-- RLS Policies
ALTER TABLE productivity_maps ENABLE ROW LEVEL SECURITY;

-- Users can view productivity maps for their own fields
CREATE POLICY "Users can view their own productivity maps"
ON productivity_maps
FOR SELECT
USING (
  field_id IN (
    SELECT f.id FROM fields f
    JOIN farms fm ON f.farm_id = fm.id
    WHERE fm.user_id = auth.uid()
  )
);

-- Users can create productivity maps for their own fields
CREATE POLICY "Users can create productivity maps for their fields"
ON productivity_maps
FOR INSERT
WITH CHECK (
  field_id IN (
    SELECT f.id FROM fields f
    JOIN farms fm ON f.farm_id = fm.id
    WHERE fm.user_id = auth.uid()
  )
);

-- Users can update productivity maps for their own fields
CREATE POLICY "Users can update their own productivity maps"
ON productivity_maps
FOR UPDATE
USING (
  field_id IN (
    SELECT f.id FROM fields f
    JOIN farms fm ON f.farm_id = fm.id
    WHERE fm.user_id = auth.uid()
  )
)
WITH CHECK (
  field_id IN (
    SELECT f.id FROM fields f
    JOIN farms fm ON f.farm_id = fm.id
    WHERE fm.user_id = auth.uid()
  )
);

-- Users can delete productivity maps for their own fields
CREATE POLICY "Users can delete their own productivity maps"
ON productivity_maps
FOR DELETE
USING (
  field_id IN (
    SELECT f.id FROM fields f
    JOIN farms fm ON f.farm_id = fm.id
    WHERE fm.user_id = auth.uid()
  )
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_productivity_maps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER productivity_maps_updated_at
BEFORE UPDATE ON productivity_maps
FOR EACH ROW
EXECUTE FUNCTION update_productivity_maps_updated_at();

-- Comments
COMMENT ON TABLE productivity_maps IS 'Stores productivity zone maps generated via EOSDA Zoning API';
COMMENT ON COLUMN productivity_maps.zmap_id IS 'EOSDA zoning map ID';
COMMENT ON COLUMN productivity_maps.vegetation_index IS 'Vegetation index used (NDVI, NDWI, EVI, NDMI)';
COMMENT ON COLUMN productivity_maps.zone_quantity IS 'Number of productivity zones (3, 5, or 7)';
COMMENT ON COLUMN productivity_maps.zones IS 'JSON array of zone data with geometry and recommendations';
COMMENT ON COLUMN productivity_maps.shapefile_url IS 'URL to download shapefile for GIS software';
