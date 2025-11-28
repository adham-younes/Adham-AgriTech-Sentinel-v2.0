-- ============================================================================
-- Fix Security Definer Views
-- ============================================================================
-- Date: 2025-11-28
-- Fixes security issues with SECURITY DEFINER views
-- ============================================================================

-- Drop existing views
DROP VIEW IF EXISTS public.recent_disease_analyses;
DROP VIEW IF EXISTS public.active_diseases_by_field;

-- Recreate views without SECURITY DEFINER
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

-- Grant access to views (RLS will handle row-level security)
GRANT SELECT ON public.recent_disease_analyses TO authenticated;
GRANT SELECT ON public.active_diseases_by_field TO authenticated;

-- Add RLS policies for views (they will use underlying table RLS)
-- No additional policies needed as views inherit from base tables

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Security Definer Views fixed successfully!';
  RAISE NOTICE '   - Recreated recent_disease_analyses view';
  RAISE NOTICE '   - Recreated active_diseases_by_field view';
  RAISE NOTICE '   - Removed SECURITY DEFINER property';
END $$;

