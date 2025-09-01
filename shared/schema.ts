import { pgTable, serial, varchar, integer, timestamp, boolean, text, decimal } from 'drizzle-orm/pg-core';

// === USERS ===
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  credits: integer('credits').default(1000).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// === SEEDS ===
export const userSeeds = pgTable('user_seeds', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  seedId: integer('seed_id').notNull(), // 1-7 for different rarities
  quantity: integer('quantity').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// === PLANTED FIELDS ===
export const plantedFields = pgTable('planted_fields', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  fieldIndex: integer('field_index').notNull(), // 0-24 for 25 garden fields
  seedId: integer('seed_id').notNull(),
  plantedAt: timestamp('planted_at').defaultNow().notNull(),
  harvestAt: timestamp('harvest_at').notNull(),
  isReady: boolean('is_ready').default(false).notNull(),
});

// === USER FLOWERS ===
export const userFlowers = pgTable('user_flowers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  flowerId: integer('flower_id').notNull(), // 1-200
  rarity: integer('rarity').notNull(), // 1-7
  quantity: integer('quantity').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// === FIELD BUTTERFLIES (spawned in garden) ===
export const fieldButterflies = pgTable('field_butterflies', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  fieldIndex: integer('field_index').notNull(),
  butterflyId: integer('butterfly_id').notNull(), // 1-1000
  rarity: integer('rarity').notNull(),
  spawnedAt: timestamp('spawned_at').defaultNow().notNull(),
  despawnAt: timestamp('despawn_at').notNull(), // 72h later
});

// === USER BUTTERFLIES (collected) ===
export const userButterflies = pgTable('user_butterflies', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  butterflyId: integer('butterfly_id').notNull(),
  rarity: integer('rarity').notNull(),
  quantity: integer('quantity').default(1).notNull(),
  collectedAt: timestamp('collected_at').defaultNow().notNull(),
});

// === EXHIBITION FRAMES ===
export const exhibitionFrames = pgTable('exhibition_frames', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  frameIndex: integer('frame_index').notNull(), // 0-24 for 25 frames
  butterflyId: integer('butterfly_id'),
  rarity: integer('rarity'),
  placedAt: timestamp('placed_at').defaultNow(),
});

// === BOUQUETS ===
export const userBouquets = pgTable('user_bouquets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  flower1Id: integer('flower1_id').notNull(),
  flower2Id: integer('flower2_id'),
  flower3Id: integer('flower3_id'),
  totalRarity: integer('total_rarity').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// === PLACED BOUQUETS (in garden) ===
export const placedBouquets = pgTable('placed_bouquets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  bouquetId: integer('bouquet_id').references(() => userBouquets.id).notNull(),
  fieldIndex: integer('field_index').notNull(),
  placedAt: timestamp('placed_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(), // 72h later
});

// === MARKET LISTINGS (only seeds) ===
export const marketListings = pgTable('market_listings', {
  id: serial('id').primaryKey(),
  sellerId: integer('seller_id').references(() => users.id).notNull(),
  seedId: integer('seed_id').notNull(),
  quantity: integer('quantity').notNull(),
  pricePerSeed: integer('price_per_seed').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// === BUTTERFLY SELLING (72h countdown) ===
export const butterflySales = pgTable('butterfly_sales', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  butterflyId: integer('butterfly_id').notNull(),
  rarity: integer('rarity').notNull(),
  quantity: integer('quantity').notNull(),
  priceEach: integer('price_each').notNull(),
  listedAt: timestamp('listed_at').defaultNow().notNull(),
  sellsAt: timestamp('sells_at').notNull(), // 72h later
  isSold: boolean('is_sold').default(false).notNull(),
});

// === GLOBAL BOUQUET NAMES (for uniqueness) ===
export const globalBouquetNames = pgTable('global_bouquet_names', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});