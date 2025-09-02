import { pgTable, text, serial, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  credits: integer("credits").notNull().default(1000),
  lastPassiveIncomeAt: timestamp("last_passive_income_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const seeds = pgTable("seeds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rarity: text("rarity").notNull(), // common, uncommon, rare, legendary
  price: integer("price").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userSeeds = pgTable("user_seeds", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  seedId: integer("seed_id").notNull().references(() => seeds.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const marketListings = pgTable("market_listings", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  seedId: integer("seed_id").notNull().references(() => seeds.id),
  quantity: integer("quantity").notNull(),
  pricePerUnit: integer("price_per_unit").notNull(),
  totalPrice: integer("total_price").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const createMarketListingSchema = z.object({
  seedId: z.number().min(1),
  quantity: z.number().min(1),
  pricePerUnit: z.number().min(1),
});

export const buyListingSchema = z.object({
  listingId: z.number().min(1),
  quantity: z.number().min(1),
});

// Garden field schema
export const plantedFields = pgTable("planted_fields", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  fieldIndex: integer("field_index").notNull(),
  seedId: integer("seed_id").notNull().references(() => seeds.id),
  seedRarity: text("seed_rarity").notNull(),
  plantedAt: timestamp("planted_at").notNull().defaultNow(),
  isGrown: boolean("is_grown").notNull().default(false),
  flowerId: integer("flower_id"),
  flowerName: text("flower_name"),
  flowerImageUrl: text("flower_image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const plantSeedSchema = z.object({
  fieldIndex: z.number().min(0).max(49),
  seedId: z.number(),
  userSeedId: z.number()
});

export const harvestFieldSchema = z.object({
  fieldIndex: z.number().min(0).max(49)
});

// User flowers inventory
export const userFlowers = pgTable("user_flowers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  flowerId: integer("flower_id").notNull(),
  rarity: integer("rarity").notNull(), // Integer rarity for constraint compliance
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  flowerName: text("flower_name"), // Nullable as per PostgreSQL
  flowerRarity: text("flower_rarity"), // Nullable as per PostgreSQL
  flowerImageUrl: text("flower_image_url"), // Nullable as per PostgreSQL
});

// Bouquet system
export const bouquets = pgTable("bouquets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  rarity: text("rarity").notNull(), // Average rarity of the 3 flowers
  imageUrl: text("image_url").notNull().default("/Blumen/bouquet.jpg"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bouquetRecipes = pgTable("bouquet_recipes", {
  id: serial("id").primaryKey(),
  bouquetId: integer("bouquet_id").notNull().references(() => bouquets.id),
  flowerId1: integer("flower_id_1").notNull(),
  flowerId2: integer("flower_id_2").notNull(),
  flowerId3: integer("flower_id_3").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userBouquets = pgTable("user_bouquets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bouquetId: integer("bouquet_id").notNull().references(() => bouquets.id),
  quantity: integer("quantity").notNull().default(1),
  bouquetName: text("bouquet_name").notNull(),
  bouquetRarity: text("bouquet_rarity").notNull(),
  bouquetImageUrl: text("bouquet_image_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const placedBouquets = pgTable("placed_bouquets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bouquetId: integer("bouquet_id").notNull().references(() => bouquets.id),
  fieldIndex: integer("field_index").notNull(),
  placedAt: timestamp("placed_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // 21 minutes after placement
  nextSpawnAt: timestamp("next_spawn_at").notNull(), // Current slot spawn time
  currentSpawnSlot: integer("current_spawn_slot").notNull().default(1), // Which slot (1-4)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userButterflies = pgTable("user_butterflies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  butterflyId: integer("butterfly_id").notNull(),
  butterflyName: text("butterfly_name").notNull(),
  butterflyRarity: text("butterfly_rarity").notNull(),
  butterflyImageUrl: text("butterfly_image_url").notNull(),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Exhibition frames for butterfly displays
export const exhibitionFrames = pgTable("exhibition_frames", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  frameNumber: integer("frame_number").notNull(), // 1, 2, 3, etc.
  purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Butterflies placed in exhibition frames
export const exhibitionButterflies = pgTable("exhibition_butterflies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  frameId: integer("frame_id").notNull().references(() => exhibitionFrames.id),
  slotIndex: integer("slot_index").notNull(), // 0-5 for 3x2 grid
  butterflyId: integer("butterfly_id").notNull(),
  butterflyName: text("butterfly_name").notNull(),
  butterflyRarity: text("butterfly_rarity").notNull(),
  butterflyImageUrl: text("butterfly_image_url").notNull(),
  placedAt: timestamp("placed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Passive income tracking
export const passiveIncomeLog = pgTable("passive_income_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // credits earned
  sourceType: text("source_type").notNull(), // 'exhibition'
  sourceDetails: text("source_details").notNull(), // frame and butterfly info
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Exhibition frame likes table
export const exhibitionFrameLikes = pgTable("exhibition_frame_likes", {
  id: serial("id").primaryKey(),
  frameOwnerId: integer("frame_owner_id").notNull().references(() => users.id), // Owner of the exhibition frame
  likerId: integer("liker_id").notNull().references(() => users.id), // User who liked the frame
  frameId: integer("frame_id").notNull().references(() => exhibitionFrames.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    uniqueFrameLike: unique("unique_frame_like").on(table.frameOwnerId, table.likerId, table.frameId)
  };
});

// Butterflies spawned on garden fields (waiting to be collected)
export const fieldButterflies = pgTable("field_butterflies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  fieldIndex: integer("field_index").notNull(), // 0-49 for the 50 garden fields
  butterflyId: integer("butterfly_id").notNull(),
  butterflyName: text("butterfly_name").notNull(),
  butterflyRarity: text("butterfly_rarity").notNull(),
  butterflyImageUrl: text("butterfly_image_url").notNull(),
  bouquetId: integer("bouquet_id").notNull().references(() => bouquets.id),
  spawnedAt: timestamp("spawned_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// VIP Butterflies - Premium animated butterflies (GIF format)
export const userVipButterflies = pgTable("user_vip_butterflies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  vipButterflyId: integer("vip_butterfly_id").notNull(),
  vipButterflyName: text("vip_butterfly_name").notNull(),
  vipButterflyImageUrl: text("vip_butterfly_image_url").notNull(), // Path to .gif file
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// VIP Butterflies placed in exhibition frames  
export const exhibitionVipButterflies = pgTable("exhibition_vip_butterflies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  frameId: integer("frame_id").notNull().references(() => exhibitionFrames.id),
  slotIndex: integer("slot_index").notNull(), // 0-5 for 3x2 grid
  vipButterflyId: integer("vip_butterfly_id").notNull(),
  vipButterflyName: text("vip_butterfly_name").notNull(),
  vipButterflyImageUrl: text("vip_butterfly_image_url").notNull(), // Path to .gif file
  placedAt: timestamp("placed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const createBouquetSchema = z.object({
  flowerId1: z.number().min(1),
  flowerId2: z.number().min(1),
  flowerId3: z.number().min(1),
  name: z.string().min(1).max(50).optional(),
  generateName: z.boolean().optional(),
});

export const placeBouquetSchema = z.object({
  bouquetId: z.number().min(1),
  fieldIndex: z.number().min(0).max(49),
});

// Weekly Challenge System
export const weeklyChallenges = pgTable("weekly_challenges", {
  id: serial("id").primaryKey(),
  weekNumber: integer("week_number").notNull().unique(), // YYYY-WW format
  year: integer("year").notNull(),
  startTime: timestamp("start_time").notNull(), // Monday 00:00
  endTime: timestamp("end_time").notNull(),   // Sunday 18:00
  isActive: boolean("is_active").notNull().default(true),
  // Required flowers (6 total: 2 uncommon, 2 rare, 2 super-rare)
  flowerId1: integer("flower_id_1").notNull(), // uncommon
  flowerId2: integer("flower_id_2").notNull(), // uncommon  
  flowerId3: integer("flower_id_3").notNull(), // rare
  flowerId4: integer("flower_id_4").notNull(), // rare
  flowerId5: integer("flower_id_5").notNull(), // super-rare
  flowerId6: integer("flower_id_6").notNull(), // super-rare
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const challengeDonations = pgTable("challenge_donations", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => weeklyChallenges.id),
  userId: integer("user_id").notNull().references(() => users.id),
  flowerId: integer("flower_id").notNull(),
  quantity: integer("quantity").notNull(),
  donatedAt: timestamp("donated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const challengeRewards = pgTable("challenge_rewards", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => weeklyChallenges.id),
  userId: integer("user_id").notNull().references(() => users.id),
  rank: integer("rank").notNull(), // 1-10
  totalDonations: integer("total_donations").notNull(),
  butterflyId: integer("butterfly_id").notNull(),
  butterflyName: text("butterfly_name").notNull(),
  butterflyRarity: text("butterfly_rarity").notNull(),
  butterflyImageUrl: text("butterfly_image_url").notNull(),
  isAnimated: boolean("is_animated").notNull().default(false), // true for rank 1
  passiveIncome: integer("passive_income").notNull().default(0), // 60 for animated
  rewardedAt: timestamp("rewarded_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const donateChallengeFlowerSchema = z.object({
  challengeId: z.number().min(1),
  flowerId: z.number().min(1),
  quantity: z.number().min(1).max(999),
});

// All type exports
export type User = typeof users.$inferSelect;
export type Seed = typeof seeds.$inferSelect;
export type UserSeed = typeof userSeeds.$inferSelect;
export type MarketListing = typeof marketListings.$inferSelect;
export type CreateMarketListingRequest = z.infer<typeof createMarketListingSchema>;
export type BuyListingRequest = z.infer<typeof buyListingSchema>;
export type PlantedField = typeof plantedFields.$inferSelect;
export type PlantSeedRequest = z.infer<typeof plantSeedSchema>;
export type HarvestFieldRequest = z.infer<typeof harvestFieldSchema>;
export type UserFlower = typeof userFlowers.$inferSelect;
export type Bouquet = typeof bouquets.$inferSelect;
export type BouquetRecipe = typeof bouquetRecipes.$inferSelect;
export type UserBouquet = typeof userBouquets.$inferSelect;
export type PlacedBouquet = typeof placedBouquets.$inferSelect;
export type UserButterfly = typeof userButterflies.$inferSelect;
export type FieldButterfly = typeof fieldButterflies.$inferSelect;
export type UserVipButterfly = typeof userVipButterflies.$inferSelect;
export type ExhibitionFrame = typeof exhibitionFrames.$inferSelect;
export type ExhibitionButterfly = typeof exhibitionButterflies.$inferSelect;
export type ExhibitionVipButterfly = typeof exhibitionVipButterflies.$inferSelect;
export type PassiveIncomeLog = typeof passiveIncomeLog.$inferSelect;
export type CreateBouquetRequest = z.infer<typeof createBouquetSchema>;
export type PlaceBouquetRequest = z.infer<typeof placeBouquetSchema>;
export type WeeklyChallenge = typeof weeklyChallenges.$inferSelect;
export type ChallengeDonation = typeof challengeDonations.$inferSelect;
export type ChallengeReward = typeof challengeRewards.$inferSelect;
export type DonateChallengeFlowerRequest = z.infer<typeof donateChallengeFlowerSchema>;
