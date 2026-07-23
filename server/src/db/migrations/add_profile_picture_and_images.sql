-- Add profile picture to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);

-- Add image_urls to food_listings (replace photo_url with array)
ALTER TABLE food_listings ADD COLUMN IF NOT EXISTS image_urls TEXT[];

-- Migrate existing photo_url to image_urls if data exists
UPDATE food_listings
SET image_urls = ARRAY[photo_url]
WHERE photo_url IS NOT NULL AND photo_url != '';

-- Drop old photo_url column after migration
-- ALTER TABLE food_listings DROP COLUMN IF EXISTS photo_url;

-- Add messages table for chat system
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    claim_id INTEGER NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_claim ON messages (claim_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages (receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at DESC);

-- Add scheduled_pickup_time to claims for pickup scheduling
ALTER TABLE claims ADD COLUMN IF NOT EXISTS scheduled_pickup_time TIMESTAMPTZ;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS pickup_instructions TEXT;

-- Comments
COMMENT ON COLUMN users.profile_picture IS 'URL/path to user profile picture';
COMMENT ON COLUMN food_listings.image_urls IS 'Array of image URLs for the food listing';
COMMENT ON TABLE messages IS 'Chat messages between donors and NGOs for a specific claim';
COMMENT ON COLUMN claims.scheduled_pickup_time IS 'Confirmed pickup time by NGO';
COMMENT ON COLUMN claims.pickup_instructions IS 'Special pickup instructions from donor';