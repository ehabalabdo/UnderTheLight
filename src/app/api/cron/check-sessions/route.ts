import { NextRequest, NextResponse } from "next/server";
import { createSessionsIfNeeded } from "@/lib/session-engine";

// POST: Cron job to check and create sessions
// Protected with CRON_SECRET
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await createSessionsIfNeeded();

    return NextResponse.json({
      message: `Created ${sessions.length} new sessions`,
      sessions: sessions.map((s) => ({
        id: s.session.id,
        participantId: s.session.participantId,
      })),
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 }
    );
  }
}

// GET: Also support GET for Vercel Cron
export async function GET(req: NextRequest) {
  return POST(req);
}
