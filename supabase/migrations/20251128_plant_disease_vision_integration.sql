-- ============================================================================
-- Plant Disease Vision Integration Migration
-- ============================================================================
-- Integration of vision models with Supabase for plant disease analysis
-- Date: 2025-11-28
-- ============================================================================

-- ============================================================================
-- SECTION 1: Plant Disease Analyses Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.plant_disease_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
  crop_type TEXT,
  
  -- Image data
  image_url TEXT NOT NULL,
  image_storage_path TEXT, -- Path in Supabase Storage if uploaded
  
  -- Analysis metadata
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('plant_id', 'disease_detection', 'pest_detection', 'nutrient_deficiency', 'general_health')),
  provider TEXT NOT NULL, -- 'plant.id', 'custom_model', 'gemini_vision', etc.
  model_version TEXT,
  
  -- Results
  results JSONB NOT NULL, -- Full analysis results from API
  confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Detected issues
  detected_diseases JSONB DEFAULT '[]'::jsonb, -- Array of {name, name_ar, severity, confidence}
  detected_pests JSONB DEFAULT '[]'::jsonb, -- Array of {name, name_ar, type, confidence}
  detected_deficiencies JSONB DEFAULT '[]'::jsonb, -- Array of {nutrient, severity, confidence}
  
  -- Plant identification
  plant_species TEXT,
  plant_species_ar TEXT,
  plant_scientific_name TEXT,
  plant_common_names JSONB, -- Array of common names
  
  -- AI-generated recommendations
  recommendations JSONB DEFAULT '[]'::jsonb, -- Array of {type, action, priority, details}
  treatment_suggestions JSONB DEFAULT '[]'::jsonb, -- Array of treatment recommendations
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT valid_confidence CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_plant_disease_analyses_user_id ON public.plant_disease_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_plant_disease_analyses_field_id ON public.plant_disease_analyses(field_id);
CREATE INDEX IF NOT EXISTS idx_plant_disease_analyses_created_at ON public.plant_disease_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plant_disease_analyses_analysis_type ON public.plant_disease_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_plant_disease_analyses_provider ON public.plant_disease_analyses(provider);

-- GIN index for JSONB searches
CREATE INDEX IF NOT EXISTS idx_plant_disease_analyses_detected_diseases ON public.plant_disease_analyses USING GIN (detected_diseases);
CREATE INDEX IF NOT EXISTS idx_plant_disease_analyses_recommendations ON public.plant_disease_analyses USING GIN (recommendations);

-- Update trigger
DROP TRIGGER IF EXISTS update_plant_disease_analyses_updated_at ON public.plant_disease_analyses;
CREATE TRIGGER update_plant_disease_analyses_updated_at
  BEFORE UPDATE ON public.plant_disease_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.plant_disease_analyses ENABLE ROW LEVEL SECURITY;

-- Users can only see their own analyses
CREATE POLICY "Users can view their own plant disease analyses"
  ON public.plant_disease_analyses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own analyses
CREATE POLICY "Users can insert their own plant disease analyses"
  ON public.plant_disease_analyses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own analyses
CREATE POLICY "Users can update their own plant disease analyses"
  ON public.plant_disease_analyses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own analyses
CREATE POLICY "Users can delete their own plant disease analyses"
  ON public.plant_disease_analyses
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 2: Disease Tracking Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.disease_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  crop_type TEXT,
  
  -- Disease information
  disease_name TEXT NOT NULL,
  disease_name_ar TEXT,
  disease_scientific_name TEXT,
  disease_category TEXT, -- 'fungal', 'bacterial', 'viral', 'pest', 'deficiency'
  
  -- Detection details
  first_detected_at TIMESTAMPTZ DEFAULT NOW(),
  last_detected_at TIMESTAMPTZ DEFAULT NOW(),
  detection_count INTEGER DEFAULT 1,
  
  -- Severity and status
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('active', 'resolved', 'monitoring', 'preventive')) DEFAULT 'active',
  
  -- Treatment
  treatment_applied JSONB DEFAULT '[]'::jsonb, -- Array of treatments
  treatment_started_at TIMESTAMPTZ,
  treatment_completed_at TIMESTAMPTZ,
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Related analysis
  related_analysis_id UUID REFERENCES public.plant_disease_analyses(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_disease_tracking_field_id ON public.disease_tracking(field_id);
CREATE INDEX IF NOT EXISTS idx_disease_tracking_status ON public.disease_tracking(status);
CREATE INDEX IF NOT EXISTS idx_disease_tracking_severity ON public.disease_tracking(severity);
CREATE INDEX IF NOT EXISTS idx_disease_tracking_last_detected ON public.disease_tracking(last_detected_at DESC);

-- Update trigger
DROP TRIGGER IF EXISTS update_disease_tracking_updated_at ON public.disease_tracking;
CREATE TRIGGER update_disease_tracking_updated_at
  BEFORE UPDATE ON public.disease_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.disease_tracking ENABLE ROW LEVEL SECURITY;

-- Users can view diseases for their fields
CREATE POLICY "Users can view diseases for their fields"
  ON public.disease_tracking
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = disease_tracking.field_id
      AND f.user_id = auth.uid()
    )
  );

-- Users can insert diseases for their fields
CREATE POLICY "Users can insert diseases for their fields"
  ON public.disease_tracking
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = disease_tracking.field_id
      AND f.user_id = auth.uid()
    )
  );

-- Users can update diseases for their fields
CREATE POLICY "Users can update diseases for their fields"
  ON public.disease_tracking
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = disease_tracking.field_id
      AND f.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = disease_tracking.field_id
      AND f.user_id = auth.uid()
    )
  );

-- Users can delete diseases for their fields
CREATE POLICY "Users can delete diseases for their fields"
  ON public.disease_tracking
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = disease_tracking.field_id
      AND f.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SECTION 3: Helper Functions
-- ============================================================================

-- Function to automatically create disease tracking entry from analysis
CREATE OR REPLACE FUNCTION public.create_disease_tracking_from_analysis()
RETURNS TRIGGER AS $$
DECLARE
  disease_record JSONB;
  field_record RECORD;
BEGIN
  -- Only process if diseases were detected
  IF NEW.detected_diseases IS NOT NULL AND jsonb_array_length(NEW.detected_diseases) > 0 THEN
    -- Get field information
    SELECT f.id, f.crop_type INTO field_record
    FROM public.fields f
    WHERE f.id = NEW.field_id
    LIMIT 1;
    
    -- Process each detected disease
    FOR disease_record IN SELECT * FROM jsonb_array_elements(NEW.detected_diseases)
    LOOP
      -- Check if disease already exists for this field
      INSERT INTO public.disease_tracking (
        field_id,
        crop_type,
        disease_name,
        disease_name_ar,
        disease_category,
        severity,
        status,
        related_analysis_id,
        detection_count,
        last_detected_at
      )
      VALUES (
        NEW.field_id,
        field_record.crop_type,
        disease_record->>'name',
        disease_record->>'name_ar',
        disease_record->>'category',
        COALESCE(disease_record->>'severity', 'medium'),
        'active',
        NEW.id,
        1,
        NOW()
      )
      ON CONFLICT DO NOTHING; -- Prevent duplicates
      
      -- If disease exists, update it
      UPDATE public.disease_tracking
      SET
        detection_count = detection_count + 1,
        last_detected_at = NOW(),
        severity = GREATEST(severity, COALESCE((disease_record->>'severity')::text, 'medium')),
        status = CASE 
          WHEN status = 'resolved' THEN 'active'
          ELSE status
        END,
        related_analysis_id = NEW.id
      WHERE field_id = NEW.field_id
        AND disease_name = disease_record->>'name'
        AND status != 'resolved';
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create disease tracking
DROP TRIGGER IF EXISTS trigger_create_disease_tracking ON public.plant_disease_analyses;
CREATE TRIGGER trigger_create_disease_tracking
  AFTER INSERT ON public.plant_disease_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.create_disease_tracking_from_analysis();

-- ============================================================================
-- SECTION 4: Views for Analytics
-- ============================================================================

-- View: Recent disease analyses with field info
CREATE OR REPLACE VIEW public.recent_disease_analyses AS
SELECT 
  pda.id,
  pda.user_id,
  pda.field_id,
  f.name AS field_name,
  pda.crop_type,
  pda.analysis_type,
  pda.provider,
  pda.confidence_score,
  pda.detected_diseases,
  pda.detected_pests,
  pda.recommendations,
  pda.created_at
FROM public.plant_disease_analyses pda
LEFT JOIN public.fields f ON f.id = pda.field_id
ORDER BY pda.created_at DESC;

-- View: Active diseases by field
CREATE OR REPLACE VIEW public.active_diseases_by_field AS
SELECT 
  dt.field_id,
  f.name AS field_name,
  f.crop_type,
  COUNT(*) AS active_disease_count,
  MAX(dt.severity) AS highest_severity,
  MAX(dt.last_detected_at) AS last_detection
FROM public.disease_tracking dt
JOIN public.fields f ON f.id = dt.field_id
WHERE dt.status = 'active'
GROUP BY dt.field_id, f.name, f.crop_type;

-- Grant access to views
GRANT SELECT ON public.recent_disease_analyses TO authenticated;
GRANT SELECT ON public.active_diseases_by_field TO authenticated;

-- ============================================================================
-- SECTION 5: Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Plant Disease Vision Integration migration completed successfully!';
  RAISE NOTICE '   - Created plant_disease_analyses table';
  RAISE NOTICE '   - Created disease_tracking table';
  RAISE NOTICE '   - Created helper functions and triggers';
  RAISE NOTICE '   - Created analytics views';
END $$;

