import { GameLeaderboard } from "@/components/game-leaderboard";
import { Bird } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#b9eaff_0%,#a8e2ff_45%,#95d8ff_100%)] px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-xl border border-[#7fd6d8] bg-[#74c8ea]/90 py-8 text-center text-[#f1f37a]">
          <div className="inline-flex items-center gap-3">
            <Bird className="h-10 w-10 text-[#95e4e6]" />
            <h1 className="text-3xl font-bold tracking-wide sm:text-4xl">LEADERBOARD</h1>
          </div>
        </header>

        <GameLeaderboard />
      </div>
    </main>
  );
}
