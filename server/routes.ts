import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
      const sellerId = 1; // TODO: Get from session/auth
      
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
      const buyerId = 1; // TODO: Get from session/auth
      
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
      const userId = 1; // TODO: Get from session/auth
      
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
      const userId = 1; // TODO: Get from session/auth
      
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
      
      // Generate consistent Latin name based on flowerId
      // Using flowerId as seed for consistent naming
      const randomSeed = flowerId * 31; // Simple seed generation
      const tempRandom = Math.random;
      Math.random = () => {
        const x = Math.sin(randomSeed) * 10000;
        return x - Math.floor(x);
      };
      
      const flower = {
        id: flowerId,
        name: generateLatinFlowerName(),
        rarity: getFlowerRarityById(flowerId),
        imageUrl: `/Blumen/${flowerId}.jpg`
      };
      
      // Restore original Math.random
      Math.random = tempRandom;
      
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
      const userId = 1; // TODO: Get from session/auth
      
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

  app.get("/api/user/:id/butterflies", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const butterflies = await storage.getUserButterflies(userId);
      res.json({ butterflies });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get butterflies on garden fields
  app.get("/api/user/:id/field-butterflies", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const fieldButterflies = await storage.getFieldButterflies(userId);
      res.json({ fieldButterflies });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Collect butterfly from field
  app.post("/api/garden/collect-butterfly", async (req, res) => {
    try {
      const { fieldIndex } = req.body;
      const userId = 1; // TODO: Get from session/auth
      
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
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/bouquets/place", async (req, res) => {
    try {
      const placeData = placeBouquetSchema.parse(req.body);
      const userId = 1; // TODO: Get from session/auth
      
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
      const userId = 1; // TODO: Get from session/auth
      
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

  const httpServer = createServer(app);
  return httpServer;
}
