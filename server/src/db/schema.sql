-- MealBridge Database Schema
-- Requires PostgreSQL 14+ with PostGIS extension

-- Enable PostGIS extension (run separately if needed)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Custom Types
CREATE TYPE user_role AS ENUM ('donor', 'ngo', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE food_category AS ENUM ('cooked', 'packaged', 'raw', 'bakery', 'dairy', 'other');
CREATE TYPE listing_status AS ENUM ('available', 'claimed', 'completed', 'expired', 'cancelled');

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'donor',
    org_name VARCHAR(200),
    verification verification_status DEFAULT 'pending',
    location GEOGRAPHY(POINT, 4326),
    address TEXT,
    avg_rating NUMERIC(2,1) DEFAULT 0 CHECK (avg_rating >= 0 AND avg_rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food Listings Table
CREATE TABLE food_listings (
    id SERIAL PRIMARY KEY,
    donor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category food_category NOT NULL DEFAULT 'cooked',
    is_veg BOOLEAN DEFAULT TRUE,
    is_halal BOOLEAN DEFAULT FALSE,
    servings INTEGER NOT NULL CHECK (servings > 0),
    prepared_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    pickup_start TIMESTAMPTZ NOT NULL,
    pickup_end TIMESTAMPTZ NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    address TEXT NOT NULL,
    photo_url TEXT,
    status listing_status NOT NULL DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claims Table
CREATE TABLE claims (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES food_listings(id) ON DELETE CASCADE,
    ngo_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    picked_up_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    UNIQUE (listing_id)
);

-- Ratings Table
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    claim_id INTEGER NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    rater_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ratee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (claim_id, rater_id)
);

-- Notifications Table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_users_location ON users USING GIST (location);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_verification ON users (verification);

CREATE INDEX idx_listings_location ON food_listings USING GIST (location);
CREATE INDEX idx_listings_status ON food_listings (status);
CREATE INDEX idx_listings_donor ON food_listings (donor_id);
CREATE INDEX idx_listings_expires ON food_listings (expires_at);

CREATE INDEX idx_claims_ngo ON claims (ngo_id);
CREATE INDEX idx_claims_listing ON claims (listing_id);

CREATE INDEX idx_notifications_user ON notifications (user_id);
CREATE INDEX idx_notifications_read ON notifications (is_read);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON food_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();