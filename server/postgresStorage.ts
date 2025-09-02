import { 
  users, 
  seeds, 
  userSeeds, 
  marketListings,
  plantedFields,
  userFlowers,
  flowers,
  bouquets,
  userBouquets,
  bouquetRecipes,
  placedBouquets,
  userButterflies,
  butterflies,
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
import { eq, ilike, and, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { generateRandomFlower, getGrowthTime, getRandomRarity, type RarityTier } from "@shared/rarity";
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
    
    if (!randomFlower) {
      return { success: false, message: 'Failed to generate flower' };
    }

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
    // Check if user already has this flower
    const existingFlower = await this.db
      .select()
      .from(userFlowers)
      .where(and(eq(userFlowers.userId, userId), eq(userFlowers.flowerId, flowerId)))
      .limit(1);

    if (existingFlower.length > 0) {
      // Increase quantity of existing flower
      await this.db
        .update(userFlowers)
        .set({ quantity: existingFlower[0].quantity + 1 })
        .where(eq(userFlowers.id, existingFlower[0].id));
      
      console.log(`💾 Increased ${flowerName} quantity to ${existingFlower[0].quantity + 1} for user ${userId}`);
    } else {
      // Create new flower entry
      await this.db.insert(userFlowers).values({
        userId,
        flowerId,
        rarity: this.getRarityInteger(flowerRarity),
        flowerName,
        flowerRarity,
        flowerImageUrl,
        quantity: 1
      });
      console.log(`💾 Added new flower ${flowerName} for user ${userId} to PostgreSQL`);
    }
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
      console.log(`🔍 Creating bouquet for user ${userId} with flowers:`, data);
      
      // Get all flowers for this user
      const allUserFlowers = await this.db
        .select()
        .from(userFlowers)
        .where(eq(userFlowers.userId, userId));

      console.log(`🔍 Available flowers:`, allUserFlowers.map(f => ({ id: f.id, flowerId: f.flowerId, name: f.flowerName })));

      // Find the specific flowers by flowerId (not by id)
      const flower1 = allUserFlowers.find((f: any) => f.flowerId === data.flowerId1);
      const flower2 = allUserFlowers.find((f: any) => f.flowerId === data.flowerId2);
      const flower3 = allUserFlowers.find((f: any) => f.flowerId === data.flowerId3);

      console.log(`🔍 Found flowers:`, { 
        flower1: flower1 ? { id: flower1.id, name: flower1.flowerName } : 'NOT FOUND',
        flower2: flower2 ? { id: flower2.id, name: flower2.flowerName } : 'NOT FOUND',
        flower3: flower3 ? { id: flower3.id, name: flower3.flowerName } : 'NOT FOUND'
      });

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

      // Remove flowers from inventory (decrease quantity or delete if quantity becomes 0)
      
      // Handle flower1
      if (flower1.quantity > 1) {
        console.log(`🌸 Reducing flower1 (${flower1.flowerName}) quantity from ${flower1.quantity} to ${flower1.quantity - 1}`);
        await this.db
          .update(userFlowers)
          .set({ quantity: flower1.quantity - 1 })
          .where(eq(userFlowers.id, flower1.id));
      } else {
        console.log(`🌸 Deleting flower1 (${flower1.flowerName}) completely`);
        await this.db.delete(userFlowers).where(eq(userFlowers.id, flower1.id));
      }
      
      // Handle flower2
      if (flower2.quantity > 1) {
        console.log(`🌸 Reducing flower2 (${flower2.flowerName}) quantity from ${flower2.quantity} to ${flower2.quantity - 1}`);
        await this.db
          .update(userFlowers)
          .set({ quantity: flower2.quantity - 1 })
          .where(eq(userFlowers.id, flower2.id));
      } else {
        console.log(`🌸 Deleting flower2 (${flower2.flowerName}) completely`);
        await this.db.delete(userFlowers).where(eq(userFlowers.id, flower2.id));
      }
      
      // Handle flower3
      if (flower3.quantity > 1) {
        console.log(`🌸 Reducing flower3 (${flower3.flowerName}) quantity from ${flower3.quantity} to ${flower3.quantity - 1}`);
        await this.db
          .update(userFlowers)
          .set({ quantity: flower3.quantity - 1 })
          .where(eq(userFlowers.id, flower3.id));
      } else {
        console.log(`🌸 Deleting flower3 (${flower3.flowerName}) completely`);
        await this.db.delete(userFlowers).where(eq(userFlowers.id, flower3.id));
      }

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
    try {
      // Check if user has the bouquet
      const userBouquet = await this.db
        .select()
        .from(userBouquets)
        .where(and(eq(userBouquets.userId, userId), eq(userBouquets.bouquetId, data.bouquetId)))
        .limit(1);

      if (userBouquet.length === 0) {
        return { success: false, message: 'Bouquet nicht gefunden' };
      }

      // Check if field is already occupied
      const existingField = await this.db
        .select()
        .from(placedBouquets)
        .where(and(eq(placedBouquets.userId, userId), eq(placedBouquets.fieldIndex, data.fieldIndex)))
        .limit(1);

      if (existingField.length > 0) {
        return { success: false, message: 'Feld ist bereits belegt' };
      }

      // Calculate spawn timing (4 butterflies over 21 minutes)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 21 * 60 * 1000); // 21 minutes
      const nextSpawnAt = new Date(now.getTime() + 5.25 * 60 * 1000); // First spawn in 5.25 minutes

      // Place bouquet
      await this.db.insert(placedBouquets).values({
        userId,
        bouquetId: data.bouquetId,
        fieldIndex: data.fieldIndex,
        placedAt: now,
        expiresAt: expiresAt,
        nextSpawnAt: nextSpawnAt,
        currentSpawnSlot: 1
      });

      // Remove bouquet from user inventory
      if (userBouquet[0].quantity > 1) {
        await this.db
          .update(userBouquets)
          .set({ quantity: userBouquet[0].quantity - 1 })
          .where(and(eq(userBouquets.userId, userId), eq(userBouquets.bouquetId, data.bouquetId)));
      } else {
        await this.db
          .delete(userBouquets)
          .where(and(eq(userBouquets.userId, userId), eq(userBouquets.bouquetId, data.bouquetId)));
      }

      console.log(`💐 Placed bouquet ${data.bouquetId} on field ${data.fieldIndex} for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to place bouquet:', error);
      return { success: false, message: 'Fehler beim Platzieren des Bouquets' };
    }
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

  private mapRarityToNumber(rarity: string): number {
    const rarityMap: { [key: string]: number } = {
      'common': 1,
      'uncommon': 2, 
      'rare': 3,
      'super-rare': 4,
      'epic': 5,
      'legendary': 6,
      'mythical': 7
    };
    return rarityMap[rarity] || 1; // Default to common if unknown
  }

  async collectFieldButterfly(userId: number, fieldIndex: number): Promise<{ success: boolean; butterfly?: UserButterfly }> {
    console.log(`🦋 Collecting butterfly for user ${userId} on field ${fieldIndex}`);
    
    const fieldButterfly = await this.db
      .select()
      .from(fieldButterflies)
      .where(and(eq(fieldButterflies.userId, userId), eq(fieldButterflies.fieldIndex, fieldIndex)));

    if (fieldButterfly.length === 0) {
      console.log(`🦋 No butterfly found on field ${fieldIndex} for user ${userId}`);
      return { success: false };
    }

    console.log(`🦋 Found butterfly: ${fieldButterfly[0].butterflyName} (ID: ${fieldButterfly[0].butterflyId})`);

    // Check if user already has this butterfly type
    const existing = await this.db
      .select()
      .from(userButterflies)
      .where(and(eq(userButterflies.userId, userId), eq(userButterflies.butterflyId, fieldButterfly[0].butterflyId)));

    let result: UserButterfly;
    
    try {
      if (existing.length > 0) {
        // Increase quantity
        console.log(`🦋 Increasing quantity from ${existing[0].quantity} to ${existing[0].quantity + 1}`);
        const updated = await this.db
          .update(userButterflies)
          .set({ quantity: existing[0].quantity + 1 })
          .where(and(eq(userButterflies.userId, userId), eq(userButterflies.butterflyId, fieldButterfly[0].butterflyId)))
          .returning();
        result = updated[0];
      } else {
        // Add new butterfly to inventory  
        console.log(`🦋 Adding new butterfly to inventory`);
        const newButterfly = await this.db.insert(userButterflies).values({
          userId,
          butterflyId: fieldButterfly[0].butterflyId,
          butterflyName: fieldButterfly[0].butterflyName,
          butterflyRarity: fieldButterfly[0].butterflyRarity,
          butterflyImageUrl: fieldButterfly[0].butterflyImageUrl,
          quantity: 1
        }).returning();
        result = newButterfly[0];
      }
    } catch (error: any) {
      // Handle unique constraint violation (race condition)
      if (error.code === '23505') {
        console.log(`🦋 Race condition detected, retrying with quantity update`);
        const existingRetry = await this.db
          .select()
          .from(userButterflies)
          .where(and(eq(userButterflies.userId, userId), eq(userButterflies.butterflyId, fieldButterfly[0].butterflyId)));
        
        const updated = await this.db
          .update(userButterflies)
          .set({ quantity: existingRetry[0].quantity + 1 })
          .where(and(eq(userButterflies.userId, userId), eq(userButterflies.butterflyId, fieldButterfly[0].butterflyId)))
          .returning();
        result = updated[0];
      } else {
        throw error;
      }
    }

    // Remove from field
    console.log(`🦋 Removing butterfly from field ${fieldIndex}`);
    await this.db
      .delete(fieldButterflies)
      .where(and(eq(fieldButterflies.userId, userId), eq(fieldButterflies.fieldIndex, fieldIndex)));

    console.log(`🦋 Successfully collected butterfly: ${result.butterflyName}`);
    return { success: true, butterfly: result };
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
    const user = await this.getUser(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Get current frame count to determine next frame number
    const existingFrames = await this.getExhibitionFrames(userId);
    const frameNumber = existingFrames.length + 1;
    
    // Calculate cost - first frame is free, subsequent frames increase exponentially
    let cost = 0;
    if (frameNumber > 1) {
      // First frame is free, subsequent frames cost credits with exponential scaling
      cost = Math.round(500 * Math.pow(1.2, frameNumber - 2));
    }

    if (user.credits < cost) {
      return { success: false, message: 'Insufficient credits' };
    }

    // Create frame
    const newFrame = await this.db.insert(exhibitionFrames).values({
      userId,
      frameNumber
    }).returning();

    // Deduct credits (only if cost > 0)
    let updatedUser = user;
    if (cost > 0) {
      updatedUser = await this.updateUserCredits(userId, user.credits - cost);
    }

    console.log(`🖼️ User ${userId} purchased frame ${frameNumber} for ${cost} credits`);

    return { 
      success: true, 
      newCredits: updatedUser?.credits || user.credits,
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
    try {
      // Find expired bouquet on this field with bouquet details
      const expiredBouquet = await this.db
        .select({
          id: placedBouquets.id,
          bouquetId: placedBouquets.bouquetId,
          bouquetRarity: bouquets.rarity
        })
        .from(placedBouquets)
        .leftJoin(bouquets, eq(placedBouquets.bouquetId, bouquets.id))
        .where(and(
          eq(placedBouquets.userId, userId), 
          eq(placedBouquets.fieldIndex, fieldIndex),
          lt(placedBouquets.expiresAt, new Date()) // Must be expired
        ))
        .limit(1);

      if (expiredBouquet.length === 0) {
        return { success: false };
      }

      const bouquetRarity = expiredBouquet[0].bouquetRarity as RarityTier || 'common';

      // Generate seed drop based on bouquet rarity (1-3 seeds, more for better bouquets)
      const seedQuantity = this.getBouquetSeedQuantity(bouquetRarity);
      const seedRarity = this.getBouquetInfluencedSeedRarity(bouquetRarity);

      // Get a random seed ID of this rarity
      const availableSeeds = await this.db
        .select()
        .from(seeds)
        .where(eq(seeds.rarity, seedRarity));

      if (availableSeeds.length === 0) {
        return { success: false };
      }

      const randomSeed = availableSeeds[Math.floor(Math.random() * availableSeeds.length)];

      // Add seeds to user inventory
      await this.addSeedToInventoryById(userId, randomSeed.id, seedQuantity);

      // Remove the expired bouquet
      await this.db
        .delete(placedBouquets)
        .where(and(
          eq(placedBouquets.userId, userId),
          eq(placedBouquets.fieldIndex, fieldIndex)
        ));

      console.log(`💧 Collected expired ${bouquetRarity} bouquet on field ${fieldIndex} for user ${userId}, got ${seedQuantity}x ${seedRarity} seeds`);

      return { 
        success: true, 
        seedDrop: { 
          rarity: seedRarity, 
          quantity: seedQuantity 
        } 
      };
    } catch (error) {
      console.error('Failed to collect expired bouquet:', error);
      return { success: false };
    }
  }

  // Helper method to determine seed quantity based on bouquet rarity
  private getBouquetSeedQuantity(bouquetRarity: RarityTier): number {
    const rarityMultipliers = {
      'common': 1,
      'uncommon': 1.2,
      'rare': 1.4,
      'super-rare': 1.6,
      'epic': 1.8,
      'legendary': 2.0,
      'mythical': 2.5
    };

    const baseSeeds = Math.floor(Math.random() * 3) + 1; // 1-3 base seeds
    const multiplier = rarityMultipliers[bouquetRarity] || 1;
    
    return Math.min(5, Math.floor(baseSeeds * multiplier)); // Max 5 seeds
  }

  // Helper method to get rarity-influenced seed drop based on bouquet quality
  private getBouquetInfluencedSeedRarity(bouquetRarity: RarityTier): RarityTier {
    // Create modified weights based on bouquet rarity
    const baseWeights = {
      'common': 45,
      'uncommon': 30,
      'rare': 15,
      'super-rare': 7,
      'epic': 2.5,
      'legendary': 0.4,
      'mythical': 0.1
    };

    // Boost better rarities based on bouquet quality
    const rarityBoostFactors = {
      'common': { 'rare': 1, 'super-rare': 1, 'epic': 1, 'legendary': 1, 'mythical': 1 },
      'uncommon': { 'rare': 1.5, 'super-rare': 1.2, 'epic': 1.1, 'legendary': 1, 'mythical': 1 },
      'rare': { 'rare': 2, 'super-rare': 1.8, 'epic': 1.5, 'legendary': 1.2, 'mythical': 1 },
      'super-rare': { 'rare': 2.5, 'super-rare': 2.2, 'epic': 2, 'legendary': 1.5, 'mythical': 1.2 },
      'epic': { 'rare': 3, 'super-rare': 2.8, 'epic': 2.5, 'legendary': 2, 'mythical': 1.5 },
      'legendary': { 'rare': 4, 'super-rare': 3.5, 'epic': 3, 'legendary': 2.5, 'mythical': 2 },
      'mythical': { 'rare': 5, 'super-rare': 4.5, 'epic': 4, 'legendary': 3.5, 'mythical': 3 }
    };

    const boostFactors = rarityBoostFactors[bouquetRarity] || rarityBoostFactors['common'];

    // Apply boosts to weights
    const modifiedWeights = {
      'common': baseWeights.common * 0.8, // Slightly reduce common chance for all bouquets
      'uncommon': baseWeights.uncommon * 0.9, // Slightly reduce uncommon chance
      'rare': baseWeights.rare * (boostFactors['rare'] || 1),
      'super-rare': baseWeights['super-rare'] * (boostFactors['super-rare'] || 1),
      'epic': baseWeights.epic * (boostFactors['epic'] || 1),
      'legendary': baseWeights.legendary * (boostFactors['legendary'] || 1),
      'mythical': baseWeights.mythical * (boostFactors['mythical'] || 1)
    };

    // Calculate total weight
    const totalWeight = Object.values(modifiedWeights).reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * totalWeight;

    // Select rarity based on modified weights
    let currentWeight = 0;
    for (const [rarity, weight] of Object.entries(modifiedWeights)) {
      currentWeight += weight;
      if (random <= currentWeight) {
        return rarity as RarityTier;
      }
    }

    return 'common'; // Fallback
  }

  async spawnButterflyOnField(userId: number, bouquetId: number, bouquetRarity: RarityTier): Promise<{ success: boolean; fieldButterfly?: FieldButterfly; fieldIndex?: number }> {
    try {
      // Find the placed bouquet to get the field index
      const placedBouquet = await this.db
        .select()
        .from(placedBouquets)
        .where(and(eq(placedBouquets.userId, userId), eq(placedBouquets.bouquetId, bouquetId)))
        .limit(1);

      if (placedBouquet.length === 0) {
        return { success: false };
      }

      // Get all occupied fields for this user
      const [userPlantedFields, userPlacedBouquets, userExistingButterflies] = await Promise.all([
        this.db.select({ fieldIndex: plantedFields.fieldIndex }).from(plantedFields).where(eq(plantedFields.userId, userId)),
        this.db.select({ fieldIndex: placedBouquets.fieldIndex }).from(placedBouquets).where(eq(placedBouquets.userId, userId)),
        this.db.select({ fieldIndex: fieldButterflies.fieldIndex }).from(fieldButterflies).where(eq(fieldButterflies.userId, userId))
      ]);

      // Collect all occupied field indices
      const occupiedFields = new Set([
        ...userPlantedFields.map((f: { fieldIndex: number }) => f.fieldIndex),
        ...userPlacedBouquets.map((f: { fieldIndex: number }) => f.fieldIndex),
        ...userExistingButterflies.map((f: { fieldIndex: number }) => f.fieldIndex)
      ]);

      // Get adjacent fields around the bouquet (4x4 grid: 0-15)
      const bouquetFieldIndex = placedBouquet[0].fieldIndex;
      const gridWidth = 4;
      
      // Calculate adjacent field indices (8 surrounding fields)
      const adjacentFields = [];
      const row = Math.floor(bouquetFieldIndex / gridWidth);
      const col = bouquetFieldIndex % gridWidth;
      
      for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
        for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
          if (deltaRow === 0 && deltaCol === 0) continue; // Skip the bouquet field itself
          
          const newRow = row + deltaRow;
          const newCol = col + deltaCol;
          
          // Check bounds
          if (newRow >= 0 && newRow < gridWidth && newCol >= 0 && newCol < gridWidth) {
            const adjacentFieldIndex = newRow * gridWidth + newCol;
            adjacentFields.push(adjacentFieldIndex);
          }
        }
      }

      // Find available adjacent fields (not occupied)
      const availableAdjacentFields = adjacentFields.filter(fieldIndex => !occupiedFields.has(fieldIndex));

      if (availableAdjacentFields.length === 0) {
        console.log(`🦋 No available adjacent fields for butterfly spawn around bouquet field ${bouquetFieldIndex} for user ${userId}`);
        return { success: false };
      }

      // Select random available adjacent field
      const fieldIndex = availableAdjacentFields[Math.floor(Math.random() * availableAdjacentFields.length)];

      // Generate random butterfly based on bouquet rarity
      const { generateRandomButterfly } = await import('./bouquet');
      const butterflyData = await generateRandomButterfly(bouquetRarity);

      // Create field butterfly with 24-hour despawn time
      const spawnTime = new Date();
      const despawnTime = new Date(spawnTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours later
      
      const newFieldButterfly = await this.db.insert(fieldButterflies).values({
        userId,
        fieldIndex,
        butterflyId: butterflyData.id,
        butterflyName: butterflyData.name,
        butterflyRarity: bouquetRarity,
        butterflyImageUrl: butterflyData.imageUrl,
        bouquetId: bouquetId,
        spawnedAt: spawnTime,
        despawnAt: despawnTime
      }).returning();

      console.log(`🦋 Spawned butterfly "${butterflyData.name}" on field ${fieldIndex} for user ${userId}`);
      console.log(`🔍 DEBUG: Bouquet on field ${bouquetFieldIndex}, adjacent fields: [${adjacentFields.join(', ')}], available: [${availableAdjacentFields.join(', ')}]`);
      
      return { 
        success: true, 
        fieldButterfly: newFieldButterfly[0],
        fieldIndex: fieldIndex
      };
      
    } catch (error) {
      console.error('Failed to spawn butterfly:', error);
      return { success: false };
    }
  }

  // Additional exhibition methods (from routes usage)
  async canSellButterfly(userId: number, exhibitionButterflyId: number): Promise<boolean> {
    const timeRemaining = await this.getTimeUntilSellable(userId, exhibitionButterflyId);
    return timeRemaining === 0;
  }

  async getTimeUntilSellable(userId: number, exhibitionButterflyId: number): Promise<number> {
    const butterfly = await this.db
      .select()
      .from(exhibitionButterflies)
      .where(and(eq(exhibitionButterflies.userId, userId), eq(exhibitionButterflies.id, exhibitionButterflyId)));
    
    if (butterfly.length === 0) return 0;
    
    // Get likes count for this frame
    const allFrameLikes = await this.getUserFrameLikes(userId);
    const frameWithLikes = allFrameLikes.find(f => f.frameId === butterfly[0].frameId);
    const likesCount = frameWithLikes ? frameWithLikes.totalLikes : 0;
    
    const now = new Date();
    const placedAt = new Date(butterfly[0].placedAt);
    const msElapsed = now.getTime() - placedAt.getTime();
    
    // Base time: 72 hours in milliseconds
    const baseTimeMs = 72 * 60 * 60 * 1000; // = 259,200,000 ms
    
    // Likes reduction: 1 minute per like in milliseconds  
    const likesReductionMs = likesCount * 60 * 1000;
    
    // Required time to sell = 72 hours - (likes * 1 minute)
    const requiredTimeMs = Math.max(0, baseTimeMs - likesReductionMs);
    
    // Time remaining = required time - elapsed time
    const remainingMs = Math.max(0, requiredTimeMs - msElapsed);
    
    console.log(`🕒 DEBUG Countdown: placed=${placedAt.toISOString()}, elapsed=${msElapsed}ms, required=${requiredTimeMs}ms, remaining=${remainingMs}ms, likes=${likesCount}`);
    
    return remainingMs;
  }

  async getUserFrameLikes(userId: number): Promise<any[]> {
    // Simple approach: get all likes and group manually
    const allLikes = await this.db
      .select()
      .from(exhibitionFrameLikes)
      .where(eq(exhibitionFrameLikes.frameOwnerId, userId));
    
    // Group by frameId and count
    const frameGroups = allLikes.reduce((groups: any, like: any) => {
      const frameId = like.frameId;
      if (!groups[frameId]) {
        groups[frameId] = { frameId, totalLikes: 0 };
      }
      groups[frameId].totalLikes++;
      return groups;
    }, {});
    
    return Object.values(frameGroups);
  }

  async getFrameLikesForUser(likerId: number, frameOwnerId: number): Promise<any[]> {
    // Get all butterflies (frames) owned by frameOwnerId
    const ownerButterflies = await this.db
      .select()
      .from(exhibitionButterflies)
      .where(eq(exhibitionButterflies.userId, frameOwnerId));

    // Get all likes for the frame owner's frames
    const allLikes = await this.db
      .select()
      .from(exhibitionFrameLikes)
      .where(eq(exhibitionFrameLikes.frameOwnerId, frameOwnerId));
    
    // Get unique frame IDs
    const uniqueFrameIds = [...new Set(ownerButterflies.map(b => b.frameId))];
    
    // Create a result for each frame
    const result: any[] = [];
    
    for (const frameId of uniqueFrameIds) {
      const frameLikes = allLikes.filter(like => like.frameId === frameId);
      
      result.push({
        frameId,
        totalLikes: frameLikes.length,
        isLiked: frameLikes.some(like => like.likerId === likerId)
      });
    }
    
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
    if (butterflies.length === 0) {
      return { success: true, creditsEarned: 0 };
    }
    
    // Get user's last passive income time
    const user = await this.getUser(userId);
    if (!user) {
      return { success: false };
    }
    
    const now = new Date();
    const lastIncomeTime = user.lastPassiveIncomeAt || new Date(now.getTime() - 60 * 60 * 1000); // Default to 1 hour ago
    const minutesElapsed = Math.floor((now.getTime() - lastIncomeTime.getTime()) / (1000 * 60));
    
    // Don't process if less than 1 minute has passed
    if (minutesElapsed < 1) {
      return { success: true, creditsEarned: 0 };
    }
    
    let totalCredits = 0;
    
    for (const butterfly of butterflies) {
      // Calculate passive income based on rarity (per hour)
      const rarityIncomePerHour = { common: 1, uncommon: 2, rare: 5, 'super-rare': 10, epic: 20, legendary: 50, mythical: 100 };
      const incomePerHour = rarityIncomePerHour[butterfly.butterflyRarity as keyof typeof rarityIncomePerHour] || 1;
      
      // Calculate income proportional to minutes elapsed (minutengenau)
      const incomePerMinute = incomePerHour / 60;
      const earnedCredits = Math.floor(incomePerMinute * minutesElapsed);
      totalCredits += earnedCredits;
      
      // Log passive income
      await this.db.insert(passiveIncomeLog).values({
        userId,
        amount: incomePerHour,
        sourceType: 'exhibition',
        sourceDetails: `Frame ${butterfly.frameId}, Slot ${butterfly.slotIndex}: ${butterfly.butterflyName}`
      });
    }
    
    if (totalCredits > 0) {
      // Update user credits and last passive income time
      await this.updateUserCredits(userId, user.credits + totalCredits);
      await this.db.update(users)
        .set({ lastPassiveIncomeAt: now })
        .where(eq(users.id, userId));
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
    // Can't like your own frame
    if (userId === frameOwnerId) {
      return { success: false, message: 'Cannot like your own frame' };
    }

    // Check if frame is full (6 butterflies)
    const frameButterflies = await this.db
      .select()
      .from(exhibitionButterflies)
      .where(and(eq(exhibitionButterflies.userId, frameOwnerId), eq(exhibitionButterflies.frameId, frameId)));
    
    if (frameButterflies.length < 6) {
      return { success: false, message: 'Only full frames can be liked' };
    }

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

  async getForeignExhibitionFrames(frameOwnerId: number): Promise<any[]> {
    const result = await this.db
      .select()
      .from(exhibitionFrames)
      .where(eq(exhibitionFrames.userId, frameOwnerId));
    
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