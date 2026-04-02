import { NextRequest, NextResponse } from "next/server";
import { refreshLeaderboard, getCacheMetadata } from "@/lib/cache";
import type { TimeFrame } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const timeframe = (body.timeframe || "allTime") as TimeFrame;
    const state = body.state || undefined;

    // Validate timeframe
    const validTimeframes: TimeFrame[] = ["allTime", "lastMonth", "last7Days"];
    if (!validTimeframes.includes(timeframe)) {
      return NextResponse.json(
        { error: "Invalid timeframe. Must be one of: allTime, lastMonth, last7Days" },
        { status: 400 }
      );
    }

    // Attempt to refresh
    const result = await refreshLeaderboard(timeframe, state);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          lastRefreshed: result.lastRefreshed,
        },
        { status: 429 } // Too Many Requests
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      lastRefreshed: result.lastRefreshed,
    });
  } catch (error) {
    console.error("Error refreshing leaderboard:", error);
    return NextResponse.json(
      {
        error: "Failed to refresh leaderboard",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeframe = (searchParams.get("timeframe") || "allTime") as TimeFrame;
    const state = searchParams.get("state") || undefined;

    const metadata = getCacheMetadata(timeframe, state);

    return NextResponse.json({
      lastRefreshed: metadata.lastRefreshed,
      canRefresh: metadata.canRefresh,
    });
  } catch (error) {
    console.error("Error getting cache metadata:", error);
    return NextResponse.json(
      {
        error: "Failed to get cache metadata",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
