type GameStats = {
  attempts: number;
  solves: number;
  streakDays: number;
  bestTimeSeconds: number | null;
  lastPlayedAt: string | null;
  lastSolvedDate: string | null;
};

export function getGameStats(gameId: string): GameStats {
  if (typeof window === "undefined") {
    // On server or if localStorage not available
    return {
      attempts: 0,
      solves: 0,
      streakDays: 0,
      bestTimeSeconds: null,
      lastPlayedAt: null,
      lastSolvedDate: null,
    };
  }
  try {
    const key = `catGames.stats.${gameId}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return {
        attempts: 0,
        solves: 0,
        streakDays: 0,
        bestTimeSeconds: null,
        lastPlayedAt: null,
        lastSolvedDate: null,
      };
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
    return {
      attempts: 0,
      solves: 0,
      streakDays: 0,
      bestTimeSeconds: null,
      lastPlayedAt: null,
      lastSolvedDate: null,
    };
  }
}

export function setGameStats(gameId: string, stats: GameStats) {
  if (typeof window === "undefined") return;
  try {
    const key = `catGames.stats.${gameId}`;
    window.localStorage.setItem(key, JSON.stringify(stats));
  } catch {
    // ignore write errors (e.g., storage full)
  }
}

export function getGameSession(gameId: string): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`catGames.session.${gameId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setGameSession(gameId: string, session: any) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`catGames.session.${gameId}`, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function clearGameSession(gameId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`catGames.session.${gameId}`);
  } catch {
    // ignore
  }
}
