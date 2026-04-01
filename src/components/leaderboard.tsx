"use client";

import Link from "next/link";
import { Trophy, TrendingUp } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export type LeaderboardEntry = {
  id: string;
  rank: number;
  player: string;
  avatarUrl?: string;
  score: number;
  puzzlesPlayed?: number;
  levelLabel?: string;
  linked?: boolean;
};

type LeaderboardProps = {
  metricLabel?: string;
  entries?: LeaderboardEntry[];
  selectedGameId?: string;
  isLoading?: boolean;
  startRank?: number;
};

function formatScore(score: number) {
  if (score % 1 !== 0) return score.toFixed(2);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(score);
}

function LeaderboardSkeleton() {
  return Array.from({ length: 10 }).map((_, index) => (
    <TableRow key={index} className="border-b border-white/5">
      <TableCell className="w-20">
        <Skeleton className="h-5 w-10 bg-white/5" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full bg-white/5" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 bg-white/5" />
            <Skeleton className="h-3 w-40 bg-white/5" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16 ml-auto bg-white/5" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="ml-auto h-5 w-12 bg-white/5" />
      </TableCell>
    </TableRow>
  ));
}

export function Leaderboard({
  metricLabel = "Score",
  entries = [],
  selectedGameId,
  isLoading = false,
  startRank,
}: LeaderboardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-white/2">
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-white/5 bg-white/2 text-xs uppercase tracking-wider">
              <TableHead className="w-20 text-slate-500">Rank</TableHead>
              <TableHead className="text-slate-500">Player</TableHead>
              <TableHead className="text-right text-slate-500">{metricLabel}</TableHead>
              <TableHead className="text-right text-slate-500">Games</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LeaderboardSkeleton />
            ) : (
              entries.map((entry, index) => {
                const displayRank = startRank ? startRank + index : entry.rank;

                const avatarPalette = [
                  "bg-violet-500/20 text-violet-400",
                  "bg-sky-500/20 text-sky-400",
                  "bg-emerald-500/20 text-emerald-400",
                  "bg-amber-500/20 text-amber-400",
                  "bg-pink-500/20 text-pink-400",
                  "bg-cyan-500/20 text-cyan-400",
                ];
                const avatarColor = avatarPalette[(displayRank - 1) % avatarPalette.length];

                return (
                  <TableRow
                    key={entry.id}
                    className="lb-row border-b border-white/4 hover:bg-transparent"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <TableCell className="py-3.5">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/4 text-sm font-semibold text-slate-400">
                        {displayRank}
                      </span>
                    </TableCell>

                    <TableCell className="py-3.5">
                      <Link
                        href={`/profile/${entry.id}${selectedGameId ? `?game=${selectedGameId}` : ""}`}
                        className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
                      >
                        <Avatar className="h-9 w-9 ring-1 ring-white/10">
                          <AvatarFallback className={avatarColor}>
                            <Trophy className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-200 transition-colors group-hover:text-violet-300">
                            {entry.player}
                          </div>
                          <div className="truncate text-xs text-slate-500">
                            {entry.levelLabel ?? "Level 11: Puzzle Grand Master"}
                          </div>
                        </div>
                      </Link>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums text-slate-300">
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                        {formatScore(entry.score)}
                      </div>
                    </TableCell>

                    <TableCell className="text-right text-sm font-medium text-slate-400">
                      {entry.puzzlesPlayed ?? 30}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}