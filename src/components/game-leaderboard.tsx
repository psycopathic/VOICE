"use client";

import { useEffect, useMemo, useState } from "react";

import { Leaderboard, type LeaderboardEntry } from "@/components/leaderboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type GamePlayer = Omit<LeaderboardEntry, "rank">;

type GameData = {
  id: string;
  name: string;
  description?: string;
  metricLabel?: string;
  currentUserId?: string;
  players: GamePlayer[];
};

type GamesResponse = {
  games: GameData[];
};

export function GameLeaderboard() {
  const pageSize = 10;

  const [games, setGames] = useState<GameData[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [timeframe, setTimeframe] = useState("last7days");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function loadGames() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch("/games.json", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Unable to fetch games data.");
        }

        const payload = (await response.json()) as GamesResponse;
        const fetchedGames = Array.isArray(payload.games) ? payload.games : [];

        if (!isMounted) {
          return;
        }

        setGames(fetchedGames);
        setSelectedGameId((current) => current || fetchedGames[0]?.id || "");
      } catch {
        if (isMounted) {
          setErrorMessage("Could not load leaderboard data. Please try again.");
          setGames([]);
          setSelectedGameId("");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadGames();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedGame = useMemo(
    () => games.find((game) => game.id === selectedGameId) ?? games[0],
    [games, selectedGameId],
  );

  const rankedEntries = useMemo<LeaderboardEntry[]>(() => {
    if (!selectedGame) {
      return [];
    }

    const filteredPlayers = selectedGame.players.filter((player) =>
      player.player.toLowerCase().includes(search.toLowerCase()),
    );

    return [...filteredPlayers]
      .sort((a, b) => b.score - a.score)
      .map((player, index) => ({
        ...player,
        rank: index + 1,
        puzzlesPlayed: player.puzzlesPlayed ?? 30,
        levelLabel: player.levelLabel ?? "Level 11: Puzzle Grand Master",
      }));
  }, [search, selectedGame]);

  const totalItems = rankedEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return rankedEntries.slice(startIndex, startIndex + pageSize);
  }, [currentPage, rankedEntries]);

  const displayStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const displayEnd = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedGameId, timeframe]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-[#7fd6d8] bg-[#7ea1a8]/85 px-4 py-4 text-center sm:px-8">
        <p className="text-base font-semibold text-white sm:text-xl">
          Keep learning daily to climb the classroom leaderboard.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input
          className="h-12 w-full rounded-md border border-[#7fd6d8] bg-white px-4 pr-12 text-base text-slate-700 shadow-sm outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#8bd8db]"
          placeholder="Search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <Card className="overflow-hidden rounded-xl border border-[#7fd6d8] bg-white/85">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 px-4 py-4 text-xs sm:px-6">
            <button
              type="button"
              onClick={() => setTimeframe("last7days")}
              className={cn(
                "border-b-2 pb-1 font-medium uppercase tracking-wide",
                timeframe === "last7days"
                  ? "border-[#72d6d8] text-[#72d6d8]"
                  : "border-transparent text-slate-500",
              )}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeframe("lastMonth")}
              className={cn(
                "border-b-2 pb-1 font-medium uppercase tracking-wide",
                timeframe === "lastMonth"
                  ? "border-[#72d6d8] text-[#72d6d8]"
                  : "border-transparent text-slate-500",
              )}
            >
              Last Month
            </button>
            <button
              type="button"
              onClick={() => setTimeframe("allTime")}
              className={cn(
                "border-b-2 pb-1 font-medium uppercase tracking-wide",
                timeframe === "allTime"
                  ? "border-[#72d6d8] text-[#72d6d8]"
                  : "border-transparent text-slate-500",
              )}
            >
              All Time
            </button>

            <div className="ml-auto w-full sm:w-56">
              <Select
                value={selectedGame?.id ?? ""}
                onValueChange={(value) => setSelectedGameId(String(value))}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Select game" />
                </SelectTrigger>
                <SelectContent align="end">
                  {games.map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {errorMessage ? (
            <Badge variant="destructive" className="m-4 w-fit rounded-full px-3 py-1">
              {errorMessage}
            </Badge>
          ) : null}

          <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            <Leaderboard
              metricLabel={selectedGame?.metricLabel ?? "Points"}
              entries={paginatedEntries}
              selectedGameId={selectedGame?.id}
              isLoading={isLoading}
            />

            <div className="mt-4 flex items-center justify-end gap-6 px-2 text-sm text-slate-600">
              <span>Rows per page:</span>
              <span className="border-b border-slate-300 px-1 pb-1">10</span>
              <span>
                {displayStart}-{displayEnd} of {totalItems}
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}