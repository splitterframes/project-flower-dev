import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from './storage_NEW';

export async function registerRoutes(app: Express): Promise<Server> {

/**
 * NEUE SAUBERE API-ROUTES
 * - Nur PostgreSQL Storage
 * - Alle ursprünglichen Features
 * - Keine Hybrid-Probleme
 */

// === USER ROUTES ===
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const result = await storage.createUser(username, password);
    
    if (result.success) {
      console.log(`🎯 NEW API: User registered: ${username}`);
      res.json({ 
        user: {
          id: result.user!.id,
          username: result.user!.username,
          credits: result.user!.credits
        }
      });
    } else {
      res.status(400).json({ message: result.message || 'Registration failed' });
    }
  } catch (error) {
    console.error('❌ NEW API Error registering user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const result = await storage.authenticateUser(username, password);
    
    if (result.success) {
      console.log(`🎯 NEW API: User logged in: ${username}`);
      res.json({ 
        user: {
          id: result.user!.id,
          username: result.user!.username,
          credits: result.user!.credits
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('❌ NEW API Error logging in:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      id: user.id,
      username: user.username,
      credits: user.credits,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('❌ NEW API Error getting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// === BUTTERFLY ROUTES ===
app.get('/api/user/:userId/butterflies', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const butterflies = await storage.getUserButterflies(userId);
    
    console.log(`🎯 NEW API: Getting butterflies for user ${userId} - found ${butterflies.length}`);
    res.json({ butterflies });
  } catch (error) {
    console.error('❌ NEW API Error getting butterflies:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/garden/collect-butterfly', async (req, res) => {
  try {
    const userId = parseInt(req.headers['x-user-id'] as string);
    const { fieldIndex } = req.body;

    if (!userId || fieldIndex === undefined) {
      return res.status(400).json({ message: 'User ID and field index required' });
    }

    const result = await storage.collectFieldButterfly(userId, fieldIndex);

    if (result.success) {
      console.log(`🎯 NEW API: Butterfly collected for user ${userId} from field ${fieldIndex}`);
      res.json({ 
        message: 'Schmetterling erfolgreich gesammelt!', 
        butterfly: result.butterfly 
      });
    } else {
      res.status(400).json({ message: 'No butterfly found on that field' });
    }
  } catch (error) {
    console.error('❌ NEW API Error collecting butterfly:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// === EXHIBITION ROUTES ===
app.post('/api/exhibition/place-butterfly', async (req, res) => {
  try {
    const userId = parseInt(req.headers['x-user-id'] as string);
    const { frameId, slotIndex, butterflyId } = req.body;

    if (!userId || !frameId || slotIndex === undefined || !butterflyId) {
      return res.status(400).json({ message: 'All parameters required' });
    }

    const result = await storage.placeExhibitionButterfly(userId, frameId, slotIndex, butterflyId);

    if (result.success) {
      console.log(`🎯 NEW API: Butterfly placed in exhibition for user ${userId}`);
      res.json({ message: 'Schmetterling erfolgreich platziert!' });
    } else {
      res.status(400).json({ message: result.message || 'Failed to place butterfly' });
    }
  } catch (error) {
    console.error('❌ NEW API Error placing butterfly:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// === PLACEHOLDER ROUTES (to be implemented) ===
app.get('/api/user/:userId/seeds', async (req, res) => {
  const seeds = await storage.getUserSeeds(parseInt(req.params.userId));
  res.json({ seeds });
});

app.get('/api/user/:userId/flowers', async (req, res) => {
  const flowers = await storage.getUserFlowers(parseInt(req.params.userId));
  res.json({ flowers });
});

app.get('/api/garden/planted-fields', async (req, res) => {
  const userId = parseInt(req.headers['x-user-id'] as string);
  const fields = await storage.getPlantedFields(userId);
  res.json({ fields });
});

app.get('/api/garden/field-butterflies', async (req, res) => {
  const userId = parseInt(req.headers['x-user-id'] as string);
  const butterflies = await storage.getFieldButterflies(userId);
  res.json({ butterflies });
});

app.get('/api/garden/placed-bouquets', async (req, res) => {
  const userId = parseInt(req.headers['x-user-id'] as string);
  const bouquets = await storage.getPlacedBouquets(userId);
  res.json({ bouquets });
});

app.get('/api/user/:userId/bouquets', async (req, res) => {
  const bouquets = await storage.getUserBouquets(parseInt(req.params.userId));
  res.json({ bouquets });
});

app.get('/api/user/:userId/exhibition-frames', async (req, res) => {
  const frames = await storage.getExhibitionFrames(parseInt(req.params.userId));
  res.json({ frames });
});

app.get('/api/user/:userId/exhibition-butterflies', async (req, res) => {
  const butterflies = await storage.getExhibitionButterflies(parseInt(req.params.userId));
  res.json({ butterflies });
});

app.get('/api/market', async (req, res) => {
  const listings = await storage.getMarketListings();
  res.json({ listings });
});

  const httpServer = createServer(app);
  return httpServer;
}