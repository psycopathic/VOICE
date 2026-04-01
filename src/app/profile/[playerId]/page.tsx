import Link from "next/link";
import { notFound } from "next/navigation";
import { Bird, ChevronLeft } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#b9eaff_0%,#a8e2ff_45%,#95d8ff_100%)] px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-xl border border-[#7fd6d8] bg-[#74c8ea]/90 py-8 text-center text-[#f1f37a]">
          <div className="inline-flex items-center gap-3">
            <Bird className="h-10 w-10 text-[#95e4e6]" />
            <h1 className="text-3xl font-bold tracking-wide sm:text-4xl">PROFILE</h1>
          </div>
        </header>

        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-md bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-[#7fd6d8] transition-colors hover:bg-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to leaderboard
        </Link>

        <Card className="rounded-xl border border-[#7fd6d8] bg-white/86 py-0">
          <CardContent className="space-y-6 px-6 py-6 sm:px-8">
            <div className="flex items-center justify-center gap-3 text-[#2d4058]">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f7f36a] text-[#6a5f00] ring-1 ring-[#d8cf58]">
                <Bird className="h-5 w-5" />
              </span>
              <h2 className="text-2xl font-semibold">{entry.player}</h2>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              <dl className="space-y-2 text-base font-semibold text-[#33495f]">
                <div className="flex gap-3">
                  <dt className="min-w-[10rem]">Level:</dt>
                  <dd>{entry.levelLabel ?? "Level 11"}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="min-w-[10rem]">Total Points:</dt>
                  <dd>{formatScore(totalPoints)} points</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="min-w-[10rem]">Last 7 Days Points:</dt>
                  <dd>{formatScore(last7DaysPoints)} points</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="min-w-[10rem]">Last 7 Days Place:</dt>
                  <dd>
                    {entry.rank} / {getRankedPlayers(game).length}
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="min-w-[10rem]">Puzzles Completed:</dt>
                  <dd>{formatScore(puzzlesCompleted)} puzzles</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="min-w-[10rem]">Member Since:</dt>
                  <dd>{getMemberSince(entry.id)}</dd>
                </div>
              </dl>

              <div className="self-center text-right text-[#415a72]">
                <div className="text-2xl font-semibold">{game.name}</div>
                <div className="text-lg">Rank #{entry.rank}</div>
                <div className="text-lg">
                  {formatScore(entry.score)} {game.metricLabel ?? "points"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-[#7fd6d8] bg-white/86 py-0">
          <CardContent className="px-4 py-5 sm:px-6">
            <h3 className="pb-4 text-center text-3xl font-semibold text-[#2d4058]">Recent Puzzles</h3>

            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 bg-transparent text-xs uppercase tracking-wide">
                  <TableHead className="text-[#5c5c5c]">Date</TableHead>
                  <TableHead className="text-right text-[#5c5c5c]">Word Points</TableHead>
                  <TableHead className="text-right text-[#5c5c5c]">Letter Reveals Left</TableHead>
                  <TableHead className="text-right text-[#5c5c5c]">Wager</TableHead>
                  <TableHead className="text-right text-[#5c5c5c]">Total Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRows.map((row) => (
                  <TableRow key={row.date} className="border-b border-slate-200/80">
                    <TableCell className="text-sm text-[#4a4a4a]">{row.date}</TableCell>
                    <TableCell className="text-right text-sm text-[#4a4a4a]">{formatScore(row.wordPoints)}</TableCell>
                    <TableCell className="text-right text-sm text-[#4a4a4a]">{row.reveals}</TableCell>
                    <TableCell className="text-right text-sm text-[#1f8b35]">{formatScore(row.wager)}</TableCell>
                    <TableCell className="text-right text-sm text-[#4a4a4a]">{formatScore(row.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}