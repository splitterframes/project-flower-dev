import type { Express } from "express";
import { createServer, type Server } from "http";
import { postgresStorage as storage } from "./postgresStorage";
import { insertUserSchema, loginSchema, createMarketListingSchema, buyListingSchema, plantSeedSchema, harvestFieldSchema, createBouquetSchema, placeBouquetSchema } from "@shared/schema";
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
      // Server offers unlimited Common seeds for 50 credits each
      const serverOffers = [
        {
          id: "server-common-seeds",
          seedId: 1, // Common seed ID
          seedName: "Gewöhnliche Samen",
          seedRarity: "common",
          pricePerUnit: 50,
          quantity: 999, // Unlimited
          seller: "🏪 Mariposa Shop",
          description: "Hochwertige Samen vom offiziellen Mariposa-Händler"
        }
      ];
      
      res.json({ serverOffers });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/market/buy-from-server", async (req, res) => {
    try {
      const { seedId, quantity } = req.body;
      const buyerId = parseInt(req.headers['x-user-id'] as string) || 1;
      
      if (seedId !== 1) {
        return res.status(400).json({ message: "Server verkauft nur gewöhnliche Samen" });
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
      
      const users = await storage.getAllUsersWithStatus();
      res.json({ users });
    } catch (error) {
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

  // 🔍 DEBUG: Show user 1 exhibition status on live server
  app.get("/api/debug/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Get user data
      const user = await storage.getUser(userId);
      
      // Get exhibition butterflies
      const normalButterflies = await storage.getExhibitionButterflies(userId);
      const vipButterflies = await storage.getExhibitionVipButterflies(userId);
      
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
        normalButterflyList: normalButterflies.map(b => ({ id: b.id, name: b.butterflyName, rarity: b.butterflyRarity })),
        vipButterflyList: vipButterflies.map(b => ({ id: b.id, name: b.butterflyName }))
      });
    } catch (error) {
      console.error('Debug error:', error);
      res.status(500).json({ error: 'Debug failed', message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
