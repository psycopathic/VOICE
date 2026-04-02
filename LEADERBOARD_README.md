# VOICE Leaderboard System

A production-grade leaderboard system built with Next.js 16, TypeScript, and AWS DynamoDB.

## Features

- **Real-time Leaderboard**: Displays top 500 players with cached data
- **Time Filters**: View leaderboards for All Time, Last Month, or Last 7 Days
- **State Filtering**: Filter leaderboards by state
- **Player Profiles**: Detailed player profiles with stats and rankings
- **Smart Caching**: 15-minute refresh cooldown with 30-minute auto-refresh
- **Slug System**: SEO-friendly player profile URLs
- **Find Me**: Look up your profile by email

## Architecture

### Backend Services

#### DynamoDB Client (`src/lib/dynamodb.ts`)
- Configured AWS SDK v3 client
- Document client for simplified operations
- Environment-based configuration

#### Leaderboard Service (`src/lib/leaderboard-service.ts`)
Handles all leaderboard business logic:
- **Score Aggregation**: Sums scores from `tb.dev.scores` table
- **Name Mapping**: Maps userNames to real names from `account.linking.data.v2`
- **Statistics**: Fetches streak and games played from `tb.user.statistics`
- **Time Filtering**: Supports allTime, lastMonth, and last7Days
- **State Filtering**: Filter by state from userName format `{gamerId}::{state}`
- **Player Lookup**: Find players by userName or email

#### Cache Layer (`src/lib/cache.ts`)
In-memory caching with:
- 15-minute refresh cooldown (prevents excessive refreshes)
- 30-minute auto-refresh threshold (keeps data fresh)
- Per-timeframe and per-state cache keys
- Manual refresh capability

#### Slug System (`src/lib/slug.ts`)
Generates unique, SEO-friendly player URLs:
- Format: `{initials}-{state}-{word}` (e.g., `jb-texas-dragonfly`)
- Persistent mapping stored in memory
- Collision prevention with random word selection

### API Routes

#### `GET /api/leaderboard`
Fetches the leaderboard with optional filters.

**Query Parameters:**
- `timeframe`: `allTime` | `lastMonth` | `last7Days` (default: `allTime`)
- `state`: Filter by state name (optional)

**Response:**
```json
{
  "success": true,
  "timeframe": "allTime",
  "state": null,
  "count": 500,
  "data": [
    {
      "rank": 1,
      "userName": "player123::texas",
      "points": 98500,
      "state": "texas",
      "name": "John D",
      "userId": "user-456",
      "streak": 12,
      "gamesPlayed": 345,
      "slug": "jd-texas-dragonfly"
    }
  ]
}
```

#### `POST /api/refresh`
Manually refreshes the leaderboard cache.

**Request Body:**
```json
{
  "timeframe": "allTime",
  "state": "texas"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Leaderboard refreshed successfully.",
  "lastRefreshed": 1679523456789
}
```

**Rate Limiting:**
Returns 429 if refresh attempted before cooldown expires.

#### `GET /api/refresh`
Gets cache metadata without refreshing.

**Query Parameters:**
- `timeframe`: `allTime` | `lastMonth` | `last7Days`
- `state`: State filter (optional)

**Response:**
```json
{
  "lastRefreshed": 1679523456789,
  "canRefresh": false
}
```

#### `GET /api/player/[slug]`
Fetches player profile by slug.

**Response:**
```json
{
  "success": true,
  "data": {
    "rank": 1,
    "userName": "player123::texas",
    "points": 98500,
    "state": "texas",
    "name": "John D",
    "streak": 12,
    "gamesPlayed": 345,
    "slug": "jd-texas-dragonfly"
  }
}
```

#### `POST /api/find-me`
Finds a player by email and returns their profile URL.

**Request Body:**
```json
{
  "email": "player@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "slug": "jd-texas-dragonfly",
  "redirectUrl": "/profile/jd-texas-dragonfly"
}
```

### Frontend Components

#### `ApiLeaderboard` (`src/components/api-leaderboard.tsx`)
Main leaderboard component:
- Fetches from `/api/leaderboard`
- Time filter tabs
- Search functionality
- Pagination (10 per page)
- Top 3 podium display
- Manual refresh button

#### `Leaderboard` (`src/components/leaderboard.tsx`)
Reusable table component for displaying leaderboard entries.

### DynamoDB Tables

#### `tb.dev.scores`
Daily scores per user.

**Key Fields:**
- `userName`: Format `{gamerId}::{state}`
- `date`: ISO date string
- `score`: Points earned

#### `tb.prod.user_data`
User profile data.

**Key Fields:**
- `data.USER_DETAILS`: Maps to userName
- `userId`: Unique user ID
- `state`: User's state

#### `account.linking.data.v2`
Account linking information (filtered by `appName = "TRIVIA_BATTLE"`).

**Key Fields:**
- `appName`: Must be "TRIVIA_BATTLE"
- `USER_DETAILS`: Maps to userName
- `firstName`: User's first name
- `lastName`: User's last name
- `email`: User's email (not exposed)
- `userId`: User ID

#### `tb.user.statistics`
User gameplay statistics.

**Key Fields:**
- `userName`: Player identifier
- `streak`: Current daily streak
- `gamesPlayed`: Total games played

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# Optional: Override table names
# SCORES_TABLE=tb.dev.scores
# USER_DATA_TABLE=tb.prod.user_data
# ACCOUNT_LINKING_TABLE=account.linking.data.v2
# USER_STATISTICS_TABLE=tb.user.statistics
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

### 4. Build for Production

```bash
npm run build
npm start
```

## Data Flow

### Leaderboard Computation

1. **Fetch Scores**: Scan `tb.dev.scores` table
2. **Filter by Time**: Apply timeframe filter (last 7 days, last month, or all time)
3. **Aggregate**: Sum scores per userName
4. **Filter by State**: Apply state filter if specified
5. **Fetch Names**: Scan `account.linking.data.v2` for real names
6. **Fetch Stats**: Scan `tb.user.statistics` for streaks and games played
7. **Join Data**: Combine scores with names and stats
8. **Sort & Rank**: Sort by points descending, assign ranks
9. **Limit**: Return top 500 players
10. **Cache**: Store results with timestamp

### Player Profile Lookup

1. **Slug to userName**: Resolve slug to userName
2. **Compute Leaderboard**: Get full leaderboard (or from cache)
3. **Find Player**: Locate player in leaderboard
4. **Return Profile**: Include rank, points, and stats

### Find by Email

1. **Scan Account Linking**: Find USER_DETAILS by email
2. **Get Profile**: Fetch player profile by userName
3. **Generate Slug**: Create or retrieve existing slug
4. **Return URL**: Provide redirect URL

## Performance Optimization

### Caching Strategy

- **Cache Duration**: Data refreshes automatically after 30 minutes
- **Refresh Cooldown**: Manual refresh allowed every 15 minutes
- **Cache Keys**: Separate caches per timeframe and state combination

### DynamoDB Scanning

- **Parallel Scans**: Process large tables efficiently
- **Pagination**: Handle LastEvaluatedKey for complete scans
- **Filtering**: Apply filters in DynamoDB where possible

### Data Joins

- **In-Memory Maps**: Build name and stats maps before joining
- **Single Pass**: Join all data in one iteration
- **Avoid N+1**: No per-user queries

## Security Considerations

- ✅ Email addresses are NEVER exposed in API responses
- ✅ Read-only DynamoDB access (no write operations)
- ✅ Filtered queries for TRIVIA_BATTLE app only
- ✅ Environment variables for sensitive credentials
- ✅ No SQL injection (using DynamoDB SDK)

## Testing

### Test API Endpoints

```bash
# Get leaderboard (all time)
curl http://localhost:3000/api/leaderboard

# Get leaderboard (last 7 days)
curl http://localhost:3000/api/leaderboard?timeframe=last7Days

# Get leaderboard (state filter)
curl http://localhost:3000/api/leaderboard?state=texas

# Refresh leaderboard
curl -X POST http://localhost:3000/api/refresh \
  -H "Content-Type: application/json" \
  -d '{"timeframe":"allTime"}'

# Get player profile
curl http://localhost:3000/api/player/jd-texas-dragonfly

# Find player by email
curl -X POST http://localhost:3000/api/find-me \
  -H "Content-Type: application/json" \
  -d '{"email":"player@example.com"}'
```

## Troubleshooting

### Issue: "Failed to fetch leaderboard"

**Possible Causes:**
- AWS credentials not configured
- DynamoDB tables don't exist
- Network connectivity issues
- Insufficient IAM permissions

**Solution:**
1. Verify `.env.local` has correct AWS credentials
2. Check AWS IAM permissions include `dynamodb:Scan`
3. Verify table names match your DynamoDB setup

### Issue: "Please wait X more minutes before refreshing"

**Cause:** Refresh cooldown is active (15 minutes)

**Solution:** Wait for cooldown to expire or use cached data

### Issue: "Player not found"

**Possible Causes:**
- Slug doesn't exist in mapping
- Player has no scores in database
- Email not linked to TRIVIA_BATTLE app

**Solution:**
1. Verify player has scores in `tb.dev.scores`
2. Check account linking exists in `account.linking.data.v2`
3. Ensure `appName = "TRIVIA_BATTLE"`

## Future Enhancements

- [ ] Add WebSocket support for real-time updates
- [ ] Implement persistent slug storage (Redis/KV)
- [ ] Add player search by name
- [ ] Historical rank tracking
- [ ] Player-to-player comparisons
- [ ] Achievement badges
- [ ] Export leaderboard to CSV
- [ ] Admin dashboard for cache management

## License

MIT
