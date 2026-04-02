import { NextRequest, NextResponse } from "next/server";
import { findPlayerByEmail } from "@/lib/leaderboard-service";
import { getPlayerProfile } from "@/lib/leaderboard-service";
import { ensureSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find player by email
    const userName = await findPlayerByEmail(email);

    if (!userName) {
      return NextResponse.json(
        { error: "Player not found with this email" },
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

    // Generate slug
    const slug = ensureSlug(profile.name, profile.state, profile.userName);

    return NextResponse.json({
      success: true,
      slug,
      redirectUrl: `/profile/${slug}`,
    });
  } catch (error) {
    console.error("Error finding player:", error);
    return NextResponse.json(
      {
        error: "Failed to find player",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
