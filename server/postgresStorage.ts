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
  userFish,
  userCaterpillars,
  fieldButterflies,
  fieldCaterpillars,
  fedCaterpillars as fedCaterpillarsTable,
  userVipButterflies,
  exhibitionFrames,
  exhibitionButterflies,
  exhibitionVipButterflies,
  passiveIncomeLog,
  exhibitionFrameLikes,
  weeklyChallenges,
  challengeDonations,
  challengeRewards,
  unlockedFields,
  sunSpawns,
  pondFeedingProgressTable,
  fieldFish,
  aquariumTanks,
  aquariumFish,
  mariePosaTracker,
  type User, 
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
  type UserFish,
  type UserCaterpillar,
  type FieldButterfly,
  type UserVipButterfly,
  type ExhibitionFrame,
  type ExhibitionButterfly,
  type ExhibitionVipButterfly,
  type PassiveIncomeLog,
  type CreateBouquetRequest,
  type PlaceBouquetRequest,
  type UnlockedField,
  type UnlockFieldRequest,
  type WeeklyChallenge,
  type ChallengeDonation,
  type ChallengeReward,
  type DonateChallengeFlowerRequest,
  type AquariumTank,
  type AquariumFish,
  insertUserSchema
} from "@shared/schema";
import { eq, ilike, and, lt, gt, inArray, sql, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { generateRandomFlower, getGrowthTime, getRandomRarity, type RarityTier } from "@shared/rarity";
import { generateBouquetName, calculateAverageRarity, generateRandomButterfly, getBouquetSeedDrop } from './bouquet';
import { initializeCreatureSystems, generateRandomFish, generateRandomCaterpillar, getFishRarity, getCaterpillarRarity, getRandomRarity as getRandomCreatureRarity } from './creatures';

/**
 * PostgreSQL-only Storage Implementation
 * Direct database operations without memory caching
 */
export class PostgresStorage {
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
    
    // Initialize starter fields for existing users
    this.initializeStarterFields();
    
    // Initialize creature systems (Fish and Caterpillars)
    this.initializeCreaturesSystems();
    
    // Start butterfly lifecycle service
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

  private async initializeStarterFields() {
    try {
      // Check if unlocked_fields table exists and initialize starter fields
      const allUsers = await this.db.select().from(users);
      
      for (const user of allUsers) {
        const existingUnlockedFields = await this.db
          .select()
          .from(unlockedFields)
          .where(eq(unlockedFields.userId, user.id));
        
        // If user has no unlocked fields, give them starter fields (0, 1, 10, 11)
        if (existingUnlockedFields.length === 0) {
          const starterFields = [0, 1, 10, 11]; // Field indices 0,1,10,11 = Field IDs 1,2,11,12
          
          for (const fieldIndex of starterFields) {
            await this.db.insert(unlockedFields).values({
              userId: user.id,
              fieldIndex,
              cost: 0, // Free starter fields
            });
          }
          
          console.log(`🌱 Initialized starter fields for user ${user.username} (ID: ${user.id})`);
        }
      }
    } catch (error) {
      console.error('Error initializing starter fields:', error);
      // This is OK if table doesn't exist yet
    }
  }

  private async initializeCreaturesSystems() {
    try {
      console.log('🌊 Initializing Fish and Caterpillar systems...');
      await initializeCreatureSystems();
      console.log('🌊 Creature systems initialization complete');
    } catch (error) {
      console.error('Failed to initialize creature systems:', error);
    }
  }

  async canSellCaterpillar(caterpillarId: number): Promise<{ canSell: boolean; timeRemainingMs: number }> {
    try {
      // Get caterpillar from user_caterpillars (regular caterpillars)
      const caterpillar = await this.db
        .select()
        .from(userCaterpillars)
        .where(eq(userCaterpillars.id, caterpillarId));
      
      if (caterpillar.length === 0) {
        return { canSell: false, timeRemainingMs: 0 };
      }
      
      // Regular caterpillars can be sold immediately (no waiting time)
      // Only field caterpillars from pond feeding would have waiting time
      return {
        canSell: true,
        timeRemainingMs: 0
      };
    } catch (error) {
      console.error('🐛 Error checking caterpillar sell status:', error);
      return { canSell: false, timeRemainingMs: 0 };
    }
  }

  async sellCaterpillar(userId: number, caterpillarId: number): Promise<{ success: boolean; message?: string; creditsEarned?: number }> {
    try {
      console.log(`🐛 Selling caterpillar ${caterpillarId} for user ${userId}`);
      
      // Check if caterpillar can be sold
      const sellStatus = await this.canSellCaterpillar(caterpillarId);
      if (!sellStatus.canSell) {
        return { success: false, message: 'Raupe kann noch nicht verkauft werden!' };
      }
      
      // Get caterpillar data
      const caterpillar = await this.db
        .select()
        .from(userCaterpillars)
        .where(and(
          eq(userCaterpillars.id, caterpillarId),
          eq(userCaterpillars.userId, userId)
        ));
      
      if (caterpillar.length === 0) {
        return { success: false, message: 'Raupe nicht gefunden!' };
      }
      
      const caterpillarData = caterpillar[0];
      
      // Calculate price (85% of butterfly prices)
      const price = this.getCaterpillarSellPrice(caterpillarData.caterpillarRarity);
      
      // Decrease quantity or remove if quantity reaches 0
      const newQuantity = caterpillarData.quantity - 1;
      
      if (newQuantity <= 0) {
        // Remove caterpillar completely
        await this.db
          .delete(userCaterpillars)
          .where(eq(userCaterpillars.id, caterpillarId));
      } else {
        // Decrease quantity
        await this.db
          .update(userCaterpillars)
          .set({ quantity: newQuantity })
          .where(eq(userCaterpillars.id, caterpillarId));
      }
      
      // Add credits to user
      const user = await this.db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (user.length > 0) {
        await this.db
          .update(users)
          .set({ credits: user[0].credits + price })
          .where(eq(users.id, userId));
      }
      
      console.log(`🐛 Caterpillar ${caterpillarData.caterpillarName} sold for ${price} credits`);
      return { success: true, creditsEarned: price };
    } catch (error) {
      console.error('🐛 Error selling caterpillar:', error);
      return { success: false, message: 'Datenbankfehler beim Verkauf' };
    }
  }

  // ==================== FISH MANAGEMENT ====================

  async addFishToUser(userId: number, fishId: number): Promise<UserFish | null> {
    try {
      const fishData = await generateRandomFish(getFishRarity(fishId));
      
      // Add to inventory with UPSERT to prevent race conditions
      try {
        // Try to insert first (most common case)
        const [newFish] = await this.db
          .insert(userFish)
          .values({
            userId,
            fishId: fishData.id,
            fishName: fishData.name,
            fishRarity: getFishRarity(fishData.id),
            fishImageUrl: fishData.imageUrl,
            quantity: 1
          })
          .returning();
        console.log(`🐟 Created new fish inventory entry: ${fishData.name}`);
        return newFish;
      } catch (error) {
        // If fish already exists (constraint violation), increment quantity
        const existingFish = await this.db
          .select()
          .from(userFish)
          .where(and(
            eq(userFish.userId, userId),
            eq(userFish.fishId, fishData.id)
          ));

        if (existingFish.length > 0) {
          const [updatedFish] = await this.db
            .update(userFish)
            .set({ quantity: existingFish[0].quantity + 1 })
            .where(eq(userFish.id, existingFish[0].id))
            .returning();
          console.log(`🐟 Incremented existing fish ${fishData.name} quantity to ${existingFish[0].quantity + 1}`);
          return updatedFish;
        } else {
          // Fallback: re-throw error if not a constraint violation
          throw error;
        }
      }
    } catch (error) {
      console.error('Failed to add fish to user:', error);
      return null;
    }
  }

  async getUserFish(userId: number): Promise<UserFish[]> {
    return await this.db
      .select()
      .from(userFish)
      .where(eq(userFish.userId, userId));
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async updateFishQuantity(fishEntryId: number, newQuantity: number): Promise<void> {
    await this.db
      .update(userFish)
      .set({ quantity: newQuantity })
      .where(eq(userFish.id, fishEntryId));
  }

  async deleteFishEntry(fishEntryId: number): Promise<void> {
    await this.db
      .delete(userFish)
      .where(eq(userFish.id, fishEntryId));
  }

  // ==================== CATERPILLAR MANAGEMENT ====================

  async addCaterpillarToUser(userId: number, caterpillarId: number): Promise<UserCaterpillar | null> {
    try {
      const caterpillarData = await generateRandomCaterpillar(getCaterpillarRarity(caterpillarId));
      
      // Check if user already has this caterpillar
      const existingCaterpillar = await this.db
        .select()
        .from(userCaterpillars)
        .where(and(
          eq(userCaterpillars.userId, userId),
          eq(userCaterpillars.caterpillarId, caterpillarData.id)
        ));
      
      if (existingCaterpillar.length > 0) {
        // Update quantity
        const [updatedCaterpillar] = await this.db
          .update(userCaterpillars)
          .set({ quantity: existingCaterpillar[0].quantity + 1 })
          .where(eq(userCaterpillars.id, existingCaterpillar[0].id))
          .returning();
        return updatedCaterpillar;
      } else {
        // Add new caterpillar
        const [newCaterpillar] = await this.db
          .insert(userCaterpillars)
          .values({
            userId,
            caterpillarId: caterpillarData.id,
            caterpillarName: caterpillarData.name,
            caterpillarRarity: getCaterpillarRarity(caterpillarData.id),
            caterpillarImageUrl: caterpillarData.imageUrl,
            quantity: 1
          })
          .returning();
        return newCaterpillar;
      }
    } catch (error) {
      console.error('Failed to add caterpillar to user:', error);
      return null;
    }
  }

  async getUserCaterpillars(userId: number): Promise<UserCaterpillar[]> {
    return await this.db
      .select()
      .from(userCaterpillars)
      .where(eq(userCaterpillars.userId, userId));
  }

  async removeCaterpillarFromUser(userId: number, caterpillarId: number, quantity: number = 1): Promise<boolean> {
    try {
      console.log(`🐛 Removing ${quantity} of caterpillar ${caterpillarId} from user ${userId}`);
      
      // Find the user's caterpillar
      const [userCaterpillar] = await this.db
        .select()
        .from(userCaterpillars)
        .where(and(
          eq(userCaterpillars.userId, userId),
          eq(userCaterpillars.caterpillarId, caterpillarId)
        ));

      if (!userCaterpillar) {
        console.log('🐛 Caterpillar not found in user inventory');
        return false;
      }

      if (userCaterpillar.quantity < quantity) {
        console.log('🐛 Not enough caterpillars in inventory');
        return false;
      }

      if (userCaterpillar.quantity === quantity) {
        // Remove the entire entry
        await this.db
          .delete(userCaterpillars)
          .where(eq(userCaterpillars.id, userCaterpillar.id));
        console.log('🐛 Removed entire caterpillar entry');
      } else {
        // Decrease quantity
        await this.db
          .update(userCaterpillars)
          .set({ quantity: userCaterpillar.quantity - quantity })
          .where(eq(userCaterpillars.id, userCaterpillar.id));
        console.log(`🐛 Decreased caterpillar quantity by ${quantity}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to remove caterpillar from user:', error);
      return false;
    }
  }

  async spawnRandomFish(userId: number, fieldIndex: number): Promise<{ fishName: string; fishRarity: string }> {
    try {
      console.log(`🐟 Spawning fish on field ${fieldIndex} for user ${userId}`);
      
      // Import creatures system for proper fish generation
      const { generateRandomFishByDistribution, getRandomRarity } = await import('./creatures');
      const { RARITY_NAMES_DE } = await import('../shared/rarity');
      
      // Get random rarity based on proper distribution
      const rarity = getRandomRarity();
      
      // Generate fish with correct rarity distribution
      const fishData = await generateRandomFishByDistribution(rarity);
      
      // Add fish to user inventory
      const existingFish = await this.db
        .select()
        .from(userFish)
        .where(and(
          eq(userFish.userId, userId),
          eq(userFish.fishId, fishData.id)
        ));

      if (existingFish.length > 0) {
        // Fish already exists, increment quantity
        await this.db
          .update(userFish)
          .set({ 
            quantity: existingFish[0].quantity + 1
          })
          .where(eq(userFish.id, existingFish[0].id));
        console.log(`🐟 Incremented existing fish ${fishData.name} quantity to ${existingFish[0].quantity + 1}`);
      } else {
        // New fish, create entry
        await this.db.insert(userFish).values({
          userId,
          fishId: fishData.id,
          fishName: fishData.name,
          fishRarity: rarity,
          fishImageUrl: fishData.imageUrl,
          quantity: 1
        });
        console.log(`🐟 Created new fish entry: ${fishData.name} (${rarity})`);
      }
      
      console.log(`🐟 Successfully spawned and saved ${fishData.name} (${rarity}) to user ${userId} inventory`);
      
      return {
        fishName: fishData.name,
        fishRarity: rarity
      };
    } catch (error) {
      console.error('Failed to spawn random fish:', error);
      return {
        fishName: 'Unknown Fish',
        fishRarity: 'common'
      };
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

  async createUser(user: typeof users.$inferInsert): Promise<User> {
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
    
    // Give starter fields to new user (field indices 0, 1, 10, 11)
    try {
      const starterFields = [0, 1, 10, 11]; // Field indices 0,1,10,11 = Field IDs 1,2,11,12
      
      for (const fieldIndex of starterFields) {
        await this.db.insert(unlockedFields).values({
          userId: newUser.id,
          fieldIndex,
          cost: 0, // Free starter fields
        });
      }
      
      console.log(`🌱 Gave starter fields to new user ${newUser.username}: Fields 1,2,11,12 (indices 0,1,10,11)`);
    } catch (error) {
      console.error(`Failed to give starter fields to user ${newUser.id}:`, error);
    }
    
    return newUser;
  }

  async updateUserCredits(id: number, amount: number): Promise<User | undefined> {
    // First get current credits
    const currentUser = await this.getUser(id);
    if (!currentUser) {
      throw new Error(`User ${id} not found`);
    }
    
    const newCredits = currentUser.credits + amount; // amount is a delta (change), not absolute
    console.log(`💰 Credit Update: User ${id} hatte ${currentUser.credits} Cr, ${amount >= 0 ? '+' : ''}${amount} Cr = ${newCredits} Cr`);
    
    const result = await this.db
      .update(users)
      .set({ credits: newCredits })
      .where(eq(users.id, id))
      .returning();
    return result[0] as User | undefined;
  }

  async updateUserSuns(id: number, amount: number): Promise<User | undefined> {
    // First get current suns
    const currentUser = await this.getUser(id);
    if (!currentUser) {
      throw new Error(`User ${id} not found`);
    }
    
    const currentSuns = currentUser.suns || 100; // Default to 100 if null
    const newSuns = currentSuns + amount; // amount is a delta (change), not absolute
    console.log(`☀️ Suns Update: User ${id} hatte ${currentSuns} ☀️, ${amount >= 0 ? '+' : ''}${amount} ☀️ = ${newSuns} ☀️`);
    
    const result = await this.db
      .update(users)
      .set({ suns: newSuns })
      .where(eq(users.id, id))
      .returning();
    return result[0] as User | undefined;
  }

  // Market methods
  async getMarketListings(): Promise<any[]> {
    // Get all market listings with their copied data - only one JOIN needed for seller username
    const listings = await this.db
      .select({
        id: marketListings.id,
        sellerId: marketListings.sellerId,
        itemType: marketListings.itemType,
        seedId: marketListings.seedId,
        caterpillarId: marketListings.caterpillarId,
        flowerId: marketListings.flowerId,
        butterflyId: marketListings.butterflyId,
        fishId: marketListings.fishId,
        quantity: marketListings.quantity,
        pricePerUnit: marketListings.pricePerUnit,
        totalPrice: marketListings.totalPrice,
        createdAt: marketListings.createdAt,
        sellerUsername: users.username,
        // Item data (directly stored in market_listings - no inventory JOINs needed!)
        seedName: marketListings.seedName,
        seedRarity: marketListings.seedRarity,
        caterpillarName: marketListings.caterpillarName,
        caterpillarRarity: marketListings.caterpillarRarity,
        caterpillarImageUrl: marketListings.caterpillarImageUrl,
        caterpillarIdOriginal: marketListings.caterpillarIdOriginal,
        flowerName: marketListings.flowerName,
        flowerRarity: marketListings.flowerRarity,
        flowerImageUrl: marketListings.flowerImageUrl,
        flowerIdOriginal: marketListings.flowerIdOriginal,
        butterflyName: marketListings.butterflyName,
        butterflyRarity: marketListings.butterflyRarity,
        butterflyImageUrl: marketListings.butterflyImageUrl,
        butterflyIdOriginal: marketListings.butterflyIdOriginal,
        fishName: marketListings.fishName,
        fishRarity: marketListings.fishRarity,
        fishImageUrl: marketListings.fishImageUrl,
        fishIdOriginal: marketListings.fishIdOriginal,
      })
      .from(marketListings)
      .leftJoin(users, eq(marketListings.sellerId, users.id))
      .where(eq(marketListings.isActive, true));
    
    return listings;
  }

  async createMarketListing(sellerId: number, data: CreateMarketListingRequest): Promise<any> {
    if (data.itemType === "seed") {
      // Check if user has enough seeds
      const userSeedsResult = await this.db
        .select()
        .from(userSeeds)
        .where(and(eq(userSeeds.userId, sellerId), eq(userSeeds.seedId, data.seedId!)));
      
      if (userSeedsResult.length === 0 || userSeedsResult[0].quantity < data.quantity) {
        throw new Error('Insufficient seeds');
      }

      // Create seed listing
      const listing = await this.db.insert(marketListings).values({
        sellerId,
        itemType: "seed",
        seedId: data.seedId!,
        caterpillarId: null,
        quantity: data.quantity,
        pricePerUnit: data.pricePerUnit,
        totalPrice: data.pricePerUnit * data.quantity
      }).returning();

      // Deduct seeds from seller
      await this.db
        .update(userSeeds)
        .set({ quantity: userSeedsResult[0].quantity - data.quantity })
        .where(and(eq(userSeeds.userId, sellerId), eq(userSeeds.seedId, data.seedId!)));

      return listing[0];
    } else if (data.itemType === "caterpillar") {
      // Check if user has enough caterpillars
      const caterpillarResult = await this.db
        .select()
        .from(userCaterpillars)
        .where(and(eq(userCaterpillars.userId, sellerId), eq(userCaterpillars.id, data.caterpillarId!)));
      
      if (caterpillarResult.length === 0) {
        throw new Error('Caterpillar not found');
      }

      if (caterpillarResult[0].quantity < data.quantity) {
        throw new Error('Insufficient caterpillars');
      }

      const caterpillar = caterpillarResult[0];

      // Create caterpillar listing with COPIED data (no more JOINs needed!)
      const listing = await this.db.insert(marketListings).values({
        sellerId,
        itemType: "caterpillar",
        quantity: data.quantity,
        pricePerUnit: data.pricePerUnit,
        totalPrice: data.pricePerUnit * data.quantity,
        // Copy caterpillar data directly into listing
        caterpillarId: data.caterpillarId!,
        caterpillarName: caterpillar.caterpillarName,
        caterpillarRarity: caterpillar.caterpillarRarity,
        caterpillarImageUrl: caterpillar.caterpillarImageUrl,
        caterpillarIdOriginal: caterpillar.caterpillarId, // Game ID
        // Set other item fields to null
        seedId: null,
        seedName: null,
        seedRarity: null,
        flowerId: null,
        flowerName: null,
        flowerRarity: null,
        flowerImageUrl: null,
        flowerIdOriginal: null,
        butterflyId: null,
        butterflyName: null,
        butterflyRarity: null,
        butterflyImageUrl: null,
        butterflyIdOriginal: null,
        fishId: null,
        fishName: null,
        fishRarity: null,
        fishImageUrl: null,
        fishIdOriginal: null,
      }).returning();

      // Update caterpillar quantity in seller's inventory
      const newQuantity = caterpillar.quantity - data.quantity;
      if (newQuantity <= 0) {
        // Remove caterpillar entirely if no more left
        await this.db
          .delete(userCaterpillars)
          .where(eq(userCaterpillars.id, data.caterpillarId!));
      } else {
        // Update quantity
        await this.db
          .update(userCaterpillars)
          .set({ quantity: newQuantity })
          .where(eq(userCaterpillars.id, data.caterpillarId!));
      }

      return listing[0];
    } else if (data.itemType === "flower") {
      // Check if user has the flower
      const flowerResult = await this.db
        .select()
        .from(userFlowers)
        .where(and(eq(userFlowers.userId, sellerId), eq(userFlowers.id, data.flowerId!)));
      
      if (flowerResult.length === 0) {
        throw new Error('Flower not found');
      }

      if (flowerResult[0].quantity < data.quantity) {
        throw new Error('Insufficient flowers');
      }

      const flower = flowerResult[0];

      // Create flower listing with COPIED data
      const listing = await this.db.insert(marketListings).values({
        sellerId,
        itemType: "flower",
        quantity: data.quantity,
        pricePerUnit: data.pricePerUnit,
        totalPrice: data.pricePerUnit * data.quantity,
        // Copy flower data directly into listing
        flowerId: data.flowerId!,
        flowerName: flower.flowerName,
        flowerRarity: flower.flowerRarity,
        flowerImageUrl: flower.flowerImageUrl,
        flowerIdOriginal: flower.flowerId, // Game ID
        // Set other item fields to null
        seedId: null,
        seedName: null,
        seedRarity: null,
        caterpillarId: null,
        caterpillarName: null,
        caterpillarRarity: null,
        caterpillarImageUrl: null,
        caterpillarIdOriginal: null,
        butterflyId: null,
        butterflyName: null,
        butterflyRarity: null,
        butterflyImageUrl: null,
        butterflyIdOriginal: null,
        fishId: null,
        fishName: null,
        fishRarity: null,
        fishImageUrl: null,
        fishIdOriginal: null,
      }).returning();

      // Update flower quantity
      const newQuantity = flower.quantity - data.quantity;
      if (newQuantity <= 0) {
        await this.db
          .delete(userFlowers)
          .where(eq(userFlowers.id, data.flowerId!));
      } else {
        await this.db
          .update(userFlowers)
          .set({ quantity: newQuantity })
          .where(eq(userFlowers.id, data.flowerId!));
      }

      return listing[0];
    } else if (data.itemType === "butterfly") {
      // Check if user has the butterfly (from inventory, not exhibition)
      const butterflyResult = await this.db
        .select()
        .from(userButterflies)
        .where(and(eq(userButterflies.userId, sellerId), eq(userButterflies.id, data.butterflyId!)));
      
      if (butterflyResult.length === 0) {
        throw new Error('Butterfly not found or in exhibition');
      }

      // Butterflies are unique items (quantity = 1)
      if (data.quantity !== 1) {
        throw new Error('Butterflies can only be sold one at a time');
      }

      const butterfly = butterflyResult[0];

      // Create butterfly listing with COPIED data
      const listing = await this.db.insert(marketListings).values({
        sellerId,
        itemType: "butterfly",
        quantity: 1,
        pricePerUnit: data.pricePerUnit,
        totalPrice: data.pricePerUnit,
        // Copy butterfly data directly into listing
        butterflyId: data.butterflyId!,
        butterflyName: butterfly.butterflyName,
        butterflyRarity: butterfly.butterflyRarity,
        butterflyImageUrl: butterfly.butterflyImageUrl,
        butterflyIdOriginal: butterfly.butterflyId, // Game ID
        // Set other item fields to null
        seedId: null,
        seedName: null,
        seedRarity: null,
        caterpillarId: null,
        caterpillarName: null,
        caterpillarRarity: null,
        caterpillarImageUrl: null,
        caterpillarIdOriginal: null,
        flowerId: null,
        flowerName: null,
        flowerRarity: null,
        flowerImageUrl: null,
        flowerIdOriginal: null,
        fishId: null,
        fishName: null,
        fishRarity: null,
        fishImageUrl: null,
        fishIdOriginal: null,
      }).returning();

      // Remove butterfly from seller's inventory
      await this.db
        .delete(userButterflies)
        .where(eq(userButterflies.id, data.butterflyId!));

      return listing[0];
    } else if (data.itemType === "fish") {
      // Check if user has the fish
      const fishResult = await this.db
        .select()
        .from(userFish)
        .where(and(eq(userFish.userId, sellerId), eq(userFish.id, data.fishId!)));
      
      if (fishResult.length === 0) {
        throw new Error('Fish not found');
      }

      if (fishResult[0].quantity < data.quantity) {
        throw new Error('Insufficient fish');
      }

      const fish = fishResult[0];

      // Create fish listing with COPIED data
      const listing = await this.db.insert(marketListings).values({
        sellerId,
        itemType: "fish",
        quantity: data.quantity,
        pricePerUnit: data.pricePerUnit,
        totalPrice: data.pricePerUnit * data.quantity,
        // Copy fish data directly into listing
        fishId: data.fishId!,
        fishName: fish.fishName,
        fishRarity: fish.fishRarity,
        fishImageUrl: fish.fishImageUrl,
        fishIdOriginal: fish.fishId, // Game ID
        // Set other item fields to null
        seedId: null,
        seedName: null,
        seedRarity: null,
        caterpillarId: null,
        caterpillarName: null,
        caterpillarRarity: null,
        caterpillarImageUrl: null,
        caterpillarIdOriginal: null,
        flowerId: null,
        flowerName: null,
        flowerRarity: null,
        flowerImageUrl: null,
        flowerIdOriginal: null,
        butterflyId: null,
        butterflyName: null,
        butterflyRarity: null,
        butterflyImageUrl: null,
        butterflyIdOriginal: null,
      }).returning();

      // Update fish quantity
      const newQuantity = fish.quantity - data.quantity;
      if (newQuantity <= 0) {
        await this.db
          .delete(userFish)
          .where(eq(userFish.id, data.fishId!));
      } else {
        await this.db
          .update(userFish)
          .set({ quantity: newQuantity })
          .where(eq(userFish.id, data.fishId!));
      }

      return listing[0];
    } else {
      throw new Error('Invalid item type');
    }
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

    // Process purchase based on item type
    if (listing[0].itemType === "seed") {
      // Use copied seed data from market listing
      if (!listing[0].seedName || !listing[0].seedRarity) {
        return { success: false, message: 'Seed data incomplete' };
      }

      // Add seller credits
      const seller = await this.getUser(listing[0].sellerId);
      if (seller) {
        await this.db
          .update(users)
          .set({ credits: seller.credits + totalPrice })
          .where(eq(users.id, listing[0].sellerId));
      }

      // Deduct buyer credits
      await this.db
        .update(users)
        .set({ credits: buyer.credits - totalPrice })
        .where(eq(users.id, buyerId));

      // Add seeds to buyer using copied data (seeds support quantities)
      await this.addSeedToInventory(buyerId, listing[0].seedId || 0, data.quantity);

    } else if (listing[0].itemType === "caterpillar") {
      // For caterpillars, quantity is always 1
      if (data.quantity !== 1) {
        return { success: false, message: 'Caterpillars can only be purchased one at a time' };
      }

      // Use copied caterpillar data from market listing
      if (!listing[0].caterpillarName || !listing[0].caterpillarRarity) {
        return { success: false, message: 'Caterpillar data incomplete' };
      }

      // Add seller credits
      const seller = await this.getUser(listing[0].sellerId);
      if (seller) {
        await this.db
          .update(users)
          .set({ credits: seller.credits + totalPrice })
          .where(eq(users.id, listing[0].sellerId));
      }

      // Deduct buyer credits
      await this.db
        .update(users)
        .set({ credits: buyer.credits - totalPrice })
        .where(eq(users.id, buyerId));

      // Create new caterpillar for buyer using copied data
      await this.db.insert(userCaterpillars).values({
        userId: buyerId,
        caterpillarId: listing[0].caterpillarIdOriginal || 0,
        caterpillarName: listing[0].caterpillarName,
        caterpillarRarity: listing[0].caterpillarRarity,
        caterpillarImageUrl: listing[0].caterpillarImageUrl || '',
        quantity: 1
      });
    } else if (listing[0].itemType === "flower") {
      // Use copied flower data from market listing
      if (!listing[0].flowerName || !listing[0].flowerRarity) {
        return { success: false, message: 'Flower data incomplete' };
      }

      // Add seller credits
      const seller = await this.getUser(listing[0].sellerId);
      if (seller) {
        await this.db
          .update(users)
          .set({ credits: seller.credits + totalPrice })
          .where(eq(users.id, listing[0].sellerId));
      }

      // Deduct buyer credits
      await this.db
        .update(users)
        .set({ credits: buyer.credits - totalPrice })
        .where(eq(users.id, buyerId));

      // Add flowers to buyer's inventory using copied data
      await this.addFlowerToInventoryWithQuantity(buyerId, listing[0].flowerIdOriginal || 0, listing[0].flowerName, listing[0].flowerRarity, listing[0].flowerImageUrl || '', data.quantity);

    } else if (listing[0].itemType === "butterfly") {
      // For butterflies, quantity is always 1
      if (data.quantity !== 1) {
        return { success: false, message: 'Butterflies can only be purchased one at a time' };
      }

      // Use copied butterfly data from market listing
      if (!listing[0].butterflyName || !listing[0].butterflyRarity) {
        return { success: false, message: 'Butterfly data incomplete' };
      }

      // Add seller credits
      const seller = await this.getUser(listing[0].sellerId);
      if (seller) {
        await this.db
          .update(users)
          .set({ credits: seller.credits + totalPrice })
          .where(eq(users.id, listing[0].sellerId));
      }

      // Deduct buyer credits
      await this.db
        .update(users)
        .set({ credits: buyer.credits - totalPrice })
        .where(eq(users.id, buyerId));

      // Create new butterfly for buyer using copied data
      await this.db.insert(userButterflies).values({
        userId: buyerId,
        butterflyId: listing[0].butterflyIdOriginal || 0,
        butterflyName: listing[0].butterflyName,
        butterflyRarity: listing[0].butterflyRarity,
        butterflyImageUrl: listing[0].butterflyImageUrl || '',
        quantity: 1
      });

    } else if (listing[0].itemType === "fish") {
      // Use copied fish data from market listing
      if (!listing[0].fishName || !listing[0].fishRarity) {
        return { success: false, message: 'Fish data incomplete' };
      }

      // Add seller credits
      const seller = await this.getUser(listing[0].sellerId);
      if (seller) {
        await this.db
          .update(users)
          .set({ credits: seller.credits + totalPrice })
          .where(eq(users.id, listing[0].sellerId));
      }

      // Deduct buyer credits
      await this.db
        .update(users)
        .set({ credits: buyer.credits - totalPrice })
        .where(eq(users.id, buyerId));

      // Add fish to buyer's inventory using copied data
      await this.addFishToInventoryWithQuantity(buyerId, listing[0].fishIdOriginal || 0, listing[0].fishName, listing[0].fishRarity, listing[0].fishImageUrl || '', data.quantity);
    }

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
    // Frontend handles pond field restrictions - backend just processes the request
    
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

  async addFlowerToInventoryWithQuantity(userId: number, flowerId: number, flowerName: string, flowerRarity: string, flowerImageUrl: string, quantity: number): Promise<void> {
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
        .set({ quantity: existingFlower[0].quantity + quantity })
        .where(eq(userFlowers.id, existingFlower[0].id));
      
      console.log(`💾 Increased ${flowerName} quantity to ${existingFlower[0].quantity + quantity} for user ${userId}`);
    } else {
      // Add new flower to inventory
      await this.db
        .insert(userFlowers)
        .values({
          userId,
          flowerId,
          rarity: this.getRarityInteger(flowerRarity),
          flowerName,
          flowerRarity,
          flowerImageUrl,
          quantity
        });
      
      console.log(`💾 Added new flower ${flowerName} (x${quantity}) to user ${userId} inventory`);
    }
  }

  async addFishToInventoryWithQuantity(userId: number, fishId: number, fishName: string, fishRarity: string, fishImageUrl: string, quantity: number): Promise<void> {
    // Check if user already has this fish type
    const existingFish = await this.db
      .select()
      .from(userFish)
      .where(and(eq(userFish.userId, userId), eq(userFish.fishId, fishId)))
      .limit(1);

    if (existingFish.length > 0) {
      // Increase quantity of existing fish
      await this.db
        .update(userFish)
        .set({ quantity: existingFish[0].quantity + quantity })
        .where(eq(userFish.id, existingFish[0].id));
      
      console.log(`🐟 Increased ${fishName} quantity to ${existingFish[0].quantity + quantity} for user ${userId}`);
    } else {
      // Add new fish to inventory
      await this.db
        .insert(userFish)
        .values({
          userId,
          fishId,
          fishName,
          fishRarity,
          fishImageUrl,
          quantity
        });
      
      console.log(`🐟 Added new fish ${fishName} (x${quantity}) to user ${userId} inventory`);
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

      // Generate or use provided name and check uniqueness
      let bouquetName: string;
      if (data.name) {
        // Manual name provided - check if it's unique
        if (await this.isBouquetNameTaken(data.name)) {
          return { success: false, message: "Dieser Bouquet-Name existiert bereits. Bitte wählen Sie einen anderen Namen." };
        }
        bouquetName = data.name;
      } else if (data.generateName) {
        // Generate unique AI name
        bouquetName = await this.generateUniqueBouquetName(avgRarity);
      } else {
        // Default fallback name - ensure uniqueness
        let baseName = `${flower1.flowerName} Bouquet`;
        bouquetName = await this.ensureUniqueName(baseName);
      }

      // Create bouquet
      const newBouquet = await this.db.insert(bouquets).values({
        name: bouquetName,
        rarity: avgRarity,
        imageUrl: "/Blumen/bouquet.jpg",
        createdByUserId: userId
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

      // Deduct 30 credits for bouquet creation
      const user = await this.getUser(userId);
      if (user && user.credits >= 30) {
        await this.updateUserCredits(userId, -30); // Deduct 30 credits (negative delta)
        console.log(`💰 Deducted 30 credits for bouquet creation. User ${userId} credits: ${user.credits} -> ${user.credits - 30}`);
      } else {
        console.log(`⚠️ Warning: User ${userId} has insufficient credits (${user?.credits || 0}) for bouquet creation, but bouquet was still created`);
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

  async getUserCreatedBouquetRecipes(userId: number): Promise<any[]> {
    // Get all bouquets created by this user with their recipes
    const result = await this.db
      .select({
        bouquetId: bouquets.id,
        bouquetName: bouquets.name,
        bouquetRarity: bouquets.rarity,
        bouquetImageUrl: bouquets.imageUrl,
        createdAt: bouquets.createdAt,
        flowerId1: bouquetRecipes.flowerId1,
        flowerId2: bouquetRecipes.flowerId2,
        flowerId3: bouquetRecipes.flowerId3
      })
      .from(bouquets)
      .leftJoin(bouquetRecipes, eq(bouquets.id, bouquetRecipes.bouquetId))
      .where(eq(bouquets.createdByUserId, userId))
      .orderBy(bouquets.createdAt);
    
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
        bouquetName: bouquets.name,
        bouquetRarity: bouquets.rarity
      })
      .from(placedBouquets)
      .leftJoin(bouquets, eq(placedBouquets.bouquetId, bouquets.id))
      .where(eq(placedBouquets.userId, userId));
    
    console.log(`💾 Retrieved placed bouquets for user ${userId}:`, result.map((r: any) => ({ fieldIndex: r.fieldIndex, rarity: r.bouquetRarity, name: r.bouquetName })));
    
    return result as any;
  }

  async getUserButterflies(userId: number): Promise<UserButterfly[]> {
    const result = await this.db
      .select()
      .from(userButterflies)
      .where(eq(userButterflies.userId, userId));
    
    return result;
  }

  async addButterflyToInventory(userId: number, rarity: RarityTier, quantity: number = 1): Promise<{ success: boolean; butterfly?: UserButterfly }> {
    try {
      console.log(`🦋 Adding ${quantity} butterfly(s) of rarity ${rarity} to user ${userId} inventory`);
      
      // Generate random butterfly using the existing system
      const { generateRandomButterfly } = await import('./bouquet');
      const butterflyData = await generateRandomButterfly(rarity);
      
      // Check if user already has this butterfly type
      const existing = await this.db
        .select()
        .from(userButterflies)
        .where(and(eq(userButterflies.userId, userId), eq(userButterflies.butterflyId, butterflyData.id)));

      let result: UserButterfly;
      
      if (existing.length > 0) {
        // Increase quantity
        console.log(`🦋 Increasing quantity from ${existing[0].quantity} to ${existing[0].quantity + quantity}`);
        const updated = await this.db
          .update(userButterflies)
          .set({ quantity: existing[0].quantity + quantity })
          .where(and(eq(userButterflies.userId, userId), eq(userButterflies.butterflyId, butterflyData.id)))
          .returning();
        result = updated[0];
      } else {
        // Add new butterfly to inventory  
        console.log(`🦋 Adding new butterfly to inventory`);
        const newButterfly = await this.db.insert(userButterflies).values({
          userId,
          butterflyId: butterflyData.id,
          butterflyName: butterflyData.name,
          butterflyRarity: rarity,
          butterflyImageUrl: butterflyData.imageUrl,
          quantity
        }).returning();
        result = newButterfly[0];
      }

      console.log(`🦋 Successfully added butterfly: ${result.butterflyName} (${rarity}) to user ${userId}`);
      return { success: true, butterfly: result };
    } catch (error) {
      console.error('🦋 Error adding butterfly to inventory:', error);
      return { success: false };
    }
  }

  // VIP Butterfly methods
  async getUserVipButterflies(userId: number): Promise<UserVipButterfly[]> {
    const result = await this.db
      .select()
      .from(userVipButterflies)
      .where(eq(userVipButterflies.userId, userId));
    
    return result;
  }

  async addVipButterflyToInventory(userId: number, vipButterflyId: number, vipButterflyName: string, vipButterflyImageUrl: string): Promise<void> {
    // Check if user already has this VIP butterfly
    const existing = await this.db
      .select()
      .from(userVipButterflies)
      .where(and(eq(userVipButterflies.userId, userId), eq(userVipButterflies.vipButterflyId, vipButterflyId)));

    if (existing.length > 0) {
      // Increase quantity
      await this.db
        .update(userVipButterflies)
        .set({ quantity: existing[0].quantity + 1 })
        .where(eq(userVipButterflies.id, existing[0].id));
    } else {
      // Add new VIP butterfly
      await this.db.insert(userVipButterflies).values({
        userId,
        vipButterflyId,
        vipButterflyName,
        vipButterflyImageUrl,
        quantity: 1
      });
    }
    
    console.log(`✨ Added VIP butterfly ${vipButterflyName} to user ${userId}'s inventory`);
  }

  // VIP Exhibition methods
  async getExhibitionVipButterflies(userId: number): Promise<ExhibitionVipButterfly[]> {
    const result = await this.db
      .select()
      .from(exhibitionVipButterflies)
      .where(eq(exhibitionVipButterflies.userId, userId));
    
    return result;
  }

  async placeVipButterflyInExhibition(userId: number, frameId: number, slotIndex: number, vipButterflyId: number): Promise<{ success: boolean; message?: string }> {
    // Check if user has this VIP butterfly
    const userVipButterfly = await this.db
      .select()
      .from(userVipButterflies)
      .where(and(eq(userVipButterflies.userId, userId), eq(userVipButterflies.vipButterflyId, vipButterflyId)));

    if (userVipButterfly.length === 0) {
      return { success: false, message: "VIP-Schmetterling nicht gefunden" };
    }

    // Check if slot is already occupied
    const existingPlacement = await this.db
      .select()
      .from(exhibitionVipButterflies)
      .where(and(eq(exhibitionVipButterflies.frameId, frameId), eq(exhibitionVipButterflies.slotIndex, slotIndex)));

    if (existingPlacement.length > 0) {
      return { success: false, message: "Slot bereits belegt" };
    }

    const vipButterfly = userVipButterfly[0];

    // Place VIP butterfly in exhibition
    await this.db.insert(exhibitionVipButterflies).values({
      userId,
      frameId,
      slotIndex,
      vipButterflyId: vipButterfly.vipButterflyId,
      vipButterflyName: vipButterfly.vipButterflyName,
      vipButterflyImageUrl: vipButterfly.vipButterflyImageUrl
    });

    // Remove from user inventory (or decrease quantity)
    if (vipButterfly.quantity > 1) {
      await this.db
        .update(userVipButterflies)
        .set({ quantity: vipButterfly.quantity - 1 })
        .where(eq(userVipButterflies.id, vipButterfly.id));
    } else {
      await this.db
        .delete(userVipButterflies)
        .where(eq(userVipButterflies.id, vipButterfly.id));
    }

    console.log(`✨ Placed VIP butterfly ${vipButterfly.vipButterflyName} in frame ${frameId}, slot ${slotIndex}`);
    return { success: true };
  }

  async removeVipButterflyFromExhibition(userId: number, frameId: number, slotIndex: number): Promise<{ success: boolean; message?: string }> {
    // Find the VIP butterfly in the exhibition
    const exhibitionVipButterfly = await this.db
      .select()
      .from(exhibitionVipButterflies)
      .where(and(
        eq(exhibitionVipButterflies.userId, userId),
        eq(exhibitionVipButterflies.frameId, frameId),
        eq(exhibitionVipButterflies.slotIndex, slotIndex)
      ));

    if (exhibitionVipButterfly.length === 0) {
      return { success: false, message: "Kein VIP-Schmetterling in diesem Slot gefunden" };
    }

    const vipButterfly = exhibitionVipButterfly[0];

    // Remove from exhibition
    await this.db
      .delete(exhibitionVipButterflies)
      .where(eq(exhibitionVipButterflies.id, vipButterfly.id));

    // Return to user inventory
    await this.addVipButterflyToInventory(
      userId,
      vipButterfly.vipButterflyId,
      vipButterfly.vipButterflyName,
      vipButterfly.vipButterflyImageUrl
    );

    console.log(`✨ Removed VIP butterfly ${vipButterfly.vipButterflyName} from frame ${frameId}, slot ${slotIndex}`);
    return { success: true };
  }

  // Field butterfly methods
  async getFieldButterflies(userId: number): Promise<FieldButterfly[]> {
    const result = await this.db
      .select()
      .from(fieldButterflies)
      .where(eq(fieldButterflies.userId, userId));
    
    return result;
  }

  /**
   * Get field caterpillars for a user
   */
  async getFieldCaterpillars(userId: number): Promise<any[]> {
    const result = await this.db
      .select()
      .from(fieldCaterpillars)
      .where(eq(fieldCaterpillars.userId, userId));
    
    return result;
  }

  /**
   * Collect a field caterpillar (remove from field and add to inventory)
   */
  async collectFieldCaterpillar(userId: number, fieldIndex: number): Promise<{ success: boolean; caterpillar?: UserCaterpillar }> {
    console.log(`🐛 Collecting field caterpillar for user ${userId} on field ${fieldIndex}`);
    
    // ATOMIC: Delete and return the caterpillar in one operation
    const deletedCaterpillar = await this.db
      .delete(fieldCaterpillars)
      .where(and(eq(fieldCaterpillars.userId, userId), eq(fieldCaterpillars.fieldIndex, fieldIndex)))
      .returning();

    if (deletedCaterpillar.length === 0) {
      console.log(`🐛 No caterpillar found on field ${fieldIndex} for user ${userId}`);
      return { success: false };
    }

    const fieldCaterpillar = deletedCaterpillar[0];
    console.log(`🐛 Found field caterpillar: ${fieldCaterpillar.caterpillarName} (ID: ${fieldCaterpillar.caterpillarId})`);
    console.log(`🐛 Field caterpillar rarity: ${fieldCaterpillar.caterpillarRarity}`);
    console.log(`🐛 Removed caterpillar from field ${fieldIndex}`);

    // Add to user inventory - group by caterpillarId AND caterpillarRarity
    console.log(`🐛 Looking for existing caterpillar with ID ${fieldCaterpillar.caterpillarId} and rarity ${fieldCaterpillar.caterpillarRarity}`);
    const existing = await this.db
      .select()
      .from(userCaterpillars)
      .where(and(
        eq(userCaterpillars.userId, userId), 
        eq(userCaterpillars.caterpillarId, fieldCaterpillar.caterpillarId),
        eq(userCaterpillars.caterpillarRarity, fieldCaterpillar.caterpillarRarity)
      ));
    
    console.log(`🐛 Found ${existing.length} existing caterpillars with same ID and rarity`);

    let result: UserCaterpillar;
    
    try {
      if (existing.length > 0) {
        // Increase quantity
        console.log(`🐛 Increasing quantity from ${existing[0].quantity} to ${existing[0].quantity + 1}`);
        const updated = await this.db
          .update(userCaterpillars)
          .set({ quantity: existing[0].quantity + 1 })
          .where(and(
            eq(userCaterpillars.userId, userId), 
            eq(userCaterpillars.caterpillarId, fieldCaterpillar.caterpillarId),
            eq(userCaterpillars.caterpillarRarity, fieldCaterpillar.caterpillarRarity)
          ))
          .returning();
        result = updated[0];
      } else {
        // Add new caterpillar to inventory  
        console.log(`🐛 Adding new caterpillar to inventory`);
        const newCaterpillar = await this.db.insert(userCaterpillars).values({
          userId,
          caterpillarId: fieldCaterpillar.caterpillarId,
          caterpillarName: fieldCaterpillar.caterpillarName,
          caterpillarRarity: fieldCaterpillar.caterpillarRarity,
          caterpillarImageUrl: fieldCaterpillar.caterpillarImageUrl,
          quantity: 1
        }).returning();
        result = newCaterpillar[0];
      }
    } catch (error: any) {
      console.error('🐛 Error adding caterpillar to inventory:', error);
      return { success: false };
    }

    console.log(`🐛 Successfully collected caterpillar ${fieldCaterpillar.caterpillarName} for user ${userId}`);
    return { success: true, caterpillar: result };
  }

  async placeButterflyOnField(userId: number, fieldIndex: number, butterflyId: number): Promise<{ success: boolean; message?: string; butterfly?: any }> {
    console.log(`🦋 Placing butterfly ${butterflyId} on field ${fieldIndex} for user ${userId}`);
    
    // Check if user has this butterfly
    const userButterfly = await this.db
      .select()
      .from(userButterflies)
      .where(and(eq(userButterflies.userId, userId), eq(userButterflies.id, butterflyId)));

    if (userButterfly.length === 0) {
      return { success: false, message: "Schmetterling nicht gefunden" };
    }

    // Check if field already has a butterfly
    const existingButterfly = await this.db
      .select()
      .from(fieldButterflies)
      .where(and(eq(fieldButterflies.userId, userId), eq(fieldButterflies.fieldIndex, fieldIndex)));

    if (existingButterfly.length > 0) {
      return { success: false, message: "Auf diesem Feld ist bereits ein Schmetterling platziert" };
    }

    const butterfly = userButterfly[0];

    if (butterfly.quantity <= 0) {
      return { success: false, message: "Nicht genügend Schmetterlinge im Inventar" };
    }

    try {
      // Place butterfly on field (no bouquet required for this system)
      const placedButterfly = await this.db.insert(fieldButterflies).values({
        userId,
        fieldIndex,
        butterflyId: butterfly.butterflyId,
        butterflyName: butterfly.butterflyName,
        butterflyRarity: butterfly.butterflyRarity,
        butterflyImageUrl: butterfly.butterflyImageUrl,
        bouquetId: 1 // Dummy bouquet ID since the schema requires it
      }).returning();

      // Remove from user inventory (or decrease quantity)
      if (butterfly.quantity > 1) {
        await this.db
          .update(userButterflies)
          .set({ quantity: butterfly.quantity - 1 })
          .where(eq(userButterflies.id, butterfly.id));
      } else {
        await this.db
          .delete(userButterflies)
          .where(eq(userButterflies.id, butterfly.id));
      }

      console.log(`🦋 Successfully placed butterfly ${butterfly.butterflyName} on field ${fieldIndex}`);
      return { success: true, butterfly: placedButterfly[0] };
    } catch (error) {
      console.error('🦋 Error placing butterfly on field:', error);
      return { success: false, message: 'Datenbankfehler beim Platzieren' };
    }
  }

  async removeFieldButterfly(userId: number, fieldIndex: number): Promise<{ success: boolean; message?: string }> {
    console.log(`🦋 Removing field butterfly on field ${fieldIndex} for user ${userId}`);
    
    try {
      // First, let's see what butterflies exist
      const existing = await this.db
        .select()
        .from(fieldButterflies)
        .where(and(eq(fieldButterflies.userId, userId), eq(fieldButterflies.fieldIndex, fieldIndex)));
      
      console.log(`🦋 Found ${existing.length} existing butterflies on field ${fieldIndex}:`, existing.map(b => ({ id: b.id, name: b.butterflyName })));

      const result = await this.db
        .delete(fieldButterflies)
        .where(and(eq(fieldButterflies.userId, userId), eq(fieldButterflies.fieldIndex, fieldIndex)))
        .returning();

      console.log(`🦋 Deletion result: ${result.length} rows deleted`);

      if (result.length === 0) {
        return { success: false, message: 'No butterfly found on field' };
      }

      console.log(`🦋 Successfully removed butterfly from field ${fieldIndex}:`, result[0].butterflyName);
      return { success: true };
    } catch (error) {
      console.error('🦋 Error removing field butterfly:', error);
      return { success: false, message: 'Database error' };
    }
  }

  async spawnCaterpillarOnField(userId: number, fieldIndex: number, parentRarity: string): Promise<{ success: boolean; message?: string; caterpillar?: any }> {
    console.log(`🐛 Spawning caterpillar on field ${fieldIndex} with parent rarity ${parentRarity}`);
    
    // Rarity inheritance system: 50% same, 30% lower, 20% higher
    const inheritedRarity = this.inheritCaterpillarRarity(parentRarity);
    
    // Get random caterpillar for the inherited rarity
    const caterpillar = await this.getRandomCaterpillarByRarity(inheritedRarity);
    
    if (!caterpillar) {
      return { success: false, message: `No caterpillar found for rarity ${inheritedRarity}` };
    }

    try {
      // Add caterpillar to user inventory 
      await this.addCaterpillarToInventory(userId, caterpillar.id, caterpillar.name, inheritedRarity, caterpillar.imageUrl);

      // ALSO place caterpillar permanently on the field (blocks field until collected)
      await this.db.insert(fieldCaterpillars).values({
        userId,
        fieldIndex,
        caterpillarId: caterpillar.id,
        caterpillarName: caterpillar.name,
        caterpillarRarity: inheritedRarity,
        caterpillarImageUrl: caterpillar.imageUrl,
        spawnedAt: new Date()
      });

      console.log(`🐛 Successfully spawned caterpillar ${caterpillar.name} (${inheritedRarity}) from butterfly (${parentRarity})`);
      console.log(`🐛 Caterpillar placed permanently on field ${fieldIndex} - blocks until user clicks to collect!`);
      return { success: true, caterpillar };
    } catch (error) {
      console.error('🐛 Error spawning caterpillar:', error);
      return { success: false, message: 'Database error spawning caterpillar' };
    }
  }

  private inheritCaterpillarRarity(parentRarity: string): string {
    const rarities = ['common', 'uncommon', 'rare', 'super-rare', 'epic', 'legendary', 'mythical'];
    const currentIndex = rarities.indexOf(parentRarity);
    
    if (currentIndex === -1) return 'common';
    
    const roll = Math.random();
    
    if (roll < 0.5) {
      // 50% same rarity
      return parentRarity;
    } else if (roll < 0.8) {
      // 30% lower rarity
      return currentIndex > 0 ? rarities[currentIndex - 1] : rarities[0];
    } else {
      // 20% higher rarity
      return currentIndex < rarities.length - 1 ? rarities[currentIndex + 1] : rarities[rarities.length - 1];
    }
  }

  private async addCaterpillarToInventory(userId: number, caterpillarId: number, caterpillarName: string, rarity: string, imageUrl: string): Promise<void> {
    console.log(`🐛 Adding caterpillar ${caterpillarName} (${rarity}) to user ${userId} inventory`);
    
    try {
      // Check if user already has this caterpillar type
      const existingCaterpillar = await this.db
        .select()
        .from(userCaterpillars)
        .where(and(
          eq(userCaterpillars.userId, userId),
          eq(userCaterpillars.caterpillarId, caterpillarId)
        ));

      if (existingCaterpillar.length > 0) {
        // Update quantity
        await this.db
          .update(userCaterpillars)
          .set({ quantity: existingCaterpillar[0].quantity + 1 })
          .where(eq(userCaterpillars.id, existingCaterpillar[0].id));
        
        console.log(`🐛 Updated caterpillar quantity: ${existingCaterpillar[0].quantity + 1}`);
      } else {
        // Add new caterpillar
        await this.db
          .insert(userCaterpillars)
          .values({
            userId,
            caterpillarId,
            caterpillarName,
            caterpillarRarity: rarity,
            caterpillarImageUrl: imageUrl,
            quantity: 1
          });
        
        console.log(`🐛 Added new caterpillar ${caterpillarName} to inventory`);
      }
    } catch (error) {
      console.error('🐛 Database error adding caterpillar to inventory:', error);
      throw error;
    }
  }

  private async getRandomCaterpillarByRarity(rarity: string) {
    // Use the professional system from creatures.ts with beautiful Latin names!
    const { generateRandomCaterpillar } = await import('./creatures');
    return await generateRandomCaterpillar(rarity as any);
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
    
    // ATOMIC: Delete and return the butterfly in one operation - only one request can succeed
    const deletedButterfly = await this.db
      .delete(fieldButterflies)
      .where(and(eq(fieldButterflies.userId, userId), eq(fieldButterflies.fieldIndex, fieldIndex)))
      .returning();

    if (deletedButterfly.length === 0) {
      console.log(`🦋 No butterfly found on field ${fieldIndex} for user ${userId}`);
      return { success: false };
    }

    const fieldButterfly = deletedButterfly[0];
    console.log(`🦋 Found butterfly: ${fieldButterfly.butterflyName} (ID: ${fieldButterfly.butterflyId})`);
    console.log(`🦋 Removed butterfly from field ${fieldIndex}`);

    // Check if user already has this butterfly type
    const existing = await this.db
      .select()
      .from(userButterflies)
      .where(and(eq(userButterflies.userId, userId), eq(userButterflies.butterflyId, fieldButterfly.butterflyId)));

    let result: UserButterfly;
    
    try {
      if (existing.length > 0) {
        // Increase quantity
        console.log(`🦋 Increasing quantity from ${existing[0].quantity} to ${existing[0].quantity + 1}`);
        const updated = await this.db
          .update(userButterflies)
          .set({ quantity: existing[0].quantity + 1 })
          .where(and(eq(userButterflies.userId, userId), eq(userButterflies.butterflyId, fieldButterfly.butterflyId)))
          .returning();
        result = updated[0];
      } else {
        // Add new butterfly to inventory  
        console.log(`🦋 Adding new butterfly to inventory`);
        const newButterfly = await this.db.insert(userButterflies).values({
          userId,
          butterflyId: fieldButterfly.butterflyId,
          butterflyName: fieldButterfly.butterflyName,
          butterflyRarity: fieldButterfly.butterflyRarity,
          butterflyImageUrl: fieldButterfly.butterflyImageUrl,
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
          .where(and(eq(userButterflies.userId, userId), eq(userButterflies.butterflyId, fieldButterfly.butterflyId)));
        
        const updated = await this.db
          .update(userButterflies)
          .set({ quantity: existingRetry[0].quantity + 1 })
          .where(and(eq(userButterflies.userId, userId), eq(userButterflies.butterflyId, fieldButterfly.butterflyId)))
          .returning();
        result = updated[0];
      } else {
        throw error;
      }
    }

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
      const creditResult = await this.updateUserCredits(userId, -cost); // Use negative delta to deduct credits
      if (creditResult) {
        updatedUser = creditResult;
      }
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

  // Bouquet name uniqueness methods
  async isBouquetNameTaken(name: string): Promise<boolean> {
    const existing = await this.db
      .select()
      .from(bouquets)
      .where(eq(bouquets.name, name))
      .limit(1);
    return existing.length > 0;
  }

  // Generate unique bouquet name using AI with retry logic
  async generateUniqueBouquetName(rarity: RarityTier): Promise<string> {
    const { generateBouquetName } = await import('./bouquet');
    const maxAttempts = 5;
    
    console.log(`🌹 Generating unique bouquet name for rarity: ${rarity}`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🌹 Attempt ${attempt}/${maxAttempts}: Calling OpenAI API...`);
      const generatedName = await generateBouquetName(rarity);
      
      console.log(`🌹 Generated name: "${generatedName}", checking availability...`);
      const isNameTaken = await this.isBouquetNameTaken(generatedName);
      
      if (!isNameTaken) {
        console.log(`🌹 ✅ Name "${generatedName}" is available!`);
        return generatedName;
      }
      
      console.log(`🌹 ❌ Name "${generatedName}" already exists (attempt ${attempt}/${maxAttempts})`);
      
      // If first attempt failed, show better error logging
      if (attempt === 1) {
        console.log(`🌹 🔄 First generated name was taken, retrying with ${maxAttempts - 1} more attempts...`);
      }
    }
    
    // If all AI attempts failed, create a fallback unique name
    console.log(`🌹 ⚠️ All ${maxAttempts} OpenAI attempts produced duplicate names, using fallback strategy`);
    const fallbackName = await this.ensureUniqueName(`Seltene ${rarity} Kollektion`);
    console.log(`🌹 📝 Fallback name generated: "${fallbackName}"`);
    return fallbackName;
  }

  // Ensure name is unique by adding number suffix if needed
  async ensureUniqueName(baseName: string): Promise<string> {
    let candidateName = baseName;
    let counter = 1;
    
    while (await this.isBouquetNameTaken(candidateName)) {
      candidateName = `${baseName} ${counter}`;
      counter++;
    }
    
    return candidateName;
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
    const multiplier = rarityMultipliers[bouquetRarity as keyof typeof rarityMultipliers] || 1;
    
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

    const boostFactors = rarityBoostFactors[bouquetRarity as keyof typeof rarityBoostFactors] || rarityBoostFactors['common'];

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

  // Field Unlocking System
  async getUnlockedFields(userId: number): Promise<UnlockedField[]> {
    const result = await this.db
      .select()
      .from(unlockedFields)
      .where(eq(unlockedFields.userId, userId));
    
    return result;
  }

  async isFieldUnlocked(userId: number, fieldIndex: number): Promise<boolean> {
    const result = await this.db
      .select()
      .from(unlockedFields)
      .where(and(eq(unlockedFields.userId, userId), eq(unlockedFields.fieldIndex, fieldIndex)));
    
    return result.length > 0;
  }

  async unlockField(userId: number, data: UnlockFieldRequest, cost: number): Promise<{ success: boolean; message?: string }> {
    // Check if field is already unlocked
    const isUnlocked = await this.isFieldUnlocked(userId, data.fieldIndex);
    if (isUnlocked) {
      return { success: false, message: "Field is already unlocked" };
    }

    // Check if user has enough credits
    const user = await this.getUser(userId);
    if (!user || user.credits < cost) {
      return { success: false, message: "Not enough credits" };
    }

    try {
      // Deduct credits and unlock field in a transaction-like manner
      await this.updateUserCredits(userId, -cost);
      
      await this.db.insert(unlockedFields).values({
        userId,
        fieldIndex: data.fieldIndex,
        cost,
      });

      return { success: true };
    } catch (error) {
      console.error('Error unlocking field:', error);
      return { success: false, message: "Failed to unlock field" };
    }
  }

  /**
   * Get all available fields for butterfly spawning (only unlocked & free fields)
   */
  // Check if a field is in the pond area (Teich)
  private isPondField(fieldIndex: number): boolean {
    const fieldId = fieldIndex + 1; // Convert 0-indexed to 1-indexed
    const row = Math.floor((fieldId - 1) / 10);
    const col = (fieldId - 1) % 10;
    
    // Pond area: rows 1-3, columns 1-8 (0-indexed)
    return row >= 1 && row <= 3 && col >= 1 && col <= 8;
  }

  async getAvailableFieldsForButterflies(userId: number): Promise<number[]> {
    // Get all occupied fields for this user in parallel
    const [userPlantedFields, userPlacedBouquets, userExistingButterflies, userUnlockedFields] = await Promise.all([
      this.db.select({ fieldIndex: plantedFields.fieldIndex }).from(plantedFields).where(eq(plantedFields.userId, userId)),
      this.db.select({ fieldIndex: placedBouquets.fieldIndex }).from(placedBouquets).where(eq(placedBouquets.userId, userId)),
      this.db.select({ fieldIndex: fieldButterflies.fieldIndex }).from(fieldButterflies).where(eq(fieldButterflies.userId, userId)),
      this.db.select({ fieldIndex: unlockedFields.fieldIndex }).from(unlockedFields).where(eq(unlockedFields.userId, userId))
    ]);

    // Collect all occupied field indices
    const occupiedFields = new Set([
      ...userPlantedFields.map((f: { fieldIndex: number }) => f.fieldIndex),
      ...userPlacedBouquets.map((f: { fieldIndex: number }) => f.fieldIndex),
      ...userExistingButterflies.map((f: { fieldIndex: number }) => f.fieldIndex)
    ]);

    // Get unlocked field indices
    const unlockedFieldIndices = new Set(
      userUnlockedFields.map((f: { fieldIndex: number }) => f.fieldIndex)
    );

    // Find available fields (unlocked AND free AND NOT pond fields)
    const availableFields = Array.from(unlockedFieldIndices).filter(fieldIndex => 
      !occupiedFields.has(fieldIndex) && !this.isPondField(fieldIndex)
    );
    
    console.log(`🦋 GARDEN/TEICH SEPARATION: Available butterfly fields for user ${userId}:`, availableFields, '(pond fields excluded)');
    
    return availableFields;
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

      // Find all available fields for butterfly spawning
      const availableFields = await this.getAvailableFieldsForButterflies(userId);

      if (availableFields.length === 0) {
        console.log(`🦋 No available fields for butterfly spawn for user ${userId} (garden full)`);
        return { success: false };
      }

      // Select random available field from entire garden
      const fieldIndex = availableFields[Math.floor(Math.random() * availableFields.length)];

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
      console.log(`🔍 DEBUG: Random spawn from ${availableFields.length} available fields: [${availableFields.join(', ')}]`);
      
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
    
    // Base time: 72 hours for production
    const baseTimeMs = 72 * 60 * 60 * 1000; // = 259,200,000 ms (72 hours)
    
    // Likes reduction: 1 hour per like in milliseconds  
    const likesReductionMs = likesCount * 60 * 60 * 1000;
    
    // Required time to sell = 72 hours - (likes * 1 hour)
    const requiredTimeMs = Math.max(0, baseTimeMs - likesReductionMs);
    
    // Time remaining = required time - elapsed time
    const remainingMs = Math.max(0, requiredTimeMs - msElapsed);
    
    
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
    await this.updateUserCredits(userId, creditsEarned);

    return { success: true, creditsEarned };
  }

  async canSellVipButterfly(userId: number, exhibitionVipButterflyId: number): Promise<boolean> {
    const timeRemaining = await this.getTimeUntilVipSellable(userId, exhibitionVipButterflyId);
    return timeRemaining === 0;
  }

  async getTimeUntilVipSellable(userId: number, exhibitionVipButterflyId: number): Promise<number> {
    const vipButterfly = await this.db
      .select()
      .from(exhibitionVipButterflies)
      .where(and(eq(exhibitionVipButterflies.userId, userId), eq(exhibitionVipButterflies.id, exhibitionVipButterflyId)));
    
    if (vipButterfly.length === 0) return 0;
    
    // Get likes count for this frame (VIP butterflies also benefit from likes)
    const allFrameLikes = await this.getUserFrameLikes(userId);
    const frameWithLikes = allFrameLikes.find(f => f.frameId === vipButterfly[0].frameId);
    const likesCount = frameWithLikes ? frameWithLikes.totalLikes : 0;
    
    const now = new Date();
    const placedAt = new Date(vipButterfly[0].placedAt);
    const msElapsed = now.getTime() - placedAt.getTime();
    
    // Base time: 72 hours for production
    const baseTimeMs = 72 * 60 * 60 * 1000; // = 259,200,000 ms (72 hours)
    
    // Likes reduction: 1 hour per like in milliseconds  
    const likesReductionMs = likesCount * 60 * 60 * 1000;
    
    // Required time to sell = 72 hours - (likes * 1 hour)
    const requiredTimeMs = Math.max(0, baseTimeMs - likesReductionMs);
    
    // Time remaining = required time - elapsed time
    const remainingMs = Math.max(0, requiredTimeMs - msElapsed);
    
    
    return remainingMs;
  }

  async sellExhibitionVipButterfly(userId: number, exhibitionVipButterflyId: number): Promise<{ success: boolean; message?: string; creditsEarned?: number }> {
    const canSell = await this.canSellVipButterfly(userId, exhibitionVipButterflyId);
    if (!canSell) {
      return { success: false, message: 'VIP Butterfly not ready for sale yet' };
    }

    const vipButterfly = await this.db
      .select()
      .from(exhibitionVipButterflies)
      .where(and(eq(exhibitionVipButterflies.userId, userId), eq(exhibitionVipButterflies.id, exhibitionVipButterflyId)));
    
    if (vipButterfly.length === 0) {
      return { success: false, message: 'VIP Butterfly not found' };
    }

    // VIP butterflies are worth much more! Fixed high value
    const creditsEarned = 2500; // VIP butterflies are super valuable

    // Remove VIP butterfly from exhibition
    await this.db
      .delete(exhibitionVipButterflies)
      .where(and(eq(exhibitionVipButterflies.userId, userId), eq(exhibitionVipButterflies.id, exhibitionVipButterflyId)));

    // Add credits
    await this.updateUserCredits(userId, creditsEarned);

    console.log(`✨ Sold VIP butterfly ${vipButterfly[0].vipButterflyName} for ${creditsEarned} credits`);
    return { success: true, creditsEarned };
  }

  async applyButterflyTimeBoost(userId: number, exhibitionButterflyId: number, minutes: number): Promise<{ success: boolean; message?: string }> {
    try {
      // Check if butterfly exists and belongs to user
      const butterfly = await this.db
        .select()
        .from(exhibitionButterflies)
        .where(and(eq(exhibitionButterflies.userId, userId), eq(exhibitionButterflies.id, exhibitionButterflyId)));
      
      if (butterfly.length === 0) {
        return { success: false, message: 'Schmetterling nicht gefunden oder gehört dir nicht' };
      }

      // Check if already sellable
      const canSell = await this.canSellButterfly(userId, exhibitionButterflyId);
      if (canSell) {
        return { success: false, message: 'Schmetterling ist bereits verkaufbar' };
      }

      // Calculate new placedAt date (move it back by the specified minutes)
      const currentPlacedAt = new Date(butterfly[0].placedAt);
      const newPlacedAt = new Date(currentPlacedAt.getTime() - (minutes * 60 * 1000));

      // Update the placedAt time
      await this.db
        .update(exhibitionButterflies)
        .set({ placedAt: newPlacedAt })
        .where(and(eq(exhibitionButterflies.userId, userId), eq(exhibitionButterflies.id, exhibitionButterflyId)));

      console.log(`☀️ Time Boost: User ${userId} butterfly ${exhibitionButterflyId} placedAt moved back ${minutes} minutes`);
      
      return { success: true, message: `Countdown um ${minutes} Minuten verkürzt` };
    } catch (error) {
      console.error('Error applying butterfly time boost:', error);
      return { success: false, message: 'Fehler beim Anwenden des Zeit-Boosts' };
    }
  }

  // Calculate degraded value over 72 hours
  private calculateDegradedValue(startValue: number, minValue: number, placedAt: Date): number {
    if (!placedAt) return startValue;

    const placedTime = placedAt.getTime();
    const now = new Date().getTime();
    const timeSincePlacement = now - placedTime;
    const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000;

    // If less than 72 hours have passed, calculate degradation
    if (timeSincePlacement < SEVENTY_TWO_HOURS) {
      const degradationProgress = timeSincePlacement / SEVENTY_TWO_HOURS; // 0 to 1
      const valueRange = startValue - minValue;
      const currentValue = startValue - (valueRange * degradationProgress);
      return Math.max(Math.round(currentValue), minValue);
    }

    // After 72 hours, return minimum value
    return minValue;
  }

  async processPassiveIncome(userId: number): Promise<{ success: boolean; creditsEarned?: number }> {
    console.log(`🔍 Processing passive income for user ${userId}...`);
    
    // Get all exhibition butterflies (normal + VIP) for this user
    const normalButterflies = await this.getExhibitionButterflies(userId);
    const vipButterflies = await this.getExhibitionVipButterflies(userId);
    
    console.log(`🔍 User ${userId}: ${normalButterflies.length} normal butterflies, ${vipButterflies.length} VIP butterflies`);
    
    if (normalButterflies.length === 0 && vipButterflies.length === 0) {
      console.log(`🔍 User ${userId}: No exhibition butterflies, skipping passive income`);
      return { success: true, creditsEarned: 0 };
    }
    
    // Get user's last passive income time
    const user = await this.getUser(userId);
    if (!user) {
      return { success: false };
    }
    
    const now = new Date();
    let lastIncomeTime: Date;
    let minutesElapsed: number;
    
    if (user.lastPassiveIncomeAt) {
      // Normal case: use actual last income time
      lastIncomeTime = user.lastPassiveIncomeAt;
      minutesElapsed = Math.floor((now.getTime() - lastIncomeTime.getTime()) / (1000 * 60));
    } else {
      // First time or null case: check when first butterfly was placed
      const firstButterflyTime = await this.getFirstButterflyPlacedTime(userId);
      if (firstButterflyTime) {
        lastIncomeTime = firstButterflyTime;
        minutesElapsed = Math.floor((now.getTime() - firstButterflyTime.getTime()) / (1000 * 60));
        console.log(`🔍 User ${userId}: First time passive income - using first butterfly time ${firstButterflyTime.toISOString()}`);
      } else {
        // Fallback: 1 minute ago
        lastIncomeTime = new Date(now.getTime() - 60 * 1000);
        minutesElapsed = 1;
      }
    }
    
    console.log(`🔍 User ${userId}: lastPassiveIncomeAt=${user.lastPassiveIncomeAt}, minutesElapsed=${minutesElapsed}`);
    
    // Don't process if less than 1 minute has passed
    if (minutesElapsed < 1) {
      console.log(`🔍 User ${userId}: Only ${minutesElapsed} minutes elapsed, skipping (need >=1 minute)`);
      return { success: true, creditsEarned: 0 };
    }
    
    // Calculate total hourly income from ALL butterflies with degradation
    let totalHourlyIncome = 0;
    
    // Helper function to calculate degraded income for a butterfly
    const calculateDegradedIncome = (rarity: string, isVip: boolean, placedAt: Date): number => {
      if (isVip) {
        // VIP butterflies: 60 Cr/h → 6 Cr/h over 72 hours
        return this.calculateDegradedValue(60, 6, placedAt);
      }

      const rarityValues: Record<string, { start: number; min: number }> = {
        'common': { start: 1, min: 1 },       // No degradation for Common
        'uncommon': { start: 2, min: 1 },     // 2 → 1 Cr/h
        'rare': { start: 5, min: 1 },         // 5 → 1 Cr/h  
        'super-rare': { start: 10, min: 1 },  // 10 → 1 Cr/h
        'epic': { start: 20, min: 2 },        // 20 → 2 Cr/h
        'legendary': { start: 50, min: 5 },   // 50 → 5 Cr/h
        'mythical': { start: 100, min: 10 }   // 100 → 10 Cr/h
      };

      const values = rarityValues[rarity] || { start: 1, min: 1 };
      return this.calculateDegradedValue(values.start, values.min, placedAt);
    };
    
    // Add income from normal butterflies (with degradation)
    for (const butterfly of normalButterflies) {
      const degradedIncome = calculateDegradedIncome(butterfly.butterflyRarity, false, butterfly.placedAt);
      totalHourlyIncome += degradedIncome;
    }
    
    // Add income from VIP butterflies (with degradation)
    for (const vipButterfly of vipButterflies) {
      const degradedIncome = calculateDegradedIncome('vip', true, vipButterfly.placedAt);
      totalHourlyIncome += degradedIncome;
    }
    
    if (totalHourlyIncome === 0) {
      return { success: true, creditsEarned: 0 };
    }
    
    // Calculate how many credits can be awarded based on total hourly income
    const minutesPerCredit = 60 / totalHourlyIncome;
    const totalCredits = Math.floor(minutesElapsed / minutesPerCredit);
    
    if (totalCredits > 0) {
      // Update user credits
      await this.updateUserCredits(userId, totalCredits);
      
      // Log passive income (single log entry for all butterflies)
      await this.db.insert(passiveIncomeLog).values({
        userId,
        amount: totalCredits,
        sourceType: 'exhibition',
        sourceDetails: `${normalButterflies.length + vipButterflies.length} butterflies, ${totalHourlyIncome}cr/h`
      });
      
      // Update timestamp by the exact time consumed for the awarded credits
      const minutesConsumed = totalCredits * minutesPerCredit;
      const newLastIncomeTime = new Date(lastIncomeTime.getTime() + minutesConsumed * 60 * 1000);
      await this.db.update(users)
        .set({ lastPassiveIncomeAt: newLastIncomeTime })
        .where(eq(users.id, userId));
      
      console.log(`💰 User ${userId} earned ${totalCredits} credits from exhibition (${totalHourlyIncome}cr/h, ${minutesPerCredit.toFixed(1)}min/cr)`);
    }
    
    return { success: true, creditsEarned: totalCredits };
  }

  async updateUserActivity(userId: number): Promise<void> {
    try {
      // Update user's last activity timestamp to current time
      await this.db.update(users)
        .set({ updatedAt: new Date() })
        .where(eq(users.id, userId));
      
      console.log(`✅ User ${userId} activity timestamp updated`);
    } catch (error) {
      console.error(`❌ Failed to update user ${userId} activity:`, error);
    }
  }

  // Emergency system methods
  async giveUserSeed(userId: number, seedId: number, quantity: number): Promise<void> {
    console.log(`🎁 Giving ${quantity} seeds (ID: ${seedId}) to user ${userId}`);
    
    // Check if user already has this seed type
    const existingUserSeed = await this.db
      .select()
      .from(userSeeds)
      .where(and(eq(userSeeds.userId, userId), eq(userSeeds.seedId, seedId)));
    
    if (existingUserSeed.length > 0) {
      // Update existing quantity
      const newQuantity = existingUserSeed[0].quantity + quantity;
      await this.db
        .update(userSeeds)
        .set({ quantity: newQuantity })
        .where(and(eq(userSeeds.userId, userId), eq(userSeeds.seedId, seedId)));
      
      console.log(`🎁 Updated existing seed: User ${userId} now has ${newQuantity} seeds (ID: ${seedId})`);
    } else {
      // Create new seed entry
      await this.db.insert(userSeeds).values({
        userId,
        seedId,
        quantity,
        createdAt: new Date()
      });
      
      console.log(`🎁 Created new seed entry: User ${userId} received ${quantity} seeds (ID: ${seedId})`);
    }
  }

  async checkEmergencyQualification(userId: number): Promise<{ eligible: boolean; reason?: string }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { eligible: false, reason: "User not found" };
    }

    // Check 1: User has 0 credits
    if (user.credits > 0) {
      return { eligible: false, reason: "Du hast noch Credits verfügbar" };
    }

    // Check 2: User has no seeds
    const userSeedsList = await this.getUserSeeds(userId);
    const totalSeeds = userSeedsList.reduce((sum, seed) => sum + seed.quantity, 0);
    if (totalSeeds > 0) {
      return { eligible: false, reason: "Du hast noch Samen verfügbar" };
    }

    // Check 3: User has less than 3 flowers for bouquet
    const userFlowersList = await this.getUserFlowers(userId);
    if (userFlowersList.length >= 3) {
      return { eligible: false, reason: "Du hast genug Blumen für ein Bouquet" };
    }

    // Check 4: User has no bouquets
    const userBouquetsList = await this.getUserBouquets(userId);
    if (userBouquetsList.length > 0) {
      return { eligible: false, reason: "Du hast noch Bouquets verfügbar" };
    }

    // Check 5: User has no passive income (no exhibition butterflies)
    const exhibitionButterfliesList = await this.getExhibitionButterflies(userId);
    const vipButterfliesList = await this.getExhibitionVipButterflies(userId);
    
    if (exhibitionButterfliesList.length > 0 || vipButterfliesList.length > 0) {
      return { eligible: false, reason: "Du hast passives Einkommen durch Ausstellungs-Schmetterlinge" };
    }

    // User qualifies for emergency seeds!
    return { eligible: true };
  }

  async getAllUsersWithStatus(excludeUserId?: number): Promise<Array<{
    id: number;
    username: string;
    isOnline: boolean;
    exhibitionButterflies: number;
    lastSeen: string;
    totalLikes: number;
  }>> {
    console.log('🔍 PostgreSQL getAllUsersWithStatus: Finding users for user list');
    
    // Get all users
    const allUsers = await this.db.select().from(users);
    console.log(`🔍 Found ${allUsers.length} users total`);
    
    const userList = [];
    
    for (const user of allUsers) {
      // Skip demo users and current user if specified
      if (user.id === 99 || (excludeUserId && user.id === excludeUserId)) continue;
      
      // Count exhibition butterflies for this user
      const butterflyCountResult = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(exhibitionButterflies)
        .where(eq(exhibitionButterflies.userId, user.id));
      
      const butterflyCount = butterflyCountResult[0]?.count || 0;
      
      // Calculate online status based on updatedAt timestamp
      const now = new Date();
      const lastActivity = user.updatedAt || user.createdAt;
      const timeDiff = now.getTime() - lastActivity.getTime();
      const minutesDiff = Math.floor(timeDiff / (1000 * 60));
      
      // Consider user online if last activity was within 5 minutes
      const isOnline = minutesDiff < 5;
      
      // Format last seen
      let lastSeen = '';
      if (!isOnline) {
        if (minutesDiff < 60) {
          lastSeen = `vor ${minutesDiff} Min`;
        } else if (minutesDiff < 1440) { // 24 hours
          const hours = Math.floor(minutesDiff / 60);
          lastSeen = `vor ${hours} Std`;
        } else {
          const days = Math.floor(minutesDiff / 1440);
          lastSeen = `vor ${days} Tag${days === 1 ? '' : 'en'}`;
        }
      }
      
      // Calculate total likes for this user's exhibition
      const totalLikesResult = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(exhibitionFrameLikes)
        .where(eq(exhibitionFrameLikes.frameOwnerId, user.id));
      
      const totalLikes = totalLikesResult[0]?.count || 0;
      
      userList.push({
        id: user.id,
        username: user.username,
        isOnline,
        exhibitionButterflies: butterflyCount,
        lastSeen,
        totalLikes
      });
    }
    
    // Sort by online status first, then by username
    userList.sort((a, b) => {
      if (a.isOnline !== b.isOnline) {
        return b.isOnline ? 1 : -1; // Online users first
      }
      return a.username.localeCompare(b.username);
    });
    
    console.log(`🔍 Processed ${userList.length} users for user list display`);
    return userList;
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

  async getForeignExhibitionVipButterflies(frameOwnerId: number): Promise<any[]> {
    const result = await this.db
      .select()
      .from(exhibitionVipButterflies)
      .where(eq(exhibitionVipButterflies.userId, frameOwnerId));
    
    return result;
  }

  // Bouquet timing methods for butterfly spawner
  async updateBouquetNextSpawnTime(userId: number, fieldIndex: number, nextSpawnAt: Date): Promise<void> {
    // Get current spawn slot for this bouquet
    const currentBouquet = await this.db
      .select()
      .from(placedBouquets)
      .where(and(eq(placedBouquets.userId, userId), eq(placedBouquets.fieldIndex, fieldIndex)))
      .limit(1);

    if (currentBouquet.length === 0) return;

    const currentSlot = (currentBouquet[0] as any).currentSpawnSlot || 1;
    const nextSlot = currentSlot + 1;
    
    // Generate random spawn interval (1-5 minutes)
    const { getRandomSpawnInterval } = await import('./bouquet');
    const randomInterval = getRandomSpawnInterval();
    const actualNextSpawnAt = new Date(Date.now() + randomInterval);

    console.log(`🦋 Bouquet #${currentBouquet[0].bouquetId}: Advancing from slot ${currentSlot} to ${nextSlot} (${nextSlot > 4 ? 'COMPLETED' : 'Active'})`);
    
    await this.db
      .update(placedBouquets)
      .set({ 
        nextSpawnAt: actualNextSpawnAt,
        currentSpawnSlot: nextSlot 
      })
      .where(and(eq(placedBouquets.userId, userId), eq(placedBouquets.fieldIndex, fieldIndex)));
  }

  // ========== WEEKLY CHALLENGE SYSTEM ==========

  async getCurrentWeeklyChallenge(): Promise<WeeklyChallenge | null> {
    try {
      const now = new Date();
      
      const challenge = await this.db
        .select()
        .from(weeklyChallenges)
        .where(eq(weeklyChallenges.isActive, true))
        .limit(1);

      console.log('🌸 Retrieved weekly challenge:', challenge[0] || 'No active challenge');
      return challenge[0] || null;
    } catch (error) {
      console.error('Error retrieving weekly challenge:', error);
      throw error;
    }
  }

  async createWeeklyChallenge(): Promise<WeeklyChallenge> {
    // Get current Monday 0:00
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(monday.getDate() - (monday.getDay() === 0 ? 6 : monday.getDay() - 1));
    monday.setHours(0, 0, 0, 0);
    
    // Sunday 18:00 
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(18, 0, 0, 0);

    // Generate week number (YYYY-WW format)
    const year = monday.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (monday.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

    // Generate 6 random flowers: 2 uncommon, 2 rare, 2 super-rare
    const flowerIds = {
      uncommon1: this.getRandomFlowerByRarity("uncommon"),
      uncommon2: this.getRandomFlowerByRarity("uncommon"), 
      rare1: this.getRandomFlowerByRarity("rare"),
      rare2: this.getRandomFlowerByRarity("rare"),
      superrare1: this.getRandomFlowerByRarity("super-rare"),
      superrare2: this.getRandomFlowerByRarity("super-rare")
    };

    const challengeData = {
      weekNumber: parseInt(`${year}${weekNumber.toString().padStart(2, '0')}`),
      year,
      startTime: monday,
      endTime: sunday,
      isActive: true,
      flowerId1: flowerIds.uncommon1,
      flowerId2: flowerIds.uncommon2,
      flowerId3: flowerIds.rare1,
      flowerId4: flowerIds.rare2,
      flowerId5: flowerIds.superrare1,
      flowerId6: flowerIds.superrare2
    };

    const result = await this.db.insert(weeklyChallenges).values(challengeData).returning();
    console.log('🌸 Created new weekly challenge:', challengeData);
    
    // Initialize all users with 0 points (invisible until they donate)
    await this.initializeUsersForChallenge(result[0].id);
    
    return result[0];
  }

  async deactivateChallenge(challengeId: number): Promise<void> {
    try {
      await this.db
        .update(weeklyChallenges)
        .set({ isActive: false })
        .where(eq(weeklyChallenges.id, challengeId));
      
      console.log(`🌸 Deactivated challenge ${challengeId}`);
    } catch (error) {
      console.error('Error deactivating challenge:', error);
      throw error;
    }
  }

  private getRandomFlowerByRarity(targetRarity: string): number {
    // Based on rarity distribution from replit.md:
    // Uncommon: 56-100, Rare: 101-135, Super-rare: 136-160
    const ranges = {
      "uncommon": { min: 56, max: 100 },
      "rare": { min: 101, max: 135 }, 
      "super-rare": { min: 136, max: 160 }
    };
    
    const range = ranges[targetRarity as keyof typeof ranges];
    if (!range) return 1; // fallback
    
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  }

  async donateFlowerToChallenge(userId: number, donation: DonateChallengeFlowerRequest): Promise<{ success: boolean; message?: string; seedsReceived?: number }> {
    // Check if user has enough flowers
    const userFlower = await this.db
      .select()
      .from(userFlowers)
      .where(and(
        eq(userFlowers.userId, userId),
        eq(userFlowers.flowerId, donation.flowerId)
      ))
      .limit(1);

    if (!userFlower[0] || userFlower[0].quantity < donation.quantity) {
      return { success: false, message: "Nicht genügend Blumen vorhanden" };
    }

    // Deduct flowers from user
    const newQuantity = userFlower[0].quantity - donation.quantity;
    if (newQuantity === 0) {
      await this.db
        .delete(userFlowers)
        .where(and(
          eq(userFlowers.userId, userId),
          eq(userFlowers.flowerId, donation.flowerId)
        ));
    } else {
      await this.db
        .update(userFlowers)
        .set({ quantity: newQuantity })
        .where(and(
          eq(userFlowers.userId, userId),
          eq(userFlowers.flowerId, donation.flowerId)
        ));
    }

    // Record donation
    await this.db.insert(challengeDonations).values({
      challengeId: donation.challengeId,
      userId,
      flowerId: donation.flowerId,
      quantity: donation.quantity
    });

    // Give seeds (ALWAYS 1 seed per donated flower: 50% same rarity, 50% one tier higher)
    let seedsReceived = 0;
    for (let i = 0; i < donation.quantity; i++) {
      const rewardSeed = this.getChallengeRewardSeed(userFlower[0].flowerRarity || "common");
      await this.giveUserSeed(userId, rewardSeed, 1);
      seedsReceived++;
    }

    console.log(`🌸 User ${userId} donated ${donation.quantity}x flower ${donation.flowerId}, received ${seedsReceived} seeds`);
    
    return { 
      success: true, 
      message: `${donation.quantity} Blumen gespendet!`,
      seedsReceived 
    };
  }

  private getChallengeRewardSeed(currentRarity: string): number {
    // 50% same rarity, 50% one tier higher (never lower!)
    const sameRarity = Math.random() < 0.5;
    
    const rarityToSeedMap = {
      "common": 1,
      "uncommon": 2,
      "rare": 3,
      "super-rare": 4,
      "epic": 5,
      "legendary": 5, // legendary can't go higher, stays legendary
      "mythical": 5  // mythical can't go higher, stays legendary
    };
    
    const currentSeedId = rarityToSeedMap[currentRarity as keyof typeof rarityToSeedMap] || 1;
    
    if (sameRarity) {
      return currentSeedId; // Same rarity as donated flower
    } else {
      // One tier higher (max legendary = seedId 5)
      return Math.min(currentSeedId + 1, 5);
    }
  }

  async getChallengeLeaderboard(challengeId: number): Promise<any[]> {
    const donations = await this.db
      .select({
        userId: challengeDonations.userId,
        totalDonations: challengeDonations.quantity
      })
      .from(challengeDonations)
      .where(eq(challengeDonations.challengeId, challengeId));

    // Group by user and sum donations
    const userTotals = new Map();
    donations.forEach((d: any) => {
      const current = userTotals.get(d.userId) || 0;
      userTotals.set(d.userId, current + d.totalDonations);
    });

    // Get user details and sort by total donations - ONLY show users with > 0 donations
    const leaderboard = [];
    for (const [userId, total] of userTotals) {
      if (total > 0) { // Only show users who actually donated
        const user = await this.getUser(userId);
        if (user) {
          leaderboard.push({
            userId,
            username: user.username,
            totalDonations: total
          });
        }
      }
    }

    return leaderboard.sort((a, b) => b.totalDonations - a.totalDonations);
  }

  async processChallengeRewards(challengeId: number): Promise<void> {
    const leaderboard = await this.getChallengeLeaderboard(challengeId);
    
    for (let rank = 1; rank <= Math.min(10, leaderboard.length); rank++) {
      const user = leaderboard[rank - 1];
      let butterfly;
      let isAnimated = false;
      let passiveIncome = 0;

      if (rank === 1) {
        // VIP Animated butterfly with passive income - use real VIP system
        // Get available VIP files dynamically
        const availableVipIds = await this.getAvailableVipIds();
        const randomVipId = availableVipIds[Math.floor(Math.random() * availableVipIds.length)];
        const vipButterflyName = `VIP Mariposa ${this.getVipName(randomVipId)}`;
        
        // Add VIP butterfly to user's collection using VIP system
        await this.addVipButterflyToInventory(user.userId, randomVipId, vipButterflyName, `/VIP/VIP${randomVipId}.gif`);
        
        console.log(`🏆 Winner ${user.username} received VIP butterfly: ${vipButterflyName}`);
        
        // Record VIP reward in challenge rewards (modify structure for VIP)
        await this.db.insert(challengeRewards).values({
          challengeId,
          userId: user.userId,
          rank,
          totalDonations: user.totalDonations,
          butterflyId: randomVipId,
          butterflyName: vipButterflyName,
          butterflyRarity: "vip",
          butterflyImageUrl: `/VIP/VIP${randomVipId}.gif`,
          isAnimated: true,
          passiveIncome: 60
        });
        
        continue; // Skip normal butterfly processing for rank 1
      } else if (rank === 2) {
        butterfly = this.getRandomButterflyByRarity("epic");
      } else if (rank === 3) {
        butterfly = this.getRandomButterflyByRarity("super-rare");
      } else {
        butterfly = this.getRandomButterflyByRarity("rare");
      }

      // Add butterfly to user's collection
      await this.db.insert(userButterflies).values({
        userId: user.userId,
        butterflyId: butterfly.id,
        butterflyName: butterfly.name,
        butterflyRarity: butterfly.rarity,
        butterflyImageUrl: butterfly.imageUrl,
        isAnimated,
        passiveIncome
      });

      // Record reward
      await this.db.insert(challengeRewards).values({
        challengeId,
        userId: user.userId,
        rank,
        totalDonations: user.totalDonations,
        butterflyId: butterfly.id,
        butterflyName: butterfly.name,
        butterflyRarity: butterfly.rarity,
        butterflyImageUrl: butterfly.imageUrl,
        isAnimated,
        passiveIncome
      });
    }

    console.log(`🏆 Processed rewards for challenge ${challengeId}, ${leaderboard.length} participants`);
    
    // Reset all users to 0 points after processing rewards
    await this.resetAllUsersForNewChallenge();
  }

  async initializeUsersForChallenge(challengeId: number): Promise<void> {
    try {
      // Get all existing users
      const allUsers = await this.db.select({ id: users.id }).from(users);
      
      // Create 0-donation entries for all users (invisible until they donate)
      const initialEntries = allUsers.map((user: any) => ({
        challengeId,
        userId: user.id,
        flowerId: 1, // Dummy flower ID for initialization
        quantity: 0,
        createdAt: new Date()
      }));
      
      if (initialEntries.length > 0) {
        await this.db.insert(challengeDonations).values(initialEntries);
        console.log(`🌸 Initialized ${initialEntries.length} users with 0 points for challenge ${challengeId}`);
      }
    } catch (error) {
      console.error('🌸 Error initializing users for challenge:', error);
    }
  }

  async resetAllUsersForNewChallenge(): Promise<void> {
    try {
      // This happens naturally when a new challenge is created with 0-point entries
      console.log('🌸 User points will be reset with next challenge creation');
    } catch (error) {
      console.error('🌸 Error resetting users for new challenge:', error);
    }
  }

  private getRandomButterflyByRarity(targetRarity: string): any {
    return generateRandomButterfly(targetRarity as RarityTier);
  }

  private async getAvailableVipIds(): Promise<number[]> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const vipDir = path.join(process.cwd(), 'client/public/VIP');
      const files = await fs.readdir(vipDir);
      
      // Extract VIP numbers from VIPx.gif files
      const vipIds: number[] = [];
      files.forEach(file => {
        const match = file.match(/^VIP(\d+)\.gif$/i);
        if (match) {
          const vipId = parseInt(match[1]);
          if (!isNaN(vipId)) {
            vipIds.push(vipId);
          }
        }
      });
      
      // Sort and return available VIP IDs
      const sortedIds = vipIds.sort((a, b) => a - b);
      console.log(`🦋 Found ${sortedIds.length} VIP butterfly files: VIP${sortedIds.join('.gif, VIP')}.gif`);
      
      return sortedIds.length > 0 ? sortedIds : [1]; // Fallback to VIP1 if none found
    } catch (error) {
      console.error('🦋 Error reading VIP directory:', error);
      return [1]; // Fallback to VIP1
    }
  }

  private getVipName(vipId: number): string {
    const vipNames = [
      'Dorada',     // VIP1
      'Platinada',  // VIP2  
      'Diamante',   // VIP3
      'Celestial',  // VIP4
      'Imperial',   // VIP5
      'Divina',     // VIP6
      'Suprema',    // VIP7
      'Legendaria', // VIP8
      'Mística',    // VIP9
      'Eterna'      // VIP10
    ];
    
    // Return name based on VIP ID, with fallback pattern for higher numbers
    if (vipId <= vipNames.length) {
      return vipNames[vipId - 1];
    } else {
      return `Extraordinaria ${vipId}`;
    }
  }


  /**
   * Get the time when the first exhibition butterfly was placed for a user
   */
  async getFirstButterflyPlacedTime(userId: number): Promise<Date | null> {
    try {
      // Check both normal and VIP exhibition butterflies
      const normalButterflies = await this.db
        .select()
        .from(exhibitionButterflies)
        .where(eq(exhibitionButterflies.userId, userId))
        .orderBy(exhibitionButterflies.placedAt)
        .limit(1);
        
      const vipButterflies = await this.db
        .select()
        .from(exhibitionVipButterflies)
        .where(eq(exhibitionVipButterflies.userId, userId))
        .orderBy(exhibitionVipButterflies.placedAt)
        .limit(1);
      
      const firstNormal = normalButterflies[0]?.placedAt;
      const firstVip = vipButterflies[0]?.placedAt;
      
      if (!firstNormal && !firstVip) {
        return null;
      }
      
      if (!firstNormal) return new Date(firstVip);
      if (!firstVip) return new Date(firstNormal);
      
      // Return whichever came first
      return new Date(firstNormal) < new Date(firstVip) 
        ? new Date(firstNormal) 
        : new Date(firstVip);
        
    } catch (error) {
      console.error('Error getting first butterfly placed time:', error);
      return null;
    }
  }

  /**
   * 🔧 ADMIN: Fix passive income time bug for a user
   * Resets lastPassiveIncomeAt to NULL, allowing the system to use current time
   */
  async fixPassiveIncomeTime(userId: number): Promise<void> {
    console.log(`🔧 Fixing passive income time for user ${userId}`);
    
    await this.db
      .update(users)
      .set({ lastPassiveIncomeAt: null })
      .where(eq(users.id, userId));
      
    console.log(`✅ Passive income time fixed for user ${userId}`);
  }

  // Sun Spawn Management
  /**
   * Get all active sun spawns
   */
  async getActiveSunSpawns(): Promise<any[]> {
    const now = new Date();
    return await this.db
      .select()
      .from(sunSpawns)
      .where(and(
        eq(sunSpawns.isActive, true),
        gt(sunSpawns.expiresAt, now) // Still active (not expired yet)
      ));
  }

  /**
   * Get active sun spawns for a specific user
   */
  async getActiveSunSpawnsForUser(userId: number): Promise<any[]> {
    const now = new Date();
    
    return await this.db
      .select()
      .from(sunSpawns)
      .where(and(
        eq(sunSpawns.userId, userId), // Only return suns that belong to this user
        eq(sunSpawns.isActive, true),
        gt(sunSpawns.expiresAt, now) // Still active (not expired yet)
      ));
  }

  /**
   * Spawn a new sun on a field for a specific user
   */
  async spawnSun(fieldIndex: number, userId: number): Promise<{ success: boolean; sunAmount: number }> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 1000); // 30 seconds
    const sunAmount = Math.floor(Math.random() * 3) + 1; // 1-3 suns

    try {
      console.log(`☀️ Spawning ${sunAmount} suns on field ${fieldIndex} for user ${userId}`);
      
      await this.db
        .insert(sunSpawns)
        .values({
          userId,
          fieldIndex,
          spawnedAt: now,
          expiresAt,
          sunAmount,
          isActive: true
        });

      return { success: true, sunAmount };
    } catch (error) {
      console.error('Error spawning sun:', error);
      return { success: false, sunAmount: 0 };
    }
  }

  /**
   * Collect sun from a field
   */
  async collectSun(fieldIndex: number): Promise<{ success: boolean; sunAmount: number; message: string }> {
    const now = new Date();
    
    try {
      // Find active sun spawn on this field
      const activeSun = await this.db
        .select()
        .from(sunSpawns)
        .where(and(
          eq(sunSpawns.fieldIndex, fieldIndex),
          eq(sunSpawns.isActive, true),
          gt(sunSpawns.expiresAt, now) // Not expired yet
        ))
        .limit(1);

      if (activeSun.length === 0) {
        return { success: false, sunAmount: 0, message: 'Keine Sonne zum Einsammeln gefunden' };
      }

      const sun = activeSun[0];
      
      // Deactivate the sun spawn
      await this.db
        .update(sunSpawns)
        .set({ isActive: false })
        .where(eq(sunSpawns.id, sun.id));

      console.log(`☀️ Collected ${sun.sunAmount} suns from field ${fieldIndex}`);
      
      return { 
        success: true, 
        sunAmount: sun.sunAmount, 
        message: `${sun.sunAmount} Sonnen eingesammelt!` 
      };
    } catch (error) {
      console.error('Error collecting sun:', error);
      return { success: false, sunAmount: 0, message: 'Fehler beim Einsammeln der Sonne' };
    }
  }

  /**
   * Clean up expired sun spawns
   */
  async cleanupExpiredSuns(): Promise<void> {
    const now = new Date();
    
    try {
      const result = await this.db
        .update(sunSpawns)
        .set({ isActive: false })
        .where(and(
          eq(sunSpawns.isActive, true),
          lt(sunSpawns.expiresAt, now)
        ));

      console.log(`☀️ Cleaned up expired sun spawns`);
    } catch (error) {
      console.error('Error cleaning up expired suns:', error);
    }
  }


  /**
   * Check for active sun on specific field
   */
  async getActiveSunOnField(fieldIndex: number): Promise<any | null> {
    const now = new Date();
    
    try {
      const activeSun = await this.db
        .select()
        .from(sunSpawns)
        .where(and(
          eq(sunSpawns.fieldIndex, fieldIndex),
          eq(sunSpawns.isActive, true),
          gt(sunSpawns.expiresAt, now)
        ))
        .limit(1);

      return activeSun.length > 0 ? activeSun[0] : null;
    } catch (error) {
      console.error('Error checking active sun on field:', error);
      return null;
    }
  }

  // REMOVED: Duplicate updateUserSuns function (exists on line 437)

  /**
   * Get butterfly sell price for suns (direct sale from inventory)
   */
  getButterflyToSunsPrice(rarity: string): number {
    const prices = {
      'common': 30,
      'uncommon': 45,
      'rare': 70,
      'super-rare': 100,
      'epic': 150,
      'legendary': 250,
      'mythical': 500
    };
    return prices[rarity as keyof typeof prices] || 30;
  }

  /**
   * Sell butterfly from inventory directly for suns
   */
  async sellButterflyForSuns(userId: number, butterflyId: number): Promise<{ success: boolean; message?: string; sunsEarned?: number }> {
    try {
      // Find the butterfly in user's collection
      const userButterfliesData = await this.getUserButterflies(userId);
      const butterfly = userButterfliesData.find(b => b.id === butterflyId);
      
      if (!butterfly) {
        return { success: false, message: "Schmetterling nicht gefunden" };
      }

      // Check ownership
      if (butterfly.userId !== userId) {
        return { success: false, message: "Dieser Schmetterling gehört dir nicht" };
      }

      // Calculate suns earned
      const sunsEarned = this.getButterflyToSunsPrice(butterfly.butterflyRarity);

      // Remove butterfly from user's collection (reduce quantity by 1)
      if (butterfly.quantity <= 1) {
        // Remove completely if only 1 left
        await this.db
          .delete(userButterflies)
          .where(eq(userButterflies.id, butterflyId));
      } else {
        // Reduce quantity by 1
        await this.db
          .update(userButterflies)
          .set({ quantity: butterfly.quantity - 1 })
          .where(eq(userButterflies.id, butterflyId));
      }

      // Add suns to user
      const user = await this.updateUserSuns(userId, sunsEarned);
      if (user) {
        console.log(`☀️ Suns Update: User ${userId} +${sunsEarned} ☀️ = ${user.suns} ☀️`);
      }

      console.log(`☀️ Sold ${butterfly.butterflyName} for ${sunsEarned} suns`);
      return { success: true, sunsEarned };
    } catch (error) {
      console.error('Error selling butterfly for suns:', error);
      return { success: false, message: "Fehler beim Verkauf des Schmetterlings" };
    }
  }

  // Enhanced system: Spawn butterfly on a garden field with slot-based guarantee system
  async spawnButterflyOnFieldWithSlot(userId: number, bouquetId: number, bouquetRarity: RarityTier, currentSlot: number, totalSlots: number, alreadySpawnedCount: number): Promise<{ success: boolean; fieldButterfly?: FieldButterfly; fieldIndex?: number }> {
    const { generateRandomButterfly, shouldSpawnButterfly } = await import('./bouquet');
    
    // For all bouquets: guarantee at least 1 spawn if this is the final slot and none spawned yet
    const shouldGuaranteeSpawn = currentSlot === totalSlots && alreadySpawnedCount === 0;
    
    // Check if butterfly should spawn based on rarity (with guarantee logic)
    if (!shouldGuaranteeSpawn && !shouldSpawnButterfly(bouquetRarity, currentSlot, totalSlots)) {
      return { success: false };
    }

    return this.spawnButterflyOnField(userId, bouquetId, bouquetRarity);
  }
  
  /**
   * Pond feeding progress methods for persistent storage
   */
  async updatePondFeedingProgress(userId: number, fieldIndex: number): Promise<number> {
    try {
      console.log(`🐟 Updating pond feeding progress for user ${userId} field ${fieldIndex}`);
      
      // Check if feeding progress already exists for this user-field combination
      const existing = await this.db.select().from(pondFeedingProgressTable).where(
        and(
          eq(pondFeedingProgressTable.userId, userId),
          eq(pondFeedingProgressTable.fieldIndex, fieldIndex)
        )
      );
      
      if (existing.length > 0) {
        // Increment existing progress
        const newCount = existing[0].feedingCount + 1;
        
        if (newCount >= 3) {
          // DON'T delete progress here! Update to 3 and let caller handle fish creation and cleanup  
          await this.db
            .update(pondFeedingProgressTable)
            .set({ 
              feedingCount: 3,
              lastFedAt: new Date()
            })
            .where(eq(pondFeedingProgressTable.id, existing[0].id));
          console.log(`🐟 Updated feeding progress to 3 for user ${userId} field ${fieldIndex} - ready for fish creation`);
          return 3; // Return 3 to indicate fish creation needed
        } else {
          // Update progress
          await this.db
            .update(pondFeedingProgressTable)
            .set({ 
              feedingCount: newCount,
              lastFedAt: new Date()
            })
            .where(eq(pondFeedingProgressTable.id, existing[0].id));
          console.log(`🐟 Updated feeding progress to ${newCount} for user ${userId} field ${fieldIndex}`);
          return newCount;
        }
      } else {
        // Create new progress entry
        await this.db.insert(pondFeedingProgressTable).values({
          userId,
          fieldIndex,
          feedingCount: 1,
          lastFedAt: new Date()
        });
        console.log(`🐟 Created new feeding progress (1) for user ${userId} field ${fieldIndex}`);
        return 1;
      }
      
    } catch (error) {
      console.error('🐟 Error updating pond feeding progress:', error);
      throw error;
    }
  }
  
  async getUserPondProgress(userId: number): Promise<Record<number, number>> {
    try {
      console.log(`🐟 Getting pond progress for user ${userId}`);
      
      const progressEntries = await this.db.select().from(pondFeedingProgressTable).where(
        eq(pondFeedingProgressTable.userId, userId)
      );
      
      const userProgress: Record<number, number> = {};
      for (const entry of progressEntries) {
        userProgress[entry.fieldIndex] = entry.feedingCount;
      }
      
      console.log(`🐟 Retrieved pond progress for user ${userId}:`, userProgress);
      return userProgress;
      
    } catch (error) {
      console.error('🐟 Error getting user pond progress:', error);
      throw error;
    }
  }
  
  /**
   * Field Fish system methods
   */
  async spawnFishOnField(userId: number, pondFieldIndex: number, customRarity?: string): Promise<{ fishName: string, fishRarity: RarityTier }> {
    try {
      console.log(`🐟 SPAWNING FISH: field ${pondFieldIndex} for user ${userId}${customRarity ? ` with custom rarity: ${customRarity}` : ''}`);
      
      // Check if a fish already exists on this field and remove it first
      const existingFish = await this.db
        .select()
        .from(fieldFish)
        .where(and(
          eq(fieldFish.userId, userId),
          eq(fieldFish.fieldIndex, pondFieldIndex)
        ))
        .limit(1);
      
      if (existingFish.length > 0) {
        console.log(`🐟 WARNING: Fish already exists on field ${pondFieldIndex}, removing old fish first`);
        await this.db
          .delete(fieldFish)
          .where(and(
            eq(fieldFish.userId, userId),
            eq(fieldFish.fieldIndex, pondFieldIndex)
          ));
        console.log(`🐟 Removed existing fish from field ${pondFieldIndex}`);
      }
      
      // Use custom rarity if provided, otherwise generate random
      const rarity = (customRarity as RarityTier) || getRandomCreatureRarity();
      const fishData = await generateRandomFish(rarity);
      
      console.log(`🐟 Generated fish: ${fishData.name} (${rarity}) - ID: ${fishData.id} for field ${pondFieldIndex}`);
      
      // Spawn fish on field first (not directly in inventory)
      await this.db.insert(fieldFish).values({
        userId,
        fieldIndex: pondFieldIndex,
        fishId: fishData.id,
        fishName: fishData.name,
        fishRarity: rarity,
        fishImageUrl: fishData.imageUrl,
        spawnedAt: new Date(),
        isShrinking: false
      });
      
      console.log(`🐟 ✅ FISH SPAWNED SUCCESSFULLY: ${fishData.name} (${rarity}) on pond field ${pondFieldIndex}`);
      return { fishName: fishData.name, fishRarity: rarity };
      
    } catch (error) {
      console.error('🐟 Error spawning fish on field:', error);
      throw error;
    }
  }

  // REMOVED: In-memory storage - using PostgreSQL-only storage per replit.md requirements
  

  // Get current average rarity of fed caterpillars for a field from PostgreSQL
  async getCurrentFeedingAverageRarity(userId: number, fieldIndex: number): Promise<string> {
    try {
      // Get fed caterpillars from PostgreSQL for this field
      const fedCaterpillars = await this.db
        .select()
        .from(fedCaterpillarsTable)
        .where(and(
          eq(fedCaterpillarsTable.userId, userId),
          eq(fedCaterpillarsTable.fieldIndex, fieldIndex)
        ))
        .orderBy(fedCaterpillarsTable.fedAt);
      
      const rarities = fedCaterpillars.map(c => c.caterpillarRarity);
      console.log(`🐟 DEBUG: Getting average for field ${fieldIndex}, PostgreSQL rarities:`, rarities);
      
      if (rarities.length === 0) {
        console.log(`🐟 DEBUG: No rarities in PostgreSQL, returning 'common'`);
        return 'common'; // Default if no caterpillars fed yet
      }
      
      const averageRarity = this.calculateAverageRarity(rarities);
      console.log(`🐟 DEBUG: Calculated average from [${rarities.join(', ')}] = ${averageRarity}`);
      return averageRarity;
    } catch (error) {
      console.error('🐟 Error getting current feeding average rarity:', error);
      return 'common';
    }
  }
  
  // Complete fish feeding with caterpillar - handles average calculation and fish creation
  async feedFishWithCaterpillar(userId: number, fieldIndex: number, caterpillarRarity: string): Promise<any> {
    try {
      // Get fed caterpillars from PostgreSQL for this field
      const fedCaterpillars = await this.db
        .select()
        .from(fedCaterpillarsTable)
        .where(and(
          eq(fedCaterpillarsTable.userId, userId),
          eq(fedCaterpillarsTable.fieldIndex, fieldIndex)
        ))
        .orderBy(fedCaterpillarsTable.fedAt);
      
      const rarities = fedCaterpillars.map(c => c.caterpillarRarity);
      console.log(`🐟 Fed caterpillar rarities from PostgreSQL for field ${fieldIndex}:`, rarities);
      
      if (rarities.length < 3) {
        throw new Error(`Not enough caterpillars fed (${rarities.length}/3)`);
      }
      
      // Calculate average rarity
      const averageRarity = this.calculateAverageRarity(rarities);
      console.log(`🐟 Calculated average rarity from [${rarities.join(', ')}] = ${averageRarity}`);
      
      // Spawn fish with calculated average rarity
      console.log(`🐟 CALLING spawnFishOnField with fieldIndex: ${fieldIndex}`);
      const fishResult = await this.spawnFishOnField(userId, fieldIndex, averageRarity);
      console.log('🐟 FISH SPAWNED SUCCESS with CALCULATED AVERAGE RARITY:', fishResult);
      
      // Clean up fed caterpillars AND pond progress from PostgreSQL after fish creation  
      await this.db
        .delete(fedCaterpillarsTable)
        .where(and(
          eq(fedCaterpillarsTable.userId, userId),
          eq(fedCaterpillarsTable.fieldIndex, fieldIndex)
        ));
      
      await this.db
        .delete(pondFeedingProgressTable)
        .where(and(
          eq(pondFeedingProgressTable.userId, userId),
          eq(pondFeedingProgressTable.fieldIndex, fieldIndex)
        ));
      
      console.log(`🐟 Cleaned up fed caterpillars AND pond progress from PostgreSQL for field ${fieldIndex}`);
      
      return {
        feedingCount: 3,
        fishCreated: true,
        fishName: fishResult.fishName,
        fishRarity: fishResult.fishRarity
      };
      
    } catch (error) {
      console.error('🐟 Error in feedFishWithCaterpillar:', error);
      throw error;
    }
  }

  async addFedCaterpillar(userId: number, fieldIndex: number, caterpillarRarity: string): Promise<void> {
    try {
      console.log(`🐟 Adding fed caterpillar to PostgreSQL: user ${userId}, field ${fieldIndex}, rarity ${caterpillarRarity}`);
      
      await this.db.insert(fedCaterpillarsTable).values({
        userId: userId,
        fieldIndex: fieldIndex,
        caterpillarId: 0, // Not used for fish feeding tracking
        caterpillarRarity: caterpillarRarity,
        fedAt: new Date()
      });
      
      console.log(`🐟 Successfully stored fed caterpillar for field ${fieldIndex}`);
      
    } catch (error) {
      console.error('🐟 Error adding fed caterpillar:', error);
      throw error;
    }
  }

  async updatePondFeedingProgressWithTracking(userId: number, fieldIndex: number, caterpillarRarity: string): Promise<number> {
    // ATOMIC TRANSACTION to prevent synchronization issues
    return await this.db.transaction(async (tx) => {
      console.log(`🐟 🔐 ATOMIC: Updating pond feeding progress for user ${userId}, field ${fieldIndex} with caterpillar rarity: ${caterpillarRarity}`);
      
      // 1. Store caterpillar rarity in PostgreSQL fedCaterpillars table
      await tx.insert(fedCaterpillarsTable).values({
        userId: userId,
        fieldIndex: fieldIndex,
        caterpillarId: 0, // Not used for fish feeding, only for tracking
        caterpillarRarity: caterpillarRarity,
        fedAt: new Date()
      });
      console.log(`🐟 🔐 ATOMIC: Fed caterpillar inserted successfully`);
      
      // 2. Get current fed caterpillars count from PostgreSQL (within transaction)
      const fedCaterpillars = await tx
        .select()
        .from(fedCaterpillarsTable)
        .where(and(
          eq(fedCaterpillarsTable.userId, userId),
          eq(fedCaterpillarsTable.fieldIndex, fieldIndex)
        ));
      
      const feedingCount = fedCaterpillars.length;
      console.log(`🐟 🔐 ATOMIC: Fed caterpillars count from PostgreSQL for field ${fieldIndex}: ${feedingCount}`);
      console.log(`🐟 🔐 ATOMIC: Fed caterpillar rarities:`, fedCaterpillars.map(c => c.caterpillarRarity));
      
      // 3. Update feeding progress within same transaction
      const existingProgress = await tx
        .select()
        .from(pondFeedingProgressTable)
        .where(and(
          eq(pondFeedingProgressTable.userId, userId),
          eq(pondFeedingProgressTable.fieldIndex, fieldIndex)
        ));
      
      let newProgress: number;
      if (existingProgress.length > 0) {
        // Update existing progress
        await tx
          .update(pondFeedingProgressTable)
          .set({ feedingCount: feedingCount, updatedAt: new Date() })
          .where(and(
            eq(pondFeedingProgressTable.userId, userId),
            eq(pondFeedingProgressTable.fieldIndex, fieldIndex)
          ));
        newProgress = feedingCount;
      } else {
        // Create new progress entry
        await tx.insert(pondFeedingProgressTable).values({
          userId: userId,
          fieldIndex: fieldIndex,
          feedingCount: feedingCount,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        newProgress = feedingCount;
      }
      
      console.log(`🐟 🔐 ATOMIC: Updated feeding progress to ${newProgress} for user ${userId} field ${fieldIndex}`);
      
      // If fish is created (3 feedings), log that we're ready
      if (newProgress >= 3) {
        console.log(`🐟 🔐 ATOMIC: Fish will be created, rarities ready for average:`, fedCaterpillars.map(c => c.caterpillarRarity));
      }
      
      return newProgress;
    });
  }

  async spawnFishOnFieldWithAverageRarity(userId: number, pondFieldIndex: number): Promise<{ fishName: string, fishRarity: RarityTier }> {
    try {
      console.log(`🐟 Spawning fish on field ${pondFieldIndex} for user ${userId} with AVERAGE rarity`);
      
      // Get stored caterpillar rarities for this field from database
      const fedCaterpillars = await this.getFieldCaterpillars(userId);
      const pondCaterpillars = fedCaterpillars.filter(c => c.fieldIndex === pondFieldIndex);
      const rarities = pondCaterpillars.map(c => c.caterpillarRarity);
      
      console.log(`🐟 Fed caterpillar rarities for average calculation:`, rarities);
      
      if (rarities.length === 0) {
        // Fallback to random if no rarities stored (shouldn't happen)
        console.warn('🐟 No fed caterpillar rarities found, using random rarity');
        const fishRarity = getRandomCreatureRarity();
        const fishData = await generateRandomFish(fishRarity);
        
        await this.db.insert(fieldFish).values({
          userId,
          fieldIndex: pondFieldIndex,
          fishId: fishData.id,
          fishName: fishData.name,
          fishRarity: fishRarity,
          fishImageUrl: fishData.imageUrl,
          spawnedAt: new Date(),
          isShrinking: false
        });
        
        return { fishName: fishData.name, fishRarity: fishRarity };
      }
      
      // Calculate average rarity from fed caterpillars
      const averageRarity = this.calculateAverageRarity(rarities);
      console.log(`🐟 Calculated average rarity from [${rarities.join(', ')}] = ${averageRarity}`);
      
      const fishData = await generateRandomFish(averageRarity);
      
      console.log(`🐟 Generated fish: ${fishData.name} (${averageRarity}) from average of caterpillars - ID: ${fishData.id}`);
      
      // Spawn fish on field first (not directly in inventory)
      await this.db.insert(fieldFish).values({
        userId,
        fieldIndex: pondFieldIndex,
        fishId: fishData.id,
        fishName: fishData.name,
        fishRarity: averageRarity,
        fishImageUrl: fishData.imageUrl,
        spawnedAt: new Date(),
        isShrinking: false
      });
      
      // Clean up fed caterpillars after creating fish  
      await this.db.delete(fieldCaterpillars)
        .where(and(
          eq(fieldCaterpillars.userId, userId),
          eq(fieldCaterpillars.fieldIndex, pondFieldIndex)
        ));
      console.log(`🐟 Cleaned up stored caterpillar rarities for field ${pondFieldIndex}`);
      
      console.log(`🐟 Successfully spawned ${fishData.name} (${averageRarity}) on pond field ${pondFieldIndex} based on average caterpillar rarity`);
      return { fishName: fishData.name, fishRarity: averageRarity };
      
    } catch (error) {
      console.error('🐟 Error spawning fish on field with average rarity:', error);
      throw error;
    }
  }

  private calculateAverageRarity(rarities: string[]): RarityTier {
    // Map rarities to numeric values for averaging
    const rarityValues: Record<string, number> = {
      'common': 0,
      'uncommon': 1, 
      'rare': 2,
      'super-rare': 3,
      'epic': 4,
      'legendary': 5,
      'mythical': 6
    };
    
    const valueToRarity: RarityTier[] = [
      'common',
      'uncommon', 
      'rare',
      'super-rare',
      'epic',
      'legendary',
      'mythical'
    ];
    
    // Calculate average numeric value
    const totalValue = rarities.reduce((sum, rarity) => {
      return sum + (rarityValues[rarity] || 0);
    }, 0);
    
    const averageValue = Math.round(totalValue / rarities.length);
    const clampedValue = Math.max(0, Math.min(6, averageValue));
    
    const result = valueToRarity[clampedValue];
    console.log(`🐟 Average calculation: [${rarities.join(', ')}] → values [${rarities.map(r => rarityValues[r] || 0).join(', ')}] → avg ${totalValue}/${rarities.length} = ${averageValue} → ${result}`);
    
    return result;
  }
  
  async getFieldFish(userId: number): Promise<any[]> {
    try {
      console.log(`🐟 Getting field fish for user: ${userId}`);
      
      const fieldFishList = await this.db.select().from(fieldFish).where(
        eq(fieldFish.userId, userId)
      );
      
      console.log(`🐟 Found field fish: ${fieldFishList.length}`);
      return fieldFishList;
    } catch (error) {
      console.error('🐟 Error getting field fish:', error);
      throw error;
    }
  }
  
  async collectFieldFish(userId: number, fieldFishId: number): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(`🐟 Collecting field fish ${fieldFishId} for user ${userId}`);
      
      // Get the field fish data
      const fieldFishData = await this.db.select().from(fieldFish).where(
        and(
          eq(fieldFish.id, fieldFishId),
          eq(fieldFish.userId, userId)
        )
      ).limit(1);
      
      if (fieldFishData.length === 0) {
        return { success: false, message: 'Fisch nicht gefunden' };
      }
      
      const fish = fieldFishData[0];
      
      // Add to inventory with UPSERT to prevent race conditions
      try {
        // Try to insert first (most common case)
        await this.db.insert(userFish).values({
          userId,
          fishId: fish.fishId,
          fishName: fish.fishName,
          fishRarity: fish.fishRarity,
          fishImageUrl: fish.fishImageUrl,
          quantity: 1
        });
        console.log(`🐟 Created new fish inventory entry: ${fish.fishName}`);
      } catch (error) {
        // If fish already exists (constraint violation), increment quantity
        const existingFish = await this.db.select().from(userFish).where(
          and(
            eq(userFish.userId, userId),
            eq(userFish.fishId, fish.fishId)
          )
        );

        if (existingFish.length > 0) {
          await this.db
            .update(userFish)
            .set({ 
              quantity: existingFish[0].quantity + 1
            })
            .where(eq(userFish.id, existingFish[0].id));
          console.log(`🐟 Incremented existing fish ${fish.fishName} quantity to ${existingFish[0].quantity + 1}`);
        } else {
          // Fallback: re-throw error if not a constraint violation
          throw error;
        }
      }
      
      // Remove fish from field
      await this.db.delete(fieldFish).where(eq(fieldFish.id, fieldFishId));
      console.log(`🐟 Removed field fish from field ${fish.fieldIndex}`);
      
      return { success: true };
      
    } catch (error) {
      console.error('🐟 Error collecting field fish:', error);
      return { success: false, message: 'Fehler beim Sammeln des Fisches' };
    }
  }

  async getUserButterfly(userId: number, butterflyId: number): Promise<any | null> {
    try {
      console.log(`🦋 Getting butterfly ${butterflyId} for user ${userId}`);
      
      const butterfly = await this.db.select().from(userButterflies).where(
        and(
          eq(userButterflies.userId, userId),
          eq(userButterflies.id, butterflyId)
        )
      ).limit(1);
      
      if (butterfly.length === 0) {
        console.log(`🦋 Butterfly ${butterflyId} not found for user ${userId}`);
        return null;
      }
      
      console.log(`🦋 Found butterfly: ${butterfly[0].butterflyName} (quantity: ${butterfly[0].quantity})`);
      return butterfly[0];
    } catch (error) {
      console.error('🦋 Error getting user butterfly:', error);
      return null;
    }
  }

  async consumeButterfly(userId: number, butterflyId: number): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(`🦋 Consuming butterfly ${butterflyId} for user ${userId}`);
      
      const butterfly = await this.db.select().from(userButterflies).where(
        and(
          eq(userButterflies.userId, userId),
          eq(userButterflies.id, butterflyId)
        )
      ).limit(1);
      
      if (butterfly.length === 0) {
        return { success: false, message: 'Schmetterling nicht gefunden' };
      }
      
      const butterflyData = butterfly[0];
      
      if (butterflyData.quantity <= 0) {
        return { success: false, message: 'Nicht genügend Schmetterlinge im Inventar' };
      }

      if (butterflyData.quantity > 1) {
        // Reduce quantity by 1
        await this.db
          .update(userButterflies)
          .set({ quantity: butterflyData.quantity - 1 })
          .where(eq(userButterflies.id, butterflyId));
        console.log(`🦋 Reduced butterfly ${butterflyData.butterflyName} quantity to ${butterflyData.quantity - 1}`);
      } else {
        // Remove completely if quantity is 1
        await this.db
          .delete(userButterflies)
          .where(eq(userButterflies.id, butterflyId));
        console.log(`🦋 Removed butterfly ${butterflyData.butterflyName} from inventory`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('🦋 Error consuming butterfly:', error);
      return { success: false, message: 'Datenbankfehler beim Verbrauchen' };
    }
  }

  // AQUARIUM SYSTEM METHODS
  // ======================

  async getAquariumTanks(userId: number): Promise<AquariumTank[]> {
    try {
      const tanks = await this.db
        .select()
        .from(aquariumTanks)
        .where(eq(aquariumTanks.userId, userId))
        .orderBy(aquariumTanks.tankNumber);
      
      console.log(`🐟 Found ${tanks.length} aquarium tanks for user ${userId}`);
      return tanks;
    } catch (error) {
      console.error('🐟 Error getting aquarium tanks:', error);
      return [];
    }
  }

  async getAquariumFish(userId: number): Promise<AquariumFish[]> {
    try {
      const fish = await this.db
        .select()
        .from(aquariumFish)
        .where(eq(aquariumFish.userId, userId))
        .orderBy(aquariumFish.tankId, aquariumFish.slotIndex);
      
      console.log(`🐟 Found ${fish.length} aquarium fish for user ${userId}`);
      return fish;
    } catch (error) {
      console.error('🐟 Error getting aquarium fish:', error);
      return [];
    }
  }

  async purchaseAquariumTank(userId: number, tankNumber: number): Promise<{ success: boolean; message?: string; tank?: AquariumTank }> {
    try {
      console.log(`🐟 User ${userId} purchasing aquarium tank ${tankNumber}`);
      
      // Check if tank already exists
      const existingTank = await this.db
        .select()
        .from(aquariumTanks)
        .where(and(
          eq(aquariumTanks.userId, userId),
          eq(aquariumTanks.tankNumber, tankNumber)
        ));
      
      if (existingTank.length > 0) {
        return { success: false, message: 'Aquarium bereits gekauft!' };
      }
      
      // Calculate cost: Tank 1 = free, Tank 2 = 2500, each further x1.5
      let cost = 0;
      if (tankNumber === 1) {
        cost = 0; // First aquarium is free
      } else {
        // Tank 2 = 2500, Tank 3 = 2500*1.5 = 3750, Tank 4 = 3750*1.5 = 5625, etc.
        cost = Math.round(2500 * Math.pow(1.5, tankNumber - 2));
      }
      
      // Check user credits
      const user = await this.getUser(userId);
      if (!user || user.credits < cost) {
        return { success: false, message: `Nicht genügend Credits! Benötigt: ${cost}` };
      }
      
      // Deduct credits and create tank (no transaction needed for Neon)
      // Deduct credits first
      await this.db
        .update(users)
        .set({ credits: user.credits - cost })
        .where(eq(users.id, userId));
      
      // Create tank
      await this.db
        .insert(aquariumTanks)
        .values({
          userId,
          tankNumber
        });
      
      console.log(`🐟 Tank ${tankNumber} purchased for ${cost} credits`);
      
      // Return the new tank
      const newTank = await this.db
        .select()
        .from(aquariumTanks)
        .where(and(
          eq(aquariumTanks.userId, userId),
          eq(aquariumTanks.tankNumber, tankNumber)
        ));
      
      return { success: true, tank: newTank[0] };
    } catch (error) {
      console.error('🐟 Error purchasing aquarium tank:', error);
      return { success: false, message: 'Datenbankfehler beim Kauf' };
    }
  }

  async placeAquariumFish(userId: number, tankNumber: number, slotIndex: number, userFishId: number): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(`🐟 Placing fish ${userFishId} in tank ${tankNumber}, slot ${slotIndex} for user ${userId}`);
      
      // Check if tank exists and belongs to user
      const tank = await this.db
        .select()
        .from(aquariumTanks)
        .where(and(
          eq(aquariumTanks.userId, userId),
          eq(aquariumTanks.tankNumber, tankNumber)
        ));
      
      if (tank.length === 0) {
        return { success: false, message: 'Aquarium nicht gefunden!' };
      }
      
      // Check if slot is already occupied
      const existingFish = await this.db
        .select()
        .from(aquariumFish)
        .where(and(
          eq(aquariumFish.tankId, tank[0].id),
          eq(aquariumFish.slotIndex, slotIndex)
        ));
      
      if (existingFish.length > 0) {
        return { success: false, message: 'Platz bereits belegt!' };
      }
      
      // Check if user has the fish
      const fish = await this.db
        .select()
        .from(userFish)
        .where(and(
          eq(userFish.userId, userId),
          eq(userFish.id, userFishId)
        ));
      
      if (fish.length === 0 || fish[0].quantity <= 0) {
        return { success: false, message: 'Fisch nicht im Inventar!' };
      }
      
      const fishData = fish[0];
      
      // Place fish in aquarium and reduce inventory (no transaction for Neon)
      // Place fish in aquarium first
      await this.db
        .insert(aquariumFish)
        .values({
          userId,
          tankId: tank[0].id,
          slotIndex,
          fishId: fishData.fishId,
          fishName: fishData.fishName,
          fishRarity: fishData.fishRarity,
          fishImageUrl: fishData.fishImageUrl
        });
      
      // Reduce fish quantity in inventory
      if (fishData.quantity > 1) {
        await this.db
          .update(userFish)
          .set({ quantity: fishData.quantity - 1 })
          .where(eq(userFish.id, userFishId));
      } else {
        await this.db
          .delete(userFish)
          .where(eq(userFish.id, userFishId));
      }
      
      console.log(`🐟 Fish ${fishData.fishName} placed in aquarium`);
      return { success: true };
    } catch (error) {
      console.error('🐟 Error placing aquarium fish:', error);
      return { success: false, message: 'Datenbankfehler beim Platzieren' };
    }
  }

  async removeAquariumFish(userId: number, aquariumFishId: number): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(`🐟 Removing aquarium fish ${aquariumFishId} for user ${userId}`);
      
      // Get the fish to remove
      const fish = await this.db
        .select()
        .from(aquariumFish)
        .where(and(
          eq(aquariumFish.id, aquariumFishId),
          eq(aquariumFish.userId, userId)
        ));
      
      if (fish.length === 0) {
        return { success: false, message: 'Fisch nicht gefunden!' };
      }
      
      const fishData = fish[0];
      
      // Remove from aquarium and add back to inventory (no transaction for Neon)
      // Remove from aquarium first
      await this.db
        .delete(aquariumFish)
        .where(eq(aquariumFish.id, aquariumFishId));
      
      // Add back to inventory
      const existingFish = await this.db
        .select()
        .from(userFish)
        .where(and(
          eq(userFish.userId, userId),
          eq(userFish.fishId, fishData.fishId)
        ));
      
      if (existingFish.length > 0) {
        // Increase quantity
        await this.db
          .update(userFish)
          .set({ quantity: existingFish[0].quantity + 1 })
          .where(eq(userFish.id, existingFish[0].id));
      } else {
        // Add new entry
        await this.db
          .insert(userFish)
          .values({
            userId,
            fishId: fishData.fishId,
            fishName: fishData.fishName,
            fishRarity: fishData.fishRarity,
            fishImageUrl: fishData.fishImageUrl,
            quantity: 1
          });
      }
      
      console.log(`🐟 Fish ${fishData.fishName} removed from aquarium and returned to inventory`);
      return { success: true };
    } catch (error) {
      console.error('🐟 Error removing aquarium fish:', error);
      return { success: false, message: 'Datenbankfehler beim Entfernen' };
    }
  }

  async canSellAquariumFish(aquariumFishId: number): Promise<{ canSell: boolean; timeRemainingMs: number }> {
    try {
      const fish = await this.db
        .select()
        .from(aquariumFish)
        .where(eq(aquariumFish.id, aquariumFishId));
      
      if (fish.length === 0) {
        return { canSell: false, timeRemainingMs: 0 };
      }
      
      const placedTime = new Date(fish[0].placedAt).getTime();
      const now = new Date().getTime();
      const timeSincePlacement = now - placedTime;
      
      // Fish can be sold after 24 hours (vs 72 hours for butterflies)
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
      const timeRemaining = TWENTY_FOUR_HOURS - timeSincePlacement;
      
      return {
        canSell: timeRemaining <= 0,
        timeRemainingMs: Math.max(0, timeRemaining)
      };
    } catch (error) {
      console.error('🐟 Error checking fish sell status:', error);
      return { canSell: false, timeRemainingMs: 0 };
    }
  }

  async sellAquariumFish(userId: number, aquariumFishId: number): Promise<{ success: boolean; message?: string; creditsEarned?: number }> {
    try {
      console.log(`🐟 Selling aquarium fish ${aquariumFishId} for user ${userId}`);
      
      // Check if fish can be sold
      const sellStatus = await this.canSellAquariumFish(aquariumFishId);
      if (!sellStatus.canSell) {
        return { success: false, message: 'Fisch kann noch nicht verkauft werden!' };
      }
      
      // Get the fish
      const fish = await this.db
        .select()
        .from(aquariumFish)
        .where(and(
          eq(aquariumFish.id, aquariumFishId),
          eq(aquariumFish.userId, userId)
        ));
      
      if (fish.length === 0) {
        return { success: false, message: 'Fisch nicht gefunden!' };
      }
      
      const fishData = fish[0];
      
      // Calculate price (20% of butterfly prices)
      const price = this.getFishSellPrice(fishData.fishRarity);
      
      // Remove fish and add credits (no transaction for Neon)
      // Remove fish from aquarium first
      await this.db
        .delete(aquariumFish)
        .where(eq(aquariumFish.id, aquariumFishId));
      
      // Add credits to user
      const user = await this.db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (user.length > 0) {
        await this.db
          .update(users)
          .set({ credits: user[0].credits + price })
          .where(eq(users.id, userId));
      }
      
      console.log(`🐟 Fish ${fishData.fishName} sold for ${price} credits`);
      return { success: true, creditsEarned: price };
    } catch (error) {
      console.error('🐟 Error selling aquarium fish:', error);
      return { success: false, message: 'Datenbankfehler beim Verkauf' };
    }
  }

  async applyAquariumSunBoost(userId: number, aquariumFishId: number, minutes: number): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(`🐟 Applying ${minutes} minute sun boost to fish ${aquariumFishId} for user ${userId}`);
      
      const sunCost = minutes; // 1 sun = 1 minute
      
      // Check user suns
      const user = await this.getUser(userId);
      if (!user || user.suns < sunCost) {
        return { success: false, message: 'Nicht genügend Sonnen!' };
      }
      
      // Get the fish
      const fish = await this.db
        .select()
        .from(aquariumFish)
        .where(and(
          eq(aquariumFish.id, aquariumFishId),
          eq(aquariumFish.userId, userId)
        ));
      
      if (fish.length === 0) {
        return { success: false, message: 'Fisch nicht gefunden!' };
      }
      
      const fishData = fish[0];
      const currentPlacedAt = new Date(fishData.placedAt);
      const newPlacedAt = new Date(currentPlacedAt.getTime() - (minutes * 60 * 1000));
      
      // Update fish placement time and deduct suns (no transaction for Neon)
      // Update fish placed time first
      await this.db
        .update(aquariumFish)
        .set({ placedAt: newPlacedAt })
        .where(eq(aquariumFish.id, aquariumFishId));
      
      // Deduct suns
      await this.db
        .update(users)
        .set({ suns: user.suns - sunCost })
        .where(eq(users.id, userId));
      
      console.log(`🐟 Applied ${minutes} minute boost to fish ${fishData.fishName}`);
      return { success: true };
    } catch (error) {
      console.error('🐟 Error applying sun boost:', error);
      return { success: false, message: 'Datenbankfehler beim Boost' };
    }
  }

  private getFishSellPrice(rarity: string): number {
    // Fish prices are 40% of butterfly prices (doubled from 20%)
    const basePrice = (() => {
      switch (rarity) {
        case 'common': return 100;
        case 'uncommon': return 300;
        case 'rare': return 800;
        case 'super-rare': return 2000;
        case 'epic': return 5000;
        case 'legendary': return 12000;
        case 'mythical': return 30000;
        default: return 100;
      }
    })();
    
    return Math.floor(basePrice * 0.4); // 40% of butterfly prices
  }

  private getCaterpillarSellPrice(rarity: string): number {
    // Caterpillar prices are 85% of butterfly prices
    const basePrice = (() => {
      switch (rarity) {
        case 'common': return 50;
        case 'uncommon': return 100;
        case 'rare': return 200;
        case 'super-rare': return 400;
        case 'epic': return 600;
        case 'legendary': return 800;
        case 'mythical': return 1000;
        default: return 50;
      }
    })();
    
    return Math.floor(basePrice * 0.85); // 85% of butterfly prices
  }

  // Marie Posa trading system functions
  async getMariePosaLastTrade(userId: number): Promise<{ lastTradeAt: Date | null }> {
    try {
      const result = await this.db
        .select()
        .from(mariePosaTracker)
        .where(eq(mariePosaTracker.userId, userId))
        .orderBy(desc(mariePosaTracker.lastTradeAt))
        .limit(1);

      return { 
        lastTradeAt: result.length > 0 ? result[0].lastTradeAt : null 
      };
    } catch (error) {
      console.error('Error getting Marie Posa last trade:', error);
      return { lastTradeAt: null };
    }
  }

  async processMariePosaSale(userId: number, items: Array<{type: string, originalId: number, sellPrice: number}>): Promise<{
    success: boolean;
    message?: string;
    totalEarned?: number;
    itemsSold?: number;
  }> {
    try {
      if (!items || items.length === 0 || items.length > 4) {
        return { success: false, message: 'Ungültige Item-Auswahl' };
      }

      let totalEarned = 0;
      let itemsSold = 0;

      // Begin transaction to ensure all operations succeed or fail together
      for (const item of items) {
        let deleteResult = false;
        
        // Delete the item from user's inventory based on type
        switch (item.type) {
          case 'flower':
            const flowerResult = await this.db
              .delete(userFlowers)
              .where(and(
                eq(userFlowers.id, item.originalId),
                eq(userFlowers.userId, userId)
              ))
              .returning();
            deleteResult = flowerResult.length > 0;
            break;
            
          case 'butterfly':
            const butterflyResult = await this.db
              .delete(userButterflies)
              .where(and(
                eq(userButterflies.id, item.originalId),
                eq(userButterflies.userId, userId)
              ))
              .returning();
            deleteResult = butterflyResult.length > 0;
            break;
            
          case 'fish':
            // Handle fish differently - check if quantity > 1, decrease quantity instead of deleting
            const fishData = await this.db
              .select()
              .from(userFish)
              .where(and(
                eq(userFish.id, item.originalId),
                eq(userFish.userId, userId)
              ))
              .limit(1);

            if (fishData.length > 0) {
              if (fishData[0].quantity > 1) {
                // Decrease quantity by 1
                await this.db
                  .update(userFish)
                  .set({ quantity: fishData[0].quantity - 1 })
                  .where(eq(userFish.id, item.originalId));
                deleteResult = true;
              } else {
                // Delete if quantity is 1
                const fishResult = await this.db
                  .delete(userFish)
                  .where(and(
                    eq(userFish.id, item.originalId),
                    eq(userFish.userId, userId)
                  ))
                  .returning();
                deleteResult = fishResult.length > 0;
              }
            }
            break;
            
          case 'caterpillar':
            // Handle caterpillars like fish - check if quantity > 1, decrease quantity instead of deleting
            const caterpillarData = await this.db
              .select()
              .from(userCaterpillars)
              .where(and(
                eq(userCaterpillars.id, item.originalId),
                eq(userCaterpillars.userId, userId)
              ))
              .limit(1);

            if (caterpillarData.length > 0) {
              if (caterpillarData[0].quantity > 1) {
                // Decrease quantity by 1
                await this.db
                  .update(userCaterpillars)
                  .set({ quantity: caterpillarData[0].quantity - 1 })
                  .where(eq(userCaterpillars.id, item.originalId));
                deleteResult = true;
              } else {
                // Delete if quantity is 1
                const caterpillarResult = await this.db
                  .delete(userCaterpillars)
                  .where(and(
                    eq(userCaterpillars.id, item.originalId),
                    eq(userCaterpillars.userId, userId)
                  ))
                  .returning();
                deleteResult = caterpillarResult.length > 0;
              }
            }
            break;
            
          default:
            console.warn(`Unknown item type: ${item.type}`);
            continue;
        }

        if (deleteResult) {
          totalEarned += item.sellPrice;
          itemsSold++;
        } else {
          console.warn(`Failed to delete item ${item.originalId} of type ${item.type} for user ${userId}`);
        }
      }

      if (itemsSold === 0) {
        return { success: false, message: 'Keine Items konnten verkauft werden' };
      }

      // Add credits to user
      await this.db
        .update(users)
        .set({ 
          credits: sql`credits + ${totalEarned}`,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // Record this trade - check if entry exists for this user
      const existingEntry = await this.db
        .select()
        .from(mariePosaTracker)
        .where(eq(mariePosaTracker.userId, userId))
        .limit(1);

      if (existingEntry.length > 0) {
        // Update existing entry
        await this.db
          .update(mariePosaTracker)
          .set({ lastTradeAt: new Date() })
          .where(eq(mariePosaTracker.userId, userId));
      } else {
        // Insert new entry
        await this.db
          .insert(mariePosaTracker)
          .values({
            userId,
            lastTradeAt: new Date(),
            createdAt: new Date()
          });
      }

      console.log(`👑 Marie Posa: User ${userId} sold ${itemsSold} items for ${totalEarned} credits`);
      
      return {
        success: true,
        totalEarned,
        itemsSold
      };
    } catch (error) {
      console.error('Error processing Marie Posa sale:', error);
      return { success: false, message: 'Datenbankfehler beim Verkauf' };
    }
  }
}

export const postgresStorage = new PostgresStorage();