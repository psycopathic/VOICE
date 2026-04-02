import Link from "next/link";
import { notFound } from "next/navigation";
import { Bird, ChevronLeft } from "lucide-react";

import { GameLeaderboard } from "@/components/game-leaderboard";
import { Card, CardContent } from "@/components/ui/card";
import { getGamesData } from "@/lib/games-data";

type GamePageProps = {
  params: Promise<{ gameId: string }>;
};

export default async function GamePage({ params }: GamePageProps) {
  const { gameId } = await params;
  const { games } = await getGamesData();
  const selectedGame = games.find((game) => game.id === gameId);

  if (!selectedGame) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#b9eaff_0%,#a8e2ff_45%,#95d8ff_100%)] px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-xl border border-[#7fd6d8] bg-[#74c8ea]/90 py-8 text-center text-[#f1f37a]">
          <div className="inline-flex items-center gap-3">
            <Bird className="h-10 w-10 text-[#95e4e6]" />
            <h1 className="text-3xl font-bold tracking-wide sm:text-4xl">{selectedGame.name}</h1>
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
          <CardContent className="px-4 py-4 sm:px-6">
            <p className="text-sm text-slate-600 sm:text-base">
              {selectedGame.description ?? "Choose a game and explore its ranking board."}
            </p>
          </CardContent>
        </Card>

        <GameLeaderboard initialGameId={selectedGame.id} />
      </div>
    </main>
  );
}