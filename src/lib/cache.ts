import type { CachedLeaderboard, LeaderboardEntry, TimeFrame } from "./types";
import { computeLeaderboard } from "./leaderboard-service";

// In-memory cache
const cache = new Map<string, CachedLeaderboard>();

// Cache configuration
const REFRESH_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes
const AUTO_REFRESH_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

// Last refresh timestamp per cache key
const lastRefreshTimes = new Map<string, number>();

/**
 * Generates cache key
 */
function getCacheKey(timeframe: TimeFrame, stateFilter?: string): string {
  return `${timeframe}${stateFilter ? `:${stateFilter}` : ""}`;
}

/**
 * Checks if cache is stale
 */
function isCacheStale(cacheKey: string): boolean {
  const cached = cache.get(cacheKey);
  if (!cached) {
    return true;
  }

  const age = Date.now() - cached.lastRefreshed;
  return age > AUTO_REFRESH_THRESHOLD_MS;
}

/**
 * Checks if refresh is allowed (cooldown check)
 */
function canRefresh(cacheKey: string): boolean {
  const lastRefresh = lastRefreshTimes.get(cacheKey);
  if (!lastRefresh) {
    return true;
  }

  const timeSinceRefresh = Date.now() - lastRefresh;
  return timeSinceRefresh >= REFRESH_COOLDOWN_MS;
}

/**
 * Gets leaderboard data with caching
 */
export async function getCachedLeaderboard(
  timeframe: TimeFrame = "allTime",
  stateFilter?: string,
  forceRefresh = false
): Promise<LeaderboardEntry[]> {
  const cacheKey = getCacheKey(timeframe, stateFilter);

  // Check if we need to refresh
  const shouldRefresh =
    forceRefresh || !cache.has(cacheKey) || isCacheStale(cacheKey);

  if (shouldRefresh && canRefresh(cacheKey)) {
    // Compute fresh data
    const data = await computeLeaderboard(timeframe, stateFilter);

    // Update cache
    cache.set(cacheKey, {
      data,
      lastRefreshed: Date.now(),
      timeframe,
      stateFilter,
    });

    // Update last refresh time
    lastRefreshTimes.set(cacheKey, Date.now());

    return data;
  }

  // Return cached data
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached.data;
  }

  // Fallback: compute without caching (shouldn't happen)
  return computeLeaderboard(timeframe, stateFilter);
}

/**
 * Gets cache metadata
 */
export function getCacheMetadata(
  timeframe: TimeFrame = "allTime",
  stateFilter?: string
): { lastRefreshed: number | null; canRefresh: boolean } {
  const cacheKey = getCacheKey(timeframe, stateFilter);
  const cached = cache.get(cacheKey);

  return {
    lastRefreshed: cached?.lastRefreshed || null,
    canRefresh: canRefresh(cacheKey),
  };
}

/**
 * Forces a refresh of the cache
 */
export async function refreshLeaderboard(
  timeframe: TimeFrame = "allTime",
  stateFilter?: string
): Promise<{ success: boolean; message: string; lastRefreshed?: number }> {
  const cacheKey = getCacheKey(timeframe, stateFilter);

  if (!canRefresh(cacheKey)) {
    const lastRefresh = lastRefreshTimes.get(cacheKey);
    const timeSinceRefresh = lastRefresh ? Date.now() - lastRefresh : 0;
    const timeUntilRefresh = REFRESH_COOLDOWN_MS - timeSinceRefresh;
    const minutesUntilRefresh = Math.ceil(timeUntilRefresh / 60000);

    return {
      success: false,
      message: `Please wait ${minutesUntilRefresh} more minute(s) before refreshing again.`,
      lastRefreshed: lastRefresh,
    };
  }

  // Compute fresh data
  const data = await computeLeaderboard(timeframe, stateFilter);

  // Update cache
  const now = Date.now();
  cache.set(cacheKey, {
    data,
    lastRefreshed: now,
    timeframe,
    stateFilter,
  });

  // Update last refresh time
  lastRefreshTimes.set(cacheKey, now);

  return {
    success: true,
    message: "Leaderboard refreshed successfully.",
    lastRefreshed: now,
  };
}

/**
 * Clears all cache
 */
export function clearCache(): void {
  cache.clear();
  lastRefreshTimes.clear();
}
