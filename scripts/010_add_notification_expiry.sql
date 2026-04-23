-- Add expires_at column to notifications table
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster querying on expired notifications
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);

-- Update existing booking notifications to expire in 4 hours from creation
UPDATE notifications
SET expires_at = created_at + INTERVAL '4 hours'
WHERE type = 'success' 
  AND title LIKE '%Booking%'
  AND expires_at IS NULL;
