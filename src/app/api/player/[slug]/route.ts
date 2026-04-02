import { NextRequest, NextResponse } from "next/server";
import { getUserNameFromSlug, ensureSlug } from "@/lib/slug";
import { getPlayerProfile } from "@/lib/leaderboard-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug parameter is required" },
        { status: 400 }
      );
    }

    // Get userName from slug
    const userName = getUserNameFromSlug(slug);

    if (!userName) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    // Get player profile
    const profile = await getPlayerProfile(userName);

    if (!profile) {
      return NextResponse.json(
        { error: "Player profile not found" },
        { status: 404 }
      );
    }

    // Ensure slug is included
    const profileWithSlug = {
      ...profile,
      slug: ensureSlug(profile.name, profile.state, profile.userName),
    };

    return NextResponse.json({
      success: true,
      data: profileWithSlug,
    });
  } catch (error) {
    console.error("Error fetching player profile:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch player profile",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
