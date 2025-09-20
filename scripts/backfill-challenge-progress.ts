#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { challengeDonations, weeklyChallenges, weeklyChallengeProgress, users } from '../shared/schema.js';
import { eq, and, sql } from 'drizzle-orm';

// Create database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const db = drizzle(neon(connectionString));

// Backfill challenge progress from existing donations
async function backfillChallengeProgress() {
  console.log('🌸 Starting Challenge Progress Backfill...\n');

  try {
    // Get active challenge
    const activeChallenge = await db
      .select()
      .from(weeklyChallenges)
      .where(eq(weeklyChallenges.isActive, true))
      .limit(1);

    if (activeChallenge.length === 0) {
      console.log('❌ No active challenge found');
      return;
    }

    const challenge = activeChallenge[0];
    console.log(`🎯 Active Challenge: Week ${challenge.weekNumber} (ID: ${challenge.id})`);
    console.log(`📝 Required Flowers: ${challenge.flowerId1}, ${challenge.flowerId2}, ${challenge.flowerId3}, ${challenge.flowerId4}, ${challenge.flowerId5}, ${challenge.flowerId6}\n`);

    // Get all donations for this challenge
    const donations = await db
      .select({
        userId: challengeDonations.userId,
        username: users.username,
        flowerId: challengeDonations.flowerId,
        quantity: challengeDonations.quantity,
        donatedAt: challengeDonations.donatedAt
      })
      .from(challengeDonations)
      .leftJoin(users, eq(challengeDonations.userId, users.id))
      .where(eq(challengeDonations.challengeId, challenge.id))
      .orderBy(challengeDonations.userId, challengeDonations.donatedAt);

    console.log(`📊 Found ${donations.length} donations for challenge ${challenge.id}:\n`);

    // Required flower IDs set
    const requiredFlowerIds = new Set([
      challenge.flowerId1, challenge.flowerId2, challenge.flowerId3,
      challenge.flowerId4, challenge.flowerId5, challenge.flowerId6
    ]);

    // Calculate progress for each user
    const userProgress = new Map<number, {
      userId: number;
      username: string;
      score: number;
      totalDonations: number;
      qualifyingFlowers: Set<number>;
      firstCompletedAt: Date | null;
    }>();

    for (const donation of donations) {
      if (!userProgress.has(donation.userId)) {
        userProgress.set(donation.userId, {
          userId: donation.userId,
          username: donation.username || 'Unknown',
          score: 0,
          totalDonations: 0,
          qualifyingFlowers: new Set(),
          firstCompletedAt: null
        });
      }

      const progress = userProgress.get(donation.userId)!;
      progress.totalDonations += donation.quantity;

      // Check if this flower qualifies
      if (requiredFlowerIds.has(donation.flowerId)) {
        const prevScore = progress.score;
        progress.score += donation.quantity;
        progress.qualifyingFlowers.add(donation.flowerId);

        console.log(`✅ ${progress.username}: +${donation.quantity} qualifying donations (Flower ${donation.flowerId}) -> Score: ${progress.score}`);

        // Check if completed first set (6 unique flowers)
        if (progress.qualifyingFlowers.size === 6 && !progress.firstCompletedAt) {
          progress.firstCompletedAt = donation.donatedAt;
          console.log(`🎉 ${progress.username}: COMPLETED first set at ${donation.donatedAt}`);
        }
      } else {
        console.log(`❌ ${progress.username}: Non-qualifying donation (Flower ${donation.flowerId})`);
      }
    }

    console.log('\n📈 Final Progress Summary:');
    for (const [userId, progress] of userProgress) {
      console.log(`${progress.username} (ID: ${userId}): Score ${progress.score}, Total Donations: ${progress.totalDonations}, Qualifying Flowers: ${Array.from(progress.qualifyingFlowers).join(', ')}, First Completed: ${progress.firstCompletedAt || 'Not completed'}`);
    }

    // Insert/Update progress in database
    console.log('\n💾 Updating database...');
    for (const [userId, progress] of userProgress) {
      await db
        .insert(weeklyChallengeProgress)
        .values({
          userId: progress.userId,
          challengeId: challenge.id,
          score: progress.score,
          setsCompleted: progress.qualifyingFlowers.size === 6 ? 1 : 0,
          totalDonations: progress.totalDonations,
          firstCompletedAt: progress.firstCompletedAt,
          lastUpdatedAt: new Date(),
          createdAt: new Date()
        })
        .onConflictDoUpdate({
          target: [weeklyChallengeProgress.userId, weeklyChallengeProgress.challengeId],
          set: {
            score: progress.score,
            setsCompleted: progress.qualifyingFlowers.size === 6 ? 1 : 0,
            totalDonations: progress.totalDonations,
            firstCompletedAt: progress.firstCompletedAt,
            lastUpdatedAt: new Date()
          }
        });

      console.log(`✅ Updated progress for ${progress.username}`);
    }

    // Check final leaderboard
    console.log('\n🏆 Final Leaderboard:');
    const leaderboard = await db
      .select({
        userId: weeklyChallengeProgress.userId,
        score: weeklyChallengeProgress.score,
        firstCompletedAt: weeklyChallengeProgress.firstCompletedAt,
        username: users.username
      })
      .from(weeklyChallengeProgress)
      .leftJoin(users, eq(weeklyChallengeProgress.userId, users.id))
      .where(eq(weeklyChallengeProgress.challengeId, challenge.id))
      .orderBy(sql`score DESC, first_completed_at ASC`);

    if (leaderboard.length === 0) {
      console.log('❌ No qualifying entries found - leaderboard is empty');
    } else {
      leaderboard.forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.username}: ${entry.score} points ${entry.firstCompletedAt ? `(completed ${entry.firstCompletedAt})` : '(incomplete)'}`);
      });
    }

    console.log('\n🎉 Backfill completed successfully!');

  } catch (error) {
    console.error('❌ Error during backfill:', error);
    throw error;
  }
}

// Run the backfill
backfillChallengeProgress().catch(console.error);