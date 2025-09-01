import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';
import { eq, and, gte, lt, desc, asc } from 'drizzle-orm';
import { getRandomRarity, getRandomFlowerId, getRandomButterflyId, getRarityConfig } from '../shared/rarity';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

export class MariposaStorage {
  
  // === USER MANAGEMENT ===
  async createUser(username: string, password: string): Promise<{ id: number; username: string; credits: number } | null> {
    try {
      const [user] = await db.insert(schema.users)
        .values({ username, password })
        .returning();
      
      console.log(`🦋 User created: ${username} (ID: ${user.id})`);
      
      // Give starter seeds
      await this.giveStarterSeeds(user.id);
      
      return { id: user.id, username: user.username, credits: user.credits };
    } catch (error) {
      console.error('❌ Error creating user:', error);
      return null;
    }
  }

  async loginUser(username: string, password: string): Promise<{ id: number; username: string; credits: number } | null> {
    try {
      const [user] = await db.select()
        .from(schema.users)
        .where(and(eq(schema.users.username, username), eq(schema.users.password, password)))
        .limit(1);
      
      if (user) {
        console.log(`🦋 User logged in: ${username}`);
        return { id: user.id, username: user.username, credits: user.credits };
      }
      return null;
    } catch (error) {
      console.error('❌ Error logging in:', error);
      return null;
    }
  }

  // === STARTER SYSTEM ===
  async giveStarterSeeds(userId: number) {
    // Give 10 common seeds and 5 uncommon seeds to new users
    await db.insert(schema.userSeeds).values([
      { userId, seedId: 1, quantity: 10 }, // 10 common seeds
      { userId, seedId: 2, quantity: 5 },  // 5 uncommon seeds
    ]);
    
    // Give starter unlocked fields (top-left 2x2)
    await db.insert(schema.userUnlockedFields).values([
      { userId, fieldIndex: 0, unlockCost: 0 },
      { userId, fieldIndex: 1, unlockCost: 0 },
      { userId, fieldIndex: 10, unlockCost: 0 },
      { userId, fieldIndex: 11, unlockCost: 0 },
    ]);
    
    console.log(`🌱 Starter seeds given to user ${userId}`);
    console.log(`🔓 Starter fields unlocked for user ${userId}`);
  }

  // === FIELD UNLOCKING ===
  async getUnlockedFields(userId: number) {
    return await db.select().from(schema.userUnlockedFields).where(eq(schema.userUnlockedFields.userId, userId));
  }
  
  async getNextUnlockCost(userId: number): Promise<number> {
    const unlockedFields = await this.getUnlockedFields(userId);
    const unlockedCount = unlockedFields.filter(f => f.unlockCost > 0).length; // Exclude starter fields
    return Math.floor(1000 * Math.pow(1.2, unlockedCount));
  }
  
  async isFieldUnlockable(userId: number, fieldIndex: number): Promise<boolean> {
    // Check if field is already unlocked
    const existing = await db.select()
      .from(schema.userUnlockedFields)
      .where(and(eq(schema.userUnlockedFields.userId, userId), eq(schema.userUnlockedFields.fieldIndex, fieldIndex)))
      .limit(1);
    
    if (existing.length > 0) return false;
    
    // Get all unlocked fields
    const unlockedFields = await this.getUnlockedFields(userId);
    const unlockedIndices = new Set(unlockedFields.map(f => f.fieldIndex));
    
    // Check if field is adjacent to any unlocked field (10x5 grid)
    const row = Math.floor(fieldIndex / 10);
    const col = fieldIndex % 10;
    const adjacentIndices = [
      (row - 1) * 10 + col, // above
      (row + 1) * 10 + col, // below
      row * 10 + (col - 1), // left
      row * 10 + (col + 1), // right
    ].filter(idx => idx >= 0 && idx < 50); // Valid field range
    
    return adjacentIndices.some(idx => unlockedIndices.has(idx));
  }
  
  async unlockField(userId: number, fieldIndex: number): Promise<boolean> {
    try {
      // Check if field can be unlocked
      const canUnlock = await this.isFieldUnlockable(userId, fieldIndex);
      if (!canUnlock) {
        console.log(`❌ Field ${fieldIndex} cannot be unlocked by user ${userId}`);
        return false;
      }
      
      // Get unlock cost
      const cost = await this.getNextUnlockCost(userId);
      
      // Check if user has enough credits
      const [user] = await db.select()
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1);
      
      if (!user || user.credits < cost) {
        console.log(`❌ User ${userId} doesn't have enough credits (${user?.credits} < ${cost})`);
        return false;
      }
      
      // Deduct credits and unlock field
      await db.update(schema.users)
        .set({ credits: user.credits - cost })
        .where(eq(schema.users.id, userId));
      
      await db.insert(schema.userUnlockedFields).values({
        userId,
        fieldIndex,
        unlockCost: cost
      });
      
      console.log(`🔓 Field ${fieldIndex} unlocked by user ${userId} for ${cost} credits`);
      return true;
    } catch (error) {
      console.error('❌ Error unlocking field:', error);
      return false;
    }
  }

  // === GARDEN SYSTEM ===
  async plantSeed(userId: number, fieldIndex: number, seedId: number): Promise<boolean> {
    try {
      // Check if field is unlocked
      const unlockedField = await db.select()
        .from(schema.userUnlockedFields)
        .where(and(eq(schema.userUnlockedFields.userId, userId), eq(schema.userUnlockedFields.fieldIndex, fieldIndex)))
        .limit(1);
      
      if (unlockedField.length === 0) {
        console.log(`❌ Field ${fieldIndex} is not unlocked for user ${userId}`);
        return false;
      }
      
      // Check if field is empty
      const existingField = await db.select()
        .from(schema.plantedFields)
        .where(and(eq(schema.plantedFields.userId, userId), eq(schema.plantedFields.fieldIndex, fieldIndex)))
        .limit(1);
      
      if (existingField.length > 0) {
        console.log(`❌ Field ${fieldIndex} already occupied`);
        return false;
      }

      // Check if user has seed
      const [userSeed] = await db.select()
        .from(schema.userSeeds)
        .where(and(eq(schema.userSeeds.userId, userId), eq(schema.userSeeds.seedId, seedId)))
        .limit(1);

      if (!userSeed || userSeed.quantity < 1) {
        console.log(`❌ User ${userId} doesn't have seed ${seedId}`);
        return false;
      }

      // Plant seed
      const growthTime = getRarityConfig(seedId).growthTime;
      const harvestAt = new Date(Date.now() + growthTime);

      await db.insert(schema.plantedFields).values({
        userId,
        fieldIndex,
        seedId,
        harvestAt,
        // Set default values for old columns that still exist
        isReady: false
      });

      // Remove seed from inventory
      if (userSeed.quantity === 1) {
        await db.delete(schema.userSeeds).where(eq(schema.userSeeds.id, userSeed.id));
      } else {
        await db.update(schema.userSeeds)
          .set({ quantity: userSeed.quantity - 1 })
          .where(eq(schema.userSeeds.id, userSeed.id));
      }

      console.log(`🌱 Seed ${seedId} planted in field ${fieldIndex} by user ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Error planting seed:', error);
      return false;
    }
  }

  async harvestFlower(userId: number, fieldIndex: number): Promise<boolean> {
    try {
      const [field] = await db.select()
        .from(schema.plantedFields)
        .where(and(eq(schema.plantedFields.userId, userId), eq(schema.plantedFields.fieldIndex, fieldIndex)))
        .limit(1);

      if (!field || field.harvestAt > new Date()) {
        return false;
      }

      // Generate random flower based on seed rarity
      const flowerId = getRandomFlowerId(field.seedId);

      // Add flower to inventory
      const existingFlower = await db.select()
        .from(schema.userFlowers)
        .where(and(eq(schema.userFlowers.userId, userId), eq(schema.userFlowers.flowerId, flowerId)))
        .limit(1);

      if (existingFlower.length > 0) {
        await db.update(schema.userFlowers)
          .set({ quantity: existingFlower[0].quantity + 1 })
          .where(eq(schema.userFlowers.id, existingFlower[0].id));
      } else {
        await db.insert(schema.userFlowers).values({
          userId,
          flowerId,
          rarity: field.seedId,
          quantity: 1
        });
      }

      // Remove planted field
      await db.delete(schema.plantedFields).where(eq(schema.plantedFields.id, field.id));

      console.log(`🌸 Flower ${flowerId} harvested from field ${fieldIndex} by user ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Error harvesting flower:', error);
      return false;
    }
  }

  // === DATA GETTERS ===
  async getUserSeeds(userId: number) {
    return await db.select().from(schema.userSeeds).where(eq(schema.userSeeds.userId, userId));
  }

  async getPlantedFields(userId: number) {
    return await db.select().from(schema.plantedFields).where(eq(schema.plantedFields.userId, userId));
  }

  async getUserFlowers(userId: number) {
    return await db.select().from(schema.userFlowers).where(eq(schema.userFlowers.userId, userId));
  }

  async getUserButterflies(userId: number) {
    return await db.select().from(schema.userButterflies).where(eq(schema.userButterflies.userId, userId));
  }
}

export const storage = new MariposaStorage();