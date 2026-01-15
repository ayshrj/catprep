import { type NextRequest, NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";

import { getAuthenticatedUserId } from "../../auth/utils";

export const runtime = "nodejs";

type GameStats = {
  attempts: number;
  solves: number;
  streakDays: number;
  bestTimeSeconds: number | null;
  lastPlayedAt: string | null;
  lastSolvedDate: string | null;
};

type GameSession = {
  puzzle: any;
  state: any;
};

function sanitizeStats(raw: any): GameStats | null {
  if (!raw || typeof raw !== "object") return null;
  return {
    attempts: Number.isFinite(raw.attempts) ? Number(raw.attempts) : 0,
    solves: Number.isFinite(raw.solves) ? Number(raw.solves) : 0,
    streakDays: Number.isFinite(raw.streakDays) ? Number(raw.streakDays) : 0,
    bestTimeSeconds:
      raw.bestTimeSeconds === null || Number.isFinite(raw.bestTimeSeconds) ? (raw.bestTimeSeconds ?? null) : null,
    lastPlayedAt: typeof raw.lastPlayedAt === "string" ? raw.lastPlayedAt : null,
    lastSolvedDate: typeof raw.lastSolvedDate === "string" ? raw.lastSolvedDate : null,
  };
}

function sanitizeSession(raw: any): GameSession | null {
  if (!raw || typeof raw !== "object") return null;
  if (!("puzzle" in raw) || !("state" in raw)) return null;
  return { puzzle: raw.puzzle, state: raw.state };
}

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("gameId")?.trim();
  if (!gameId) {
    return NextResponse.json({ error: "gameId is required." }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Storage is not configured." }, { status: 503 });
  }

  const doc = await db.collection("users").doc(userId).collection("games").doc(gameId).get();
  if (!doc.exists) {
    return NextResponse.json({ stats: null, session: null });
  }

  const data = doc.data() ?? {};
  const stats = sanitizeStats((data as any).stats);
  const session = sanitizeSession((data as any).session);

  return NextResponse.json({ stats, session });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Storage is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const gameId = typeof body.gameId === "string" ? body.gameId.trim() : "";

  if (!gameId) {
    return NextResponse.json({ error: "gameId is required." }, { status: 400 });
  }

  const stats = sanitizeStats(body.stats);
  const session = sanitizeSession(body.session);
  const clearSession = body.clearSession === true;

  if (!stats && !session && !clearSession) {
    return NextResponse.json({ error: "Provide stats or session payload to persist." }, { status: 400 });
  }

  const payload: Record<string, any> = {
    updatedAt: new Date().toISOString(),
  };

  if (stats) payload.stats = stats;
  if (clearSession) payload.session = null;
  else if (session) payload.session = { puzzle: session.puzzle, state: session.state };

  await db.collection("users").doc(userId).collection("games").doc(gameId).set(payload, { merge: true });

  return NextResponse.json({ ok: true });
}
