-- ================================================================
-- PROJECT FLOWER - MINIMAL DATABASE SCHEMA
-- ================================================================
-- This is a minimal version for quick setup and testing
-- Contains only the essential tables without all the data
-- ================================================================

-- Database configuration
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- ================================================================
-- ESSENTIAL TABLES ONLY
-- ================================================================

-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    credits INTEGER DEFAULT 1000 NOT NULL,
    last_passive_income_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    suns INTEGER DEFAULT 100 NOT NULL,
    dna INTEGER DEFAULT 0 NOT NULL,
    tickets INTEGER DEFAULT 0,
    hearts INTEGER DEFAULT 0 NOT NULL
);

-- User Collections
CREATE TABLE user_butterflies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    butterfly_id INTEGER NOT NULL,
    butterfly_name TEXT NOT NULL,
    butterfly_rarity TEXT NOT NULL,
    butterfly_image_url TEXT NOT NULL,
    collected_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE user_flowers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flower_id INTEGER NOT NULL,
    flower_name TEXT NOT NULL,
    flower_rarity TEXT NOT NULL,
    flower_image_url TEXT NOT NULL,
    collected_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE user_fish (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fish_id INTEGER NOT NULL,
    fish_name TEXT NOT NULL,
    fish_rarity TEXT NOT NULL,
    fish_image_url TEXT NOT NULL,
    collected_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE user_caterpillars (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    caterpillar_id INTEGER NOT NULL,
    caterpillar_name TEXT NOT NULL,
    caterpillar_rarity TEXT NOT NULL,
    caterpillar_image_url TEXT NOT NULL,
    collected_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- Garden System
CREATE TABLE planted_fields (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_index INTEGER NOT NULL,
    flower_id INTEGER,
    flower_name TEXT,
    flower_rarity TEXT,
    flower_image_url TEXT,
    planted_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    growth_stage INTEGER DEFAULT 0 NOT NULL,
    watered_at TIMESTAMP WITHOUT TIME ZONE,
    harvest_ready_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, field_index)
);

CREATE TABLE field_butterflies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_index INTEGER NOT NULL,
    butterfly_id INTEGER NOT NULL,
    butterfly_name TEXT NOT NULL,
    butterfly_rarity TEXT NOT NULL,
    butterfly_image_url TEXT NOT NULL,
    spawned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    collected_at TIMESTAMP WITHOUT TIME ZONE,
    is_collected BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- Exhibition System
CREATE TABLE exhibition_frames (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    frame_number INTEGER NOT NULL,
    is_vip BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, frame_number, is_vip)
);

CREATE TABLE exhibition_butterflies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    frame_id INTEGER NOT NULL REFERENCES exhibition_frames(id) ON DELETE CASCADE,
    butterfly_id INTEGER NOT NULL,
    butterfly_name TEXT NOT NULL,
    butterfly_rarity TEXT NOT NULL,
    butterfly_image_url TEXT NOT NULL,
    placed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(frame_id)
);

CREATE TABLE exhibition_frame_likes (
    id SERIAL PRIMARY KEY,
    frame_id INTEGER NOT NULL REFERENCES exhibition_frames(id) ON DELETE CASCADE,
    liker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    liked_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(frame_id, liker_id)
);

-- Market System
CREATE TABLE market_listings (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type CHARACTER VARYING(20) DEFAULT 'seed' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    quantity INTEGER NOT NULL,
    price_per_unit INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- Weekly Challenges
CREATE TABLE weekly_challenges (
    id SERIAL PRIMARY KEY,
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    start_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    end_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    flower_id1 INTEGER NOT NULL,
    flower_id2 INTEGER NOT NULL,
    flower_id3 INTEGER NOT NULL,
    flower_id4 INTEGER NOT NULL,
    flower_id5 INTEGER NOT NULL,
    flower_id6 INTEGER NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(week_number, year)
);

-- Sun Spawns
CREATE TABLE sun_spawns (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    spawned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    collected_at TIMESTAMP WITHOUT TIME ZONE,
    is_collected BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- ================================================================
-- ESSENTIAL INDEXES ONLY
-- ================================================================

-- User indexes
CREATE INDEX idx_users_username ON users(username);

-- Collection indexes  
CREATE INDEX idx_user_butterflies_user_id ON user_butterflies(user_id);
CREATE INDEX idx_user_flowers_user_id ON user_flowers(user_id);
CREATE INDEX idx_user_fish_user_id ON user_fish(user_id);
CREATE INDEX idx_user_caterpillars_user_id ON user_caterpillars(user_id);

-- Garden indexes
CREATE INDEX idx_planted_fields_user_id ON planted_fields(user_id);
CREATE INDEX idx_field_butterflies_user_id ON field_butterflies(user_id);

-- Exhibition indexes
CREATE INDEX idx_exhibition_butterflies_user_id ON exhibition_butterflies(user_id);
CREATE INDEX idx_exhibition_frame_likes_frame_id ON exhibition_frame_likes(frame_id);

-- Market indexes
CREATE INDEX idx_market_listings_is_active ON market_listings(is_active);

-- Sun spawn indexes
CREATE INDEX idx_sun_spawns_user_id ON sun_spawns(user_id);

-- ================================================================
-- DEMO USER
-- ================================================================

-- Demo user (password: demo123)
INSERT INTO users (username, password, credits, suns, dna, tickets, hearts)
VALUES ('demo', '$2b$10$demo.hash.placeholder', 5000, 500, 100, 10, 50);

-- ================================================================
-- SCHEMA VERSION
-- ================================================================

CREATE TABLE schema_version (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

INSERT INTO schema_version (version) VALUES ('1.0.0-minimal');