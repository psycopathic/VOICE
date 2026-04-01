"use client";

import { useEffect, useMemo, useState } from "react";

import { Leaderboard, type LeaderboardEntry } from "@/components/leaderboard";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Trophy, Crown, Medal, Flame, TrendingUp } from "lucide-react";
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

function formatScore(score: number) {
  if (score % 1 !== 0) return score.toFixed(2);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(score);
}

function PodiumCard({
  entry,
  position,
  metricLabel,
  selectedGameId,
}: {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
  metricLabel: string;
  selectedGameId?: string;
}) {
  const configs = {
    1: {
      gradient: "from-amber-500/20 via-yellow-500/10 to-transparent",
      glow: "glow-gold",
      textGradient: "text-gradient-gold",
      badgeClass: "rank-badge-gold",
      icon: <Crown className="h-5 w-5" />,
      ringColor: "ring-amber-500/30",
      size: "sm:col-start-2 sm:row-start-1",
      heightClass: "sm:pb-6",
    },
    2: {
      gradient: "from-slate-400/15 via-slate-300/5 to-transparent",
      glow: "glow-silver",
      textGradient: "text-gradient-silver",
      badgeClass: "rank-badge-silver",
      icon: <Medal className="h-4 w-4" />,
      ringColor: "ring-slate-400/20",
      size: "sm:col-start-1 sm:row-start-1",
      heightClass: "sm:pt-4",
    },
    3: {
      gradient: "from-orange-600/15 via-orange-500/5 to-transparent",
      glow: "glow-bronze",
      textGradient: "text-gradient-bronze",
      badgeClass: "rank-badge-bronze",
      icon: <Medal className="h-4 w-4" />,
      ringColor: "ring-orange-600/20",
      size: "sm:col-start-3 sm:row-start-1",
      heightClass: "sm:pt-8",
    },
  };

  const config = configs[position];

  return (
    <a
      href={`/profile/${entry.id}${selectedGameId ? `?game=${selectedGameId}` : ""}`}
      className={cn(
        "podium-card group flex flex-col items-center gap-3 rounded-2xl p-5 text-center",
        "bg-gradient-to-b",
        config.gradient,
        config.glow,
        config.size,
        config.heightClass,
        "animate-scale-in"
      )}
      style={{ animationDelay: `${(position - 1) * 100}ms` }}
    >
      {/* Rank badge */}
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold",
          config.badgeClass
        )}
      >
        {position === 1 ? config.icon : `#${position}`}
      </div>

      {/* Avatar circle */}
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ring-2",
          config.ringColor,
          position === 1
            ? "from-amber-500/20 to-yellow-600/10"
            : position === 2
            ? "from-slate-400/20 to-slate-500/10"
            : "from-orange-500/20 to-orange-600/10"
        )}
      >
        <Trophy
          className={cn(
            "h-7 w-7",
            position === 1
              ? "text-amber-400"
              : position === 2
              ? "text-slate-300"
              : "text-orange-400"
          )}
        />
      </div>

      {/* Player name */}
      <div>
        <div
          className={cn(
            "text-lg font-bold tracking-tight transition-colors group-hover:brightness-125",
            config.textGradient
          )}
        >
          {entry.player}
        </div>
        <div className="mt-0.5 text-xs text-slate-500">
          {entry.levelLabel ?? "Level 11: Grand Master"}
        </div>
      </div>

      {/* Score */}
      <div className="mt-auto flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-sm font-semibold text-slate-200">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
        {formatScore(entry.score)} {metricLabel}
      </div>
    </a>
  );
}

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

  // Paginate the full ranked list (always 10 per page).
  // On page 1 (when not searching), the first 3 become the podium
  // and the remaining 7 fill the table — still 10 total.
  const totalItems = rankedEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const pageSlice = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return rankedEntries.slice(startIndex, startIndex + pageSize);
  }, [currentPage, rankedEntries]);

  const showPodium = !search && currentPage === 1 && pageSlice.length >= 3;
  const podiumEntries = showPodium ? pageSlice.slice(0, 3) : [];
  const paginatedEntries = showPodium ? pageSlice.slice(3) : pageSlice;

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

  const timeframes = [
    { key: "last7days", label: "Last 7 Days" },
    { key: "lastMonth", label: "Last Month" },
    { key: "allTime", label: "All Time" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Motivational banner */}
      <div className="glass-card-light flex items-center gap-3 rounded-xl px-5 py-4 sm:px-8">
        <Flame className="h-5 w-5 shrink-0 text-amber-400 animate-pulse-glow" />
        <p className="text-sm font-medium text-slate-300 sm:text-base">
          Keep learning daily to climb the classroom leaderboard.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />
        <input
          id="search-players"
          className="search-input h-12 w-full rounded-xl px-12 text-sm text-slate-200 outline-none placeholder:text-slate-500"
          placeholder="Search players..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {/* Main content card */}
      <div className="glass-card overflow-hidden rounded-2xl">
        {/* Controls bar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-white/5 px-5 py-4 sm:px-6">
          {/* Timeframe tabs */}
          <div className="flex items-center gap-1 rounded-full bg-white/[0.03] p-1">
            {timeframes.map((tf) => (
              <button
                key={tf.key}
                type="button"
                onClick={() => setTimeframe(tf.key)}
                className={cn("tab-pill", timeframe === tf.key && "active")}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Game selector */}
          <div className="ml-auto w-full sm:w-56">
            <Select
              value={selectedGame?.id ?? ""}
              onValueChange={(value) => setSelectedGameId(String(value))}
            >
              <SelectTrigger className="w-full rounded-xl border-white/8 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]">
                <SelectValue placeholder="Select game" />
              </SelectTrigger>
              <SelectContent align="end" className="border-white/8 bg-[#111827]">
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

        <div className="px-5 pb-5 pt-2 sm:px-6 sm:pb-6">
          {/* Top 3 podium */}
          {showPodium && podiumEntries.length >= 3 && !isLoading && (
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
              <PodiumCard
                entry={podiumEntries[1]}
                position={2}
                metricLabel={selectedGame?.metricLabel ?? "Points"}
                selectedGameId={selectedGame?.id}
              />
              <PodiumCard
                entry={podiumEntries[0]}
                position={1}
                metricLabel={selectedGame?.metricLabel ?? "Points"}
                selectedGameId={selectedGame?.id}
              />
              <PodiumCard
                entry={podiumEntries[2]}
                position={3}
                metricLabel={selectedGame?.metricLabel ?? "Points"}
                selectedGameId={selectedGame?.id}
              />
            </div>
          )}

          {/* Leaderboard table */}
          <Leaderboard
            metricLabel={selectedGame?.metricLabel ?? "Points"}
            entries={paginatedEntries}
            selectedGameId={selectedGame?.id}
            isLoading={isLoading}
            startRank={showPodium ? 4 : undefined}
          />

          {/* Pagination */}
          <div className="mt-5 flex items-center justify-between gap-4 text-sm text-slate-500">
            <span>
              {displayStart}–{displayEnd} of {totalItems} players
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}