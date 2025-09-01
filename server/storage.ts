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
import { generateRandomFlower, getGrowthTime, type RarityTier } from "@shared/rarity";
import { generateBouquetName, calculateAverageRarity, generateRandomButterfly, getBouquetSeedDrop } from './bouquet';
import * as fs from 'fs';
import * as path from 'path';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCredits(id: number, amount: number): Promise<User | undefined>;
  
  // Market methods
  getMarketListings(): Promise<any[]>;
  createMarketListing(sellerId: number, data: CreateMarketListingRequest): Promise<any>;
  buyMarketListing(buyerId: number, data: BuyListingRequest): Promise<{ success: boolean; message?: string }>;
  getUserSeeds(userId: number): Promise<any[]>;
  
  // Garden methods
  plantSeed(userId: number, data: PlantSeedRequest): Promise<{ success: boolean; message?: string }>;
  getPlantedFields(userId: number): Promise<PlantedField[]>;
  harvestField(userId: number, data: HarvestFieldRequest): Promise<{ success: boolean; message?: string }>;
  
  // Flower inventory methods
  getUserFlowers(userId: number): Promise<UserFlower[]>;
  addFlowerToInventory(userId: number, flowerId: number, flowerName: string, flowerRarity: string, flowerImageUrl: string): Promise<void>;
  
  // Bouquet methods
  createBouquet(userId: number, data: CreateBouquetRequest): Promise<{ success: boolean; message?: string; bouquet?: Bouquet }>;
  getUserBouquets(userId: number): Promise<UserBouquet[]>;
  getBouquetRecipes(): Promise<BouquetRecipe[]>;
  getBouquetRecipe(bouquetId: number): Promise<BouquetRecipe | null>;
  placeBouquet(userId: number, data: PlaceBouquetRequest): Promise<{ success: boolean; message?: string }>;
  getPlacedBouquets(userId: number): Promise<PlacedBouquet[]>;
  getUserButterflies(userId: number): Promise<UserButterfly[]>;
  
  // Seed management methods
  addSeedToInventory(userId: number, rarity: RarityTier, quantity: number): Promise<void>;
  collectExpiredBouquet(userId: number, fieldIndex: number): Promise<{ success: boolean; seedDrop?: { rarity: RarityTier; quantity: number } }>;
  
  // Butterfly management methods
  spawnButterflyOnField(userId: number, bouquetId: number, bouquetRarity: RarityTier): Promise<{ success: boolean; fieldButterfly?: FieldButterfly; fieldIndex?: number }>;
  collectFieldButterfly(userId: number, fieldIndex: number): Promise<{ success: boolean; butterfly?: UserButterfly }>;
  
  // Exhibition methods
  getExhibitionFrames(userId: number): Promise<ExhibitionFrame[]>;
  purchaseExhibitionFrame(userId: number): Promise<{ success: boolean; message?: string; newCredits?: number; frame?: ExhibitionFrame }>;
  getExhibitionButterflies(userId: number): Promise<ExhibitionButterfly[]>;
  placeExhibitionButterfly(userId: number, frameId: number, slotIndex: number, butterflyId: number): Promise<{ success: boolean; message?: string }>;
  removeExhibitionButterfly(userId: number, frameId: number, slotIndex: number): Promise<{ success: boolean; message?: string }>;
  sellExhibitionButterfly(userId: number, exhibitionButterflyId: number): Promise<{ success: boolean; message?: string; creditsEarned?: number }>;
  processPassiveIncome(userId: number): Promise<{ success: boolean; creditsEarned?: number }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private seeds: Map<number, Seed>;
  private userSeeds: Map<number, UserSeed & { seedName: string; seedRarity: string }>;
  private marketListings: Map<number, MarketListing & { sellerUsername: string; seedName: string; seedRarity: string }>;
  private plantedFields: Map<number, PlantedField>;
  private userFlowers: Map<number, UserFlower>;
  private bouquets: Map<number, Bouquet>;
  private userBouquets: Map<number, UserBouquet & { bouquetName: string; bouquetRarity: string; bouquetImageUrl: string }>;
  private bouquetRecipes: Map<number, BouquetRecipe>;
  private placedBouquets: Map<number, PlacedBouquet & { bouquetName: string; bouquetRarity: string }>;
  private userButterflies: Map<number, UserButterfly>;
  private fieldButterflies: Map<number, FieldButterfly>;
  private exhibitionFrames: Map<number, ExhibitionFrame>;
  private exhibitionButterflies: Map<number, ExhibitionButterfly>;
  private passiveIncomeLog: Map<number, PassiveIncomeLog>;
  private exhibitionFrameLikes: Map<number, ExhibitionFrameLike>;
  private currentId: number;
  private currentSeedId: number;
  private currentUserSeedId: number;
  private currentListingId: number;
  private currentFieldId: number;
  private currentBouquetId: number;
  private currentUserBouquetId: number;
  private currentRecipeId: number;
  private currentPlacedBouquetId: number;
  private currentButterflyId: number;
  private currentFieldButterflyId: number;
  private currentFlowerId: number;
  private currentExhibitionFrameId: number;
  private currentExhibitionButterflyId: number;
  private currentPassiveIncomeId: number;
  private currentFrameLikeId: number;
  private saveFilePath = path.join(process.cwd(), 'game-data.json');
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private db: any; // Drizzle database connection

  constructor() {
    this.users = new Map();
    this.seeds = new Map();
    this.userSeeds = new Map();
    this.marketListings = new Map();
    this.plantedFields = new Map();
    this.userFlowers = new Map();
    this.bouquets = new Map();
    this.userBouquets = new Map();
    this.bouquetRecipes = new Map();
    this.placedBouquets = new Map();
    this.userButterflies = new Map();
    this.fieldButterflies = new Map();
    this.exhibitionFrames = new Map();
    this.exhibitionButterflies = new Map();
    this.passiveIncomeLog = new Map();
    this.exhibitionFrameLikes = new Map();
    this.currentId = 1;
    this.currentSeedId = 1;
    this.currentUserSeedId = 1;
    this.currentListingId = 1;
    this.currentFieldId = 1;
    this.currentBouquetId = 1;
    this.currentUserBouquetId = 1;
    this.currentRecipeId = 1;
    this.currentPlacedBouquetId = 1;
    this.currentButterflyId = 1;
    this.currentFieldButterflyId = 1;
    this.currentFlowerId = 1;
    this.currentExhibitionFrameId = 1;
    this.currentExhibitionButterflyId = 1;
    this.currentPassiveIncomeId = 1;
    this.currentFrameLikeId = 1;
    
    // Initialize database connection
    if (process.env.DATABASE_URL) {
      const sql = neon(process.env.DATABASE_URL);
      this.db = drizzle(sql, { schema });
    }
    
    // Initialize with some sample seeds and demo market listings
    this.initializeSampleSeeds();
    // this.createDemoMarketListings(); // Demo handlers removed
    
    // Load saved data if exists
    // Prioritize database over JSON file - database is persistent across deployments
    this.loadFromDatabase().then(() => {
      console.log('💾 Database loading completed, falling back to JSON if needed');
      this.loadData();
    }).catch((error) => {
      console.error('💾 Database loading failed, using JSON fallback:', error);
      this.loadData();
    });
    
    // Auto-save every 30 seconds
    this.autoSaveInterval = setInterval(() => {
      this.saveData();
    }, 30000);
  }

  // Database loading method
  private async loadFromDatabase(): Promise<void> {
    if (!this.db) {
      throw new Error('Database connection not available');
    }

    try {
      console.log('💾 Loading data from PostgreSQL database...');
      
      // Load users
      const dbUsers = await this.db.select().from(schema.users);
      dbUsers.forEach((user: any) => {
        this.users.set(user.id, {
          id: user.id,
          username: user.username,
          password: user.password,
          credits: user.credits,
          lastPassiveIncomeAt: user.lastPassiveIncomeAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
        this.currentId = Math.max(this.currentId, user.id + 1);
      });

      // Load seeds
      const dbSeeds = await this.db.select().from(schema.seeds);
      dbSeeds.forEach((seed: any) => {
        this.seeds.set(seed.id, {
          id: seed.id,
          name: seed.name,
          rarity: seed.rarity,
          price: seed.price,
          description: seed.description,
          imageUrl: seed.imageUrl,
          createdAt: seed.createdAt
        });
        this.currentSeedId = Math.max(this.currentSeedId, seed.id + 1);
      });

      // Load user seeds
      const dbUserSeeds = await this.db.select().from(schema.userSeeds);
      dbUserSeeds.forEach((userSeed: any) => {
        const seed = this.seeds.get(userSeed.seedId);
        this.userSeeds.set(userSeed.id, {
          id: userSeed.id,
          userId: userSeed.userId,
          seedId: userSeed.seedId,
          quantity: userSeed.quantity,
          createdAt: userSeed.createdAt,
          seedName: seed?.name || 'Unknown',
          seedRarity: seed?.rarity || 'common'
        });
        this.currentUserSeedId = Math.max(this.currentUserSeedId, userSeed.id + 1);
      });

      console.log(`💾 Loaded from database: ${this.users.size} users, ${this.userSeeds.size} user seeds, ${this.seeds.size} seeds`);
    } catch (error) {
      console.error('💾 Failed to load from database:', error);
      throw error;
    }
  }

  // Data persistence methods
  private saveData(): void {
    try {
      const data = {
        users: Array.from(this.users.entries()),
        seeds: Array.from(this.seeds.entries()),
        userSeeds: Array.from(this.userSeeds.entries()),
        marketListings: Array.from(this.marketListings.entries()),
        plantedFields: Array.from(this.plantedFields.entries()),
        userFlowers: Array.from(this.userFlowers.entries()),
        bouquets: Array.from(this.bouquets.entries()),
        userBouquets: Array.from(this.userBouquets.entries()),
        bouquetRecipes: Array.from(this.bouquetRecipes.entries()),
        placedBouquets: Array.from(this.placedBouquets.entries()),
        userButterflies: Array.from(this.userButterflies.entries()),
        fieldButterflies: Array.from(this.fieldButterflies.entries()),
        exhibitionFrames: Array.from(this.exhibitionFrames.entries()),
        exhibitionButterflies: Array.from(this.exhibitionButterflies.entries()),
        passiveIncomeLog: Array.from(this.passiveIncomeLog.entries()),
        exhibitionFrameLikes: Array.from(this.exhibitionFrameLikes.entries()),
        counters: {
          currentId: this.currentId,
          currentSeedId: this.currentSeedId,
          currentUserSeedId: this.currentUserSeedId,
          currentListingId: this.currentListingId,
          currentFieldId: this.currentFieldId,
          currentBouquetId: this.currentBouquetId,
          currentUserBouquetId: this.currentUserBouquetId,
          currentRecipeId: this.currentRecipeId,
          currentPlacedBouquetId: this.currentPlacedBouquetId,
          currentButterflyId: this.currentButterflyId,
          currentFieldButterflyId: this.currentFieldButterflyId,
          currentFlowerId: this.currentFlowerId,
          currentExhibitionFrameId: this.currentExhibitionFrameId,
          currentExhibitionButterflyId: this.currentExhibitionButterflyId,
          currentPassiveIncomeId: this.currentPassiveIncomeId,
          currentFrameLikeId: this.currentFrameLikeId
        },
        savedAt: new Date().toISOString()
      };
      
      fs.writeFileSync(this.saveFilePath, JSON.stringify(data, null, 2));
      console.log('💾 Game data saved successfully');
    } catch (error) {
      console.error('💾 Failed to save game data:', error);
    }
  }

  private loadData(): void {
    try {
      if (fs.existsSync(this.saveFilePath)) {
        const data = JSON.parse(fs.readFileSync(this.saveFilePath, 'utf8'));
        
        // Restore all maps with date conversion
        this.users = new Map((data.users || []).map(([key, user]: [any, any]) => [
          key, 
          {
            ...user,
            createdAt: new Date(user.createdAt),
            updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined
          }
        ]));
        this.seeds = new Map((data.seeds || []).map(([key, seed]: [any, any]) => [
          key,
          {
            ...seed,
            createdAt: new Date(seed.createdAt)
          }
        ]));
        this.userSeeds = new Map(data.userSeeds || []);
        this.marketListings = new Map((data.marketListings || []).map(([key, listing]: [any, any]) => [
          key,
          {
            ...listing,
            createdAt: new Date(listing.createdAt),
            updatedAt: listing.updatedAt ? new Date(listing.updatedAt) : undefined
          }
        ]));
        this.plantedFields = new Map((data.plantedFields || []).map(([key, field]: [any, any]) => [
          key,
          {
            ...field,
            plantedAt: new Date(field.plantedAt),
            createdAt: new Date(field.createdAt)
          }
        ]));
        this.userFlowers = new Map(data.userFlowers || []);
        this.bouquets = new Map((data.bouquets || []).map(([key, bouquet]: [any, any]) => [
          key,
          {
            ...bouquet,
            createdAt: new Date(bouquet.createdAt)
          }
        ]));
        this.userBouquets = new Map(data.userBouquets || []);
        this.bouquetRecipes = new Map(data.bouquetRecipes || []);
        this.placedBouquets = new Map((data.placedBouquets || []).map(([key, bouquet]: [any, any]) => [
          key,
          {
            ...bouquet,
            placedAt: new Date(bouquet.placedAt),
            expiresAt: new Date(bouquet.expiresAt)
          }
        ]));
        this.userButterflies = new Map(data.userButterflies || []);
        this.fieldButterflies = new Map((data.fieldButterflies || []).map(([key, butterfly]: [any, any]) => [
          key,
          {
            ...butterfly,
            spawnedAt: new Date(butterfly.spawnedAt),
            expiresAt: new Date(butterfly.expiresAt)
          }
        ]));
        this.exhibitionFrames = new Map(data.exhibitionFrames || []);
        this.exhibitionButterflies = new Map((data.exhibitionButterflies || []).map(([key, butterfly]: [any, any]) => [
          key,
          {
            ...butterfly,
            addedAt: new Date(butterfly.addedAt)
          }
        ]));
        this.passiveIncomeLog = new Map((data.passiveIncomeLog || []).map(([key, log]: [any, any]) => [
          key,
          {
            ...log,
            processedAt: new Date(log.processedAt)
          }
        ]));
        this.exhibitionFrameLikes = new Map((data.exhibitionFrameLikes || []).map(([key, like]: [any, any]) => [
          key,
          {
            ...like,
            createdAt: new Date(like.createdAt)
          }
        ]));
        
        // Restore counters
        if (data.counters) {
          this.currentId = data.counters.currentId || 1;
          this.currentSeedId = data.counters.currentSeedId || 8;
          this.currentUserSeedId = data.counters.currentUserSeedId || 1;
          this.currentListingId = data.counters.currentListingId || 1;
          this.currentFieldId = data.counters.currentFieldId || 1;
          this.currentBouquetId = data.counters.currentBouquetId || 1;
          this.currentUserBouquetId = data.counters.currentUserBouquetId || 1;
          this.currentRecipeId = data.counters.currentRecipeId || 1;
          this.currentPlacedBouquetId = data.counters.currentPlacedBouquetId || 1;
          this.currentButterflyId = data.counters.currentButterflyId || 1;
          this.currentFieldButterflyId = data.counters.currentFieldButterflyId || 1;
          this.currentFlowerId = data.counters.currentFlowerId || 1;
          this.currentExhibitionFrameId = data.counters.currentExhibitionFrameId || 1;
          this.currentExhibitionButterflyId = data.counters.currentExhibitionButterflyId || 1;
          this.currentPassiveIncomeId = data.counters.currentPassiveIncomeId || 1;
          this.currentFrameLikeId = data.counters.currentFrameLikeId || 1;
        }
        
        console.log('💾 Game data loaded successfully from', data.savedAt || 'unknown time');
        console.log(`💾 Loaded ${this.users.size} users, ${this.userSeeds.size} user seeds, ${this.userFlowers.size} flowers, ${this.userButterflies.size} butterflies`);
      } else {
        console.log('💾 No save file found, starting fresh');
      }
    } catch (error) {
      console.error('💾 Failed to load game data:', error);
    }
  }

  // Manual save trigger for important operations
  public forceSave(): void {
    this.saveData();
  }

  private initializeSampleSeeds() {
    const sampleSeeds = [
      { id: 1, name: "Common Samen", rarity: "common", price: 10, description: "Ein gewöhnlicher Samen mit einfachen Eigenschaften", imageUrl: "/Blumen/0.jpg", createdAt: new Date() },
      { id: 2, name: "Uncommon Samen", rarity: "uncommon", price: 25, description: "Ein ungewöhnlicher Samen mit besonderen Eigenschaften", imageUrl: "/Blumen/0.jpg", createdAt: new Date() },
      { id: 3, name: "Rare Samen", rarity: "rare", price: 50, description: "Ein seltener Samen mit wertvollen Eigenschaften", imageUrl: "/Blumen/0.jpg", createdAt: new Date() },
      { id: 4, name: "Super-rare Samen", rarity: "super-rare", price: 100, description: "Ein super-seltener Samen mit außergewöhnlichen Eigenschaften", imageUrl: "/Blumen/0.jpg", createdAt: new Date() },
      { id: 5, name: "Epic Samen", rarity: "epic", price: 200, description: "Ein epischer Samen mit mächtigen Eigenschaften", imageUrl: "/Blumen/0.jpg", createdAt: new Date() },
      { id: 6, name: "Legendary Samen", rarity: "legendary", price: 400, description: "Ein legendärer Samen mit mythischen Eigenschaften", imageUrl: "/Blumen/0.jpg", createdAt: new Date() },
      { id: 7, name: "Mythical Samen", rarity: "mythical", price: 800, description: "Ein mythischer Samen aus einer anderen Welt", imageUrl: "/Blumen/0.jpg", createdAt: new Date() }
    ];

    sampleSeeds.forEach(seed => {
      this.seeds.set(seed.id, seed);
      this.currentSeedId = Math.max(this.currentSeedId, seed.id + 1);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!this.db) {
      throw new Error('Database not available');
    }

    const result = await this.db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
    return result[0] || undefined;
  }

  async updateUserCredits(id: number, amount: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { 
      ...user, 
      credits: Math.max(0, user.credits + amount),
      updatedAt: new Date()
    };
    
    // Update in memory
    this.users.set(id, updatedUser);
    
    // Update in database for persistence
    if (this.db) {
      try {
        await this.db.update(schema.users)
          .set({ 
            credits: updatedUser.credits, 
            updatedAt: updatedUser.updatedAt 
          })
          .where(eq(schema.users.id, id));
      } catch (error) {
        console.error('💾 Failed to update user credits in database:', error);
        // Continue with memory-only update as fallback
      }
    }
    
    return updatedUser;
  }

  async getMarketListings(): Promise<any[]> {
    return Array.from(this.marketListings.values()).filter(listing => listing.isActive);
  }

  async createMarketListing(sellerId: number, data: CreateMarketListingRequest): Promise<any> {
    const seller = this.users.get(sellerId);
    const seed = this.seeds.get(data.seedId);
    if (!seller || !seed) {
      throw new Error("Seller or seed not found");
    }

    const userSeed = Array.from(this.userSeeds.values()).find(
      us => us.userId === sellerId && us.seedId === data.seedId
    );
    
    if (!userSeed || userSeed.quantity < data.quantity) {
      throw new Error("Nicht genügend Samen verfügbar");
    }

    const id = this.currentListingId++;
    const now = new Date();
    const listing = {
      id,
      sellerId,
      seedId: data.seedId,
      quantity: data.quantity,
      pricePerUnit: data.pricePerUnit,
      totalPrice: data.quantity * data.pricePerUnit,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      sellerUsername: seller.username,
      seedName: seed.name,
      seedRarity: seed.rarity
    };

    this.marketListings.set(id, listing);

    // Reduce seller's seed quantity
    const updatedUserSeed = {
      ...userSeed,
      quantity: userSeed.quantity - data.quantity
    };
    this.userSeeds.set(userSeed.id, updatedUserSeed);

    return listing;
  }

  async buyMarketListing(buyerId: number, data: BuyListingRequest): Promise<{ success: boolean; message?: string }> {
    const buyer = this.users.get(buyerId);
    const listing = this.marketListings.get(data.listingId);
    
    if (!buyer || !listing || !listing.isActive) {
      return { success: false, message: "Angebot nicht verfügbar" };
    }

    if (listing.sellerId === buyerId) {
      return { success: false, message: "Du kannst deine eigenen Angebote nicht kaufen" };
    }

    const totalCost = Math.min(data.quantity, listing.quantity) * listing.pricePerUnit;
    
    if (buyer.credits < totalCost) {
      return { success: false, message: "Nicht genügend Credits" };
    }

    const quantityToBuy = Math.min(data.quantity, listing.quantity);

    // Update buyer credits
    await this.updateUserCredits(buyerId, -totalCost);
    
    // Update seller credits
    await this.updateUserCredits(listing.sellerId, totalCost);

    // Give seeds to buyer
    const existingUserSeed = Array.from(this.userSeeds.values()).find(
      us => us.userId === buyerId && us.seedId === listing.seedId
    );

    if (existingUserSeed) {
      const updatedUserSeed = {
        ...existingUserSeed,
        quantity: existingUserSeed.quantity + quantityToBuy
      };
      this.userSeeds.set(existingUserSeed.id, updatedUserSeed);
    } else {
      const seed = this.seeds.get(listing.seedId);
      const newUserSeed = {
        id: this.currentUserSeedId++,
        userId: buyerId,
        seedId: listing.seedId,
        quantity: quantityToBuy,
        createdAt: new Date(),
        seedName: seed?.name || "Unknown",
        seedRarity: seed?.rarity || "common"
      };
      this.userSeeds.set(newUserSeed.id, newUserSeed);
    }

    // Update or remove listing
    if (listing.quantity <= quantityToBuy) {
      // Remove listing completely
      listing.isActive = false;
      this.marketListings.set(listing.id, listing);
    } else {
      // Reduce listing quantity
      const updatedListing = {
        ...listing,
        quantity: listing.quantity - quantityToBuy,
        totalPrice: (listing.quantity - quantityToBuy) * listing.pricePerUnit,
        updatedAt: new Date()
      };
      this.marketListings.set(listing.id, updatedListing);
    }

    return { success: true };
  }

  async getUserSeeds(userId: number): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database not available');
    }

    const result = await this.db
      .select({
        id: schema.userSeeds.id,
        userId: schema.userSeeds.userId,
        seedId: schema.userSeeds.seedId,
        quantity: schema.userSeeds.quantity,
        seedName: schema.seeds.name,
        seedRarity: schema.seeds.rarity,
        seedPrice: schema.seeds.price,
        seedDescription: schema.seeds.description,
        seedImageUrl: schema.seeds.imageUrl
      })
      .from(schema.userSeeds)
      .leftJoin(schema.seeds, eq(schema.userSeeds.seedId, schema.seeds.id))
      .where(eq(schema.userSeeds.userId, userId));

    return result;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!this.db) {
      throw new Error('Database not available');
    }

    const now = new Date();
    
    // Insert directly into PostgreSQL
    const [user] = await this.db.insert(schema.users).values({
      username: insertUser.username,
      password: insertUser.password,
      credits: 1000,
      lastPassiveIncomeAt: null,
      createdAt: now,
      updatedAt: now
    }).returning();

    console.log(`🌱 New user ${user.username} created with 5 common + 3 rare seeds`);

    // Give new users starter seeds - save to PostgreSQL
    await this.giveStarterSeeds(user.id);
    
    return user;
  }

  private async giveStarterSeeds(userId: number) {
    if (!this.db) {
      throw new Error('Database not available');
    }

    // Give new users some common seeds to start with
    const starterSeeds = [
      { seedId: 1, quantity: 5 }, // 5 Common seeds
      { seedId: 3, quantity: 3 }, // 3 Rare seeds
    ];

    for (const starter of starterSeeds) {
      const seed = this.seeds.get(starter.seedId);
      if (seed) {
        // Insert directly into PostgreSQL
        await this.db.insert(schema.userSeeds).values({
          userId,
          seedId: starter.seedId,
          quantity: starter.quantity,
          createdAt: new Date()
        });
        console.log(`🌱 Gave user ${userId}: ${starter.quantity}x ${seed.name} (${seed.rarity})`);
      }
    }
  }

  // private createDemoMarketListings() {
  //   // Demo market listings function removed - market now starts empty
  //   // Real users will create their own listings
  // }

  async plantSeed(userId: number, data: PlantSeedRequest): Promise<{ success: boolean; message?: string }> {
    const user = this.users.get(userId);
    const seed = this.seeds.get(data.seedId);
    const userSeed = this.userSeeds.get(data.userSeedId);
    
    if (!user || !seed || !userSeed) {
      return { success: false, message: "Nutzer, Samen oder Inventar nicht gefunden" };
    }

    if (userSeed.userId !== userId || userSeed.seedId !== data.seedId) {
      return { success: false, message: "Ungültiger Samen im Inventar" };
    }

    if (userSeed.quantity < 1) {
      return { success: false, message: "Nicht genügend Samen verfügbar" };
    }

    // Check if field is already planted
    const existingField = Array.from(this.plantedFields.values()).find(
      field => field.userId === userId && field.fieldIndex === data.fieldIndex
    );

    if (existingField) {
      return { success: false, message: "Dieses Feld ist bereits bepflanzt" };
    }

    // Generate random flower for this seed rarity
    const randomFlower = generateRandomFlower(seed.rarity as RarityTier);
    
    // Create planted field
    const fieldId = this.currentFieldId++;
    const plantedField: PlantedField = {
      id: fieldId,
      userId,
      fieldIndex: data.fieldIndex,
      seedId: data.seedId,
      seedRarity: seed.rarity,
      plantedAt: new Date(),
      isGrown: false,
      flowerId: randomFlower?.id || null,
      flowerName: randomFlower?.name || null,
      flowerImageUrl: randomFlower?.imageUrl || null,
      createdAt: new Date()
    };

    this.plantedFields.set(fieldId, plantedField);

    // Reduce user seed quantity
    const updatedUserSeed = {
      ...userSeed,
      quantity: userSeed.quantity - 1
    };
    this.userSeeds.set(data.userSeedId, updatedUserSeed);

    return { success: true };
  }

  async getPlantedFields(userId: number): Promise<PlantedField[]> {
    const fields = Array.from(this.plantedFields.values())
      .filter(field => field.userId === userId);
    
    // Check if any fields should be grown by now
    const currentTime = new Date();
    fields.forEach(field => {
      if (!field.isGrown) {
        const growthTime = getGrowthTime(field.seedRarity as RarityTier);
        const elapsedSeconds = (currentTime.getTime() - field.plantedAt.getTime()) / 1000;
        
        if (elapsedSeconds >= growthTime) {
          field.isGrown = true;
          this.plantedFields.set(field.id, field);
        }
      }
    });
    
    return fields;
  }

  async harvestField(userId: number, data: HarvestFieldRequest): Promise<{ success: boolean; message?: string }> {
    const plantedField = Array.from(this.plantedFields.values()).find(
      field => field.userId === userId && field.fieldIndex === data.fieldIndex
    );

    if (!plantedField) {
      return { success: false, message: "Kein Feld zum Ernten gefunden" };
    }

    // Check if field should be grown by now (same logic as getPlantedFields)
    if (!plantedField.isGrown) {
      const currentTime = new Date();
      const growthTime = getGrowthTime(plantedField.seedRarity as RarityTier);
      const elapsedSeconds = (currentTime.getTime() - plantedField.plantedAt.getTime()) / 1000;
      
      if (elapsedSeconds >= growthTime) {
        plantedField.isGrown = true;
        this.plantedFields.set(plantedField.id, plantedField);
      } else {
        return { success: false, message: "Die Blume ist noch nicht gewachsen" };
      }
    }

    // Add flower to user inventory
    await this.addFlowerToInventory(
      userId, 
      plantedField.flowerId!, 
      plantedField.flowerName!, 
      plantedField.seedRarity, 
      plantedField.flowerImageUrl!
    );

    // Remove planted field
    this.plantedFields.delete(plantedField.id);
    
    return { success: true };
  }

  async getUserFlowers(userId: number): Promise<UserFlower[]> {
    return Array.from(this.userFlowers.values())
      .filter(flower => flower.userId === userId);
  }

  async addFlowerToInventory(userId: number, flowerId: number, flowerName: string, flowerRarity: string, flowerImageUrl: string): Promise<void> {
    // Check if user already has this flower
    const existingFlower = Array.from(this.userFlowers.values())
      .find(flower => flower.userId === userId && flower.flowerId === flowerId && flower.flowerName === flowerName);

    if (existingFlower) {
      // Increase quantity
      existingFlower.quantity += 1;
      this.userFlowers.set(existingFlower.id, existingFlower);
    } else {
      // Add new flower
      const newFlower: UserFlower = {
        id: this.currentFlowerId++,
        userId,
        flowerId,
        flowerName,
        flowerRarity,
        flowerImageUrl,
        quantity: 1,
        createdAt: new Date()
      };
      this.userFlowers.set(newFlower.id, newFlower);
    }
  }

  // Check if bouquet name already exists
  async isBouquetNameTaken(name: string): Promise<boolean> {
    return Array.from(this.bouquets.values()).some(bouquet => bouquet.name === name);
  }

  // Generate unique bouquet name using AI with retry logic
  async generateUniqueBouquetName(rarity: RarityTier): Promise<string> {
    const maxAttempts = 5;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const generatedName = await generateBouquetName(rarity);
      
      if (!(await this.isBouquetNameTaken(generatedName))) {
        return generatedName;
      }
      
      console.log(`🌹 Attempt ${attempt}: Bouquet name "${generatedName}" already exists, trying again...`);
    }
    
    // If all AI attempts failed, create a fallback unique name
    return await this.ensureUniqueName(`Seltene ${rarity} Kollektion`);
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

  // Bouquet methods implementation
  async createBouquet(userId: number, data: CreateBouquetRequest): Promise<{ success: boolean; message?: string; bouquet?: Bouquet }> {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, message: "Benutzer nicht gefunden" };
    }

    // Check if user has enough credits
    if (user.credits < 30) {
      return { success: false, message: "Nicht genügend Credits (30 benötigt)" };
    }

    // Get the three flowers from user inventory
    const flower1 = Array.from(this.userFlowers.values()).find(f => f.userId === userId && f.flowerId === data.flowerId1);
    const flower2 = Array.from(this.userFlowers.values()).find(f => f.userId === userId && f.flowerId === data.flowerId2);
    const flower3 = Array.from(this.userFlowers.values()).find(f => f.userId === userId && f.flowerId === data.flowerId3);

    if (!flower1 || !flower2 || !flower3) {
      return { success: false, message: "Eine oder mehrere Blumen nicht im Inventar gefunden" };
    }

    if (flower1.quantity < 1 || flower2.quantity < 1 || flower3.quantity < 1) {
      return { success: false, message: "Nicht genügend Blumen verfügbar" };
    }

    // Calculate average rarity
    const averageRarity = calculateAverageRarity(
      flower1.flowerRarity as RarityTier,
      flower2.flowerRarity as RarityTier,
      flower3.flowerRarity as RarityTier
    );

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
      bouquetName = await this.generateUniqueBouquetName(averageRarity);
    } else {
      // Default fallback name - ensure uniqueness
      let baseName = `${flower1.flowerName} Bouquet`;
      bouquetName = await this.ensureUniqueName(baseName);
    }

    // Create bouquet
    const bouquet: Bouquet = {
      id: this.currentBouquetId++,
      name: bouquetName,
      rarity: averageRarity,
      imageUrl: "/Blumen/Bouquet.jpg",
      createdAt: new Date()
    };
    this.bouquets.set(bouquet.id, bouquet);

    // Create recipe
    const recipe: BouquetRecipe = {
      id: this.currentRecipeId++,
      bouquetId: bouquet.id,
      flowerId1: data.flowerId1,
      flowerId2: data.flowerId2,
      flowerId3: data.flowerId3,
      createdAt: new Date()
    };
    this.bouquetRecipes.set(recipe.id, recipe);

    // Add to user's bouquet inventory
    const userBouquet = {
      id: this.currentUserBouquetId++,
      userId,
      bouquetId: bouquet.id,
      quantity: 1,
      createdAt: new Date(),
      bouquetName: bouquet.name,
      bouquetRarity: bouquet.rarity,
      bouquetImageUrl: bouquet.imageUrl
    };
    this.userBouquets.set(userBouquet.id, userBouquet);

    // Remove flowers from inventory
    flower1.quantity -= 1;
    flower2.quantity -= 1;
    flower3.quantity -= 1;

    // Remove flowers with 0 quantity
    if (flower1.quantity === 0) this.userFlowers.delete(flower1.id);
    else this.userFlowers.set(flower1.id, flower1);
    if (flower2.quantity === 0) this.userFlowers.delete(flower2.id);
    else this.userFlowers.set(flower2.id, flower2);
    if (flower3.quantity === 0) this.userFlowers.delete(flower3.id);
    else this.userFlowers.set(flower3.id, flower3);

    // Deduct credits
    user.credits -= 30;
    this.users.set(userId, user);
    console.log(`Credits deducted: ${user.credits} remaining for user ${userId}`);

    return { success: true, bouquet };
  }

  async getBouquetRecipes(): Promise<BouquetRecipe[]> {
    return Array.from(this.bouquetRecipes.values());
  }

  async getBouquetRecipe(bouquetId: number): Promise<BouquetRecipe | null> {
    const recipe = Array.from(this.bouquetRecipes.values()).find(r => r.bouquetId === bouquetId);
    return recipe || null;
  }

  async getUserBouquets(userId: number): Promise<UserBouquet[]> {
    const allBouquets = Array.from(this.userBouquets.values()).filter(bouquet => bouquet.userId === userId);
    console.log(`🌹 Getting bouquets for user ${userId}:`, allBouquets.map(b => `ID:${b.id} Q:${b.quantity} Name:${b.bouquetName}`));
    return allBouquets.map(b => ({
        id: b.id,
        userId: b.userId,
        bouquetId: b.bouquetId,
        quantity: b.quantity,
        bouquetName: b.bouquetName,
        bouquetRarity: b.bouquetRarity,
        bouquetImageUrl: b.bouquetImageUrl,
        createdAt: b.createdAt
      }));
  }

  async placeBouquet(userId: number, data: PlaceBouquetRequest): Promise<{ success: boolean; message?: string }> {
    const userBouquet = Array.from(this.userBouquets.values())
      .find(b => b.userId === userId && b.bouquetId === data.bouquetId);

    if (!userBouquet || userBouquet.quantity < 1) {
      return { success: false, message: "Bouquet nicht im Inventar gefunden" };
    }

    const bouquet = this.bouquets.get(data.bouquetId);
    if (!bouquet) {
      return { success: false, message: "Bouquet-Daten nicht gefunden" };
    }

    // Check if field is already occupied
    const existingPlacement = Array.from(this.placedBouquets.values())
      .find(p => p.userId === userId && p.fieldIndex === data.fieldIndex);

    if (existingPlacement) {
      return { success: false, message: "Feld ist bereits belegt" };
    }

    // Create placed bouquet (expires in 21 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 21); // Standard 21 minutes for bouquet placement

    const placedBouquet = {
      id: this.currentPlacedBouquetId++,
      userId,
      bouquetId: data.bouquetId,
      fieldIndex: data.fieldIndex,
      placedAt: new Date(),
      expiresAt,
      createdAt: new Date(),
      bouquetName: bouquet.name,
      bouquetRarity: bouquet.rarity
    };
    this.placedBouquets.set(placedBouquet.id, placedBouquet);

    // Remove bouquet from inventory but keep for recipe viewing
    userBouquet.quantity -= 1;
    console.log(`🌹 Before placing: Bouquet quantity: ${userBouquet.quantity}, ID: ${userBouquet.id}`);
    // Always keep the bouquet in inventory, even with quantity 0, for recipe viewing
    this.userBouquets.set(userBouquet.id, userBouquet);
    console.log(`🌹 After placing: Bouquet kept in inventory with quantity: ${userBouquet.quantity}`);

    return { success: true };
  }

  async getPlacedBouquets(userId: number): Promise<PlacedBouquet[]> {
    // Return all bouquets (expired and non-expired) for display
    // Expired bouquets will be processed only when manually collected
    return Array.from(this.placedBouquets.values())
      .filter(bouquet => bouquet.userId === userId)
      .map(pb => ({
        id: pb.id,
        userId: pb.userId,
        bouquetId: pb.bouquetId,
        fieldIndex: pb.fieldIndex,
        placedAt: pb.placedAt,
        expiresAt: pb.expiresAt,
        createdAt: pb.createdAt,
        bouquetName: pb.bouquetName,
        bouquetRarity: pb.bouquetRarity
      } as any));
  }

  async getUserButterflies(userId: number): Promise<UserButterfly[]> {
    return Array.from(this.userButterflies.values())
      .filter(butterfly => butterfly.userId === userId);
  }

  async addSeedToInventory(userId: number, rarity: RarityTier, quantity: number): Promise<void> {
    // Find existing seed of this rarity in user's inventory
    const existingSeed = Array.from(this.userSeeds.values())
      .find(seed => seed.userId === userId && seed.seedRarity === rarity);
    
    if (existingSeed) {
      // Add to existing quantity
      existingSeed.quantity += quantity;
      this.userSeeds.set(existingSeed.id, existingSeed);
    } else {
      // Create new seed inventory entry
      const newUserSeed = {
        id: this.currentUserSeedId++,
        userId,
        seedId: 1, // Generic seed ID for now
        quantity,
        createdAt: new Date(),
        seedName: `${rarity} Samen`,
        seedRarity: rarity
      };
      this.userSeeds.set(newUserSeed.id, newUserSeed);
    }
  }

  async collectExpiredBouquet(userId: number, fieldIndex: number): Promise<{ success: boolean; seedDrop?: { rarity: RarityTier; quantity: number } }> {
    // Find the expired bouquet on the specified field
    const placedBouquet = Array.from(this.placedBouquets.values()).find(pb => 
      pb.userId === userId && 
      pb.fieldIndex === fieldIndex &&
      new Date() > new Date(pb.expiresAt)
    );

    if (!placedBouquet) {
      return { success: false };
    }
    
    // Generate seed drop
    const seedDrop = getBouquetSeedDrop(placedBouquet.bouquetRarity as RarityTier);
    
    // Add seeds to user inventory
    await this.addSeedToInventory(userId, seedDrop.rarity, seedDrop.quantity);
    console.log(`💧 Expired bouquet collected manually, dropped ${seedDrop.quantity}x ${seedDrop.rarity} seeds for user ${userId}`);
    
    // Remove the expired bouquet
    this.placedBouquets.delete(placedBouquet.id);

    return { 
      success: true, 
      seedDrop: seedDrop 
    };
  }

  // New system: Spawn butterfly on a garden field
  async spawnButterflyOnField(userId: number, bouquetId: number, bouquetRarity: RarityTier): Promise<{ success: boolean; fieldButterfly?: FieldButterfly; fieldIndex?: number }> {
    const { generateRandomButterfly, shouldSpawnButterfly } = await import('./bouquet');
    
    // Check if butterfly should spawn based on rarity
    if (!shouldSpawnButterfly(bouquetRarity)) {
      return { success: false };
    }

    // Find an available field (not occupied by plants or other butterflies)
    const occupiedFields = new Set<number>();
    
    // Add planted fields
    Array.from(this.plantedFields.values())
      .filter(pf => pf.userId === userId)
      .forEach(pf => occupiedFields.add(pf.fieldIndex));
    
    // Add fields with butterflies  
    Array.from(this.fieldButterflies.values())
      .filter(fb => fb.userId === userId)
      .forEach(fb => occupiedFields.add(fb.fieldIndex));
    
    // Add fields with placed bouquets
    Array.from(this.placedBouquets.values())
      .filter(pb => pb.userId === userId)
      .forEach(pb => occupiedFields.add(pb.fieldIndex));
    
    // Find first available field (0-49)
    let availableField = -1;
    for (let i = 0; i < 50; i++) {
      if (!occupiedFields.has(i)) {
        availableField = i;
        break;
      }
    }
    
    if (availableField === -1) {
      console.log(`🦋 No available fields for butterfly spawn (user ${userId})`);
      return { success: false };
    }

    // Generate new butterfly
    const butterflyData = await generateRandomButterfly(bouquetRarity);
    
    // Create field butterfly
    const fieldButterfly: FieldButterfly = {
      id: this.currentFieldButterflyId++,
      userId,
      fieldIndex: availableField,
      butterflyId: butterflyData.id,
      butterflyName: butterflyData.name,
      butterflyRarity: bouquetRarity,
      butterflyImageUrl: butterflyData.imageUrl,
      bouquetId,
      spawnedAt: new Date(),
      createdAt: new Date()
    };
    
    this.fieldButterflies.set(fieldButterfly.id, fieldButterfly);
    console.log(`🦋 Butterfly spawned on field ${availableField}: ${butterflyData.name} (${bouquetRarity})`);
    return { success: true, fieldButterfly, fieldIndex: availableField };
  }

  // Get butterflies on garden fields
  async getFieldButterflies(userId: number): Promise<FieldButterfly[]> {
    return Array.from(this.fieldButterflies.values())
      .filter(fb => fb.userId === userId);
  }

  // Collect butterfly from field (move to inventory)
  async collectFieldButterfly(userId: number, fieldIndex: number): Promise<{ success: boolean; butterfly?: UserButterfly }> {
    // Find butterfly on this field
    const fieldButterfly = Array.from(this.fieldButterflies.values())
      .find(fb => fb.userId === userId && fb.fieldIndex === fieldIndex);
    
    if (!fieldButterfly) {
      return { success: false };
    }
    
    // Remove from field
    this.fieldButterflies.delete(fieldButterfly.id);
    
    // Add to user inventory
    const existingButterfly = Array.from(this.userButterflies.values())
      .find(b => b.userId === userId && b.butterflyId === fieldButterfly.butterflyId);
    
    if (existingButterfly) {
      // Increase quantity
      existingButterfly.quantity += 1;
      this.userButterflies.set(existingButterfly.id, existingButterfly);
      console.log(`🦋 Collected butterfly: +1 ${fieldButterfly.butterflyName} (total: ${existingButterfly.quantity})`);
      return { success: true, butterfly: existingButterfly };
    } else {
      // Create new butterfly in inventory
      const newButterfly: UserButterfly = {
        id: this.currentButterflyId++,
        userId,
        butterflyId: fieldButterfly.butterflyId,
        butterflyName: fieldButterfly.butterflyName,
        butterflyRarity: fieldButterfly.butterflyRarity,
        butterflyImageUrl: fieldButterfly.butterflyImageUrl,
        quantity: 1,
        createdAt: new Date()
      };
      this.userButterflies.set(newButterfly.id, newButterfly);
      console.log(`🦋 Collected new butterfly: ${fieldButterfly.butterflyName} (${fieldButterfly.butterflyRarity})`);
      return { success: true, butterfly: newButterfly };
    }
  }

  // Exhibition methods
  async getExhibitionFrames(userId: number): Promise<ExhibitionFrame[]> {
    return Array.from(this.exhibitionFrames.values())
      .filter(frame => frame.userId === userId)
      .sort((a, b) => a.frameNumber - b.frameNumber);
  }

  async purchaseExhibitionFrame(userId: number): Promise<{ success: boolean; message?: string; newCredits?: number; frame?: ExhibitionFrame }> {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const userFrames = await this.getExhibitionFrames(userId);
    const frameNumber = userFrames.length + 1;
    
    let cost = 0;
    if (frameNumber > 1) {
      // First frame is free, subsequent frames cost credits
      cost = Math.round(500 * Math.pow(1.2, frameNumber - 2));
    }

    if (user.credits < cost) {
      return { success: false, message: "Nicht genügend Credits" };
    }

    // Deduct credits
    user.credits -= cost;
    this.users.set(userId, user);

    // Create frame
    const frame: ExhibitionFrame = {
      id: this.currentExhibitionFrameId++,
      userId,
      frameNumber,
      purchasedAt: new Date(),
      createdAt: new Date()
    };

    this.exhibitionFrames.set(frame.id, frame);
    console.log(`🖼️ User ${userId} purchased exhibition frame #${frameNumber} for ${cost} credits`);
    
    return { success: true, newCredits: user.credits, frame };
  }

  async getExhibitionButterflies(userId: number): Promise<ExhibitionButterfly[]> {
    return Array.from(this.exhibitionButterflies.values())
      .filter(butterfly => butterfly.userId === userId);
  }

  async placeExhibitionButterfly(userId: number, frameId: number, slotIndex: number, butterflyId: number): Promise<{ success: boolean; message?: string }> {
    // Check if frame belongs to user
    const frame = this.exhibitionFrames.get(frameId);
    if (!frame || frame.userId !== userId) {
      return { success: false, message: "Frame not found" };
    }

    // Check if slot is already occupied
    const existingButterfly = Array.from(this.exhibitionButterflies.values())
      .find(eb => eb.frameId === frameId && eb.slotIndex === slotIndex);
    
    if (existingButterfly) {
      return { success: false, message: "Slot already occupied" };
    }

    // Check if user has this butterfly
    const userButterfly = Array.from(this.userButterflies.values())
      .find(ub => ub.userId === userId && ub.id === butterflyId);
    
    if (!userButterfly || userButterfly.quantity < 1) {
      return { success: false, message: "Butterfly not available" };
    }

    // Check if butterfly already exists in this frame (prevent duplicates)
    const duplicateInFrame = Array.from(this.exhibitionButterflies.values())
      .find(eb => eb.frameId === frameId && eb.butterflyId === userButterfly.butterflyId);
    
    if (duplicateInFrame) {
      return { success: false, message: "Dieser Schmetterling ist bereits in diesem Rahmen ausgestellt" };
    }
    
    if (!userButterfly || userButterfly.quantity < 1) {
      return { success: false, message: "Butterfly not available" };
    }

    // Remove butterfly from inventory
    if (userButterfly.quantity > 1) {
      userButterfly.quantity -= 1;
      this.userButterflies.set(userButterfly.id, userButterfly);
    } else {
      this.userButterflies.delete(userButterfly.id);
    }

    // Place butterfly in exhibition
    const exhibitionButterfly: ExhibitionButterfly = {
      id: this.currentExhibitionButterflyId++,
      userId,
      frameId,
      slotIndex,
      butterflyId: userButterfly.butterflyId,
      butterflyName: userButterfly.butterflyName,
      butterflyRarity: userButterfly.butterflyRarity,
      butterflyImageUrl: userButterfly.butterflyImageUrl,
      placedAt: new Date(),
      createdAt: new Date()
    };

    this.exhibitionButterflies.set(exhibitionButterfly.id, exhibitionButterfly);
    console.log(`🦋 Placed ${userButterfly.butterflyName} in exhibition frame ${frameId}, slot ${slotIndex}`);
    
    return { success: true };
  }

  async removeExhibitionButterfly(userId: number, frameId: number, slotIndex: number): Promise<{ success: boolean; message?: string }> {
    // Find butterfly in exhibition
    const exhibitionButterfly = Array.from(this.exhibitionButterflies.values())
      .find(eb => eb.userId === userId && eb.frameId === frameId && eb.slotIndex === slotIndex);
    
    if (!exhibitionButterfly) {
      return { success: false, message: "Butterfly not found in exhibition" };
    }

    // Remove from exhibition
    this.exhibitionButterflies.delete(exhibitionButterfly.id);

    // Add back to user inventory
    const existingButterfly = Array.from(this.userButterflies.values())
      .find(ub => ub.userId === userId && ub.butterflyId === exhibitionButterfly.butterflyId);
    
    if (existingButterfly) {
      existingButterfly.quantity += 1;
      this.userButterflies.set(existingButterfly.id, existingButterfly);
    } else {
      const newButterfly: UserButterfly = {
        id: this.currentButterflyId++,
        userId,
        butterflyId: exhibitionButterfly.butterflyId,
        butterflyName: exhibitionButterfly.butterflyName,
        butterflyRarity: exhibitionButterfly.butterflyRarity,
        butterflyImageUrl: exhibitionButterfly.butterflyImageUrl,
        quantity: 1,
        createdAt: new Date()
      };
      this.userButterflies.set(newButterfly.id, newButterfly);
    }

    console.log(`🦋 Removed ${exhibitionButterfly.butterflyName} from exhibition back to inventory`);
    return { success: true };
  }

  // Get butterfly sell price based on rarity
  getButterflysellPrice(rarity: string): number {
    const prices = {
      'common': 50,
      'uncommon': 100,
      'rare': 200,
      'super-rare': 400,
      'epic': 600,
      'legendary': 800,
      'mythical': 1000
    };
    return prices[rarity as keyof typeof prices] || 50;
  }

  // Check if butterfly can be sold (72 hours = 259200000 ms after placement, reduced by likes)
  canSellButterfly(placedAt: Date, frameId: number): boolean {
    const now = new Date();
    const timeSincePlacement = now.getTime() - placedAt.getTime();
    
    // Count likes for this frame
    const likesCount = Array.from(this.exhibitionFrameLikes.values())
      .filter(like => like.frameId === frameId).length;
    
    // Reduce required time by 1 minute (60000 ms) per like
    const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000; // 72 hours in milliseconds
    const ONE_MINUTE = 60 * 1000; // 1 minute in milliseconds
    const requiredTime = SEVENTY_TWO_HOURS - (likesCount * ONE_MINUTE);
    
    return timeSincePlacement >= Math.max(0, requiredTime);
  }

  // Get time remaining until butterfly can be sold (reduced by likes)
  getTimeUntilSellable(placedAt: Date, frameId: number): number {
    const now = new Date();
    const timeSincePlacement = now.getTime() - placedAt.getTime();
    
    // Count likes for this frame
    const likesCount = Array.from(this.exhibitionFrameLikes.values())
      .filter(like => like.frameId === frameId).length;
    
    // Reduce required time by 1 minute (60000 ms) per like
    const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000;
    const ONE_MINUTE = 60 * 1000;
    const requiredTime = SEVENTY_TWO_HOURS - (likesCount * ONE_MINUTE);
    
    const remaining = requiredTime - timeSincePlacement;
    return Math.max(0, remaining);
  }

  async sellExhibitionButterfly(userId: number, exhibitionButterflyId: number): Promise<{ success: boolean; message?: string; creditsEarned?: number }> {
    // Find the exhibition butterfly
    const exhibitionButterfly = this.exhibitionButterflies.get(exhibitionButterflyId);
    
    if (!exhibitionButterfly) {
      return { success: false, message: "Schmetterling nicht gefunden" };
    }

    // Check ownership
    if (exhibitionButterfly.userId !== userId) {
      return { success: false, message: "Dieser Schmetterling gehört dir nicht" };
    }

    // Check if 72 hours have passed (reduced by likes)
    if (!this.canSellButterfly(exhibitionButterfly.placedAt, exhibitionButterfly.frameId)) {
      const timeRemaining = this.getTimeUntilSellable(exhibitionButterfly.placedAt, exhibitionButterfly.frameId);
      const hoursRemaining = Math.ceil(timeRemaining / (60 * 60 * 1000));
      
      // Count likes for better user feedback
      const likesCount = Array.from(this.exhibitionFrameLikes.values())
        .filter(like => like.frameId === exhibitionButterfly.frameId).length;
      
      const likesText = likesCount > 0 ? ` (${likesCount} Likes = ${likesCount} Min. weniger)` : '';
      return { success: false, message: `Du kannst diesen Schmetterling in ${hoursRemaining} Stunden verkaufen${likesText}` };
    }

    // Calculate sell price
    const creditsEarned = this.getButterflysellPrice(exhibitionButterfly.butterflyRarity);

    // Remove butterfly from exhibition
    this.exhibitionButterflies.delete(exhibitionButterflyId);

    // Add credits to user
    const user = this.users.get(userId);
    if (user) {
      user.credits += creditsEarned;
      this.users.set(userId, user);
    }

    console.log(`💰 Sold ${exhibitionButterfly.butterflyName} for ${creditsEarned} credits`);
    return { success: true, creditsEarned };
  }

  async processPassiveIncome(userId: number): Promise<{ success: boolean; creditsEarned?: number }> {
    const exhibitionButterflies = await this.getExhibitionButterflies(userId);
    
    if (exhibitionButterflies.length === 0) {
      return { success: true, creditsEarned: 0 };
    }

    // Calculate hourly income rate
    let totalHourlyIncome = 0;
    for (const butterfly of exhibitionButterflies) {
      switch (butterfly.butterflyRarity) {
        case 'common': totalHourlyIncome += 1; break;
        case 'uncommon': totalHourlyIncome += 3; break;
        case 'rare': totalHourlyIncome += 8; break;
        case 'super-rare': totalHourlyIncome += 15; break;
        case 'epic': totalHourlyIncome += 25; break;
        case 'legendary': totalHourlyIncome += 50; break;
        case 'mythical': totalHourlyIncome += 100; break;
        default: totalHourlyIncome += 1; break;
      }
    }

    // Calculate minutes needed for 1 credit
    // If hourly income is 6, then 1 credit every 10 minutes (60/6 = 10)
    const minutesPerCredit = totalHourlyIncome > 0 ? 60 / totalHourlyIncome : 0;
    
    if (minutesPerCredit === 0) {
      return { success: true, creditsEarned: 0 };
    }

    // Get user's last passive income timestamp
    const user = this.users.get(userId);
    if (!user) {
      return { success: false };
    }

    // Check if user has lastPassiveIncomeAt property, if not set it to now
    if (!user.lastPassiveIncomeAt) {
      user.lastPassiveIncomeAt = new Date();
      this.users.set(userId, user);
      return { success: true, creditsEarned: 0 };
    }

    const now = new Date();
    const timeSinceLastIncome = now.getTime() - user.lastPassiveIncomeAt.getTime();
    const minutesSinceLastIncome = timeSinceLastIncome / (1000 * 60);

    // Calculate how many credits to award
    const creditsToAward = Math.floor(minutesSinceLastIncome / minutesPerCredit);

    if (creditsToAward >= 1) {
      // Award the credits
      user.credits += creditsToAward;
      // Update timestamp - add the exact time for the credited minutes
      user.lastPassiveIncomeAt = new Date(user.lastPassiveIncomeAt.getTime() + (creditsToAward * minutesPerCredit * 60 * 1000));
      this.users.set(userId, user);

      // Log the income
      const incomeLog: PassiveIncomeLog = {
        id: this.currentPassiveIncomeId++,
        userId,
        amount: creditsToAward,
        sourceType: 'exhibition',
        sourceDetails: `${exhibitionButterflies.length} butterflies, ${totalHourlyIncome}cr/h`,
        earnedAt: new Date(),
        createdAt: new Date()
      };
      this.passiveIncomeLog.set(incomeLog.id, incomeLog);

      console.log(`💰 User ${userId} earned ${creditsToAward} credits from exhibition (${totalHourlyIncome}cr/h, ${minutesPerCredit.toFixed(1)}min/cr)`);
      return { success: true, creditsEarned: creditsToAward };
    }

    return { success: true, creditsEarned: 0 };
  }

  async updateUserActivity(userId: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
  }

  async getAllUsersWithStatus(excludeUserId?: number): Promise<Array<{
    id: number;
    username: string;
    isOnline: boolean;
    exhibitionButterflies: number;
    lastSeen: string;
    totalLikes: number;
  }>> {
    const users = Array.from(this.users.values());
    const userList = [];
    
    for (const user of users) {
      // Skip demo users and current user
      if (user.id === 99 || (excludeUserId && user.id === excludeUserId)) continue;
      
      // Get exhibition butterflies count
      const exhibitionButterflies = Array.from(this.exhibitionButterflies.values())
        .filter(eb => eb.userId === user.id);
      
      // For now, we'll simulate online status based on recent activity
      // In a real app, this would track actual login/logout events
      const now = new Date();
      const lastActivity = user.updatedAt || user.createdAt;
      
      // Ensure lastActivity is a Date object (fix for JSON serialization)
      const lastActivityDate = lastActivity instanceof Date ? lastActivity : new Date(lastActivity);
      const timeDiff = now.getTime() - lastActivityDate.getTime();
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
      const totalLikes = Array.from(this.exhibitionFrameLikes.values())
        .filter(like => like.frameOwnerId === user.id).length;
      
      userList.push({
        id: user.id,
        username: user.username,
        isOnline,
        exhibitionButterflies: exhibitionButterflies.length,
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
    
    return userList;
  }

  // Like system methods
  async likeExhibitionFrame(likerId: number, frameOwnerId: number, frameId: number): Promise<{ success: boolean; message?: string }> {
    // Check if the frame exists
    const frame = this.exhibitionFrames.get(frameId);
    if (!frame) {
      return { success: false, message: 'Exhibition frame not found' };
    }

    // Check if user is trying to like their own frame
    if (frameOwnerId === likerId) {
      return { success: false, message: 'Cannot like your own exhibition frame' };
    }

    // Check if frame has 6 butterflies (full frame)
    const frameButterflies = Array.from(this.exhibitionButterflies.values())
      .filter(butterfly => butterfly.frameId === frameId);
    
    if (frameButterflies.length < 6) {
      return { success: false, message: 'Can only like frames with 6 butterflies' };
    }

    // Check if already liked
    const existingLike = Array.from(this.exhibitionFrameLikes.values())
      .find(like => like.frameOwnerId === frameOwnerId && like.likerId === likerId && like.frameId === frameId);
    
    if (existingLike) {
      return { success: false, message: 'Already liked this frame' };
    }

    // Create new like
    const like: ExhibitionFrameLike = {
      id: this.currentFrameLikeId++,
      frameOwnerId,
      likerId,
      frameId,
      createdAt: new Date()
    };

    this.exhibitionFrameLikes.set(like.id, like);
    return { success: true };
  }

  async unlikeExhibitionFrame(likerId: number, frameOwnerId: number, frameId: number): Promise<{ success: boolean; message?: string }> {
    // Find the like
    const existingLike = Array.from(this.exhibitionFrameLikes.values())
      .find(like => like.frameOwnerId === frameOwnerId && like.likerId === likerId && like.frameId === frameId);
    
    if (!existingLike) {
      return { success: false, message: 'Like not found' };
    }

    // Remove the like
    this.exhibitionFrameLikes.delete(existingLike.id);
    return { success: true };
  }

  async getUserFrameLikes(userId: number, frameOwnerId: number): Promise<Array<{ frameId: number; isLiked: boolean; totalLikes: number }>> {
    // Get all frames for the owner
    const ownerFrames = Array.from(this.exhibitionFrames.values())
      .filter(frame => frame.userId === frameOwnerId);
    
    return ownerFrames.map(frame => {
      const totalLikes = Array.from(this.exhibitionFrameLikes.values())
        .filter(like => like.frameId === frame.id).length;
      
      const isLiked = Array.from(this.exhibitionFrameLikes.values())
        .some(like => like.frameId === frame.id && like.likerId === userId);
      
      return {
        frameId: frame.id,
        isLiked,
        totalLikes
      };
    });
  }

  async getForeignExhibitionButterflies(ownerId: number): Promise<ExhibitionButterfly[]> {
    return Array.from(this.exhibitionButterflies.values())
      .filter(eb => eb.userId === ownerId);
  }
}

interface ExhibitionFrameLike {
  id: number;
  frameOwnerId: number;
  likerId: number;
  frameId: number;
  createdAt: Date;
}

// Initialize database connection
const sql = neon(process.env.DATABASE_URL || '');
const db = drizzle(sql, { schema });

class PostgreSQLStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    // Create user with default credits (1000)
    const result = await db.insert(users).values({
      ...user,
      credits: 1000
    }).returning();
    const newUser = result[0];

    // Add start seeds to inventory: 5 common + 3 rare
    try {
      // Get seed IDs for common and rare seeds
      const commonSeeds = await db.select().from(seeds).where(eq(seeds.rarity, 'common')).limit(1);
      const rareSeeds = await db.select().from(seeds).where(eq(seeds.rarity, 'rare')).limit(1);

      const startSeeds = [
        { seedId: commonSeeds[0]?.id || 1, rarity: 'common', quantity: 5 },
        { seedId: rareSeeds[0]?.id || 2, rarity: 'rare', quantity: 3 }
      ];

      for (const seedInfo of startSeeds) {
        await db.insert(userSeeds).values({
          userId: newUser.id,
          seedId: seedInfo.seedId,
          quantity: seedInfo.quantity
        });
      }
    } catch (error) {
      console.error(`❌ Error adding start seeds for user ${newUser.username}:`, error);
    }

    console.log(`🌱 New user ${newUser.username} created with 5 common + 3 rare seeds`);
    return newUser;
  }

  async updateUserCredits(id: number, amount: number): Promise<User | undefined> {
    const result = await db.update(users).set({ credits: amount }).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Market methods - Stub implementations for now
  async getMarketListings(): Promise<any[]> {
    return [];
  }

  async createMarketListing(sellerId: number, data: CreateMarketListingRequest): Promise<any> {
    return null;
  }

  async buyMarketListing(buyerId: number, data: BuyListingRequest): Promise<{ success: boolean; message?: string }> {
    return { success: false, message: 'Not implemented yet' };
  }

  async getUserSeeds(userId: number): Promise<any[]> {
    const result = await db
      .select({
        id: userSeeds.id,
        userId: userSeeds.userId,
        seedId: userSeeds.seedId,
        quantity: userSeeds.quantity,
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
    return { success: false, message: 'Not implemented yet' };
  }

  async getPlantedFields(userId: number): Promise<PlantedField[]> {
    const result = await db.select().from(plantedFields).where(eq(plantedFields.userId, userId));
    return result;
  }

  async harvestField(userId: number, data: HarvestFieldRequest): Promise<{ success: boolean; message?: string }> {
    return { success: false, message: 'Not implemented yet' };
  }

  // Flower inventory methods
  async getUserFlowers(userId: number): Promise<UserFlower[]> {
    const result = await db.select().from(userFlowers).where(eq(userFlowers.userId, userId));
    return result;
  }

  async addFlowerToInventory(userId: number, flowerId: number, flowerName: string, flowerRarity: string, flowerImageUrl: string): Promise<void> {
    await db.insert(userFlowers).values({
      userId,
      flowerId,
      flowerName,
      flowerRarity,
      flowerImageUrl,
      quantity: 1
    });
  }

  // Bouquet methods - Stub implementations
  async createBouquet(userId: number, data: CreateBouquetRequest): Promise<{ success: boolean; message?: string; bouquet?: Bouquet }> {
    return { success: false, message: 'Not implemented yet' };
  }

  async getUserBouquets(userId: number): Promise<UserBouquet[]> {
    const result = await db.select().from(userBouquets).where(eq(userBouquets.userId, userId));
    return result;
  }

  async getBouquetRecipes(): Promise<BouquetRecipe[]> {
    const result = await db.select().from(bouquetRecipes);
    return result;
  }

  async getBouquetRecipe(bouquetId: number): Promise<BouquetRecipe | null> {
    const result = await db.select().from(bouquetRecipes).where(eq(bouquetRecipes.bouquetId, bouquetId)).limit(1);
    return result[0] || null;
  }

  async placeBouquet(userId: number, data: PlaceBouquetRequest): Promise<{ success: boolean; message?: string }> {
    return { success: false, message: 'Not implemented yet' };
  }

  async getPlacedBouquets(userId: number): Promise<PlacedBouquet[]> {
    const result = await db.select().from(placedBouquets).where(eq(placedBouquets.userId, userId));
    return result;
  }

  async getUserButterflies(userId: number): Promise<UserButterfly[]> {
    const result = await db.select().from(userButterflies).where(eq(userButterflies.userId, userId));
    return result;
  }

  // Seed management methods
  async addSeedToInventory(userId: number, rarity: RarityTier, quantity: number): Promise<void> {
    // Stub implementation
  }

  async collectExpiredBouquet(userId: number, fieldIndex: number): Promise<{ success: boolean; seedDrop?: { rarity: RarityTier; quantity: number } }> {
    return { success: false };
  }

  // Butterfly management methods
  async spawnButterflyOnField(userId: number, bouquetId: number, bouquetRarity: RarityTier): Promise<{ success: boolean; fieldButterfly?: FieldButterfly; fieldIndex?: number }> {
    return { success: false };
  }

  async collectFieldButterfly(userId: number, fieldIndex: number): Promise<{ success: boolean; butterfly?: UserButterfly }> {
    return { success: false };
  }

  // Exhibition methods
  async getExhibitionFrames(userId: number): Promise<ExhibitionFrame[]> {
    const result = await db.select().from(exhibitionFrames).where(eq(exhibitionFrames.userId, userId));
    return result;
  }

  async purchaseExhibitionFrame(userId: number): Promise<{ success: boolean; message?: string; newCredits?: number; frame?: ExhibitionFrame }> {
    try {
      // Check user credits
      const user = await this.getUser(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const framePrice = 100;
      if (user.credits < framePrice) {
        return { success: false, message: 'Not enough credits' };
      }

      // Get current frame count
      const frames = await this.getExhibitionFrames(userId);
      const nextFrameNumber = frames.length + 1;

      // Create frame and deduct credits in transaction
      const [newFrame] = await db.insert(exhibitionFrames).values({
        userId,
        frameNumber: nextFrameNumber
      }).returning();

      const updatedUser = await this.updateUserCredits(userId, user.credits - framePrice);

      return { 
        success: true, 
        newCredits: updatedUser?.credits,
        frame: newFrame
      };
    } catch (error) {
      return { success: false, message: 'Database error' };
    }
  }

  async getExhibitionButterflies(userId: number): Promise<ExhibitionButterfly[]> {
    const result = await db.select().from(exhibitionButterflies).where(eq(exhibitionButterflies.userId, userId));
    return result;
  }

  async placeExhibitionButterfly(userId: number, frameId: number, slotIndex: number, butterflyId: number): Promise<{ success: boolean; message?: string }> {
    try {
      // Get butterfly from user inventory
      const userButterfliesResult = await db.select().from(userButterflies)
        .where(eq(userButterflies.userId, userId));
      
      const butterfly = userButterfliesResult.find(b => b.butterflyId === butterflyId);
      if (!butterfly) {
        return { success: false, message: 'Butterfly not found in inventory' };
      }

      // Place butterfly in exhibition
      await db.insert(exhibitionButterflies).values({
        userId,
        frameId,
        slotIndex,
        butterflyId: butterfly.butterflyId,
        butterflyName: butterfly.butterflyName,
        butterflyRarity: butterfly.butterflyRarity,
        butterflyImageUrl: butterfly.butterflyImageUrl
      });

      // Remove from user inventory
      await db.delete(userButterflies)
        .where(eq(userButterflies.id, butterfly.id));

      return { success: true };
    } catch (error) {
      return { success: false, message: 'Database error' };
    }
  }

  async removeExhibitionButterfly(userId: number, frameId: number, slotIndex: number): Promise<{ success: boolean; message?: string }> {
    return { success: false, message: 'Not implemented yet' };
  }

  async sellExhibitionButterfly(userId: number, exhibitionButterflyId: number): Promise<{ success: boolean; message?: string; creditsEarned?: number }> {
    return { success: false, message: 'Not implemented yet' };
  }

  async processPassiveIncome(userId: number): Promise<{ success: boolean; creditsEarned?: number }> {
    return { success: false, creditsEarned: 0 };
  }

  // Stub methods for missing interface methods
  async likeExhibitionFrame(likerId: number, frameOwnerId: number, frameId: number): Promise<{ success: boolean; message?: string }> {
    return { success: false, message: 'Not implemented yet' };
  }

  async unlikeExhibitionFrame(likerId: number, frameOwnerId: number, frameId: number): Promise<{ success: boolean; message?: string }> {
    return { success: false, message: 'Not implemented yet' };
  }

  async getUserFrameLikes(userId: number, frameOwnerId: number): Promise<Array<{ frameId: number; isLiked: boolean; totalLikes: number }>> {
    return [];
  }

  async getForeignExhibitionButterflies(ownerId: number): Promise<ExhibitionButterfly[]> {
    const result = await db.select().from(exhibitionButterflies).where(eq(exhibitionButterflies.userId, ownerId));
    return result;
  }

  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(users);
    return result;
  }

  async getAllUsersWithStatus(): Promise<(User & { isOnline: boolean })[]> {
    const users = await this.getAllUsers();
    // For now, mark all users as offline since we need to implement session tracking
    return users.map(user => ({ ...user, isOnline: false }));
  }

  async getFieldButterflies(userId: number): Promise<FieldButterfly[]> {
    const result = await db.select().from(fieldButterflies).where(eq(fieldButterflies.userId, userId));
    return result;
  }

  async updateUserActivity(userId: number): Promise<void> {
    // Update user's last activity timestamp
    try {
      await db.update(users).set({ updatedAt: new Date() }).where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating user activity:', error);
    }
  }

  async saveData(): Promise<void> {
    // No-op for PostgreSQL - data is automatically persisted
    console.log('💾 PostgreSQL data automatically persisted');
  }
}

export const storage = new PostgreSQLStorage();
