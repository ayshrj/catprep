type LlmPuzzleResponse = {
  puzzle: unknown;
  recordId?: string;
  createdAt?: string;
};

function normalizeErrorMessage(value: unknown) {
  if (typeof value === "string" && value.trim()) return value;
  return "Failed to generate puzzle.";
}

export async function fetchLlmPuzzle(gameId: string, difficulty: number, signal?: AbortSignal) {
  const response = await fetch("/api/games/puzzles", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId, difficulty }),
    signal,
  });

  const data = (await response.json().catch(() => ({}))) as LlmPuzzleResponse & { error?: unknown };
  if (!response.ok) {
    const message = normalizeErrorMessage(data?.error);
    const error = new Error(message);
    (error as any).status = response.status;
    (error as any).details = data;
    throw error;
  }

  return data as LlmPuzzleResponse;
}
