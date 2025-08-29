import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  credits: integer("credits").notNull().default(1000),
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginRequest = z.infer<typeof loginSchema>;
export type Seed = typeof seeds.$inferSelect;
export type UserSeed = typeof userSeeds.$inferSelect;
export type MarketListing = typeof marketListings.$inferSelect;
export type CreateMarketListingRequest = z.infer<typeof createMarketListingSchema>;
export type BuyListingRequest = z.infer<typeof buyListingSchema>;
export type PlantedField = typeof plantedFields.$inferSelect;
export type PlantSeedRequest = z.infer<typeof plantSeedSchema>;
export type HarvestFieldRequest = z.infer<typeof harvestFieldSchema>;
