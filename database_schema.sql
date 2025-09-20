-- ================================================================
-- PROJECT FLOWER - COMPLETE DATABASE SCHEMA
-- ================================================================
-- This file creates the complete database structure for the 
-- Project Flower game including all tables, indexes, and constraints.
-- 
-- PostgreSQL Version: 16.9+
-- Created: September 2025
-- ================================================================

-- Database configuration
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
SET default_tablespace = '';
SET default_table_access_method = heap;

-- ================================================================
-- CORE USER SYSTEM
-- ================================================================

-- Users table - core user accounts
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

-- ================================================================
-- AQUARIUM SYSTEM
-- ================================================================

-- Aquarium tanks purchased by users
CREATE TABLE aquarium_tanks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tank_number INTEGER NOT NULL,
    purchased_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, tank_number)
);

-- Fish placed in aquarium tanks
CREATE TABLE aquarium_fish (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tank_id INTEGER NOT NULL REFERENCES aquarium_tanks(id) ON DELETE CASCADE,
    slot_index INTEGER NOT NULL,
    fish_id INTEGER NOT NULL,
    fish_name TEXT NOT NULL,
    fish_rarity TEXT NOT NULL,
    fish_image_url TEXT NOT NULL,
    placed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(tank_id, slot_index)
);

-- ================================================================
-- GARDEN AND FIELD SYSTEM
-- ================================================================

-- Planted fields in user gardens
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

-- Field flowers (harvested flowers from fields)
CREATE TABLE field_flowers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_index INTEGER NOT NULL,
    flower_id INTEGER NOT NULL,
    flower_name TEXT NOT NULL,
    flower_rarity TEXT NOT NULL,
    flower_image_url TEXT NOT NULL,
    spawned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- Field butterflies (spawned on fields)
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

-- Field caterpillars (spawned on fields)
CREATE TABLE field_caterpillars (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_index INTEGER NOT NULL,
    caterpillar_id INTEGER NOT NULL,
    caterpillar_name TEXT NOT NULL,
    caterpillar_rarity TEXT NOT NULL,
    caterpillar_image_url TEXT NOT NULL,
    spawned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    collected_at TIMESTAMP WITHOUT TIME ZONE,
    is_collected BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- Field fish (spawned on fields)
CREATE TABLE field_fish (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_index INTEGER NOT NULL,
    fish_id INTEGER NOT NULL,
    fish_name TEXT NOT NULL,
    fish_rarity TEXT NOT NULL,
    fish_image_url TEXT NOT NULL,
    spawned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    collected_at TIMESTAMP WITHOUT TIME ZONE,
    is_collected BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- ================================================================
-- USER COLLECTIONS
-- ================================================================

-- User butterfly collection
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

-- User flower collection
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

-- User fish collection
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

-- User caterpillar collection
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

-- ================================================================
-- EXHIBITION SYSTEM
-- ================================================================

-- Exhibition frames for displaying butterflies
CREATE TABLE exhibition_frames (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    frame_number INTEGER NOT NULL,
    is_vip BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, frame_number, is_vip)
);

-- Butterflies displayed in exhibition frames
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

-- VIP exhibition butterflies
CREATE TABLE exhibition_vip_butterflies (
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

-- Likes on exhibition frames
CREATE TABLE exhibition_frame_likes (
    id SERIAL PRIMARY KEY,
    frame_id INTEGER NOT NULL REFERENCES exhibition_frames(id) ON DELETE CASCADE,
    liker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    liked_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(frame_id, liker_id)
);

-- ================================================================
-- MARKET SYSTEM
-- ================================================================

-- Market listings for trading items
CREATE TABLE market_listings (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seed_id INTEGER,
    quantity INTEGER NOT NULL,
    price_per_unit INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    caterpillar_id INTEGER,
    item_type CHARACTER VARYING(20) DEFAULT 'seed' NOT NULL,
    flower_id INTEGER,
    butterfly_id INTEGER,
    fish_id INTEGER,
    seed_name TEXT,
    seed_rarity TEXT,
    caterpillar_name TEXT,
    caterpillar_rarity TEXT,
    caterpillar_image_url TEXT,
    caterpillar_id_original INTEGER,
    flower_name TEXT,
    flower_rarity TEXT,
    flower_image_url TEXT,
    flower_id_original INTEGER,
    butterfly_name TEXT,
    butterfly_rarity TEXT,
    butterfly_image_url TEXT,
    butterfly_id_original INTEGER,
    fish_name TEXT,
    fish_rarity TEXT,
    fish_image_url TEXT,
    fish_id_original INTEGER
);

-- ================================================================
-- BOUQUET SYSTEM
-- ================================================================

-- Bouquet recipes
CREATE TABLE bouquet_recipes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    flower1_id INTEGER NOT NULL,
    flower2_id INTEGER NOT NULL,
    flower3_id INTEGER NOT NULL,
    flower4_id INTEGER NOT NULL,
    flower5_id INTEGER NOT NULL,
    flower6_id INTEGER NOT NULL,
    is_rare_spawn BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- User bouquets
CREATE TABLE bouquets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id INTEGER NOT NULL REFERENCES bouquet_recipes(id) ON DELETE CASCADE,
    recipe_name TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    last_spawn_check TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    flowers_json TEXT NOT NULL
);

-- ================================================================
-- SPAWNING SYSTEMS
-- ================================================================

-- Sun spawns for energy system
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
-- CATERPILLAR FEEDING SYSTEM
-- ================================================================

-- Fed caterpillars tracking
CREATE TABLE fed_caterpillars (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    caterpillar_id INTEGER NOT NULL,
    caterpillar_name TEXT NOT NULL,
    caterpillar_rarity TEXT NOT NULL,
    caterpillar_image_url TEXT NOT NULL,
    fed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    ready_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    collected_at TIMESTAMP WITHOUT TIME ZONE,
    is_collected BOOLEAN DEFAULT FALSE NOT NULL,
    resulting_butterfly_id INTEGER,
    resulting_butterfly_name TEXT,
    resulting_butterfly_rarity TEXT,
    resulting_butterfly_image_url TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- ================================================================
-- CHALLENGE SYSTEM
-- ================================================================

-- Weekly challenges
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

-- Challenge donations by users
CREATE TABLE challenge_donations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES weekly_challenges(id) ON DELETE CASCADE,
    flower_id INTEGER NOT NULL,
    flower_name TEXT NOT NULL,
    flower_rarity TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    donated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- Challenge rewards
CREATE TABLE challenge_rewards (
    id SERIAL PRIMARY KEY,
    challenge_id INTEGER NOT NULL REFERENCES weekly_challenges(id) ON DELETE CASCADE,
    reward_tier INTEGER NOT NULL,
    reward_type TEXT NOT NULL,
    reward_item_id INTEGER,
    reward_item_name TEXT,
    reward_item_rarity TEXT,
    reward_item_image_url TEXT,
    reward_quantity INTEGER DEFAULT 1 NOT NULL,
    credits_reward INTEGER DEFAULT 0 NOT NULL,
    hearts_reward INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- ================================================================
-- DAILY SYSTEM
-- ================================================================

-- Daily items/rewards
CREATE TABLE daily_items (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    item_type TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    item_rarity TEXT NOT NULL,
    item_image_url TEXT NOT NULL,
    credits_cost INTEGER DEFAULT 0 NOT NULL,
    hearts_cost INTEGER DEFAULT 0 NOT NULL,
    quantity_available INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- Daily redemptions by users
CREATE TABLE daily_redemptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    daily_item_id INTEGER NOT NULL REFERENCES daily_items(id) ON DELETE CASCADE,
    quantity_redeemed INTEGER NOT NULL,
    redeemed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, daily_item_id)
);

-- ================================================================
-- CASTLE SYSTEM
-- ================================================================

-- Castle unlocked parts
CREATE TABLE castle_unlocked_parts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    part_name TEXT NOT NULL,
    unlocked_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, part_name)
);

-- Castle grid state
CREATE TABLE castle_grid_state (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    grid_index INTEGER NOT NULL,
    is_unlocked BOOLEAN DEFAULT FALSE NOT NULL,
    unlocked_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, grid_index)
);

-- ================================================================
-- COLLECTION STATS
-- ================================================================

-- Collection statistics tracking
CREATE TABLE collection_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stat_type TEXT NOT NULL,
    stat_category TEXT NOT NULL,
    count INTEGER DEFAULT 0 NOT NULL,
    total_possible INTEGER DEFAULT 0 NOT NULL,
    last_updated TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, stat_type, stat_category)
);

-- ================================================================
-- SPECIAL TRACKING
-- ================================================================

-- Marie Posa butterfly tracking
CREATE TABLE marie_posa_tracker (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    marie_posa_id INTEGER NOT NULL,
    last_spawn_date DATE NOT NULL,
    spawn_count INTEGER DEFAULT 1 NOT NULL,
    last_spawn_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, marie_posa_id, last_spawn_date)
);

-- ================================================================
-- PERFORMANCE INDEXES
-- ================================================================

-- Core user indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Aquarium system indexes
CREATE INDEX idx_aquarium_tanks_user_id ON aquarium_tanks(user_id);
CREATE INDEX idx_aquarium_fish_user_id ON aquarium_fish(user_id);
CREATE INDEX idx_aquarium_fish_tank_id ON aquarium_fish(tank_id);

-- Garden and field indexes
CREATE INDEX idx_planted_fields_user_id ON planted_fields(user_id);
CREATE INDEX idx_field_flowers_user_id ON field_flowers(user_id);
CREATE INDEX idx_field_butterflies_user_id ON field_butterflies(user_id);
CREATE INDEX idx_field_caterpillars_user_id ON field_caterpillars(user_id);
CREATE INDEX idx_field_fish_user_id ON field_fish(user_id);

-- Collection indexes
CREATE INDEX idx_user_butterflies_user_id ON user_butterflies(user_id);
CREATE INDEX idx_user_flowers_user_id ON user_flowers(user_id);
CREATE INDEX idx_user_fish_user_id ON user_fish(user_id);
CREATE INDEX idx_user_caterpillars_user_id ON user_caterpillars(user_id);

-- Exhibition system indexes
CREATE INDEX idx_exhibition_frames_user_id ON exhibition_frames(user_id);
CREATE INDEX idx_exhibition_butterflies_user_id ON exhibition_butterflies(user_id);
CREATE INDEX idx_exhibition_vip_butterflies_user_id ON exhibition_vip_butterflies(user_id);
CREATE INDEX idx_exhibition_frame_likes_frame_id ON exhibition_frame_likes(frame_id);
CREATE INDEX idx_exhibition_frame_likes_liker_id ON exhibition_frame_likes(liker_id);

-- Market system indexes
CREATE INDEX idx_market_listings_seller_id ON market_listings(seller_id);
CREATE INDEX idx_market_listings_is_active ON market_listings(is_active);
CREATE INDEX idx_market_listings_item_type ON market_listings(item_type);

-- Spawning system indexes
CREATE INDEX idx_sun_spawns_user_id ON sun_spawns(user_id);
CREATE INDEX idx_sun_spawns_expires_at ON sun_spawns(expires_at);
CREATE INDEX idx_sun_spawns_is_collected ON sun_spawns(is_collected);

-- Caterpillar feeding indexes
CREATE INDEX idx_fed_caterpillars_user_id ON fed_caterpillars(user_id);
CREATE INDEX idx_fed_caterpillars_ready_at ON fed_caterpillars(ready_at);
CREATE INDEX idx_fed_caterpillars_is_collected ON fed_caterpillars(is_collected);

-- Challenge system indexes
CREATE INDEX idx_weekly_challenges_is_active ON weekly_challenges(is_active);
CREATE INDEX idx_challenge_donations_user_id ON challenge_donations(user_id);
CREATE INDEX idx_challenge_donations_challenge_id ON challenge_donations(challenge_id);

-- Daily system indexes
CREATE INDEX idx_daily_items_date ON daily_items(date);
CREATE INDEX idx_daily_redemptions_user_id ON daily_redemptions(user_id);

-- Castle system indexes
CREATE INDEX idx_castle_unlocked_parts_user_id ON castle_unlocked_parts(user_id);
CREATE INDEX idx_castle_grid_state_user_id ON castle_grid_state(user_id);

-- Collection stats indexes
CREATE INDEX idx_collection_stats_user_id ON collection_stats(user_id);
CREATE INDEX idx_collection_stats_type_category ON collection_stats(stat_type, stat_category);

-- Special tracking indexes
CREATE INDEX idx_marie_posa_tracker_user_id ON marie_posa_tracker(user_id);
CREATE INDEX idx_marie_posa_tracker_spawn_date ON marie_posa_tracker(last_spawn_date);

-- ================================================================
-- INITIAL DATA SETUP
-- ================================================================

-- Insert default admin user (password should be changed!)
INSERT INTO users (username, password, credits, suns, dna, tickets, hearts)
VALUES ('admin', '$2b$10$defaulthash', 10000, 1000, 1000, 100, 1000);

-- ================================================================
-- SCHEMA VERSION TRACKING
-- ================================================================

CREATE TABLE schema_version (
    id SERIAL PRIMARY KEY,
    version TEXT NOT NULL,
    applied_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    description TEXT
);

INSERT INTO schema_version (version, description)
VALUES ('1.0.0', 'Initial Project Flower database schema with optimized indexes');

-- ================================================================
-- END OF SCHEMA
-- ================================================================