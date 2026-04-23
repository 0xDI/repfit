-- Add new fields for onboarding (Step 2260 request)

ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS operating_hours TEXT,
ADD COLUMN IF NOT EXISTS max_capacity INTEGER,
ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;

-- Comment on columns
COMMENT ON COLUMN gyms.operating_hours IS 'Description of operating hours (e.g. "24/7", "Standard Business Hours")';
COMMENT ON COLUMN gyms.max_capacity IS 'Maximum capacity per session or general gym capacity';

-- Refresh the updated_at trigger just in case
UPDATE gyms SET updated_at = NOW() WHERE id IN (SELECT id FROM gyms LIMIT 1);
