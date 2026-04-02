/**
 * Slug system for player profiles
 * Format: {initials}-{state}-{word}
 * Example: jb-texas-dragonfly
 */

// Word list for slug generation
const WORDS = [
  "dragonfly", "falcon", "phoenix", "tiger", "eagle",
  "panther", "wolf", "lion", "bear", "hawk",
  "shark", "cobra", "viper", "raptor", "jaguar",
  "cheetah", "leopard", "lynx", "puma", "cougar",
  "thunder", "lightning", "storm", "blaze", "frost",
  "shadow", "ghost", "spirit", "phantom", "warrior",
  "knight", "champion", "master", "legend", "hero",
  "ace", "star", "nova", "comet", "meteor",
];

// In-memory slug store (in production, use KV store or database)
const slugToUserName = new Map<string, string>();
const userNameToSlug = new Map<string, string>();

/**
 * Generates initials from a name
 */
function generateInitials(name: string): string {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 0) {
    return "an"; // anonymous
  }

  if (parts.length === 1) {
    // Single name, take first two letters
    return parts[0].substring(0, 2).toLowerCase();
  }

  // Multiple parts, take first letter of each
  return parts
    .slice(0, 2)
    .map(p => p.charAt(0))
    .join("")
    .toLowerCase();
}

/**
 * Normalizes state name for slug
 */
function normalizeState(state: string): string {
  return state.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Generates a random word from the word list
 */
function getRandomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

/**
 * Generates a slug for a user
 */
export function generateSlug(name: string, state: string, userName: string): string {
  // Check if slug already exists for this userName
  const existing = userNameToSlug.get(userName);
  if (existing) {
    return existing;
  }

  const initials = generateInitials(name);
  const normalizedState = normalizeState(state);

  // Try to generate a unique slug (max 10 attempts)
  let slug: string;
  let attempts = 0;

  do {
    const word = getRandomWord();
    slug = `${initials}-${normalizedState}-${word}`;
    attempts++;
  } while (slugToUserName.has(slug) && attempts < 10);

  // If still not unique after 10 attempts, append a random number
  if (slugToUserName.has(slug)) {
    const random = Math.floor(Math.random() * 10000);
    slug = `${slug}-${random}`;
  }

  // Store the mapping
  slugToUserName.set(slug, userName);
  userNameToSlug.set(userName, slug);

  return slug;
}

/**
 * Gets userName from slug
 */
export function getUserNameFromSlug(slug: string): string | null {
  return slugToUserName.get(slug) || null;
}

/**
 * Gets slug from userName
 */
export function getSlugFromUserName(userName: string): string | null {
  return userNameToSlug.get(userName) || null;
}

/**
 * Pre-populates slug for a userName if it doesn't exist
 */
export function ensureSlug(name: string, state: string, userName: string): string {
  return generateSlug(name, state, userName);
}
