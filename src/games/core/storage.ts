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

type CloudGameData = {
  stats: GameStats | null;
  session: GameSession | null;
};

const EMPTY_STATS: GameStats = {
  attempts: 0,
  solves: 0,
  streakDays: 0,
  bestTimeSeconds: null,
  lastPlayedAt: null,
  lastSolvedDate: null,
};

// Enable cloud sync by default; set NEXT_PUBLIC_ENABLE_GAME_CLOUD_SYNC=0 to force local-only.
const CLOUD_SYNC_ENABLED = process.env.NEXT_PUBLIC_ENABLE_GAME_CLOUD_SYNC !== "0";

const cloudQueue = new Map<string, { stats?: GameStats; session?: GameSession | null }>();
const cloudTimers = new Map<string, number>();

function normalizeStats(raw: any): GameStats | null {
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

function normalizeSession(raw: any): GameSession | null {
  if (!raw || typeof raw !== "object") return null;
  if (!("puzzle" in raw) || !("state" in raw)) return null;
  return {
    puzzle: raw.puzzle,
    state: raw.state,
  };
}

function queueCloudSync(gameId: string, update: { stats?: GameStats; session?: GameSession | null }) {
  if (!CLOUD_SYNC_ENABLED || typeof window === "undefined") return;
  const existing = cloudQueue.get(gameId) ?? {};
  cloudQueue.set(gameId, { ...existing, ...update });

  if (cloudTimers.has(gameId)) return;

  const timerId = window.setTimeout(() => {
    cloudTimers.delete(gameId);
    const payload = cloudQueue.get(gameId);
    cloudQueue.delete(gameId);
    if (!payload) return;

    const body: any = { gameId };
    if (payload.stats) body.stats = payload.stats;
    if (payload.session === null) body.clearSession = true;
    else if (payload.session) body.session = payload.session;

    if (!body.stats && !body.session && !body.clearSession) return;

    fetch("/api/games/storage", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {
      // Swallow errors; local storage remains the primary fallback.
    });
  }, 600);

  cloudTimers.set(gameId, timerId);
}

export function getGameStats(gameId: string): GameStats {
  if (typeof window === "undefined") {
    // On server or if localStorage not available
    return { ...EMPTY_STATS };
  }
  try {
    const key = `catGames.stats.${gameId}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return { ...EMPTY_STATS };
    }
    const stats = JSON.parse(raw);
    return {
      attempts: stats.attempts ?? 0,
      solves: stats.solves ?? 0,
      streakDays: stats.streakDays ?? 0,
      bestTimeSeconds: stats.bestTimeSeconds ?? null,
      lastPlayedAt: stats.lastPlayedAt ?? null,
      lastSolvedDate: stats.lastSolvedDate ?? null,
    };
  } catch {
    return { ...EMPTY_STATS };
  }
}

export function setGameStats(gameId: string, stats: GameStats, options?: { skipCloud?: boolean }) {
  if (typeof window === "undefined") return;
  try {
    const key = `catGames.stats.${gameId}`;
    window.localStorage.setItem(key, JSON.stringify(stats));
    if (!options?.skipCloud) {
      queueCloudSync(gameId, { stats });
    }
  } catch {
    // ignore write errors (e.g., storage full)
  }
}

export function getGameSession(gameId: string): GameSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`catGames.session.${gameId}`);
    return raw ? (JSON.parse(raw) as GameSession) : null;
  } catch {
    return null;
  }
}

export function setGameSession(gameId: string, session: GameSession, options?: { skipCloud?: boolean }) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`catGames.session.${gameId}`, JSON.stringify(session));
    if (!options?.skipCloud) {
      queueCloudSync(gameId, { session });
    }
  } catch {
    // ignore
  }
}

export function clearGameSession(gameId: string, options?: { skipCloud?: boolean }) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`catGames.session.${gameId}`);
    if (!options?.skipCloud) {
      queueCloudSync(gameId, { session: null });
    }
  } catch {
    // ignore
  }
}

export async function fetchCloudGameData(gameId: string): Promise<CloudGameData | null> {
  if (!CLOUD_SYNC_ENABLED || typeof window === "undefined") return null;
  try {
    const res = await fetch(`/api/games/storage?gameId=${encodeURIComponent(gameId)}`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => ({}));
    const stats = normalizeStats((data as any)?.stats) ?? null;
    const session = normalizeSession((data as any)?.session) ?? null;

    // Hydrate local cache without triggering another cloud write.
    if (stats) setGameStats(gameId, stats, { skipCloud: true });
    if (session) setGameSession(gameId, session, { skipCloud: true });

    return { stats, session };
  } catch {
    return null;
  }
}
