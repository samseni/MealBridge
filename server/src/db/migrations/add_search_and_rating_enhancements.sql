-- Add saved searches table
CREATE TABLE IF NOT EXISTS saved_searches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    filters JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add search history table
CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    filters JSONB,
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add rating replies table
CREATE TABLE IF NOT EXISTS rating_replies (
    id SERIAL PRIMARY KEY,
    rating_id INTEGER NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reply TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add rating reports table
CREATE TABLE IF NOT EXISTS rating_reports (
    id SERIAL PRIMARY KEY,
    rating_id INTEGER NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rating_id, reporter_id)
);

-- Add helpful votes table
CREATE TABLE IF NOT EXISTS rating_helpful_votes (
    id SERIAL PRIMARY KEY,
    rating_id INTEGER NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rating_id, user_id)
);

-- Add helpful count to ratings table
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS not_helpful_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_last_used ON saved_searches(last_used_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rating_replies_rating ON rating_replies(rating_id);
CREATE INDEX IF NOT EXISTS idx_rating_replies_user ON rating_replies(user_id);

CREATE INDEX IF NOT EXISTS idx_rating_reports_rating ON rating_reports(rating_id);
CREATE INDEX IF NOT EXISTS idx_rating_reports_status ON rating_reports(status);

CREATE INDEX IF NOT EXISTS idx_helpful_votes_rating ON rating_helpful_votes(rating_id);
CREATE INDEX IF NOT EXISTS idx_helpful_votes_user ON rating_helpful_votes(user_id);

-- Function to update helpful counts
CREATE OR REPLACE FUNCTION update_rating_helpful_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.is_helpful THEN
            UPDATE ratings SET helpful_count = helpful_count + 1 WHERE id = NEW.rating_id;
        ELSE
            UPDATE ratings SET not_helpful_count = not_helpful_count + 1 WHERE id = NEW.rating_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_helpful != NEW.is_helpful THEN
            IF NEW.is_helpful THEN
                UPDATE ratings
                SET helpful_count = helpful_count + 1, not_helpful_count = not_helpful_count - 1
                WHERE id = NEW.rating_id;
            ELSE
                UPDATE ratings
                SET helpful_count = helpful_count - 1, not_helpful_count = not_helpful_count + 1
                WHERE id = NEW.rating_id;
            END IF;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.is_helpful THEN
            UPDATE ratings SET helpful_count = helpful_count - 1 WHERE id = OLD.rating_id;
        ELSE
            UPDATE ratings SET not_helpful_count = not_helpful_count - 1 WHERE id = OLD.rating_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for helpful votes
DROP TRIGGER IF EXISTS trigger_update_helpful_counts ON rating_helpful_votes;
CREATE TRIGGER trigger_update_helpful_counts
AFTER INSERT OR UPDATE OR DELETE ON rating_helpful_votes
FOR EACH ROW EXECUTE FUNCTION update_rating_helpful_counts();

-- Comments
COMMENT ON TABLE saved_searches IS 'User saved search filters';
COMMENT ON TABLE search_history IS 'User search history for analytics';
COMMENT ON TABLE rating_replies IS 'Replies to ratings from the rated user';
COMMENT ON TABLE rating_reports IS 'Reports of inappropriate ratings';
COMMENT ON TABLE rating_helpful_votes IS 'Helpful votes on ratings';