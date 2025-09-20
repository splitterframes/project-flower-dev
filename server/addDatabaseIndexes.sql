-- Database Performance Indexes for MyMariposa Game
-- These indexes will dramatically improve query performance

-- User-related indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_id ON users(id);

-- User butterflies indexes (heavily queried)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_butterflies_user_id ON user_butterflies(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_butterflies_butterfly_id ON user_butterflies(butterfly_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_butterflies_user_butterfly ON user_butterflies(user_id, butterfly_id);

-- Exhibition butterflies indexes  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exhibition_butterflies_user_id ON exhibition_butterflies(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exhibition_butterflies_frame_id ON exhibition_butterflies(frame_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exhibition_butterflies_user_frame ON exhibition_butterflies(user_id, frame_id);

-- Field butterflies indexes (for garden spawning)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_field_butterflies_user_id ON field_butterflies(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_field_butterflies_field_index ON field_butterflies(field_index);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_field_butterflies_user_field ON field_butterflies(user_id, field_index);

-- User flowers indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_flowers_user_id ON user_flowers(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_flowers_flower_id ON user_flowers(flower_id);

-- User seeds indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_seeds_user_id ON user_seeds(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_seeds_seed_id ON user_seeds(seed_id);

-- Planted fields indexes (for garden management)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_planted_fields_user_id ON planted_fields(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_planted_fields_field_index ON planted_fields(field_index);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_planted_fields_user_field ON planted_fields(user_id, field_index);

-- Sun spawns indexes (for sun collection)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sun_spawns_user_id ON sun_spawns(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sun_spawns_field_index ON sun_spawns(field_index);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sun_spawns_expires_at ON sun_spawns(expires_at);

-- Market listings indexes (for marketplace)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_listings_seller_id ON market_listings(seller_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_listings_status ON market_listings(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_listings_item_type ON market_listings(item_type);

-- Bouquets indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bouquets_user_id ON bouquets(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bouquet_recipes_bouquet_id ON bouquet_recipes(bouquet_id);

-- Exhibition frames and likes indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exhibition_frames_user_id ON exhibition_frames(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exhibition_likes_frame_id ON exhibition_likes(frame_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exhibition_likes_user_frame ON exhibition_likes(frame_owner_id, frame_id);

-- Unlocked features indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unlocked_features_user_id ON unlocked_features(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unlocked_features_feature ON unlocked_features(feature_name);

-- Aquarium indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aquarium_fish_user_id ON aquarium_fish(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aquarium_fish_tank_id ON aquarium_fish(tank_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aquarium_tanks_user_id ON aquarium_tanks(user_id);

-- Challenge related indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenge_donations_user_id ON challenge_donations(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenge_donations_challenge_id ON challenge_donations(challenge_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_weekly_challenges_active ON weekly_challenges(is_active);

-- Collection stats indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_stats_user_id ON collection_stats(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_stats_item ON collection_stats(item_type, item_id);

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_butterflies_rarity ON user_butterflies(user_id, butterfly_rarity);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_field_butterflies_spawned ON field_butterflies(user_id, spawned_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_listings_active ON market_listings(status, created_at) WHERE status = 'active';

-- Performance monitoring queries
-- Use these to verify index usage:
-- EXPLAIN ANALYZE SELECT * FROM user_butterflies WHERE user_id = 4;
-- EXPLAIN ANALYZE SELECT * FROM exhibition_butterflies WHERE user_id = 4;
-- EXPLAIN ANALYZE SELECT * FROM field_butterflies WHERE user_id = 4 AND field_index = 10;
