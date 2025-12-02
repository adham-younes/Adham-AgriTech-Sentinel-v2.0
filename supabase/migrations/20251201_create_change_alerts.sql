-- Migration: Create change_alerts table for storing vegetation change detection alerts

CREATE TABLE IF NOT EXISTS change_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  baseline_date DATE NOT NULL,
  comparison_date DATE NOT NULL,
  change_percentage FLOAT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('positive', 'negative', 'neutral')),
  vegetation_index TEXT NOT NULL DEFAULT 'NDVI',
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_change_alerts_field_id 
ON change_alerts(field_id);

CREATE INDEX IF NOT EXISTS idx_change_alerts_status 
ON change_alerts(status);

CREATE INDEX IF NOT EXISTS idx_change_alerts_created_at 
ON change_alerts(created_at DESC);

-- RLS Policies
ALTER TABLE change_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view alerts for their own fields
CREATE POLICY "Users can view their own change alerts"
ON change_alerts
FOR SELECT
USING (
  field_id IN (
    SELECT f.id FROM fields f
    JOIN farms fm ON f.farm_id = fm.id
    WHERE fm.user_id = auth.uid()
  )
);

-- Users can create alerts (usually via system, but allow for now)
CREATE POLICY "Users can create change alerts"
ON change_alerts
FOR INSERT
WITH CHECK (
  field_id IN (
    SELECT f.id FROM fields f
    JOIN farms fm ON f.farm_id = fm.id
    WHERE fm.user_id = auth.uid()
  )
);

-- Users can update status of their alerts
CREATE POLICY "Users can update their own change alerts"
ON change_alerts
FOR UPDATE
USING (
  field_id IN (
    SELECT f.id FROM fields f
    JOIN farms fm ON f.farm_id = fm.id
    WHERE fm.user_id = auth.uid()
  )
);

-- Comments
COMMENT ON TABLE change_alerts IS 'Stores alerts generated from vegetation change detection analysis';
COMMENT ON COLUMN change_alerts.change_percentage IS 'Percentage change in vegetation index (negative = decline)';
COMMENT ON COLUMN change_alerts.change_type IS 'Classification of change (positive, negative, neutral)';
