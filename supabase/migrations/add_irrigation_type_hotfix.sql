-- ============================================================================
-- Hotfix: Add Missing irrigation_type Column to fields Table
-- ============================================================================
-- This migration adds the irrigation_type column that was missing from the
-- fields table in production, causing field creation errors.
-- ============================================================================

-- Add irrigation_type column if it doesn't exist
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
    
    RAISE NOTICE 'Added irrigation_type column to fields table';
  ELSE
    RAISE NOTICE 'irrigation_type column already exists in fields table';
  END IF;
END $$;

-- Verify the column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'fields' 
    AND column_name = 'irrigation_type'
  ) THEN
    RAISE EXCEPTION 'Failed to add irrigation_type column to fields table';
  ELSE
    RAISE NOTICE 'Verification successful: irrigation_type column exists';
  END IF;
END $$;
