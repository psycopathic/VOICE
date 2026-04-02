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
  MapPin,
} from "lucide-react";

type ProfilePageProps = {
  params: Promise<{ playerId: string }>;
};

type PlayerProfile = {
  rank: number;
  userName: string;
  points: number;
  state: string;
  name: string;
  userId?: string;
  streak?: number;
  gamesPlayed?: number;
  slug: string;
};

async function fetchPlayerProfile(slug: string): Promise<PlayerProfile | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/player/${slug}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.success && data.data) {
      return data.data;
    }

    return null;
  } catch (error) {
    console.error("Error fetching player profile:", error);
    return null;
  }
}

function formatScore(value: number) {
  if (value % 1 !== 0) {
    return value.toFixed(2);
  }

  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
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

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { playerId } = await params;

  const profile = await fetchPlayerProfile(playerId);

  if (!profile) {
    notFound();
  }

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
                  #{profile.rank}
                </div>
              </div>

              {/* Player info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-gradient text-3xl font-bold tracking-tight sm:text-4xl">
                  {profile.name}
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  {profile.state} • Trivia Battle Player
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 ring-1 ring-violet-500/20">
                    <MapPin className="h-3 w-3" />
                    {profile.state}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/20">
                    <TrendingUp className="h-3 w-3" />
                    {formatScore(profile.points)} points
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-500/20">
                    <Star className="h-3 w-3" />
                    Rank #{profile.rank}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={<Target className="h-5 w-5 text-violet-400" />}
            label="Total Points"
            value={`${formatScore(profile.points)}`}
            color="bg-violet-500/10"
            delay={0}
          />
          <StatCard
            icon={<Award className="h-5 w-5 text-emerald-400" />}
            label="Rank"
            value={`#${profile.rank}`}
            color="bg-emerald-500/10"
            delay={50}
          />
          {profile.streak !== undefined && (
            <StatCard
              icon={<Zap className="h-5 w-5 text-amber-400" />}
              label="Streak"
              value={`${profile.streak} days`}
              color="bg-amber-500/10"
              delay={100}
            />
          )}
          {profile.gamesPlayed !== undefined && (
            <StatCard
              icon={<Gamepad2 className="h-5 w-5 text-sky-400" />}
              label="Games Played"
              value={`${formatScore(profile.gamesPlayed)}`}
              color="bg-sky-500/10"
              delay={150}
            />
          )}
          <StatCard
            icon={<MapPin className="h-5 w-5 text-pink-400" />}
            label="State"
            value={profile.state}
            color="bg-pink-500/10"
            delay={200}
          />
          <StatCard
            icon={<Trophy className="h-5 w-5 text-cyan-400" />}
            label="Username"
            value={profile.userName.split("::")[0] || "Player"}
            color="bg-cyan-500/10"
            delay={250}
          />
        </div>

        {/* Info card */}
        <div className="glass-card overflow-hidden rounded-2xl">
          <div className="px-6 py-5">
            <h2 className="text-xl font-bold text-slate-200">Player Statistics</h2>
            <p className="mt-2 text-sm text-slate-400">
              This player has earned {formatScore(profile.points)} points and is currently ranked #{profile.rank} on the leaderboard.
            </p>
            {profile.streak !== undefined && profile.streak > 0 && (
              <p className="mt-2 text-sm text-slate-400">
                They are on a {profile.streak}-day streak!
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
