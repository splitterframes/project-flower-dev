import { 
  users, 
  seeds, 
  userSeeds, 
  marketListings,
  plantedFields,
  userFlowers,
  bouquets,
  userBouquets,
  bouquetRecipes,
  placedBouquets,
  userButterflies,
  fieldButterflies,
  exhibitionFrames,
  exhibitionButterflies,
  passiveIncomeLog,
  exhibitionFrameLikes,
  type User, 
  type InsertUser, 
  type Seed, 
  type UserSeed, 
  type MarketListing,
  type PlantedField,
  type CreateMarketListingRequest,
  type BuyListingRequest,
  type PlantSeedRequest,
  type HarvestFieldRequest,
  type UserFlower,
  type Bouquet,
  type UserBouquet,
  type BouquetRecipe,
  type PlacedBouquet,
  type UserButterfly,
  type FieldButterfly,
  type ExhibitionFrame,
  type ExhibitionButterfly,
  type PassiveIncomeLog,
  type CreateBouquetRequest,
  type PlaceBouquetRequest
} from "@shared/schema";
import { eq, ilike, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { generateRandomFlower, getGrowthTime, type RarityTier } from "@shared/rarity";
import { generateBouquetName, calculateAverageRarity, generateRandomButterfly, getBouquetSeedDrop } from './bouquet';
import type { IStorage } from './storage';

/**
 * PostgreSQL-only Storage Implementation
 * Direct database operations without memory caching
 */
export class PostgresStorage implements IStorage {
  private db: any;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for PostgreSQL storage');
    }
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
    console.log('🗄️ PostgreSQL-only storage initialized');
    
    // Initialize basic seeds if they don't exist
    this.initializeSeeds();
  }

  private async initializeSeeds() {
    try {
      // Check if seeds exist
      const existingSeeds = await this.db.select().from(seeds);
      
      if (existingSeeds.length === 0) {
        console.log('🌱 Initializing basic seeds...');
        
        // Create basic seeds for all rarity tiers
        const basicSeeds = [
          { name: 'Gelbe Samen', rarity: 'common', price: 10, description: 'Gewöhnliche gelbe Samen' },
          { name: 'Grüne Samen', rarity: 'uncommon', price: 25, description: 'Ungewöhnliche grüne Samen' },
          { name: 'Blaue Samen', rarity: 'rare', price: 50, description: 'Seltene blaue Samen' },
          { name: 'Türkise Samen', rarity: 'super-rare', price: 100, description: 'Super seltene türkise Samen' },
          { name: 'Lila Samen', rarity: 'epic', price: 200, description: 'Epische lila Samen' },
          { name: 'Orange Samen', rarity: 'legendary', price: 500, description: 'Legendäre orange Samen' },
          { name: 'Rote Samen', rarity: 'mythical', price: 1000, description: 'Mythische rote Samen' }
        ];
        
        await this.db.insert(seeds).values(basicSeeds);
        console.log(`🌱 Created ${basicSeeds.length} basic seeds in database`);
      }
    } catch (error) {
      console.error('Failed to initialize seeds:', error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0] as User | undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(ilike(users.username, username));
    return result[0] as User | undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning();
    const newUser = result[0] as User;
    
    console.log(`💾 Created new user "${user.username}" in PostgreSQL (ID: ${newUser.id})`);
    
    // Give starter seeds to new user (5 common + 3 rare seeds)
    try {
      await this.addSeedToInventory(newUser.id, 'common' as RarityTier, 5);
      await this.addSeedToInventory(newUser.id, 'rare' as RarityTier, 3);
      console.log(`🌱 Gave starter seeds to new user ${newUser.username}: 5 Common + 3 Rare`);
    } catch (error) {
      console.error(`Failed to give starter seeds to user ${newUser.id}:`, error);
    }
    
    return newUser;
  }

  async updateUserCredits(id: number, amount: number): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set({ credits: amount })
      .where(eq(users.id, id))
      .returning();
    return result[0] as User | undefined;
  }

  // Market methods
  async getMarketListings(): Promise<any[]> {
    const listings = await this.db
      .select({
        id: marketListings.id,
        sellerId: marketListings.sellerId,
        seedId: marketListings.seedId,
        quantity: marketListings.quantity,
        pricePerUnit: marketListings.pricePerUnit,
        createdAt: marketListings.createdAt,
        sellerUsername: users.username,
        seedName: seeds.name,
        seedRarity: seeds.rarity
      })
      .from(marketListings)
      .leftJoin(users, eq(marketListings.sellerId, users.id))
      .leftJoin(seeds, eq(marketListings.seedId, seeds.id));
    
    return listings;
  }

  async createMarketListing(sellerId: number, data: CreateMarketListingRequest): Promise<any> {
    // Check if user has enough seeds
    const userSeedsResult = await this.db
      .select()
      .from(userSeeds)
      .where(and(eq(userSeeds.userId, sellerId), eq(userSeeds.seedId, data.seedId)));
    
    if (userSeedsResult.length === 0 || userSeedsResult[0].quantity < data.quantity) {
      throw new Error('Insufficient seeds');
    }

    // Create listing
    const listing = await this.db.insert(marketListings).values({
      sellerId,
      seedId: data.seedId,
      quantity: data.quantity,
      pricePerUnit: data.pricePerUnit,
      totalPrice: data.pricePerUnit * data.quantity
    }).returning();

    // Deduct seeds from seller
    await this.db
      .update(userSeeds)
      .set({ quantity: userSeedsResult[0].quantity - data.quantity })
      .where(and(eq(userSeeds.userId, sellerId), eq(userSeeds.seedId, data.seedId)));

    return listing[0];
  }

  async buyMarketListing(buyerId: number, data: BuyListingRequest): Promise<{ success: boolean; message?: string }> {
    const listing = await this.db
      .select()
      .from(marketListings)
      .where(eq(marketListings.id, data.listingId));

    if (listing.length === 0) {
      return { success: false, message: 'Listing not found' };
    }

    const totalPrice = listing[0].pricePerUnit * data.quantity;
    
    // Check buyer credits
    const buyer = await this.getUser(buyerId);
    if (!buyer || buyer.credits < totalPrice) {
      return { success: false, message: 'Insufficient credits' };
    }

    // Process purchase
    await this.db
      .update(users)
      .set({ credits: buyer.credits - totalPrice })
      .where(eq(users.id, buyerId));

    // Add seeds to buyer
    await this.addSeedToInventory(buyerId, listing[0].seedId, data.quantity);

    // Update listing quantity or remove
    if (listing[0].quantity > data.quantity) {
      await this.db
        .update(marketListings)
        .set({ quantity: listing[0].quantity - data.quantity })
        .where(eq(marketListings.id, data.listingId));
    } else {
      await this.db
        .delete(marketListings)
        .where(eq(marketListings.id, data.listingId));
    }

    return { success: true };
  }

  async getUserSeeds(userId: number): Promise<any[]> {
    const result = await this.db
      .select({
        id: userSeeds.id,
        userId: userSeeds.userId,
        seedId: userSeeds.seedId,
        quantity: userSeeds.quantity,
        createdAt: userSeeds.createdAt,
        seedName: seeds.name,
        seedRarity: seeds.rarity,
        seedPrice: seeds.price,
        seedDescription: seeds.description,
        seedImageUrl: seeds.imageUrl
      })
      .from(userSeeds)
      .leftJoin(seeds, eq(userSeeds.seedId, seeds.id))
      .where(eq(userSeeds.userId, userId));
    
    return result;
  }

  // Garden methods
  async plantSeed(userId: number, data: PlantSeedRequest): Promise<{ success: boolean; message?: string }> {
    // Check if user has seeds
    const userSeedsResult = await this.db
      .select()
      .from(userSeeds)
      .where(and(eq(userSeeds.userId, userId), eq(userSeeds.seedId, data.seedId)));

    if (userSeedsResult.length === 0 || userSeedsResult[0].quantity < 1) {
      return { success: false, message: 'No seeds available' };
    }

    // Check if field is empty
    const existingField = await this.db
      .select()
      .from(plantedFields)
      .where(and(eq(plantedFields.userId, userId), eq(plantedFields.fieldIndex, data.fieldIndex)));

    if (existingField.length > 0) {
      return { success: false, message: 'Field already occupied' };
    }

    // Get seed info for random flower generation
    const seedInfo = await this.db
      .select()
      .from(seeds)
      .where(eq(seeds.id, data.seedId));

    if (seedInfo.length === 0) {
      return { success: false, message: 'Invalid seed' };
    }

    // Generate random flower
    const randomFlower = generateRandomFlower(seedInfo[0].rarity as RarityTier);

    // Plant seed
    await this.db.insert(plantedFields).values({
      userId,
      fieldIndex: data.fieldIndex,
      seedId: data.seedId,
      seedRarity: seedInfo[0].rarity,
      plantedAt: new Date(),
      isGrown: false,
      flowerId: randomFlower.id,
      flowerName: randomFlower.name,
      flowerImageUrl: randomFlower.imageUrl
    });

    // Deduct seed
    await this.db
      .update(userSeeds)
      .set({ quantity: userSeedsResult[0].quantity - 1 })
      .where(and(eq(userSeeds.userId, userId), eq(userSeeds.seedId, data.seedId)));

    return { success: true };
  }

  async getPlantedFields(userId: number): Promise<PlantedField[]> {
    const result = await this.db
      .select()
      .from(plantedFields)
      .where(eq(plantedFields.userId, userId));
    
    return result;
  }

  async harvestField(userId: number, data: HarvestFieldRequest): Promise<{ success: boolean; message?: string }> {
    const field = await this.db
      .select()
      .from(plantedFields)
      .where(and(eq(plantedFields.userId, userId), eq(plantedFields.fieldIndex, data.fieldIndex)));

    if (field.length === 0) {
      return { success: false, message: 'No planted field found' };
    }

    const plantedField = field[0];
    const growthTime = getGrowthTime(plantedField.seedRarity as RarityTier);
    const now = new Date();
    const plantedTime = new Date(plantedField.plantedAt);
    const isGrown = (now.getTime() - plantedTime.getTime()) >= growthTime * 1000;

    if (!isGrown) {
      return { success: false, message: 'Flower is not ready for harvest yet' };
    }

    // Add flower to inventory
    await this.addFlowerToInventory(
      userId,
      plantedField.flowerId!,
      plantedField.flowerName!,
      plantedField.seedRarity!,
      plantedField.flowerImageUrl!
    );

    // Remove planted field
    await this.db
      .delete(plantedFields)
      .where(and(eq(plantedFields.userId, userId), eq(plantedFields.fieldIndex, data.fieldIndex)));

    return { success: true };
  }

  // Flower inventory methods
  async getUserFlowers(userId: number): Promise<UserFlower[]> {
    const result = await this.db
      .select()
      .from(userFlowers)
      .where(eq(userFlowers.userId, userId));
    
    return result;
  }

  async addFlowerToInventory(userId: number, flowerId: number, flowerName: string, flowerRarity: string, flowerImageUrl: string): Promise<void> {
    await this.db.insert(userFlowers).values({
      userId,
      flowerId,
      rarity: this.getRarityInteger(flowerRarity),
      flowerName,
      flowerRarity,
      flowerImageUrl,
      quantity: 1
    });
    console.log(`💾 Added new flower for user ${userId} to PostgreSQL`);
  }

  private getRarityInteger(rarity: string): number {
    switch (rarity.toLowerCase()) {
      case 'common': return 1;
      case 'uncommon': return 2;
      case 'rare': return 3;
      case 'super-rare': return 4;
      case 'epic': return 5;
      case 'legendary': return 6;
      case 'mythical': return 7;
      default: return 1; // Default to common
    }
  }

  // NEW: Implement correct addSeedToInventory from interface
  async addSeedToInventory(userId: number, rarity: RarityTier, quantity: number): Promise<void> {
    // Find seed ID by rarity
    const seedResult = await this.db
      .select()
      .from(seeds)
      .where(eq(seeds.rarity, rarity));
    
    if (seedResult.length === 0) {
      throw new Error(`No seed found for rarity: ${rarity}`);
    }
    
    const seedId = seedResult[0].id;
    await this.addSeedToInventoryById(userId, seedId, quantity);
  }

  async addSeedToInventoryById(userId: number, seedId: number, quantity: number): Promise<void> {
    // Check if user already has this seed type
    const existing = await this.db
      .select()
      .from(userSeeds)
      .where(and(eq(userSeeds.userId, userId), eq(userSeeds.seedId, seedId)));

    if (existing.length > 0) {
      // Update quantity
      await this.db
        .update(userSeeds)
        .set({ quantity: existing[0].quantity + quantity })
        .where(and(eq(userSeeds.userId, userId), eq(userSeeds.seedId, seedId)));
    } else {
      // Create new entry
      await this.db.insert(userSeeds).values({
        userId,
        seedId,
        quantity
      });
    }
  }

  // Create bouquet from 3 flowers
  async createBouquet(userId: number, data: CreateBouquetRequest): Promise<{ success: boolean; message?: string; bouquet?: Bouquet }> {
    try {
      // Get all flowers for this user
      const allUserFlowers = await this.db
        .select()
        .from(userFlowers)
        .where(eq(userFlowers.userId, userId));

      // Find the specific flowers
      const flower1 = allUserFlowers.find(f => f.id === data.flowerId1);
      const flower2 = allUserFlowers.find(f => f.id === data.flowerId2);
      const flower3 = allUserFlowers.find(f => f.id === data.flowerId3);

      if (!flower1 || !flower2 || !flower3) {
        return { success: false, message: 'Eine oder mehrere Blumen nicht gefunden' };
      }

      // Calculate average rarity
      const rarity1 = flower1.flowerRarity as RarityTier;
      const rarity2 = flower2.flowerRarity as RarityTier;
      const rarity3 = flower3.flowerRarity as RarityTier;
      const avgRarity = calculateAverageRarity(rarity1, rarity2, rarity3);

      // Create unique bouquet name
      const bouquetName = data.name || `Bouquet-${Date.now()}`;

      // Create bouquet
      const newBouquet = await this.db.insert(bouquets).values({
        name: bouquetName,
        rarity: avgRarity,
        imageUrl: "/Blumen/bouquet.jpg"
      }).returning();

      // Create recipe
      await this.db.insert(bouquetRecipes).values({
        bouquetId: newBouquet[0].id,
        flowerId1: flower1.flowerId,
        flowerId2: flower2.flowerId,
        flowerId3: flower3.flowerId
      });

      // Add to user inventory
      await this.db.insert(userBouquets).values({
        userId,
        bouquetId: newBouquet[0].id,
        quantity: 1,
        bouquetName: bouquetName,
        bouquetRarity: avgRarity,
        bouquetImageUrl: "/Blumen/bouquet.jpg"
      });

      // Remove flowers from inventory
      await this.db.delete(userFlowers).where(eq(userFlowers.id, data.flowerId1));
      await this.db.delete(userFlowers).where(eq(userFlowers.id, data.flowerId2));
      await this.db.delete(userFlowers).where(eq(userFlowers.id, data.flowerId3));

      console.log(`💐 Created bouquet "${bouquetName}" for user ${userId}`);
      return { success: true, bouquet: newBouquet[0] };

    } catch (error) {
      console.error('Failed to create bouquet:', error);
      return { success: false, message: 'Fehler beim Erstellen des Bouquets' };
    }
  }

  async getUserBouquets(userId: number): Promise<UserBouquet[]> {
    const result = await this.db
      .select()
      .from(userBouquets)
      .where(eq(userBouquets.userId, userId));
    
    return result;
  }

  async getBouquetRecipes(): Promise<BouquetRecipe[]> {
    const result = await this.db.select().from(bouquetRecipes);
    return result;
  }

  async getBouquetRecipe(bouquetId: number): Promise<BouquetRecipe | null> {
    const result = await this.db
      .select()
      .from(bouquetRecipes)
      .where(eq(bouquetRecipes.bouquetId, bouquetId));
    
    return result[0] || null;
  }

  async placeBouquet(userId: number, data: PlaceBouquetRequest): Promise<{ success: boolean; message?: string }> {
    throw new Error('Not implemented yet');
  }

  async getPlacedBouquets(userId: number): Promise<PlacedBouquet[]> {
    const result = await this.db
      .select({
        id: placedBouquets.id,
        userId: placedBouquets.userId,
        bouquetId: placedBouquets.bouquetId,
        fieldIndex: placedBouquets.fieldIndex,
        placedAt: placedBouquets.placedAt,
        expiresAt: placedBouquets.expiresAt,
        nextSpawnAt: placedBouquets.nextSpawnAt,
        currentSpawnSlot: placedBouquets.currentSpawnSlot,
        createdAt: placedBouquets.createdAt,
        bouquetName: userBouquets.bouquetName,
        bouquetRarity: userBouquets.bouquetRarity
      })
      .from(placedBouquets)
      .leftJoin(userBouquets, eq(placedBouquets.bouquetId, userBouquets.bouquetId))
      .where(eq(placedBouquets.userId, userId));
    
    console.log(`💾 Retrieved placed bouquets for user ${userId}:`, result.map((r: any) => ({ fieldIndex: r.fieldIndex, rarity: r.bouquetRarity })));
    
    return result as any;
  }

  async getUserButterflies(userId: number): Promise<UserButterfly[]> {
    const result = await this.db
      .select()
      .from(userButterflies)
      .where(eq(userButterflies.userId, userId));
    
    return result;
  }

  // Field butterfly methods
  async getFieldButterflies(userId: number): Promise<FieldButterfly[]> {
    const result = await this.db
      .select()
      .from(fieldButterflies)
      .where(eq(fieldButterflies.userId, userId));
    
    return result;
  }

  async collectFieldButterfly(userId: number, fieldIndex: number): Promise<{ success: boolean; butterfly?: UserButterfly }> {
    const fieldButterfly = await this.db
      .select()
      .from(fieldButterflies)
      .where(and(eq(fieldButterflies.userId, userId), eq(fieldButterflies.fieldIndex, fieldIndex)));

    if (fieldButterfly.length === 0) {
      return { success: false };
    }

    // Add butterfly to inventory
    const newButterfly = await this.db.insert(userButterflies).values({
      userId,
      butterflyId: fieldButterfly[0].butterflyId,
      butterflyName: fieldButterfly[0].butterflyName,
      butterflyRarity: fieldButterfly[0].butterflyRarity,
      butterflyImageUrl: fieldButterfly[0].butterflyImageUrl,
      quantity: 1
    }).returning();

    // Remove from field
    await this.db
      .delete(fieldButterflies)
      .where(and(eq(fieldButterflies.userId, userId), eq(fieldButterflies.fieldIndex, fieldIndex)));

    return { success: true, butterfly: newButterfly[0] };
  }

  // Exhibition methods
  async getExhibitionFrames(userId: number): Promise<ExhibitionFrame[]> {
    const result = await this.db
      .select()
      .from(exhibitionFrames)
      .where(eq(exhibitionFrames.userId, userId));
    
    return result;
  }

  async purchaseExhibitionFrame(userId: number): Promise<{ success: boolean; message?: string; newCredits?: number; frame?: ExhibitionFrame }> {
    const FRAME_COST = 1000;
    
    const user = await this.getUser(userId);
    if (!user || user.credits < FRAME_COST) {
      return { success: false, message: 'Insufficient credits' };
    }

    // Get current frame count to determine next frame number
    const existingFrames = await this.getExhibitionFrames(userId);
    const frameNumber = existingFrames.length + 1;

    // Create frame
    const newFrame = await this.db.insert(exhibitionFrames).values({
      userId,
      frameNumber
    }).returning();

    // Deduct credits
    const updatedUser = await this.updateUserCredits(userId, user.credits - FRAME_COST);

    return { 
      success: true, 
      newCredits: updatedUser?.credits,
      frame: newFrame[0]
    };
  }

  async getExhibitionButterflies(userId: number): Promise<ExhibitionButterfly[]> {
    const result = await this.db
      .select()
      .from(exhibitionButterflies)
      .where(eq(exhibitionButterflies.userId, userId));
    
    return result;
  }

  async placeExhibitionButterfly(userId: number, frameId: number, slotIndex: number, butterflyId: number): Promise<{ success: boolean; message?: string }> {
    // Check if user has the butterfly
    const userButterfly = await this.db
      .select()
      .from(userButterflies)
      .where(and(eq(userButterflies.userId, userId), eq(userButterflies.butterflyId, butterflyId)));

    if (userButterfly.length === 0) {
      return { success: false, message: 'Butterfly not found' };
    }

    // Check if slot is empty
    const existingSlot = await this.db
      .select()
      .from(exhibitionButterflies)
      .where(and(eq(exhibitionButterflies.frameId, frameId), eq(exhibitionButterflies.slotIndex, slotIndex)));

    if (existingSlot.length > 0) {
      return { success: false, message: 'Slot already occupied' };
    }

    // Place butterfly
    await this.db.insert(exhibitionButterflies).values({
      userId,
      frameId,
      slotIndex,
      butterflyId: userButterfly[0].butterflyId,
      butterflyName: userButterfly[0].butterflyName,
      butterflyRarity: userButterfly[0].butterflyRarity,
      butterflyImageUrl: userButterfly[0].butterflyImageUrl
    });

    // Remove from inventory
    if (userButterfly[0].quantity > 1) {
      await this.db
        .update(userButterflies)
        .set({ quantity: userButterfly[0].quantity - 1 })
        .where(and(eq(userButterflies.userId, userId), eq(userButterflies.butterflyId, butterflyId)));
    } else {
      await this.db
        .delete(userButterflies)
        .where(and(eq(userButterflies.userId, userId), eq(userButterflies.butterflyId, butterflyId)));
    }

    return { success: true };
  }

  async removeExhibitionButterfly(userId: number, frameId: number, slotIndex: number): Promise<{ success: boolean; message?: string }> {
    const butterfly = await this.db
      .select()
      .from(exhibitionButterflies)
      .where(and(eq(exhibitionButterflies.userId, userId), eq(exhibitionButterflies.frameId, frameId), eq(exhibitionButterflies.slotIndex, slotIndex)));

    if (butterfly.length === 0) {
      return { success: false, message: 'No butterfly in slot' };
    }

    // Return to inventory
    const existing = await this.db
      .select()
      .from(userButterflies)
      .where(and(eq(userButterflies.userId, userId), eq(userButterflies.butterflyId, butterfly[0].butterflyId)));

    if (existing.length > 0) {
      await this.db
        .update(userButterflies)
        .set({ quantity: existing[0].quantity + 1 })
        .where(and(eq(userButterflies.userId, userId), eq(userButterflies.butterflyId, butterfly[0].butterflyId)));
    } else {
      await this.db.insert(userButterflies).values({
        userId,
        butterflyId: butterfly[0].butterflyId,
        butterflyName: butterfly[0].butterflyName,
        butterflyRarity: butterfly[0].butterflyRarity,
        butterflyImageUrl: butterfly[0].butterflyImageUrl,
        quantity: 1
      });
    }

    // Remove from exhibition
    await this.db
      .delete(exhibitionButterflies)
      .where(and(eq(exhibitionButterflies.userId, userId), eq(exhibitionButterflies.frameId, frameId), eq(exhibitionButterflies.slotIndex, slotIndex)));

    return { success: true };
  }

  // Additional methods that may be needed
  async collectExpiredBouquet(userId: number, fieldIndex: number): Promise<{ success: boolean; seedDrop?: { rarity: RarityTier; quantity: number } }> {
    throw new Error('Not implemented yet');
  }

  async spawnButterflyOnField(userId: number, bouquetId: number, bouquetRarity: RarityTier): Promise<{ success: boolean; fieldButterfly?: FieldButterfly; fieldIndex?: number }> {
    throw new Error('Not implemented yet');
  }

  // Additional exhibition methods (from routes usage)
  async canSellButterfly(userId: number, exhibitionButterflyId: number): Promise<boolean> {
    const butterfly = await this.db
      .select()
      .from(exhibitionButterflies)
      .where(and(eq(exhibitionButterflies.userId, userId), eq(exhibitionButterflies.id, exhibitionButterflyId)));
    
    if (butterfly.length === 0) return false;
    
    // Check if 72 hours have passed
    const now = new Date();
    const placedAt = new Date(butterfly[0].placedAt);
    const hoursElapsed = (now.getTime() - placedAt.getTime()) / (1000 * 60 * 60);
    
    return hoursElapsed >= 72;
  }

  async getTimeUntilSellable(userId: number, exhibitionButterflyId: number): Promise<number> {
    const butterfly = await this.db
      .select()
      .from(exhibitionButterflies)
      .where(and(eq(exhibitionButterflies.userId, userId), eq(exhibitionButterflies.id, exhibitionButterflyId)));
    
    if (butterfly.length === 0) return 0;
    
    const now = new Date();
    const placedAt = new Date(butterfly[0].placedAt);
    const hoursElapsed = (now.getTime() - placedAt.getTime()) / (1000 * 60 * 60);
    
    return Math.max(0, 72 - hoursElapsed);
  }

  async getUserFrameLikes(userId: number): Promise<any[]> {
    const result = await this.db
      .select()
      .from(exhibitionFrameLikes)
      .where(eq(exhibitionFrameLikes.frameOwnerId, userId));
    
    return result;
  }

  async sellExhibitionButterfly(userId: number, exhibitionButterflyId: number): Promise<{ success: boolean; message?: string; creditsEarned?: number }> {
    const canSell = await this.canSellButterfly(userId, exhibitionButterflyId);
    if (!canSell) {
      return { success: false, message: 'Butterfly not ready for sale yet' };
    }

    const butterfly = await this.db
      .select()
      .from(exhibitionButterflies)
      .where(and(eq(exhibitionButterflies.userId, userId), eq(exhibitionButterflies.id, exhibitionButterflyId)));
    
    if (butterfly.length === 0) {
      return { success: false, message: 'Butterfly not found' };
    }

    // Calculate credits based on rarity
    const rarityValues = { common: 10, uncommon: 25, rare: 50, 'super-rare': 100, epic: 200, legendary: 500, mythical: 1000 };
    const creditsEarned = rarityValues[butterfly[0].butterflyRarity as keyof typeof rarityValues] || 10;

    // Remove butterfly
    await this.db
      .delete(exhibitionButterflies)
      .where(and(eq(exhibitionButterflies.userId, userId), eq(exhibitionButterflies.id, exhibitionButterflyId)));

    // Add credits
    const user = await this.getUser(userId);
    if (user) {
      await this.updateUserCredits(userId, user.credits + creditsEarned);
    }

    return { success: true, creditsEarned };
  }

  async processPassiveIncome(userId: number): Promise<{ success: boolean; creditsEarned?: number }> {
    // Get all exhibition butterflies for this user
    const butterflies = await this.getExhibitionButterflies(userId);
    let totalCredits = 0;
    
    for (const butterfly of butterflies) {
      // Calculate passive income based on rarity (per hour)
      const rarityIncomePerHour = { common: 1, uncommon: 2, rare: 5, 'super-rare': 10, epic: 20, legendary: 50, mythical: 100 };
      const incomePerHour = rarityIncomePerHour[butterfly.butterflyRarity as keyof typeof rarityIncomePerHour] || 1;
      
      // For now, award 1 hour of income
      totalCredits += incomePerHour;
      
      // Log passive income
      await this.db.insert(passiveIncomeLog).values({
        userId,
        amount: incomePerHour,
        sourceType: 'exhibition',
        sourceDetails: `Frame ${butterfly.frameId}, Slot ${butterfly.slotIndex}: ${butterfly.butterflyName}`
      });
    }
    
    if (totalCredits > 0) {
      const user = await this.getUser(userId);
      if (user) {
        await this.updateUserCredits(userId, user.credits + totalCredits);
      }
    }
    
    return { success: true, creditsEarned: totalCredits };
  }

  async updateUserActivity(userId: number): Promise<void> {
    // Update user's last activity timestamp if needed
    // For now, just a placeholder
    console.log(`User ${userId} activity updated`);
  }

  async getAllUsersWithStatus(): Promise<User[]> {
    const result = await this.db.select().from(users);
    return result;
  }

  async likeExhibitionFrame(userId: number, frameOwnerId: number, frameId: number): Promise<{ success: boolean; message?: string }> {
    // Check if already liked
    const existing = await this.db
      .select()
      .from(exhibitionFrameLikes)
      .where(and(
        eq(exhibitionFrameLikes.likerId, userId),
        eq(exhibitionFrameLikes.frameOwnerId, frameOwnerId),
        eq(exhibitionFrameLikes.frameId, frameId)
      ));

    if (existing.length > 0) {
      return { success: false, message: 'Already liked' };
    }

    await this.db.insert(exhibitionFrameLikes).values({
      frameOwnerId,
      likerId: userId,
      frameId
    });

    return { success: true };
  }

  async unlikeExhibitionFrame(userId: number, frameOwnerId: number, frameId: number): Promise<{ success: boolean; message?: string }> {
    const result = await this.db
      .delete(exhibitionFrameLikes)
      .where(and(
        eq(exhibitionFrameLikes.likerId, userId),
        eq(exhibitionFrameLikes.frameOwnerId, frameOwnerId),
        eq(exhibitionFrameLikes.frameId, frameId)
      ));

    return { success: true };
  }

  async getForeignExhibitionButterflies(frameOwnerId: number): Promise<any[]> {
    const result = await this.db
      .select()
      .from(exhibitionButterflies)
      .where(eq(exhibitionButterflies.userId, frameOwnerId));
    
    return result;
  }

  // Bouquet timing methods for butterfly spawner
  async updateBouquetNextSpawnTime(userId: number, fieldIndex: number, nextSpawnAt: Date): Promise<void> {
    await this.db
      .update(placedBouquets)
      .set({ nextSpawnAt })
      .where(and(eq(placedBouquets.userId, userId), eq(placedBouquets.fieldIndex, fieldIndex)));
  }
}

export const postgresStorage = new PostgresStorage();