-- ============================================================================
-- Early Warning System & ML Model Registry Migration
-- ============================================================================
-- Date: 2025-11-28
-- ============================================================================

-- ============================================================================
-- SECTION 1: Early Warnings Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.early_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  
  -- Warning details
  warning_type TEXT NOT NULL CHECK (warning_type IN ('vegetation_stress', 'drought_risk', 'disease_risk', 'nutrient_deficiency', 'temperature_stress')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Messages
  message TEXT NOT NULL,
  message_ar TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  recommendation_ar TEXT NOT NULL,
  
  -- Metrics that triggered the warning
  metrics JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('active', 'resolved', 'monitoring')) DEFAULT 'active',
  
  -- Timestamps
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one active warning per type per field
  CONSTRAINT unique_active_warning UNIQUE (field_id, warning_type, status) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_early_warnings_field_id ON public.early_warnings(field_id);
CREATE INDEX IF NOT EXISTS idx_early_warnings_user_id ON public.early_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_early_warnings_status ON public.early_warnings(status);
CREATE INDEX IF NOT EXISTS idx_early_warnings_severity ON public.early_warnings(severity);
CREATE INDEX IF NOT EXISTS idx_early_warnings_detected_at ON public.early_warnings(detected_at DESC);

-- Update trigger
DROP TRIGGER IF EXISTS update_early_warnings_updated_at ON public.early_warnings;
CREATE TRIGGER update_early_warnings_updated_at
  BEFORE UPDATE ON public.early_warnings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.early_warnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own warnings"
  ON public.early_warnings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own warnings"
  ON public.early_warnings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own warnings"
  ON public.early_warnings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own warnings"
  ON public.early_warnings
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 2: ML Models Registry
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ml_models_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Model identification
  model_name TEXT NOT NULL,
  model_type TEXT NOT NULL CHECK (model_type IN ('disease_detection', 'yield_prediction', 'soil_analysis', 'crop_classification', 'pest_detection')),
  model_version TEXT NOT NULL,
  
  -- Model metadata
  description TEXT,
  description_ar TEXT,
  model_path TEXT, -- Path to model file in storage
  model_url TEXT, -- URL to model API endpoint
  
  -- Performance metrics
  accuracy DECIMAL(5,2),
  precision_score DECIMAL(5,2),
  recall_score DECIMAL(5,2),
  f1_score DECIMAL(5,2),
  
  -- Training info
  training_date TIMESTAMPTZ,
  training_dataset_size INTEGER,
  training_parameters JSONB DEFAULT '{}'::jsonb,
  
  -- Deployment
  is_active BOOLEAN DEFAULT false,
  deployed_at TIMESTAMPTZ,
  deployed_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one active model per type
  CONSTRAINT unique_active_model UNIQUE (model_type, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ml_models_type ON public.ml_models_registry(model_type);
CREATE INDEX IF NOT EXISTS idx_ml_models_active ON public.ml_models_registry(is_active);
CREATE INDEX IF NOT EXISTS idx_ml_models_version ON public.ml_models_registry(model_version);

-- Update trigger
DROP TRIGGER IF EXISTS update_ml_models_updated_at ON public.ml_models_registry;
CREATE TRIGGER update_ml_models_updated_at
  BEFORE UPDATE ON public.ml_models_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies (Admin only for now, can be extended)
ALTER TABLE public.ml_models_registry ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view active models
CREATE POLICY "Users can view active models"
  ON public.ml_models_registry
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- ============================================================================
-- SECTION 3: Yield History Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.yield_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  
  -- Yield data
  yield_per_hectare DECIMAL(10,2) NOT NULL,
  yield_per_feddan DECIMAL(10,2),
  total_yield DECIMAL(10,2), -- Total yield in tonnes
  
  -- Harvest info
  harvest_date DATE NOT NULL,
  crop_type TEXT,
  
  -- Conditions at harvest
  ndvi_at_harvest DECIMAL(5,2),
  moisture_at_harvest DECIMAL(5,2),
  weather_conditions JSONB,
  
  -- Notes
  notes TEXT,
  notes_ar TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_yield_history_field_id ON public.yield_history(field_id);
CREATE INDEX IF NOT EXISTS idx_yield_history_user_id ON public.yield_history(user_id);
CREATE INDEX IF NOT EXISTS idx_yield_history_harvest_date ON public.yield_history(harvest_date DESC);

-- Update trigger
DROP TRIGGER IF EXISTS update_yield_history_updated_at ON public.yield_history;
CREATE TRIGGER update_yield_history_updated_at
  BEFORE UPDATE ON public.yield_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.yield_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own yield history"
  ON public.yield_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own yield history"
  ON public.yield_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own yield history"
  ON public.yield_history
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own yield history"
  ON public.yield_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 4: Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Early Warning System & ML Registry migration completed successfully!';
  RAISE NOTICE '   - Created early_warnings table';
  RAISE NOTICE '   - Created ml_models_registry table';
  RAISE NOTICE '   - Created yield_history table';
  RAISE NOTICE '   - Created indexes and RLS policies';
END $$;

