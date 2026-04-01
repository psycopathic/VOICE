import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type GamePlayer = {
  id: string;
  player: string;
  score: number;
  puzzlesPlayed?: number;
  levelLabel?: string;
  status?: string;
};

export type GameData = {
  id: string;
  name: string;
  description?: string;
  metricLabel?: string;
  players: GamePlayer[];
};

type GamesResponse = {
  games: GameData[];
};

export async function getGamesData(): Promise<GamesResponse> {
  const jsonPath = join(process.cwd(), "public", "games.json");
  const raw = await readFile(jsonPath, "utf8");
  const parsed = JSON.parse(raw) as GamesResponse;

  if (!Array.isArray(parsed.games)) {
    return { games: [] };
  }

  return parsed;
}

export function getRankedPlayers(game: GameData): Array<GamePlayer & { rank: number }> {
  return [...game.players]
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({ ...player, rank: index + 1 }));
}