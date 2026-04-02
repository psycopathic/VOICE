// DynamoDB table types

// tb.dev.scores - daily scores
export type ScoreRecord = {
  userName: string; // format: "{gamerId}::{state}"
  date?: string;
  score?: number;
  [key: string]: unknown;
};

// tb.prod.user_data - user profiles
export type UserDataRecord = {
  data: {
    USER_DETAILS?: string; // maps to userName in scores
  };
  userId?: string;
  state?: string;
  [key: string]: unknown;
};

// account.linking.data.v2 - real names and emails
export type AccountLinkingRecord = {
  appName: string;
  USER_DETAILS?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  userId?: string;
  [key: string]: unknown;
};

// tb.user.statistics - user statistics
export type UserStatistics = {
  userId?: string;
  userName?: string;
  streak?: number;
  gamesPlayed?: number;
  [key: string]: unknown;
};

// Leaderboard entry type
export type LeaderboardEntry = {
  rank: number;
  userName: string;
  points: number;
  state: string;
  name: string; // "FirstName LastInitial" or "Anonymous"
  userId?: string;
  streak?: number;
  gamesPlayed?: number;
};

// Player profile type
export type PlayerProfile = {
  userName: string;
  userId?: string;
  name: string;
  state: string;
  rank: number;
  points: number;
  streak?: number;
  gamesPlayed?: number;
  slug: string;
};

// Timeframe filter type
export type TimeFrame = "allTime" | "lastMonth" | "last7Days";

// Cached leaderboard data
export type CachedLeaderboard = {
  data: LeaderboardEntry[];
  lastRefreshed: number; // timestamp in ms
  timeframe: TimeFrame;
  stateFilter?: string;
};
