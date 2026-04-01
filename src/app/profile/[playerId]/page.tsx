import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Trophy,
  ChevronLeft,
  Target,
  Zap,
  Calendar,
  Award,
  TrendingUp,
  Gamepad2,
  Star,
  Clock,
} from "lucide-react";

import { getGamesData, getRankedPlayers, type GameData } from "@/lib/games-data";

type ProfilePageProps = {
  params: Promise<{ playerId: string }>;
  searchParams: Promise<{ game?: string }>;
};

function formatScore(value: number) {
  if (value % 1 !== 0) {
    return value.toFixed(2);
  }

  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function getMemberSince(playerId: string) {
  const year = 2021 + (playerId.charCodeAt(0) % 4);
  const month = ((playerId.charCodeAt(1) % 12) + 1).toString().padStart(2, "0");
  const day = ((playerId.charCodeAt(2) % 27) + 1).toString().padStart(2, "0");
  return `${month}/${day}/${year}`;
}

function buildRecentPuzzles(baseScore: number) {
  const rows = [] as Array<{
    date: string;
    wordPoints: number;
    reveals: number;
    wager: number;
    total: number;
  }>;

  for (let i = 0; i < 10; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);

    const wordPoints = Math.max(150, Math.round(baseScore / 160) + (i % 3) * 25);
    const reveals = 5;
    const wager = Math.round(wordPoints * 1.8);
    const total = wordPoints + wager + reveals * 100;

    rows.push({
      date: d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      wordPoints,
      reveals,
      wager,
      total,
    });
  }

  return rows;
}

function findPlayerGame(games: GameData[], playerId: string, preferredGameId?: string) {
  if (preferredGameId) {
    const game = games.find((item) => item.id === preferredGameId);
    if (game) {
      const ranked = getRankedPlayers(game);
      const entry = ranked.find((player) => player.id === playerId);
      if (entry) {
        return { game, entry };
      }
    }
  }

  for (const game of games) {
    const ranked = getRankedPlayers(game);
    const entry = ranked.find((player) => player.id === playerId);
    if (entry) {
      return { game, entry };
    }
  }

  return null;
}

function StatCard({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  delay: number;
}) {
  return (
    <div
      className="stat-card animate-slide-up flex items-center gap-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </div>
        <div className="mt-0.5 truncate text-lg font-bold text-slate-200">{value}</div>
      </div>
    </div>
  );
}

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const { playerId } = await params;
  const { game: gameId } = await searchParams;

  const { games } = await getGamesData();
  const matched = findPlayerGame(games, playerId, gameId);

  if (!matched) {
    notFound();
  }

  const { game, entry } = matched;
  const recentRows = buildRecentPuzzles(entry.score);

  const totalPoints = Math.round(entry.score * 6);
  const last7DaysPoints = recentRows.slice(0, 7).reduce((sum, row) => sum + row.total, 0);
  const puzzlesCompleted = (entry.puzzlesPlayed ?? 30) * 102;
  const totalPlayers = getRankedPlayers(game).length;

  return (
    <main className="bg-mesh min-h-screen px-4 pb-12 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-white/4 px-4 py-2.5 text-sm font-medium text-slate-400 ring-1 ring-white/8 transition-all hover:bg-white/8 hover:text-slate-200"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to leaderboard
        </Link>

        {/* Profile hero card */}
        <div className="glass-card glow-purple relative overflow-hidden rounded-2xl">
          {/* Background orbs */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-violet-500/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-indigo-500/8 blur-3xl" />

          <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
              {/* Avatar */}
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500/20 to-indigo-600/15 ring-2 ring-violet-500/20 sm:h-28 sm:w-28">
                  <Trophy className="h-10 w-10 text-violet-400 sm:h-12 sm:w-12" />
                </div>
                {/* Rank badge */}
                <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-violet-500/20">
                  #{entry.rank}
                </div>
              </div>

              {/* Player info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-gradient text-3xl font-bold tracking-tight sm:text-4xl">
                  {entry.player}
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  {entry.levelLabel ?? "Level 11: Grand Master"}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 ring-1 ring-violet-500/20">
                    <Gamepad2 className="h-3 w-3" />
                    {game.name}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/20">
                    <TrendingUp className="h-3 w-3" />
                    {formatScore(entry.score)} {game.metricLabel ?? "points"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-500/20">
                    <Star className="h-3 w-3" />
                    Top {Math.round((entry.rank / totalPlayers) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard
            icon={<Target className="h-5 w-5 text-violet-400" />}
            label="Total Points"
            value={`${formatScore(totalPoints)}`}
            color="bg-violet-500/10"
            delay={0}
          />
          <StatCard
            icon={<Zap className="h-5 w-5 text-amber-400" />}
            label="7-Day Points"
            value={`${formatScore(last7DaysPoints)}`}
            color="bg-amber-500/10"
            delay={50}
          />
          <StatCard
            icon={<Award className="h-5 w-5 text-emerald-400" />}
            label="7-Day Rank"
            value={`${entry.rank} / ${totalPlayers}`}
            color="bg-emerald-500/10"
            delay={100}
          />
          <StatCard
            icon={<Gamepad2 className="h-5 w-5 text-sky-400" />}
            label="Puzzles Done"
            value={`${formatScore(puzzlesCompleted)}`}
            color="bg-sky-500/10"
            delay={150}
          />
          <StatCard
            icon={<Calendar className="h-5 w-5 text-pink-400" />}
            label="Member Since"
            value={getMemberSince(entry.id)}
            color="bg-pink-500/10"
            delay={200}
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-cyan-400" />}
            label="Current Game"
            value={game.name}
            color="bg-cyan-500/10"
            delay={250}
          />
        </div>

        {/* Recent puzzles table */}
        <div className="glass-card overflow-hidden rounded-2xl">
          <div className="border-b border-white/5 px-6 py-5">
            <h2 className="text-xl font-bold text-slate-200">Recent Puzzles</h2>
            <p className="mt-1 text-sm text-slate-500">Your last 10 puzzle results</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3.5 text-left font-medium">Date</th>
                  <th className="px-6 py-3.5 text-right font-medium">Word Points</th>
                  <th className="px-6 py-3.5 text-right font-medium">Reveals Left</th>
                  <th className="px-6 py-3.5 text-right font-medium">Wager</th>
                  <th className="px-6 py-3.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentRows.map((row, index) => (
                  <tr
                    key={row.date}
                    className="lb-row border-b border-white/4 hover:bg-transparent"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-6 py-3.5 text-sm text-slate-300">{row.date}</td>
                    <td className="px-6 py-3.5 text-right text-sm font-medium tabular-nums text-slate-300">
                      {formatScore(row.wordPoints)}
                    </td>
                    <td className="px-6 py-3.5 text-right text-sm tabular-nums text-slate-400">
                      {row.reveals}
                    </td>
                    <td className="px-6 py-3.5 text-right text-sm font-medium tabular-nums text-emerald-400">
                      +{formatScore(row.wager)}
                    </td>
                    <td className="px-6 py-3.5 text-right text-sm font-bold tabular-nums text-slate-200">
                      {formatScore(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}