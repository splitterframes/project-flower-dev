import express from 'express';
import { storage } from './storage';

const router = express.Router();

// === AUTHENTICATION ===
router.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = await storage.createUser(username, password);
  if (user) {
    res.json({ user });
  } else {
    res.status(400).json({ error: 'Username already exists' });
  }
});

router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  const user = await storage.loginUser(username, password);
  if (user) {
    res.json({ user });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// === GARDEN ACTIONS ===
router.post('/garden/plant', async (req, res) => {
  const { userId, fieldIndex, seedId } = req.body;
  
  const success = await storage.plantSeed(userId, fieldIndex, seedId);
  if (success) {
    res.json({ message: 'Seed planted successfully' });
  } else {
    res.status(400).json({ error: 'Failed to plant seed' });
  }
});

router.post('/garden/harvest', async (req, res) => {
  const { userId, fieldIndex } = req.body;
  
  const success = await storage.harvestFlower(userId, fieldIndex);
  if (success) {
    res.json({ message: 'Flower harvested successfully' });
  } else {
    res.status(400).json({ error: 'Failed to harvest flower' });
  }
});

// === DATA ENDPOINTS ===
router.get('/user/:userId/seeds', async (req, res) => {
  const seeds = await storage.getUserSeeds(parseInt(req.params.userId));
  res.json({ seeds });
});

router.get('/user/:userId/flowers', async (req, res) => {
  const flowers = await storage.getUserFlowers(parseInt(req.params.userId));
  res.json({ flowers });
});

router.get('/user/:userId/butterflies', async (req, res) => {
  const butterflies = await storage.getUserButterflies(parseInt(req.params.userId));
  res.json({ butterflies });
});

router.get('/garden/fields/:userId', async (req, res) => {
  const fields = await storage.getPlantedFields(parseInt(req.params.userId));
  res.json({ fields });
});

export default router;