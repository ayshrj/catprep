import type {
  CatPaperFilters,
  CatPaperListResponse,
  CatPaperMetaDoc,
  CatPaperQuestionSummary,
  CatPaperSectionSummary,
  CatPaperSolutionDoc,
  CatPaperSummary,
} from "@/types/cat-paper-firestore";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data as T;
}

function toQueryString(params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    search.set(key, String(value));
  });
  return search.toString();
}

export async function fetchPaperFilters() {
  return requestJson<CatPaperMetaDoc>("/api/cat/papers/filters");
}

export async function fetchPapers(filters: CatPaperFilters): Promise<CatPaperListResponse> {
  const query = toQueryString({
    exam: filters.exam,
    year: filters.year,
    slot: filters.slot,
    section: filters.section,
    search: filters.search,
    limit: filters.limit,
    cursor: filters.cursor,
  });

  return requestJson<CatPaperListResponse>(`/api/cat/papers${query ? `?${query}` : ""}`);
}

export async function fetchPaper(
  paperId: string
): Promise<{ paper: CatPaperSummary; sections: CatPaperSectionSummary[] }> {
  return requestJson(`/api/cat/papers/${paperId}`);
}

export async function fetchSection(paperId: string, sectionId: string): Promise<{ section: CatPaperSectionSummary }> {
  return requestJson(`/api/cat/papers/${paperId}/sections/${sectionId}`);
}

export async function fetchQuestions(
  paperId: string,
  sectionId: string,
  options?: { limit?: number; cursor?: number | null }
): Promise<{ questions: CatPaperQuestionSummary[]; nextCursor: number | null }> {
  const query = toQueryString({ limit: options?.limit, cursor: options?.cursor ?? undefined });
  return requestJson(`/api/cat/papers/${paperId}/sections/${sectionId}/questions${query ? `?${query}` : ""}`);
}

export async function fetchQuestion(
  paperId: string,
  sectionId: string,
  questionId: string,
  includeSolution?: boolean
): Promise<{ question: CatPaperQuestionSummary; solution: CatPaperSolutionDoc | null }> {
  const query = includeSolution ? "?includeSolution=1" : "";
  return requestJson(`/api/cat/papers/${paperId}/sections/${sectionId}/questions/${questionId}${query}`);
}

export async function fetchFavorites(): Promise<string[]> {
  const data = await requestJson<{ favorites: string[] }>("/api/cat/papers/favorites", {
    credentials: "include",
  });
  return data.favorites;
}

export async function setFavorite(paperId: string, favorite?: boolean): Promise<boolean> {
  const data = await requestJson<{ favorite: boolean }>("/api/cat/papers/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ paperId, favorite }),
  });
  return data.favorite;
}
