import { GameLeaderboard } from "@/components/game-leaderboard";
import { Trophy, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="bg-mesh min-h-screen px-4 pb-12 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        {/* Hero header */}
        <header className="glass-card glow-purple relative overflow-hidden rounded-2xl px-6 py-10 text-center sm:py-14">
          {/* Decorative orbs */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl animate-pulse-glow" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-52 w-52 rounded-full bg-indigo-500/10 blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />

          <div className="relative z-10">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300">
              <Sparkles className="h-3.5 w-3.5" />
              Season 4 — Live Rankings
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-1 ring-white/10">
                <Trophy className="h-7 w-7 text-violet-400" />
              </div>
              <h1 className="text-gradient text-4xl font-bold tracking-tight sm:text-5xl">
                LEADERBOARD
              </h1>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Compete, climb, and conquer. Your ranking updates in real-time.
            </p>
          </div>
        </header>

        <GameLeaderboard />
      </div>
    </main>
  );
}
