import type { Express } from "express";
import { createServer, type Server } from "http";
import { postgresStorage as storage } from "./postgresStorage";
import { insertUserSchema, loginSchema, createMarketListingSchema, buyListingSchema, plantSeedSchema, harvestFieldSchema, createBouquetSchema, placeBouquetSchema, unlockFieldSchema, collectSunSchema, placeButterflyOnFieldSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          credits: user.credits 
        } 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(loginData.username);
      if (!user || user.password !== loginData.password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          credits: user.credits 
        } 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Credits routes
  app.get("/api/user/:id/credits", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ credits: user.credits });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/user/:id/credits", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount } = req.body;
      
      if (typeof amount !== 'number') {
        return res.status(400).json({ message: "Amount must be a number" });
      }

      const user = await storage.updateUserCredits(userId, amount);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ credits: user.credits });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Suns routes
  app.get("/api/user/:id/suns", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ suns: user.suns || 100 });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/user/:id/suns", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount } = req.body;
      
      if (typeof amount !== 'number') {
        return res.status(400).json({ message: "Amount must be a number" });
      }

      const user = await storage.updateUserSuns(userId, amount);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ suns: user.suns });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Market routes
  app.get("/api/market/listings", async (req, res) => {
    try {
      const listings = await storage.getMarketListings();
      res.json({ listings });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/market/create-listing", async (req, res) => {
    try {
      const listingData = createMarketListingSchema.parse(req.body);
      const sellerId = parseInt(req.headers['x-user-id'] as string) || 1;
      
      const listing = await storage.createMarketListing(sellerId, listingData);
      res.json({ listing });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/market/buy", async (req, res) => {
    try {
      const buyData = buyListingSchema.parse(req.body);
      const buyerId = parseInt(req.headers['x-user-id'] as string) || 1;
      
      const result = await storage.buyMarketListing(buyerId, buyData);
      if (result.success) {
        res.json({ message: "Purchase successful" });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Server Shop routes
  app.get("/api/market/server-shop", async (req, res) => {
    try {
      // Server offers - Credits
      const creditOffers = [
        {
          id: "server-common-seeds-credits",
          seedId: 1, // Common seed ID
          seedName: "Gewöhnliche Samen",
          seedRarity: "common",
          pricePerUnit: 50,
          currency: "credits",
          quantity: 999, // Unlimited
          seller: "🏪 Mariposa Shop",
          description: "Hochwertige Samen vom offiziellen Mariposa-Händler"
        }
      ];
      
      // Server offers - Sonnen
      const sunOffers = [
        {
          id: "server-common-seeds-suns",
          seedId: 1, // Common seed ID
          seedName: "Gewöhnliche Samen",
          seedRarity: "common",
          pricePerUnit: 20,
          currency: "suns",
          quantity: 999, // Unlimited
          seller: "☀️ Sonnen-Shop",
          description: "Gewöhnliche Samen für Sonnen"
        },
        {
          id: "server-uncommon-seeds-suns",
          seedId: 2, // Uncommon seed ID
          seedName: "Ungewöhnliche Samen",
          seedRarity: "uncommon",
          pricePerUnit: 30,
          currency: "suns",
          quantity: 999, // Unlimited
          seller: "☀️ Sonnen-Shop",
          description: "Ungewöhnliche Samen für Sonnen"
        },
        {
          id: "server-rare-seeds-suns",
          seedId: 3, // Rare seed ID
          seedName: "Seltene Samen",
          seedRarity: "rare",
          pricePerUnit: 50,
          currency: "suns",
          quantity: 999, // Unlimited
          seller: "☀️ Sonnen-Shop",
          description: "Seltene Samen für Sonnen"
        },
        {
          id: "server-superrare-seeds-suns",
          seedId: 4, // Super-rare seed ID
          seedName: "Super-seltene Samen",
          seedRarity: "super-rare",
          pricePerUnit: 100,
          currency: "suns",
          quantity: 999, // Unlimited
          seller: "☀️ Sonnen-Shop",
          description: "Super-seltene Samen für Sonnen"
        }
      ];
      
      res.json({ creditOffers, sunOffers });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/market/buy-from-server", async (req, res) => {
    try {
      const { seedId, quantity } = req.body;
      const buyerId = parseInt(req.headers['x-user-id'] as string) || 1;
      
      if (seedId !== 1) {
        return res.status(400).json({ message: "Server verkauft nur gewöhnliche Samen für Credits" });
      }
      
      if (quantity <= 0 || quantity > 100) {
        return res.status(400).json({ message: "Ungültige Menge (1-100)" });
      }
      
      const totalCost = quantity * 50; // 50 credits per common seed
      
      const user = await storage.getUser(buyerId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.credits < totalCost) {
        return res.status(400).json({ message: `Du brauchst ${totalCost} Credits für ${quantity} Samen` });
      }
      
      // Deduct credits and give seeds
      await storage.updateUserCredits(buyerId, -totalCost);
      await storage.giveUserSeed(buyerId, 1, quantity); // Give common seeds
      
      res.json({ 
        success: true, 
        message: `Erfolgreich ${quantity} gewöhnliche Samen für ${totalCost} Credits gekauft!` 
      });
    } catch (error) {
      console.error('Server shop purchase error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Sonnen-Shop route
  app.post("/api/market/buy-from-server-suns", async (req, res) => {
    try {
      const { seedId, quantity } = req.body;
      const buyerId = parseInt(req.headers['x-user-id'] as string) || 1;
      
      // Define valid seeds and their prices in Sonnen
      const sunPrices: Record<number, { name: string; price: number }> = {
        1: { name: "gewöhnliche", price: 20 },    // Common
        2: { name: "ungewöhnliche", price: 30 },  // Uncommon  
        3: { name: "seltene", price: 50 },        // Rare
        4: { name: "super-seltene", price: 100 }  // Super-rare
      };
      
      if (!sunPrices[seedId]) {
        return res.status(400).json({ message: "Ungültige Samen-ID für Sonnen-Shop" });
      }
      
      if (quantity <= 0 || quantity > 100) {
        return res.status(400).json({ message: "Ungültige Menge (1-100)" });
      }
      
      const seedInfo = sunPrices[seedId];
      const totalCost = quantity * seedInfo.price;
      
      const user = await storage.getUser(buyerId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.suns < totalCost) {
        return res.status(400).json({ message: `Du brauchst ${totalCost} Sonnen für ${quantity} ${seedInfo.name} Samen` });
      }
      
      // Deduct suns and give seeds
      await storage.updateUserSuns(buyerId, -totalCost);
      await storage.giveUserSeed(buyerId, seedId, quantity);
      
      res.json({ 
        success: true, 
        message: `Erfolgreich ${quantity} ${seedInfo.name} Samen für ${totalCost} Sonnen gekauft!` 
      });
    } catch (error) {
      console.error('Suns shop purchase error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Emergency starter seeds route
  app.post("/api/user/:id/emergency-seeds", async (req, res) => {
    console.log(`🚨 Emergency Seeds Request reached for user ${req.params.id}`);
    try {
      const userId = parseInt(req.params.id);
      console.log(`🚨 Parsed userId: ${userId}`);
      
      // Get user first
      const user = await storage.getUser(userId);
      if (!user) {
        console.log(`❌ User ${userId} not found`);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`🔍 SOS Debug: User ${userId} credits: ${user.credits}`);
      
      // 🆘 SOS SYSTEM: Check if user has extremely negative credits (≤ -100) - override ALL restrictions
      const isSOSCase = user.credits <= -100;
      console.log(`🔍 SOS Debug: isSOSCase = ${isSOSCase}`);
      
      if (isSOSCase) {
        console.log(`🆘 SOS ACTIVATED: User ${userId} has extreme negative credits (${user.credits}), providing emergency help`);
        
        // Give emergency help: 50 credits + 3 seeds
        const creditDelta = 50 - user.credits; // Calculate delta to reach 50 credits
        await storage.updateUserCredits(userId, creditDelta);
        await storage.giveUserSeed(userId, 1, 3);
        
        console.log(`🆘 SOS SUCCESS: User ${userId} credits: ${user.credits} -> 50, +3 seeds`);
        
        return res.json({ 
          success: true, 
          message: "🆘 Notfall-Hilfe erhalten! Du hast 50 Credits und 3 Samen bekommen.",
          credits: 50,
          seeds: 3,
          sosActivated: true
        });
      }
      
      console.log(`📋 Normal Emergency Seeds check for user ${userId}`);
      // Check if user qualifies for emergency seeds (normal case)
      const qualifies = await storage.checkEmergencyQualification(userId);
      console.log(`📋 Emergency qualification result:`, qualifies);
      
      if (!qualifies.eligible) {
        console.log(`❌ User ${userId} not eligible: ${qualifies.reason}`);
        return res.status(400).json({ 
          message: qualifies.reason || "Du bist nicht berechtigt für Notfall-Samen" 
        });
      }
      
      console.log(`✅ Giving user ${userId} emergency seeds`);
      // Give 3 common seeds
      await storage.giveUserSeed(userId, 1, 3);
      
      res.json({ 
        success: true, 
        message: "Du hast 3 gewöhnliche Notfall-Samen erhalten! 🌱",
        seeds: 3
      });
    } catch (error) {
      console.error('Emergency seeds error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user/:id/seeds", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const seeds = await storage.getUserSeeds(userId);
      res.json({ seeds });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Garden routes
  app.post("/api/garden/plant", async (req, res) => {
    try {
      const plantData = plantSeedSchema.parse(req.body);
      const userId = parseInt(req.headers['x-user-id'] as string) || 1;
      
      const result = await storage.plantSeed(userId, plantData);
      if (result.success) {
        res.json({ message: "Samen erfolgreich gepflanzt" });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // In-memory storage for caterpillar rarity tracking (per user/field)
  const fedCaterpillarRarities: Map<string, string[]> = new Map();

  // Helper function to create key for tracking
  function getFedCaterpillarsKey(userId: number, fieldIndex: number): string {
    return `${userId}-${fieldIndex}`;
  }

  // Helper function to calculate average rarity from fed caterpillars
  function calculateAverageRarity(rarities: string[]): string {
    const rarityValues: Record<string, number> = {
      'common': 0,
      'uncommon': 1, 
      'rare': 2,
      'super-rare': 3,
      'epic': 4,
      'legendary': 5,
      'mythical': 6
    };
    
    const valueToRarity: string[] = [
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
    
    return valueToRarity[clampedValue];
  }

  // Feed fish with caterpillar endpoint
  // Uses storage's strategic tracking system

  app.post('/api/garden/feed-fish', async (req, res) => {
    let userId: number | undefined, caterpillarId: number | undefined, fieldIndex: number | undefined;
    try {
      ({ userId, caterpillarId, fieldIndex } = req.body);

      if (!userId || !caterpillarId || fieldIndex === undefined) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      console.log('🐛 Feeding fish on field', fieldIndex, 'with caterpillar', caterpillarId);

      // Get user's caterpillar to verify they have it and get its rarity
      const userCaterpillars = await storage.getUserCaterpillars(userId);
      const caterpillarToUse = userCaterpillars.find(c => c.caterpillarId === caterpillarId);
      
      if (!caterpillarToUse || caterpillarToUse.quantity <= 0) {
        return res.status(400).json({ message: 'Du hast keine Raupen dieses Typs im Inventar.' });
      }

      // Remove one caterpillar from inventory
      const removed = await storage.removeCaterpillarFromUser(userId, caterpillarId, 1);
      
      if (!removed) {
        return res.status(400).json({ message: 'Fehler beim Entfernen der Raupe aus dem Inventar.' });
      }

      // CRITICAL FIX: Store caterpillar rarity in fed_caterpillars for ALL feedings (1st, 2nd, 3rd)
      // This ensures feedFishWithCaterpillar can always find all 3 caterpillars
      await storage.addFedCaterpillar(userId, fieldIndex, caterpillarToUse.caterpillarRarity);
      
      // Update pond progress normally  
      const result = await storage.updatePondFeedingProgress(userId, fieldIndex);
      console.log('🐟 Fish feeding result:', { fieldIndex, feedingCount: result, fishCreated: result >= 3, caterpillarRarity: caterpillarToUse.caterpillarRarity });

      if (result >= 3) {
        console.log('🐟 THIRD FEEDING: Fish will be created by storage method');
        
        // CRITICAL FIX: feedFishWithCaterpillar expects the 3rd rarity to already be in storage
        // But updatePondFeedingProgressWithTracking already added it! So we're good.
        const feedingResult = await storage.feedFishWithCaterpillar(userId, fieldIndex, caterpillarToUse.caterpillarRarity);
        
        return res.json(feedingResult);
      } else {
        // SHOW current average rarity so player can plan strategically!
        const currentAverageRarity = await storage.getCurrentFeedingAverageRarity(userId, fieldIndex);
        console.log(`🐟 Feeding progress: ${result}/3 caterpillars → current average: ${currentAverageRarity}`);
        
        return res.json({
          feedingCount: result,
          fishCreated: false,
          fishName: `Fisch ${Math.floor(Math.random() * 15) + 1}`,
          fishRarity: currentAverageRarity // Show current AVERAGE for strategic planning
        });
      }

    } catch (error) {
      console.error('🐟 CRITICAL ERROR in feed-fish:', error);
      console.error('🐟 Error details:', {
        stack: error instanceof Error ? error.stack : 'No stack trace',
        message: error instanceof Error ? error.message : error,
        userId,
        caterpillarId,
        fieldIndex
      });
      res.status(500).json({ message: 'Fehler beim Füttern der Fische.' });
    }
  });


  // Get pond feeding progress for all fields
  app.get('/api/user/:userId/pond-progress', async (req, res) => {
    const { userId } = req.params;
    
    try {
      const userProgress = await storage.getUserPondProgress(parseInt(userId));
      res.json({ pondProgress: userProgress });
    } catch (error) {
      console.error('Get pond progress error:', error);
      res.status(500).json({ message: 'Fehler beim Laden des Fütterungs-Fortschritts.' });
    }
  });

  // Get field fish for user (fish spawned on pond fields)
  app.get('/api/user/:userId/field-fish', async (req, res) => {
    const { userId } = req.params;
    
    try {
      const fieldFish = await storage.getFieldFish(parseInt(userId));
      res.json({ fieldFish });
    } catch (error) {
      console.error('Get field fish error:', error);
      res.status(500).json({ message: 'Fehler beim Laden der Teich-Fische.' });
    }
  });

  // Collect field fish (move from field to inventory)
  app.post('/api/garden/collect-field-fish', async (req, res) => {
    try {
      const { userId, fieldFishId } = req.body;
      
      if (!userId || !fieldFishId) {
        return res.status(400).json({ message: 'User ID und Field Fish ID sind erforderlich.' });
      }

      const result = await storage.collectFieldFish(userId, fieldFishId);
      
      if (result.success) {
        res.json({ message: 'Fisch erfolgreich gesammelt!' });
      } else {
        res.status(400).json({ message: result.message || 'Fehler beim Sammeln des Fisches.' });
      }
    } catch (error) {
      console.error('Collect field fish error:', error);
      res.status(500).json({ message: 'Fehler beim Sammeln des Fisches.' });
    }
  });

  app.get("/api/garden/fields/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const fields = await storage.getPlantedFields(userId);
      res.json({ fields });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/garden/harvest", async (req, res) => {
    try {
      const harvestData = harvestFieldSchema.parse(req.body);
      const userId = parseInt(req.headers['x-user-id'] as string) || 1;
      
      const result = await storage.harvestField(userId, harvestData);
      if (result.success) {
        res.json({ message: "Blume erfolgreich geerntet" });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/garden/collect-sun", async (req, res) => {
    try {
      const collectData = collectSunSchema.parse(req.body);
      const userId = parseInt(req.headers['x-user-id'] as string) || 1;
      
      const result = await storage.collectSun(collectData.fieldIndex);
      if (result.success) {
        // Update user's suns
        await storage.updateUserSuns(userId, result.sunAmount);
        res.json({ 
          message: result.message,
          sunAmount: result.sunAmount 
        });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/garden/sun-spawns", async (req, res) => {
    try {
      const userId = parseInt(req.headers['x-user-id'] as string) || 1;
      const activeSuns = await storage.getActiveSunSpawnsForUser(userId);
      res.json({ sunSpawns: activeSuns });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Flower inventory routes
  app.get("/api/user/:id/flowers", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const flowers = await storage.getUserFlowers(userId);
      res.json({ flowers });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/flower/:id", async (req, res) => {
    try {
      const flowerId = parseInt(req.params.id);
      const { generateLatinFlowerName, getFlowerRarityById } = await import('../shared/rarity');
      
      const flower = {
        id: flowerId,
        name: generateLatinFlowerName(flowerId), // Use flowerId as seed for consistent naming
        rarity: getFlowerRarityById(flowerId),
        imageUrl: `/Blumen/${flowerId}.jpg`
      };
      
      res.json(flower);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Bouquet routes
  app.post("/api/bouquets/generate-name", async (req, res) => {
    try {
      const { rarity } = req.body;
      if (!rarity) {
        return res.status(400).json({ message: "Rarity is required" });
      }
      
      const { generateBouquetName } = await import('./bouquet');
      const name = await generateBouquetName(rarity);
      
      res.json({ name });
    } catch (error) {
      console.error('Error generating bouquet name:', error);
      res.status(500).json({ message: "Failed to generate name" });
    }
  });

  // Check if bouquet name already exists
  app.post("/api/bouquets/check-name", async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }
      
      const isTaken = await storage.isBouquetNameTaken(name);
      res.json({ isTaken, available: !isTaken });
    } catch (error) {
      console.error('Error checking bouquet name:', error);
      res.status(500).json({ message: "Failed to check name" });
    }
  });

  app.post("/api/bouquets/create", async (req, res) => {
    try {
      const bouquetData = createBouquetSchema.parse(req.body);
      const userId = parseInt(req.headers['x-user-id'] as string) || 1;
      
      // SOS-System: Check if user needs emergency credits for bouquet creation
      const user = await storage.getUser(userId);
      if (user && user.credits <= 0) {
        console.log(`🆘 SOS Check: User ${userId} has ${user.credits} credits, checking for available flowers...`);
        
        // Check if user has the required flowers for the bouquet
        const userFlowers = await storage.getUserFlowers(userId);
        const flower1 = userFlowers.find(f => f.flowerId === bouquetData.flowerId1);
        const flower2 = userFlowers.find(f => f.flowerId === bouquetData.flowerId2);
        const flower3 = userFlowers.find(f => f.flowerId === bouquetData.flowerId3);
        
        if (flower1 && flower2 && flower3) {
          console.log(`🆘 SOS Activated: User ${userId} has required flowers but no credits, granting 30 credits`);
          const creditDelta = 30 - user.credits; // Calculate delta to reach 30 credits
          await storage.updateUserCredits(userId, creditDelta);
          console.log(`🆘 SOS Complete: User ${userId} credits updated from ${user.credits} to 30 (delta: ${creditDelta})`);
        }
      }
      
      const result = await storage.createBouquet(userId, bouquetData);
      if (result.success) {
        res.json({ 
          message: "Bouquet erfolgreich erstellt", 
          bouquet: result.bouquet 
        });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error('Failed to create bouquet:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user/:id/bouquets", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const bouquets = await storage.getUserBouquets(userId);
      res.json({ bouquets });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/bouquet/:id/recipe", async (req, res) => {
    try {
      const bouquetId = parseInt(req.params.id);
      const recipe = await storage.getBouquetRecipe(bouquetId);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      res.json({ recipe });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/bouquets/recipes", async (req, res) => {
    try {
      const recipes = await storage.getBouquetRecipes();
      res.json({ recipes });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get bouquet recipes created by specific user (for "Meine Bouquets")
  app.get("/api/user/:id/created-bouquet-recipes", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userRecipes = await storage.getUserCreatedBouquetRecipes(userId);
      res.json({ recipes: userRecipes });
    } catch (error) {
      console.error('Error getting user created recipes:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user/:id/butterflies", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      console.log('🦋 Getting butterflies for user:', userId);
      const butterflies = await storage.getUserButterflies(userId);
      console.log('🦋 Found butterflies:', butterflies.length);
      res.json({ butterflies });
    } catch (error) {
      console.error('🦋 Error getting butterflies:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Add butterflies to user inventory (for testing/admin purposes)
  app.post("/api/user/:id/add-butterfly", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { rarity = 'common', quantity = 1 } = req.body;
      
      // Validate rarity
      const validRarities = ['common', 'uncommon', 'rare', 'super-rare', 'epic', 'legendary', 'mythical'];
      if (!validRarities.includes(rarity)) {
        return res.status(400).json({ 
          message: "Invalid rarity", 
          validRarities 
        });
      }

      // Validate quantity
      if (typeof quantity !== 'number' || quantity < 1 || quantity > 10) {
        return res.status(400).json({ 
          message: "Quantity must be a number between 1 and 10" 
        });
      }

      console.log(`🦋 Adding ${quantity} ${rarity} butterfly(s) to user ${userId}`);
      const result = await storage.addButterflyToInventory(userId, rarity as any, quantity);
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: `${quantity} ${rarity} Schmetterling(e) hinzugefügt!`,
          butterfly: result.butterfly
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Fehler beim Hinzufügen des Schmetterlings" 
        });
      }
    } catch (error) {
      console.error('🦋 Error adding butterfly to inventory:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Fish collection endpoints
  app.get("/api/user/:id/fish", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      console.log('🐟 Getting fish for user:', userId);
      const fish = await storage.getUserFish(userId);
      console.log('🐟 Found fish:', fish.length);
      res.json({ fish });
    } catch (error) {
      console.error('🐟 Error getting fish:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Caterpillar collection endpoints
  app.get("/api/user/:id/caterpillars", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      console.log('🐛 Getting caterpillars for user:', userId);
      const caterpillars = await storage.getUserCaterpillars(userId);
      console.log('🐛 Found caterpillars:', caterpillars.length);
      res.json({ caterpillars });
    } catch (error) {
      console.error('🐛 Error getting caterpillars:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get butterflies on garden fields
  app.get("/api/user/:id/field-butterflies", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      console.log('🦋 Getting field butterflies for user:', userId);
      const fieldButterflies = await storage.getFieldButterflies(userId);
      console.log('🦋 Found field butterflies:', fieldButterflies.length);
      res.json({ fieldButterflies });
    } catch (error) {
      console.error('🦋 Error getting field butterflies:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Field caterpillars endpoints
  app.get("/api/user/:id/field-caterpillars", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      console.log('🐛 Getting field caterpillars for user:', userId);
      const fieldCaterpillars = await storage.getFieldCaterpillars(userId);
      console.log('🐛 Found field caterpillars:', fieldCaterpillars.length);
      res.json({ fieldCaterpillars });
    } catch (error) {
      console.error('🐛 Error getting field caterpillars:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Collect field caterpillar endpoint
  app.post("/api/user/:id/collect-field-caterpillar", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { fieldIndex } = req.body;
      console.log(`🐛 Collecting field caterpillar for user ${userId} on field ${fieldIndex}`);
      const result = await storage.collectFieldCaterpillar(userId, fieldIndex);
      
      if (result.success) {
        res.json({ message: 'Raupe erfolgreich eingesammelt!', caterpillar: result.caterpillar });
      } else {
        res.status(404).json({ message: 'Keine Raupe auf diesem Feld gefunden.' });
      }
    } catch (error) {
      console.error('🐛 Error collecting field caterpillar:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get unlocked fields for a user
  app.get("/api/user/:id/unlocked-fields", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const unlockedFields = await storage.getUnlockedFields(userId);
      res.json({ unlockedFields });
    } catch (error) {
      console.error('Error getting unlocked fields:', error);
      res.status(500).json({ error: "Failed to get unlocked fields" });
    }
  });

  // Unlock a field for a user
  app.post("/api/user/:id/unlock-field", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const data = unlockFieldSchema.parse(req.body);
      
      // Calculate unlock cost (this matches frontend logic)
      const userUnlockedFields = await storage.getUnlockedFields(userId);
      const starterFields = [0, 1, 10, 11]; // Convert field IDs 1,2,11,12 to indices 0,1,10,11
      const unlockedCount = userUnlockedFields.filter(f => !starterFields.includes(f.fieldIndex)).length;
      const cost = Math.round(1000 * Math.pow(1.2, unlockedCount));
      
      const result = await storage.unlockField(userId, data, cost);
      
      if (result.success) {
        res.json({ success: true });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error('Error unlocking field:', error);
      res.status(500).json({ error: "Failed to unlock field" });
    }
  });

  // Place butterfly on field
  app.post("/api/garden/place-butterfly", async (req, res) => {
    try {
      const userId = parseInt(req.headers['x-user-id'] as string) || 1;
      const data = placeButterflyOnFieldSchema.parse(req.body);
      
      console.log(`🦋 Processing butterfly animation for butterfly ${data.butterflyId} on field ${data.fieldIndex} for user ${userId}`);

      // Check if user has this butterfly and reduce quantity
      const butterfly = await storage.getUserButterfly(userId, data.butterflyId);
      
      if (!butterfly) {
        return res.status(400).json({ message: "Schmetterling nicht gefunden" });
      }

      if (butterfly.quantity <= 0) {
        return res.status(400).json({ message: "Nicht genügend Schmetterlinge im Inventar" });
      }

      // Reduce butterfly quantity (consume the butterfly for animation)
      const consumeResult = await storage.consumeButterfly(userId, data.butterflyId);
      
      if (consumeResult.success) {
        console.log(`🦋 Butterfly consumed successfully - animation will start on frontend`);
        res.json({ message: 'Schmetterling-Animation gestartet!', butterfly: butterfly });
      } else {
        res.status(400).json({ message: consumeResult.message });
      }
    } catch (error) {
      console.error('🦋 Error processing butterfly animation:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Remove butterfly from field (for automatic lifecycle)
  app.post("/api/garden/remove-butterfly", async (req, res) => {
    try {
      const { fieldIndex } = req.body;
      const userId = parseInt(req.headers['x-user-id'] as string) || 1;
      
      console.log(`🦋 Removing butterfly from field ${fieldIndex} for user ${userId}`);
      
      if (fieldIndex === undefined) {
        return res.status(400).json({ message: 'Missing fieldIndex' });
      }

      const result = await storage.removeFieldButterfly(userId, fieldIndex);
      
      if (result.success) {
        res.json({ message: 'Butterfly removed successfully' });
      } else {
        res.status(404).json({ message: 'No butterfly found on field' });
      }
    } catch (error) {
      console.error('🦋 Error removing butterfly:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Spawn caterpillar with rarity inheritance
  app.post("/api/garden/spawn-caterpillar", async (req, res) => {
    try {
      const { fieldIndex, parentRarity } = req.body;
      const userId = parseInt(req.headers['x-user-id'] as string) || 1;
      
      console.log(`🐛 Spawning caterpillar on field ${fieldIndex} with parent rarity ${parentRarity}`);
      
      if (fieldIndex === undefined || !parentRarity) {
        return res.status(400).json({ message: 'Missing fieldIndex or parentRarity' });
      }

      const result = await storage.spawnCaterpillarOnField(userId, fieldIndex, parentRarity);
      
      if (result.success) {
        res.json({ message: 'Caterpillar spawned successfully', caterpillar: result.caterpillar });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error('🐛 Error spawning caterpillar:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Collect butterfly from field
  app.post("/api/garden/collect-butterfly", async (req, res) => {
    try {
      const { fieldIndex } = req.body;
      const userId = parseInt(req.headers['x-user-id'] as string) || 1;
      
      console.log(`🦋 Attempting to collect butterfly on field ${fieldIndex}`);
      
      if (fieldIndex === undefined) {
        return res.status(400).json({ message: 'Missing fieldIndex' });
      }

      const result = await storage.collectFieldButterfly(userId, fieldIndex);
      
      if (result.success) {
        res.json({ message: 'Schmetterling erfolgreich gesammelt!', butterfly: result.butterfly });
      } else {
        res.status(404).json({ message: 'Kein Schmetterling auf diesem Feld gefunden' });
      }
    } catch (error) {
      console.error('🦋 Error collecting butterfly:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/bouquets/place", async (req, res) => {
    try {
      const placeData = placeBouquetSchema.parse(req.body);
      const userId = parseInt(req.headers['x-user-id'] as string) || 1;
      
      const result = await storage.placeBouquet(userId, placeData);
      if (result.success) {
        res.json({ message: "Bouquet erfolgreich platziert" });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/bouquets/collect-expired", async (req, res) => {
    try {
      const { fieldIndex } = req.body;
      const userId = parseInt(req.headers['x-user-id'] as string) || 1;
      
      if (fieldIndex === undefined) {
        return res.status(400).json({ message: 'Missing fieldIndex' });
      }

      const result = await storage.collectExpiredBouquet(userId, fieldIndex);
      
      if (result.success) {
        res.json({ 
          message: `Verwelktes Bouquet gesammelt! Erhalten: ${result.seedDrop?.quantity || 0}x ${result.seedDrop?.rarity || 'common'} Samen`,
          seedDrop: result.seedDrop 
        });
      } else {
        res.status(404).json({ message: 'Kein verwelktes Bouquet auf diesem Feld gefunden' });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user/:id/placed-bouquets", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const placedBouquets = await storage.getPlacedBouquets(userId);
      res.json({ placedBouquets });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Exhibition routes
  app.get("/api/user/:id/exhibition-frames", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const frames = await storage.getExhibitionFrames(userId);
      res.json({ frames });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user/:id/exhibition-butterflies", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const butterflies = await storage.getExhibitionButterflies(userId);
      res.json({ butterflies });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/exhibition/purchase-frame", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'Missing userId' });
      }

      const result = await storage.purchaseExhibitionFrame(userId);
      
      if (result.success) {
        res.json({ 
          message: 'Rahmen erfolgreich gekauft!',
          newCredits: result.newCredits,
          frame: result.frame
        });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/exhibition/place-butterfly", async (req, res) => {
    try {
      const { userId, frameId, slotIndex, butterflyId } = req.body;
      
      if (!userId || !frameId || slotIndex === undefined || !butterflyId) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      const result = await storage.placeExhibitionButterfly(userId, frameId, slotIndex, butterflyId);
      
      if (result.success) {
        res.json({ message: 'Schmetterling erfolgreich platziert!' });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/exhibition/remove-butterfly", async (req, res) => {
    try {
      const { userId, frameId, slotIndex } = req.body;
      
      if (!userId || !frameId || slotIndex === undefined) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      const result = await storage.removeExhibitionButterfly(userId, frameId, slotIndex);
      
      if (result.success) {
        res.json({ message: 'Schmetterling erfolgreich entfernt!' });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get butterfly sell status (countdown info with like reduction)
  app.get("/api/exhibition/butterfly/:id/sell-status", async (req, res) => {
    try {
      const userId = parseInt(req.headers['x-user-id'] as string) || 1;
      const exhibitionButterflyId = parseInt(req.params.id);

      // Get all exhibition butterflies for this user
      const userExhibitionButterflies = await storage.getExhibitionButterflies(userId);
      const exhibitionButterfly = userExhibitionButterflies.find(b => b.id === exhibitionButterflyId);
      
      if (!exhibitionButterfly) {
        return res.status(404).json({ error: "Schmetterling nicht gefunden" });
      }

      const canSell = await storage.canSellButterfly(userId, exhibitionButterflyId);
      const timeRemaining = await storage.getTimeUntilSellable(userId, exhibitionButterflyId);
      
      // Get likes count using getUserFrameLikes and find our specific frame
      const allFrameLikes = await storage.getUserFrameLikes(exhibitionButterfly.userId);
      const frameWithLikes = allFrameLikes.find(f => f.frameId === exhibitionButterfly.frameId);
      const likesCount = frameWithLikes ? frameWithLikes.totalLikes : 0;

      res.json({
        canSell,
        timeRemainingMs: timeRemaining,
        likesCount,
        frameId: exhibitionButterfly.frameId
      });
    } catch (error) {
      console.error('Failed to get butterfly sell status:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/exhibition/sell-butterfly", async (req, res) => {
    try {
      const { userId, exhibitionButterflyId } = req.body;
      
      if (!userId || !exhibitionButterflyId) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      const result = await storage.sellExhibitionButterfly(userId, exhibitionButterflyId);
      
      if (result.success) {
        res.json({ 
          message: 'Butterfly sold successfully', 
          success: true,
          creditsEarned: result.creditsEarned 
        });
      } else {
        res.status(400).json({ message: result.message || 'Failed to sell butterfly' });
      }
    } catch (error) {
      console.error('Failed to sell exhibition butterfly:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Sell butterfly from inventory for suns
  app.post("/api/inventory/sell-butterfly-for-suns", async (req, res) => {
    try {
      const { userId, butterflyId } = req.body;
      
      if (!userId || !butterflyId) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      const result = await storage.sellButterflyForSuns(userId, butterflyId);
      
      if (result.success) {
        res.json({ 
          message: `${result.sunsEarned} Sonnen erhalten!`, 
          success: true,
          sunsEarned: result.sunsEarned 
        });
      } else {
        res.status(400).json({ message: result.message || 'Failed to sell butterfly' });
      }
    } catch (error) {
      console.error('Failed to sell butterfly for suns:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Sonnen-Boost for butterfly countdown (10 Sonnen = 1 minute reduction)
  app.post("/api/exhibition/butterfly-sun-boost", async (req, res) => {
    try {
      const { exhibitionButterflyId, minutes } = req.body;
      const userId = parseInt(req.headers['x-user-id'] as string) || 1;
      
      if (!exhibitionButterflyId || !minutes || minutes <= 0 || minutes > 720) {
        return res.status(400).json({ message: 'Ungültige Parameter (1-720 Minuten erlaubt)' });
      }

      const sunsCost = minutes * 10; // 10 Sonnen pro Minute
      
      // Check if user has enough suns
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.suns < sunsCost) {
        return res.status(400).json({ message: `Du brauchst ${sunsCost} Sonnen für ${minutes} Minuten Boost` });
      }

      // Apply the boost
      const result = await storage.applyButterflyTimeBoost(userId, exhibitionButterflyId, minutes);
      
      if (result.success) {
        // Deduct suns
        await storage.updateUserSuns(userId, -sunsCost);
        
        res.json({ 
          success: true,
          message: `Countdown um ${minutes} Minuten für ${sunsCost} Sonnen verkürzt!`,
          minutesReduced: minutes,
          sunsCost
        });
      } else {
        res.status(400).json({ message: result.message || 'Boost fehlgeschlagen' });
      }
    } catch (error) {
      console.error('Sun boost error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ================================
  // VIP BUTTERFLY ROUTES
  // ================================

  // Get user's VIP butterflies (animated collection)
  app.get("/api/user/:id/vip-butterflies", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      console.log('✨ Getting VIP butterflies for user:', userId);
      const vipButterflies = await storage.getUserVipButterflies(userId);
      console.log('✨ Found VIP butterflies:', vipButterflies.length);
      res.json({ vipButterflies });
    } catch (error) {
      console.error('✨ Error getting VIP butterflies:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get VIP butterflies placed in exhibition frames
  app.get("/api/user/:id/exhibition-vip-butterflies", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const vipButterflies = await storage.getExhibitionVipButterflies(userId);
      res.json({ vipButterflies });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Place VIP butterfly in exhibition frame
  app.post("/api/exhibition/place-vip-butterfly", async (req, res) => {
    try {
      const { userId, frameId, slotIndex, vipButterflyId } = req.body;
      
      if (!userId || !frameId || slotIndex === undefined || !vipButterflyId) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      const result = await storage.placeVipButterflyInExhibition(userId, frameId, slotIndex, vipButterflyId);
      
      if (result.success) {
        res.json({ message: 'VIP-Schmetterling erfolgreich platziert!' });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error('✨ Error placing VIP butterfly:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Remove VIP butterfly from exhibition frame
  app.post("/api/exhibition/remove-vip-butterfly", async (req, res) => {
    try {
      const { userId, frameId, slotIndex } = req.body;
      
      if (!userId || !frameId || slotIndex === undefined) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      const result = await storage.removeVipButterflyFromExhibition(userId, frameId, slotIndex);
      
      if (result.success) {
        res.json({ message: 'VIP-Schmetterling erfolgreich entfernt!' });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error('✨ Error removing VIP butterfly:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/exhibition/process-income", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'Missing userId' });
      }

      const result = await storage.processPassiveIncome(userId);
      
      if (result.success) {
        res.json({ 
          message: `${result.creditsEarned || 0} Credits aus der Ausstellung erhalten!`,
          creditsEarned: result.creditsEarned
        });
      } else {
        res.status(400).json({ message: 'Fehler beim Verarbeiten des passiven Einkommens' });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all users with their online status and exhibition butterflies count
  app.get("/api/users/list", async (req, res) => {
    try {
      const currentUserId = parseInt(req.headers['x-user-id'] as string);
      
      if (!currentUserId) {
        return res.status(400).json({ message: "User ID required" });
      }
      
      // Update current user's last activity timestamp
      await storage.updateUserActivity(currentUserId);
      
      // Get user list excluding the current user  
      const users = await storage.getAllUsersWithStatus(currentUserId);
      res.json({ users });
    } catch (error) {
      console.error('Error fetching user list:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Like system routes
  app.post('/api/exhibition/like', async (req, res) => {
    try {
      const { likerId, frameOwnerId, frameId } = req.body;
      
      if (!likerId || !frameOwnerId || !frameId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const result = await storage.likeExhibitionFrame(likerId, frameOwnerId, frameId);
      
      if (result.success) {
        res.json({ success: true });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error('Failed to like frame:', error);
      res.status(500).json({ error: 'Failed to like frame' });
    }
  });

  app.delete('/api/exhibition/like', async (req, res) => {
    try {
      const { likerId, frameOwnerId, frameId } = req.body;
      
      if (!likerId || !frameOwnerId || !frameId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const result = await storage.unlikeExhibitionFrame(likerId, frameOwnerId, frameId);
      
      if (result.success) {
        res.json({ success: true });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error('Failed to unlike frame:', error);
      res.status(500).json({ error: 'Failed to unlike frame' });
    }
  });

  app.get('/api/user/:userId/exhibition/:frameOwnerId/likes', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const frameOwnerId = parseInt(req.params.frameOwnerId);
      
      if (isNaN(userId) || isNaN(frameOwnerId)) {
        return res.status(400).json({ error: 'Invalid user IDs' });
      }
      
      const likes = await storage.getFrameLikesForUser(userId, frameOwnerId);
      res.json({ likes });
    } catch (error) {
      console.error('Failed to get frame likes:', error);
      res.status(500).json({ error: 'Failed to get frame likes' });
    }
  });

  app.get('/api/user/:ownerId/foreign-exhibition', async (req, res) => {
    try {
      const ownerId = parseInt(req.params.ownerId);
      
      if (isNaN(ownerId)) {
        return res.status(400).json({ error: 'Invalid owner ID' });
      }
      
      const butterflies = await storage.getForeignExhibitionButterflies(ownerId);
      const vipButterflies = await storage.getForeignExhibitionVipButterflies(ownerId);
      const frames = await storage.getForeignExhibitionFrames(ownerId);
      res.json({ butterflies, vipButterflies, frames });
    } catch (error) {
      console.error('Failed to get foreign exhibition:', error);
      res.status(500).json({ error: 'Failed to get foreign exhibition' });
    }
  });

  // Debug route to show rarity distribution
  app.get("/api/debug/rarity-distribution", async (req, res) => {
    try {
      const { getRarityDistribution } = await import('./bouquet');
      const distribution = getRarityDistribution();
      
      let total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
      const formattedDistribution = Object.entries(distribution).map(([rarity, count]) => {
        return {
          rarity,
          count,
          percentage: ((count / total) * 100).toFixed(1)
        };
      });
      
      res.json({
        distribution: formattedDistribution,
        total,
        message: `Schmetterlings-Rarität Verteilung für ${total} verfügbare Bilder`
      });
    } catch (error) {
      res.status(500).json({ message: "Error loading rarity distribution" });
    }
  });

  // ========== WEEKLY CHALLENGE SYSTEM ==========
  
  // Get current active weekly challenge
  app.get("/api/weekly-challenge/current", async (req, res) => {
    try {
      const currentChallenge = await storage.getCurrentWeeklyChallenge();
      
      if (!currentChallenge) {
        return res.status(404).json({ message: "No active weekly challenge" });
      }

      // Check if challenge period is valid (Sunday 18:00 - Monday 0:00 is inactive)
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday
      const hour = now.getHours();
      
      const isInactiveTime = (dayOfWeek === 0 && hour >= 18) || 
                            (dayOfWeek === 1 && hour === 0 && now.getMinutes() === 0);

      res.json({
        challenge: currentChallenge,
        isActive: !isInactiveTime
      });
    } catch (error) {
      res.status(500).json({ message: "Error loading weekly challenge" });
    }
  });

  // Create new weekly challenge (for Monday 0:00)
  app.post("/api/weekly-challenge/create", async (req, res) => {
    try {
      const challenge = await storage.createWeeklyChallenge();
      res.json({ challenge });
    } catch (error) {
      res.status(500).json({ message: "Error creating weekly challenge" });
    }
  });

  // Donate flowers to weekly challenge
  app.post("/api/weekly-challenge/donate", async (req, res) => {
    try {
      const { donateChallengeFlowerSchema } = await import("@shared/schema");
      const donationData = donateChallengeFlowerSchema.parse(req.body);
      const userId = parseInt(req.headers['x-user-id'] as string) || 1;
      
      const result = await storage.donateFlowerToChallenge(userId, donationData);
      
      if (result.success) {
        res.json({ 
          message: result.message,
          seedsReceived: result.seedsReceived 
        });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Error processing donation" });
    }
  });

  // Get challenge leaderboard
  app.get("/api/weekly-challenge/:challengeId/leaderboard", async (req, res) => {
    try {
      const challengeId = parseInt(req.params.challengeId);
      const leaderboard = await storage.getChallengeLeaderboard(challengeId);
      
      res.json({ leaderboard });
    } catch (error) {
      res.status(500).json({ message: "Error loading leaderboard" });
    }
  });

  // Process challenge rewards (for Sunday 18:00)
  app.post("/api/weekly-challenge/:challengeId/process-rewards", async (req, res) => {
    try {
      const challengeId = parseInt(req.params.challengeId);
      await storage.processChallengeRewards(challengeId);
      
      res.json({ message: "Rewards processed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error processing rewards" });
    }
  });

  // Test endpoint for debugging passive income
  app.post('/api/test/passive-income/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    try {
      console.log(`🔧 DEBUG: Testing passive income for user ${userId}`);
      
      // Get user data
      const user = await storage.getUser(userId);
      console.log(`🔧 DEBUG: User data:`, { 
        id: user?.id, 
        credits: user?.credits, 
        lastPassiveIncomeAt: user?.lastPassiveIncomeAt 
      });
      
      // Get butterflies
      const normalButterflies = await storage.getExhibitionButterflies(userId);
      const vipButterflies = await storage.getExhibitionVipButterflies(userId);
      console.log(`🔧 DEBUG: Butterflies - Normal: ${normalButterflies.length}, VIP: ${vipButterflies.length}`);
      
      // Process passive income
      const result = await storage.processPassiveIncome(userId);
      console.log(`🔧 DEBUG: Passive income result:`, result);
      
      // Get updated user data
      const updatedUser = await storage.getUser(userId);
      console.log(`🔧 DEBUG: Updated user data:`, { 
        id: updatedUser?.id, 
        credits: updatedUser?.credits, 
        lastPassiveIncomeAt: updatedUser?.lastPassiveIncomeAt 
      });
      
      res.json({
        success: true,
        beforeCredits: user?.credits || 0,
        afterCredits: updatedUser?.credits || 0,
        creditsEarned: result.creditsEarned || 0,
        normalButterflies: normalButterflies.length,
        vipButterflies: vipButterflies.length
      });
    } catch (error) {
      console.error('Failed to test passive income:', error);
      res.status(500).json({ error: 'Failed to test passive income' });
    }
  });

  // 🔧 ADMIN: Fix passive income time bug
  app.get("/api/admin/fix-passive-income/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Get user before fix
      const userBefore = await storage.getUser(userId);
      console.log(`🔧 Fixing passive income for user ${userId}, before:`, userBefore?.lastPassiveIncomeAt);
      
      // Create a method to fix the user's passive income time
      if ('fixPassiveIncomeTime' in storage) {
        await (storage as any).fixPassiveIncomeTime(userId);
      } else {
        // Fallback: direct SQL update via storage
        throw new Error('fixPassiveIncomeTime method not implemented');
      }
      
      res.json({ 
        success: true, 
        message: `✅ Passive income time reset for user ${userId}`,
        beforeTime: userBefore?.lastPassiveIncomeAt || 'NULL',
        afterTime: 'NULL (will use current time)',
        instructions: "🎉 Passive income should now work correctly! The negative time bug is fixed."
      });
    } catch (error) {
      console.error('Admin fix error:', error);
      res.status(500).json({ 
        success: false, 
        message: "❌ Error fixing passive income", 
        error: error.message 
      });
    }
  });

  // 🔍 DEBUG: Deep dive into user exhibition data
  app.get("/api/debug/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Get user data
      const user = await storage.getUser(userId);
      
      // Get exhibition butterflies with more details
      const normalButterflies = await storage.getExhibitionButterflies(userId);
      const vipButterflies = await storage.getExhibitionVipButterflies(userId);
      
      // Get raw database data for deeper inspection
      let rawExhibitionData = [];
      let rawVipExhibitionData = [];
      let allUsers = [];
      
      try {
        // Direct database queries to see what's really there
        if ('db' in storage) {
          const db = (storage as any).db;
          rawExhibitionData = await db.select().from((storage as any).exhibitionButterflies).where((storage as any).eq((storage as any).exhibitionButterflies.userId, userId));
          rawVipExhibitionData = await db.select().from((storage as any).exhibitionVipButterflies).where((storage as any).eq((storage as any).exhibitionVipButterflies.userId, userId));
          allUsers = await db.select().from((storage as any).users);
        }
      } catch (dbError) {
        console.error('Direct DB query failed:', dbError);
      }
      
      // Get current time info
      const now = new Date();
      const lastTime = user?.lastPassiveIncomeAt;
      const minutesElapsed = lastTime ? Math.floor((now.getTime() - new Date(lastTime).getTime()) / (1000 * 60)) : 'NULL';
      
      res.json({
        userId: userId,
        userName: user?.username || 'Unknown',
        credits: user?.credits || 0,
        lastPassiveIncomeAt: lastTime || 'NULL',
        minutesElapsed: minutesElapsed,
        normalButterflies: normalButterflies.length,
        vipButterflies: vipButterflies.length,
        totalCreditsPerHour: (normalButterflies.length * 30) + (vipButterflies.length * 61),
        debugTime: now.toISOString(),
        normalButterflyList: normalButterflies.map(b => ({ id: b.id, name: b.butterflyName, rarity: b.butterflyRarity, frameIndex: b.frameIndex })),
        vipButterflyList: vipButterflies.map(b => ({ id: b.id, name: b.butterflyName, frameIndex: b.frameIndex })),
        rawExhibitionCount: rawExhibitionData.length,
        rawVipExhibitionCount: rawVipExhibitionData.length,
        rawExhibitionData: rawExhibitionData,
        rawVipExhibitionData: rawVipExhibitionData,
        allUsersCount: allUsers.length,
        allUserIds: allUsers.map(u => ({ id: u.id, username: u.username }))
      });
    } catch (error) {
      console.error('Debug error:', error);
      res.status(500).json({ error: 'Debug failed', message: error.message });
    }
  });

  // 🗑️ ADMIN: Reset all user data and start fresh
  app.get("/api/admin/reset-all-data", async (req, res) => {
    try {
      console.log('🗑️ ADMIN: Resetting all user data...');
      
      // Use storage methods to safely delete data
      if ('db' in storage) {
        const db = (storage as any).db;
        
        // Import the schema tables directly
        const {
          exhibitionVipButterflies,
          exhibitionButterflies,
          fieldButterflies,
          userButterflies,
          userVipButterflies,
          placedBouquets,
          userBouquets,
          userFlowers,
          plantedFields,
          userSeeds,
          marketListings,
          passiveIncomeLog,
          challengeDonations,
          challengeRewards,
          exhibitionFrameLikes,
          exhibitionFrames,
          users
        } = await import('@shared/schema');
        
        // Delete all user-related data in correct order (foreign keys)
        await db.delete(exhibitionVipButterflies);
        await db.delete(exhibitionButterflies);
        await db.delete(fieldButterflies);
        await db.delete(userButterflies);
        await db.delete(userVipButterflies);
        await db.delete(placedBouquets);
        await db.delete(userBouquets);
        await db.delete(userFlowers);
        await db.delete(plantedFields);
        await db.delete(userSeeds);
        await db.delete(marketListings);
        await db.delete(passiveIncomeLog);
        await db.delete(challengeDonations);
        await db.delete(challengeRewards);
        await db.delete(exhibitionFrameLikes);
        await db.delete(exhibitionFrames); // ← Diese Tabelle fehlte!
        await db.delete(users);
        
        console.log('✅ All user data deleted successfully');
        
        res.json({
          success: true,
          message: "🎉 All data reset! You can now register a fresh account and passive income will work perfectly!",
          instructions: "Go to your app and register again - everything will work normally now!"
        });
      } else {
        throw new Error('Database not accessible');
      }
    } catch (error) {
      console.error('Reset error:', error);
      res.status(500).json({
        success: false,
        message: "❌ Error resetting data",
        error: error.message
      });
    }
  });

  // ======================================
  // AQUARIUM SYSTEM ROUTES
  // ======================================

  // Get user's aquarium tanks
  app.get("/api/user/:id/aquarium-tanks", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const tanks = await storage.getAquariumTanks(userId);
      res.json({ tanks });
    } catch (error) {
      console.error('Failed to get aquarium tanks:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user's aquarium fish
  app.get("/api/user/:id/aquarium-fish", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const fish = await storage.getAquariumFish(userId);
      res.json({ fish });
    } catch (error) {
      console.error('Failed to get aquarium fish:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Purchase aquarium tank
  app.post("/api/aquarium/purchase-tank", async (req, res) => {
    try {
      const userId = parseInt(req.headers['x-user-id'] as string) || 1;
      const { tankNumber } = req.body;

      if (!tankNumber || tankNumber < 1 || tankNumber > 10) {
        return res.status(400).json({ message: "Ungültige Tank-Nummer" });
      }

      const result = await storage.purchaseAquariumTank(userId, tankNumber);
      
      if (result.success) {
        res.json({ message: "Aquarium gekauft!", tank: result.tank });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error('Failed to purchase aquarium tank:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Place fish in aquarium
  app.post("/api/aquarium/place-fish", async (req, res) => {
    try {
      const userId = parseInt(req.headers['x-user-id'] as string) || 1;
      const { tankNumber, slotIndex, fishId } = req.body;

      if (tankNumber === undefined || slotIndex === undefined || !fishId) {
        return res.status(400).json({ message: "Fehlende Parameter" });
      }

      if (slotIndex < 0 || slotIndex >= 24) {
        return res.status(400).json({ message: "Ungültiger Slot-Index" });
      }

      const result = await storage.placeAquariumFish(userId, tankNumber, slotIndex, fishId);
      
      if (result.success) {
        res.json({ message: "Fisch im Aquarium platziert!" });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error('Failed to place aquarium fish:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Remove fish from aquarium
  app.delete("/api/aquarium/remove-fish", async (req, res) => {
    try {
      const userId = parseInt(req.headers['x-user-id'] as string) || 1;
      const { aquariumFishId } = req.body;

      if (!aquariumFishId) {
        return res.status(400).json({ message: "Fisch-ID fehlt" });
      }

      const result = await storage.removeAquariumFish(userId, aquariumFishId);
      
      if (result.success) {
        res.json({ message: "Fisch aus Aquarium entfernt!" });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error('Failed to remove aquarium fish:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get fish sell status (24h countdown)
  app.get("/api/aquarium/fish/:fishId/sell-status", async (req, res) => {
    try {
      const fishId = parseInt(req.params.fishId);
      const sellStatus = await storage.canSellAquariumFish(fishId);
      
      res.json({
        canSell: sellStatus.canSell,
        timeRemainingMs: sellStatus.timeRemainingMs
      });
    } catch (error) {
      console.error('Failed to get fish sell status:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Sell aquarium fish
  app.post("/api/aquarium/sell-fish", async (req, res) => {
    try {
      const userId = parseInt(req.headers['x-user-id'] as string) || 1;
      const { aquariumFishId } = req.body;

      if (!aquariumFishId) {
        return res.status(400).json({ message: "Fisch-ID fehlt" });
      }

      const result = await storage.sellAquariumFish(userId, aquariumFishId);
      
      if (result.success) {
        res.json({ 
          message: "Fisch verkauft!",
          creditsEarned: result.creditsEarned
        });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error('Failed to sell aquarium fish:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Apply sun boost to fish (reduce wait time)
  app.post("/api/aquarium/sun-boost", async (req, res) => {
    try {
      const userId = parseInt(req.headers['x-user-id'] as string) || 1;
      const { aquariumFishId, minutes } = req.body;

      if (!aquariumFishId || !minutes) {
        return res.status(400).json({ message: "Fehlende Parameter" });
      }

      if (minutes < 1 || minutes > 1440) { // Max 24 hours
        return res.status(400).json({ message: "Ungültige Minuten (1-1440)" });
      }

      const result = await storage.applyAquariumSunBoost(userId, aquariumFishId, minutes);
      
      if (result.success) {
        res.json({ message: `${minutes} Minuten abgezogen!` });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error('Failed to apply sun boost:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Fish inventory cleanup endpoint
  app.get('/api/admin/cleanup-fish-duplicates', async (req, res) => {
    try {
      console.log('🧹 Starting fish inventory cleanup...');
      
      // Get all users with fish
      const allUsers = await storage.getAllUsers();
      let totalMerged = 0;
      
      for (const user of allUsers) {
        const userFish = await storage.getUserFish(user.id);
        
        // Group fish by fishId
        const fishGroups = new Map<number, any[]>();
        userFish.forEach(fish => {
          if (!fishGroups.has(fish.fishId)) {
            fishGroups.set(fish.fishId, []);
          }
          fishGroups.get(fish.fishId)!.push(fish);
        });
        
        // Process groups with duplicates
        for (const [fishId, duplicates] of fishGroups) {
          if (duplicates.length > 1) {
            console.log(`🐟 User ${user.username}: Found ${duplicates.length} duplicates of fish ${fishId}`);
            
            // Calculate total quantity
            const totalQuantity = duplicates.reduce((sum, fish) => sum + fish.quantity, 0);
            
            // Keep the first entry and delete others
            const keepFish = duplicates[0];
            const deleteFish = duplicates.slice(1);
            
            // Update the kept fish with total quantity
            await storage.updateFishQuantity(keepFish.id, totalQuantity);
            
            // Delete the duplicates
            for (const duplicate of deleteFish) {
              await storage.deleteFishEntry(duplicate.id);
            }
            
            console.log(`🐟 Merged ${duplicates.length} entries into 1 with quantity ${totalQuantity}`);
            totalMerged += duplicates.length - 1;
          }
        }
      }
      
      console.log(`🎉 Fish cleanup complete! Merged ${totalMerged} duplicate entries.`);
      res.json({ 
        success: true, 
        message: `Successfully merged ${totalMerged} duplicate fish entries.`,
        mergedCount: totalMerged
      });
    } catch (error) {
      console.error('Failed to cleanup fish duplicates:', error);
      res.status(500).json({ error: 'Failed to cleanup fish duplicates' });
    }
  });

  // Marie Posa trading system routes
  // Check if Marie Posa is available for trading (every 3 hours)
  app.get("/api/user/:userId/marie-posa-status", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (!userId) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const lastTradeResult = await storage.getMariePosaLastTrade(userId);
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000));
      
      let isAvailable = false;
      if (!lastTradeResult.lastTradeAt || lastTradeResult.lastTradeAt < threeHoursAgo) {
        isAvailable = true;
      }

      const nextAvailableAt = lastTradeResult.lastTradeAt ? 
        new Date(lastTradeResult.lastTradeAt.getTime() + (3 * 60 * 60 * 1000)) : 
        now;

      res.json({ 
        isAvailable,
        nextAvailableAt: nextAvailableAt.toISOString(),
        lastTradeAt: lastTradeResult.lastTradeAt?.toISOString() || null
      });
    } catch (error) {
      console.error('Error checking Marie Posa status:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Marie Posa selling endpoint
  app.post("/api/user/:userId/marie-posa-sell", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { items } = req.body;
      
      if (!userId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      if (items.length > 4) {
        return res.status(400).json({ message: "Marie Posa kauft maximal 4 Items pro Besuch!" });
      }

      // Check if Marie Posa is available
      const lastTradeResult = await storage.getMariePosaLastTrade(userId);
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000));
      
      if (lastTradeResult.lastTradeAt && lastTradeResult.lastTradeAt >= threeHoursAgo) {
        const nextAvailableAt = new Date(lastTradeResult.lastTradeAt.getTime() + (3 * 60 * 60 * 1000));
        return res.status(400).json({ 
          message: `Marie Posa ist erst wieder ${nextAvailableAt.toLocaleTimeString('de-DE')} verfügbar!` 
        });
      }

      // Process the sale
      const result = await storage.processMariePosaSale(userId, items);
      
      if (result.success) {
        res.json({ 
          message: `Marie Posa hat deine Items für ${result.totalEarned} Credits gekauft!`,
          totalEarned: result.totalEarned,
          itemsSold: result.itemsSold
        });
      } else {
        res.status(400).json({ message: result.message || 'Verkauf fehlgeschlagen' });
      }
    } catch (error) {
      console.error('Error processing Marie Posa sale:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Marie-Slot machine endpoint
  app.post("/api/user/:userId/marie-slot-play", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (!userId) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Check if user has enough suns (5 suns to play)
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.suns < 5) {
        return res.status(400).json({ message: "Nicht genügend Sonnen! Du brauchst 5 Sonnen zum Spielen." });
      }

      // Deduct 5 suns
      await storage.updateUserSuns(userId, -5);
      console.log(`🎰 User ${userId} spent 5 suns on Marie-Slot`);

      // Generate slot machine result (5 reels with 3 symbols each) - Payline system
      const symbols = ['caterpillar', 'flower', 'butterfly', 'fish', 'sun'];
      const reels: string[][] = [];
      const paylineSymbols: string[] = []; // Only middle symbols count for wins
      
      for (let i = 0; i < 5; i++) {
        const reelSymbols: string[] = [];
        for (let j = 0; j < 3; j++) {
          const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
          reelSymbols.push(randomSymbol);
          // Middle symbol (index 1) goes to payline
          if (j === 1) {
            paylineSymbols.push(randomSymbol);
          }
        }
        reels.push(reelSymbols);
      }

      console.log(`🎰 Slot result (all): ${reels.map(reel => reel.join('|')).join(' - ')}`);
      console.log(`🎰 Payline (middle): ${paylineSymbols.join(' - ')}`);

      // Check for wins on payline (middle symbols only) - FIXED!
      const symbolCounts = new Map<string, number>();
      paylineSymbols.forEach(symbol => {
        symbolCounts.set(symbol, (symbolCounts.get(symbol) || 0) + 1);
      });
      
      console.log(`🎰 Symbol counts on payline:`, Object.fromEntries(symbolCounts));

      let maxCount = 0;
      let winningSymbol = '';
      for (const [symbol, count] of symbolCounts) {
        if (count > maxCount) {
          maxCount = count;
          winningSymbol = symbol;
        }
      }

      let reward: any = null;
      let message = "Leider kein Gewinn! Probier's nochmal!";

      // Determine reward based on matching symbols
      if (maxCount >= 2) {
        console.log(`🎰 Win detected: ${maxCount} matching ${winningSymbol} symbols`);
        
        if (maxCount === 2) {
          // 2 matching = 3 suns
          await storage.updateUserSuns(userId, 3);
          reward = { type: 'suns', amount: 3 };
          message = "🌞 2 gleiche Symbole! Du gewinnst 3 Sonnen!";
          console.log(`🎰 Rewarded 3 suns to user ${userId}`);
        } else if (maxCount === 3) {
          // 3 matching = 50 credits
          await storage.updateUserCredits(userId, 50);
          reward = { type: 'credits', amount: 50 };
          message = "💰 3 gleiche Symbole! Du gewinnst 50 Credits!";
          console.log(`🎰 Rewarded 50 credits to user ${userId}`);
        } else if (maxCount === 4) {
          // 4 matching = legendary butterfly
          const butterflyResult = await storage.addButterflyToInventory(userId, 'legendary', 1);
          reward = { type: 'butterfly', rarity: 'legendary', amount: 1 };
          message = "🦋 4 gleiche Symbole! Du gewinnst einen legendären Schmetterling!";
          console.log(`🎰 Rewarded 1 legendary butterfly to user ${userId}`);
        } else if (maxCount === 5) {
          // 5 matching = 1000 credits (jackpot!)
          await storage.updateUserCredits(userId, 1000);
          reward = { type: 'credits', amount: 1000 };
          message = "💰 JACKPOT! 5 gleiche Symbole! Du gewinnst 1000 Credits!";
          console.log(`🎰 JACKPOT! Rewarded 1000 credits to user ${userId}`);
        }
      }

      res.json({
        success: true,
        reels: reels.flat(), // Send all 15 symbols (3 per reel) to frontend
        payline: paylineSymbols, // The 5 middle symbols that count for wins
        matchCount: maxCount,
        winningSymbol: maxCount >= 2 ? winningSymbol : null,
        reward,
        message
      });

    } catch (error) {
      console.error('🎰 Error in Marie-Slot play:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
