import { 
  users, 
  seeds, 
  userSeeds, 
  marketListings,
  plantedFields,
  type User, 
  type InsertUser, 
  type Seed, 
  type UserSeed, 
  type MarketListing,
  type PlantedField,
  type CreateMarketListingRequest,
  type BuyListingRequest,
  type PlantSeedRequest,
  type HarvestFieldRequest
} from "@shared/schema";
import { generateRandomFlower, getGrowthTime, type RarityTier } from "@shared/rarity";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private seeds: Map<number, Seed>;
  private userSeeds: Map<number, UserSeed & { seedName: string; seedRarity: string }>;
  private marketListings: Map<number, MarketListing & { sellerUsername: string; seedName: string; seedRarity: string }>;
  private plantedFields: Map<number, PlantedField>;
  private currentId: number;
  private currentSeedId: number;
  private currentUserSeedId: number;
  private currentListingId: number;
  private currentFieldId: number;

  constructor() {
    this.users = new Map();
    this.seeds = new Map();
    this.userSeeds = new Map();
    this.marketListings = new Map();
    this.plantedFields = new Map();
    this.currentId = 1;
    this.currentSeedId = 1;
    this.currentUserSeedId = 1;
    this.currentListingId = 1;
    this.currentFieldId = 1;
    
    // Initialize with some sample seeds and demo market listings
    this.initializeSampleSeeds();
    this.createDemoMarketListings();
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
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async updateUserCredits(id: number, amount: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { 
      ...user, 
      credits: Math.max(0, user.credits + amount),
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
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
    return Array.from(this.userSeeds.values())
      .filter(userSeed => userSeed.userId === userId && userSeed.quantity > 0);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      credits: 1000,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);

    // Give new users some starter seeds
    this.giveStarterSeeds(id);
    
    return user;
  }

  private giveStarterSeeds(userId: number) {
    // Give new users some common seeds to start with
    const starterSeeds = [
      { seedId: 1, quantity: 5 }, // 5 Sonnenblume seeds
      { seedId: 3, quantity: 3 }, // 3 Tulpe seeds
    ];

    for (const starter of starterSeeds) {
      const seed = this.seeds.get(starter.seedId);
      if (seed) {
        const userSeed = {
          id: this.currentUserSeedId++,
          userId,
          seedId: starter.seedId,
          quantity: starter.quantity,
          createdAt: new Date(),
          seedName: seed.name,
          seedRarity: seed.rarity
        };
        this.userSeeds.set(userSeed.id, userSeed);
      }
    }
  }

  private createDemoMarketListings() {
    // Create some demo users and listings so the market isn't empty
    const demoUser = {
      id: 99,
      username: "Demo_Händler",
      password: "demo",
      credits: 5000,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(99, demoUser);

    // Give demo user some seeds
    const demoUserSeeds = [
      { id: 1000, userId: 99, seedId: 1, quantity: 10, seedName: "Common Samen", seedRarity: "common", createdAt: new Date() },
      { id: 1001, userId: 99, seedId: 2, quantity: 5, seedName: "Uncommon Samen", seedRarity: "uncommon", createdAt: new Date() },
      { id: 1002, userId: 99, seedId: 3, quantity: 3, seedName: "Rare Samen", seedRarity: "rare", createdAt: new Date() },
      { id: 1003, userId: 99, seedId: 4, quantity: 2, seedName: "Super-rare Samen", seedRarity: "super-rare", createdAt: new Date() },
      { id: 1004, userId: 99, seedId: 5, quantity: 1, seedName: "Epic Samen", seedRarity: "epic", createdAt: new Date() },
      { id: 1005, userId: 99, seedId: 6, quantity: 1, seedName: "Legendary Samen", seedRarity: "legendary", createdAt: new Date() }
    ];

    demoUserSeeds.forEach(userSeed => {
      this.userSeeds.set(userSeed.id, userSeed);
    });

    // Create demo market listings
    const demoListings = [
      {
        id: 1,
        sellerId: 99,
        seedId: 1,
        quantity: 3,
        pricePerUnit: 15,
        totalPrice: 45,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        sellerUsername: "Demo_Händler",
        seedName: "Common Samen",
        seedRarity: "common"
      },
      {
        id: 2,
        sellerId: 99,
        seedId: 2,
        quantity: 2,
        pricePerUnit: 30,
        totalPrice: 60,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        sellerUsername: "Demo_Händler",
        seedName: "Uncommon Samen",
        seedRarity: "uncommon"
      },
      {
        id: 3,
        sellerId: 99,
        seedId: 3,
        quantity: 1,
        pricePerUnit: 75,
        totalPrice: 75,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        sellerUsername: "Demo_Händler",
        seedName: "Rare Samen",
        seedRarity: "rare"
      },
      {
        id: 4,
        sellerId: 99,
        seedId: 4,
        quantity: 1,
        pricePerUnit: 150,
        totalPrice: 150,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        sellerUsername: "Demo_Händler",
        seedName: "Super-rare Samen",
        seedRarity: "super-rare"
      },
      {
        id: 5,
        sellerId: 99,
        seedId: 5,
        quantity: 1,
        pricePerUnit: 300,
        totalPrice: 300,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        sellerUsername: "Demo_Händler",
        seedName: "Epic Samen",
        seedRarity: "epic"
      },
      {
        id: 6,
        sellerId: 99,
        seedId: 6,
        quantity: 1,
        pricePerUnit: 750,
        totalPrice: 750,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        sellerUsername: "Demo_Händler",
        seedName: "Legendary Samen",
        seedRarity: "legendary"
      }
    ];

    demoListings.forEach(listing => {
      this.marketListings.set(listing.id, listing);
    });

    this.currentListingId = 7;
  }

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

    if (!plantedField.isGrown) {
      return { success: false, message: "Die Blume ist noch nicht gewachsen" };
    }

    // Remove planted field
    this.plantedFields.delete(plantedField.id);

    // TODO: Add flower/butterfly to user inventory
    
    return { success: true };
  }
}

export const storage = new MemStorage();
