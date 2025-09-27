import { cache, CacheKeys, withCache } from "./cache";

export interface UserResourceSnapshot {
  credits: number;
  suns: number;
  hearts: number;
  dna: number;
  tickets: number;
  lastUpdated: string;
}

export class UserNotFoundError extends Error {
  constructor(userId: number) {
    super(`User ${userId} not found`);
    this.name = "UserNotFoundError";
  }
}

export const RESOURCE_CACHE_TTL_SECONDS = 5;

/**
 * Fetches and caches core user resources to minimise database round-trips.
 */
export async function getUserResourceSnapshot(
  userId: number,
  ttlSeconds: number = RESOURCE_CACHE_TTL_SECONDS
): Promise<UserResourceSnapshot> {
  return withCache(CacheKeys.USER_RESOURCES(userId), async () => {
    const { postgresStorage: storage } = await import("./postgresStorage");
    const user = await storage.getUser(userId);

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    return {
      credits: user.credits ?? 0,
      suns: user.suns ?? 0,
      hearts: user.hearts ?? 0,
      dna: user.dna ?? 0,
      tickets: user.tickets ?? 0,
      lastUpdated: new Date().toISOString(),
    } satisfies UserResourceSnapshot;
  }, ttlSeconds);
}

export function invalidateUserResourceCache(userId: number): void {
  cache.delete(CacheKeys.USER_RESOURCES(userId));
}
