import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from "./dynamodb";
import type {
  ScoreRecord,
  AccountLinkingRecord,
  UserStatistics,
  LeaderboardEntry,
  TimeFrame,
} from "./types";

// Table names
const SCORES_TABLE = "tb.dev.scores";
const ACCOUNT_LINKING_TABLE = "account.linking.data.v2";
const USER_STATISTICS_TABLE = "tb.user.statistics";

/**
 * Formats a name as "FirstName LastInitial"
 */
function formatName(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) {
    return "Anonymous";
  }

  if (!firstName) {
    return lastName || "Anonymous";
  }

  if (!lastName) {
    return firstName;
  }

  const lastInitial = lastName.charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}`;
}

/**
 * Scans account.linking.data.v2 and builds a name map
 * Returns: Map<USER_DETAILS, {name, userId}>
 */
async function buildNameMap(): Promise<
  Map<string, { name: string; userId?: string }>
> {
  const nameMap = new Map<string, { name: string; userId?: string }>();

  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const command = new ScanCommand({
      TableName: ACCOUNT_LINKING_TABLE,
      FilterExpression: "appName = :appName",
      ExpressionAttributeValues: {
        ":appName": "TRIVIA_BATTLE",
      },
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const response = await dynamoDb.send(command);

    if (response.Items) {
      for (const item of response.Items as AccountLinkingRecord[]) {
        if (item.USER_DETAILS) {
          nameMap.set(item.USER_DETAILS, {
            name: formatName(item.firstName, item.lastName),
            userId: item.userId,
          });
        }
      }
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return nameMap;
}

/**
 * Fetches user statistics from tb.user.statistics
 * Returns: Map<userName, {streak, gamesPlayed}>
 */
async function buildStatisticsMap(): Promise<
  Map<string, { streak?: number; gamesPlayed?: number }>
> {
  const statsMap = new Map<
    string,
    { streak?: number; gamesPlayed?: number }
  >();

  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const command = new ScanCommand({
      TableName: USER_STATISTICS_TABLE,
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const response = await dynamoDb.send(command);

    if (response.Items) {
      for (const item of response.Items as UserStatistics[]) {
        if (item.userName) {
          statsMap.set(item.userName, {
            streak: item.streak,
            gamesPlayed: item.gamesPlayed,
          });
        }
      }
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return statsMap;
}

/**
 * Filters scores based on timeframe
 */
function filterScoresByTimeframe(
  scores: ScoreRecord[],
  timeframe: TimeFrame
): ScoreRecord[] {
  if (timeframe === "allTime") {
    return scores;
  }

  const now = new Date();
  let cutoffDate: Date;

  if (timeframe === "last7Days") {
    cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else {
    // lastMonth
    cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  }

  return scores.filter((score) => {
    if (!score.date) {
      return false;
    }

    const scoreDate = new Date(score.date);
    return scoreDate >= cutoffDate;
  });
}

/**
 * Aggregates scores by userName
 * Returns: Map<userName, totalScore>
 */
function aggregateScores(scores: ScoreRecord[]): Map<string, number> {
  const aggregated = new Map<string, number>();

  for (const score of scores) {
    if (!score.userName || typeof score.score !== "number") {
      continue;
    }

    const current = aggregated.get(score.userName) || 0;
    aggregated.set(score.userName, current + score.score);
  }

  return aggregated;
}

/**
 * Parses userName to extract state
 * Format: "{gamerId}::{state}"
 */
function parseState(userName: string): string {
  const parts = userName.split("::");
  if (parts.length >= 2) {
    return parts[1];
  }
  return "Unknown";
}

/**
 * Main function to compute the leaderboard
 */
export async function computeLeaderboard(
  timeframe: TimeFrame = "allTime",
  stateFilter?: string
): Promise<LeaderboardEntry[]> {
  // 1. Fetch all scores
  const scores: ScoreRecord[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const command = new ScanCommand({
      TableName: SCORES_TABLE,
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const response = await dynamoDb.send(command);

    if (response.Items) {
      scores.push(...(response.Items as ScoreRecord[]));
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  // 2. Filter by timeframe
  const filteredScores = filterScoresByTimeframe(scores, timeframe);

  // 3. Aggregate scores by userName
  const aggregatedScores = aggregateScores(filteredScores);

  // 4. Build name map from account linking table
  const nameMap = await buildNameMap();

  // 5. Build statistics map
  const statsMap = await buildStatisticsMap();

  // 6. Build leaderboard entries
  const entries: LeaderboardEntry[] = [];

  for (const [userName, points] of aggregatedScores.entries()) {
    const state = parseState(userName);

    // Filter by state if specified
    if (stateFilter && state.toLowerCase() !== stateFilter.toLowerCase()) {
      continue;
    }

    const nameInfo = nameMap.get(userName);
    const stats = statsMap.get(userName);

    entries.push({
      rank: 0, // Will be set after sorting
      userName,
      points,
      state,
      name: nameInfo?.name || "Anonymous",
      userId: nameInfo?.userId,
      streak: stats?.streak,
      gamesPlayed: stats?.gamesPlayed,
    });
  }

  // 7. Sort by points descending and assign ranks
  entries.sort((a, b) => b.points - a.points);

  // 8. Limit to top 500
  const top500 = entries.slice(0, 500);

  // 9. Assign ranks
  top500.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return top500;
}

/**
 * Get player profile by userName
 */
export async function getPlayerProfile(userName: string): Promise<LeaderboardEntry | null> {
  // Compute full leaderboard to get rank
  const leaderboard = await computeLeaderboard();

  const entry = leaderboard.find(e => e.userName === userName);
  return entry || null;
}

/**
 * Find player by email
 */
export async function findPlayerByEmail(email: string): Promise<string | null> {
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const command = new ScanCommand({
      TableName: ACCOUNT_LINKING_TABLE,
      FilterExpression: "appName = :appName AND email = :email",
      ExpressionAttributeValues: {
        ":appName": "TRIVIA_BATTLE",
        ":email": email,
      },
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const response = await dynamoDb.send(command);

    if (response.Items && response.Items.length > 0) {
      const item = response.Items[0] as AccountLinkingRecord;
      return item.USER_DETAILS || null;
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return null;
}
