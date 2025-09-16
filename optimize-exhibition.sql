-- Optimize Exhibition Queries
-- These specific indexes will improve exhibition performance

-- Exhibition butterflies composite index (user + frame lookup)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exhibition_butterflies_user_frame 
ON exhibition_butterflies(user_id, frame_id);

-- Exhibition butterflies with slot index for grid display
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exhibition_butterflies_frame_slot 
ON exhibition_butterflies(frame_id, slot_index);

-- Exhibition frames user lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exhibition_frames_user_id 
ON exhibition_frames(user_id);

-- Exhibition likes performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exhibition_likes_frame_owner 
ON exhibition_likes(frame_owner_id, frame_id);

-- Field butterflies user lookup optimization  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_field_butterflies_user_field
ON field_butterflies(user_id, field_index);

-- User butterflies rarity filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_butterflies_user_rarity
ON user_butterflies(user_id, butterfly_rarity);

-- Query Analysis:
-- EXPLAIN ANALYZE SELECT * FROM exhibition_butterflies WHERE user_id = 4;
-- EXPLAIN ANALYZE SELECT * FROM exhibition_butterflies WHERE user_id = 4 AND frame_id = 8;
