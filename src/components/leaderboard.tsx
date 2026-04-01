"use client";

import Link from "next/link";
import { Bird } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
};

function formatScore(score: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(score);
}

function LeaderboardSkeleton() {
  return Array.from({ length: 10 }).map((_, index) => (
    <TableRow key={index}>
      <TableCell className="w-20">
        <Skeleton className="h-5 w-10" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16 ml-auto" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="ml-auto h-5 w-12" />
      </TableCell>
    </TableRow>
  ));
}

export function Leaderboard({
  metricLabel = "Score",
  entries = [],
  selectedGameId,
  isLoading = false,
}: LeaderboardProps) {
  return (
    <Card className="overflow-hidden rounded-xl border border-[#7fd6d8] bg-white/86 backdrop-blur-sm">
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 bg-white text-xs uppercase tracking-wide">
                <TableHead className="w-20 text-[#6b6b6b]">Rank</TableHead>
                <TableHead className="text-[#6b6b6b]">Name</TableHead>
                <TableHead className="text-right text-[#6b6b6b]">{metricLabel}</TableHead>
                <TableHead className="text-right text-[#6b6b6b]">Puzzles Played</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <LeaderboardSkeleton />
              ) : (
                entries.map((entry) => {
                  const iconPalette = [
                    "bg-[#f7f36a] text-[#7a6d00]",
                    "bg-[#d58cff] text-[#6f2a91]",
                    "bg-[#6dc5ff] text-[#1f5f8a]",
                    "bg-[#ffb374] text-[#8a4a1a]",
                  ];
                  const iconColor = iconPalette[(entry.rank - 1) % iconPalette.length];

                  return (
                    <TableRow key={entry.id} className="border-b border-slate-200/80">
                      <TableCell className="py-3 text-base font-medium text-[#3f3f3f]">
                        {entry.rank}
                      </TableCell>

                      <TableCell className="py-3">
                        <Link
                          href={`/profile/${entry.id}${selectedGameId ? `?game=${selectedGameId}` : ""}`}
                          className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#72d6d8]"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className={iconColor}>
                              <Bird className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <div className="text-lg font-semibold text-[#2f2f2f] hover:text-[#2a8e90]">{entry.player}</div>
                            <div className="text-sm italic text-[#5f5f5f]">
                              {entry.levelLabel ?? "Level 11: Puzzle Grand Master"}
                            </div>
                          </div>
                        </Link>
                      </TableCell>

                      <TableCell className="text-right text-base font-medium tabular-nums text-[#474747]">
                        {formatScore(entry.score)}
                      </TableCell>

                      <TableCell className="text-right text-base font-medium text-[#474747]">
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
      </CardContent>
    </Card>
  );
}