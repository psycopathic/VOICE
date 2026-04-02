import { NextRequest, NextResponse } from "next/server";
import { getCachedLeaderboard } from "@/lib/cache";
import { ensureSlug } from "@/lib/slug";
import type { TimeFrame } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeframe = (searchParams.get("timeframe") || "allTime") as TimeFrame;
    const state = searchParams.get("state") || undefined;

    // Validate timeframe
    const validTimeframes: TimeFrame[] = ["allTime", "lastMonth", "last7Days"];
    if (!validTimeframes.includes(timeframe)) {
      return NextResponse.json(
        { error: "Invalid timeframe. Must be one of: allTime, lastMonth, last7Days" },
        { status: 400 }
      );
    }

    // Get leaderboard data
    const leaderboard = await getCachedLeaderboard(timeframe, state);

    // Generate slugs for all entries
    const leaderboardWithSlugs = leaderboard.map((entry) => ({
      rank: entry.rank,
      userName: entry.userName,
      points: entry.points,
      state: entry.state,
      name: entry.name,
      userId: entry.userId,
      streak: entry.streak,
      gamesPlayed: entry.gamesPlayed,
      slug: ensureSlug(entry.name, entry.state, entry.userName),
    }));

    return NextResponse.json({
      success: true,
      timeframe,
      state: state || null,
      count: leaderboardWithSlugs.length,
      data: leaderboardWithSlugs,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch leaderboard",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
