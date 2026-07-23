-- Migration: Add active column to users table
-- Date: 2026-07-23
-- Description: Allows admins to suspend/activate user accounts

-- Add active column (default to true for existing users)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_active ON users (active);

-- Update existing users to be active
UPDATE users SET active = TRUE WHERE active IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.active IS 'Whether the user account is active. False means suspended by admin.';