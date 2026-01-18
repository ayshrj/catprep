"use client";

import { Bookmark, Filter, Loader2, Play, RefreshCw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { APP_CONTENT_HEIGHT, AppContent } from "@/components/app-content";
import { AppNavbar } from "@/components/app-navbar";
import { AppNavbarActions } from "@/components/app-navbar-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { CAT_PAPER_SECTION_LABELS } from "@/constants/cat-paper-filters";
import { useAuthAndTheme } from "@/hooks/use-auth-and-theme";
import {
  fetchFavorites,
  fetchPaper,
  fetchPaperFilters,
  fetchPapers,
  fetchQuestions,
  setFavorite,
} from "@/lib/cat-papers-service";
import type { CatPaperFilters, CatPaperMetaDoc, CatPaperSummary } from "@/types/cat-paper-firestore";

const INITIAL_FILTERS: CatPaperFilters = {
  exam: undefined,
  year: undefined,
  slot: undefined,
  section: undefined,
  search: "",
};

function formatTitle(paper: CatPaperSummary) {
  const topic = paper.topic?.trim();
  if (topic) return topic;
  return paper.pageTitle?.split("|")[0]?.trim() || "CAT Paper";
}

export default function PapersPage() {
  const { handleLogout, handleThemeToggle } = useAuthAndTheme();
  const router = useRouter();
  const [filters, setFilters] = useState<CatPaperFilters>(INITIAL_FILTERS);
  const [draftFilters, setDraftFilters] = useState<CatPaperFilters>(INITIAL_FILTERS);
  const [meta, setMeta] = useState<CatPaperMetaDoc | null>(null);
  const [papers, setPapers] = useState<CatPaperSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [practiceLoadingPaperId, setPracticeLoadingPaperId] = useState<string | null>(null);

  const loadFilters = useCallback(async () => {
    try {
      const data = await fetchPaperFilters();
      setMeta(data);
    } catch (err) {
      console.error(err);
    }
  }, [fetchPaperFilters]);

  const loadFavorites = useCallback(async () => {
    try {
      const ids = await fetchFavorites();
      setFavorites(new Set(ids));
    } catch (err) {
      // Ignore unauthenticated users.
    }
  }, [fetchFavorites]);

  const loadPapers = useCallback(
    async ({ reset }: { reset: boolean }) => {
      try {
        setError(null);
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const data = await fetchPapers({
          ...filters,
          limit: favoritesOnly ? 200 : 20,
          cursor: reset ? undefined : (nextCursor ?? undefined),
        });

        const nextPapers = favoritesOnly ? data.papers.filter(paper => favorites.has(paper.id)) : data.papers;

        setPapers(prev => (reset ? nextPapers : [...prev, ...nextPapers]));
        setNextCursor(favoritesOnly ? null : data.nextCursor);
      } catch (err) {
        console.error(err);
        setError("Unable to load papers right now.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [favorites, favoritesOnly, filters, nextCursor, fetchPapers]
  );

  useEffect(() => {
    loadFilters();
    loadFavorites();
  }, [loadFilters, loadFavorites]);

  useEffect(() => {
    loadPapers({ reset: true });
  }, [filters, favoritesOnly, loadPapers]);

  const handleApply = useCallback(() => {
    setFilters(draftFilters);
  }, [draftFilters]);

  const handleReset = useCallback(() => {
    setDraftFilters(INITIAL_FILTERS);
    setFilters(INITIAL_FILTERS);
    setFavoritesOnly(false);
  }, []);

  const yearOptions = useMemo(() => meta?.years ?? [], [meta]);
  const slotOptions = useMemo(() => meta?.slots ?? [1, 2, 3], [meta]);
  const sectionOptions = useMemo(() => meta?.sections ?? [], [meta]);

  const toggleFavorite = useCallback(
    async (paperId: string) => {
      try {
        const next = await setFavorite(paperId);
        setFavorites(prev => {
          const copy = new Set(prev);
          if (next) {
            copy.add(paperId);
          } else {
            copy.delete(paperId);
          }
          return copy;
        });
      } catch (err) {
        toast.error("Sign in to bookmark papers.");
      }
    },
    [setFavorite]
  );

  const startPractice = useCallback(
    async (paperId: string, sectionId: string) => {
      try {
        const data = await fetchQuestions(paperId, sectionId, { limit: 1 });
        const firstQuestion = data.questions[0];
        if (!firstQuestion) {
          toast.error("No questions found in this section.");
          return;
        }
        router.push(`/papers/${paperId}/sections/${sectionId}/questions/${firstQuestion.id}?practice=1`);
      } catch (err) {
        console.error(err);
        toast.error("Unable to start practice right now.");
      }
    },
    [router, fetchQuestions]
  );

  const handlePractice = useCallback(
    async (paper: CatPaperSummary) => {
      if (practiceLoadingPaperId) return;
      setPracticeLoadingPaperId(paper.id);
      try {
        const data = await fetchPaper(paper.id);
        if (!data.sections.length) {
          toast.error("No sections found for this paper.");
          return;
        }
        const firstSection = data.sections[0];
        if (!firstSection?.id) {
          toast.error("No section found for this paper.");
          return;
        }
        await startPractice(paper.id, firstSection.id);
      } catch (err) {
        console.error(err);
        toast.error("Unable to load sections right now.");
      } finally {
        setPracticeLoadingPaperId(null);
      }
    },
    [practiceLoadingPaperId, startPractice, fetchPaper]
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      <AppNavbar
        title="Cat99"
        subtitle="Past Papers"
        trailing={
          <AppNavbarActions
            value="papers"
            onChange={next => {
              if (next === "chat") {
                window.location.href = "/chat";
              } else if (next === "notes") {
                window.location.href = "/notes";
              } else if (next === "saved") {
                window.location.href = "/rough-notes";
              } else if (next === "games") {
                window.location.href = "/games";
              } else if (next === "papers") {
                window.location.href = "/papers";
              }
            }}
            onLogout={handleLogout}
            onThemeToggle={handleThemeToggle}
          />
        }
      />

      <AppContent className={APP_CONTENT_HEIGHT}>
        <div className="h-full min-h-0 overflow-y-auto py-4 sm:py-6">
          <div className="space-y-6 pb-6">
            <Card className="game-panel">
              <CardHeader className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">Find the exact paper you need</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Filter by exam, year, slot, and section. Search stays optional.
                    </p>
                  </div>
                  <Toggle
                    pressed={favoritesOnly}
                    onPressedChange={setFavoritesOnly}
                    className="gap-2"
                    variant="outline"
                  >
                    <Bookmark className="h-4 w-4" />
                    Favorites
                  </Toggle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={draftFilters.search ?? ""}
                      onChange={event => setDraftFilters(prev => ({ ...prev, search: event.target.value }))}
                      placeholder="Search keywords (optional)"
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={draftFilters.exam ?? "all"}
                    onValueChange={value =>
                      setDraftFilters(prev => ({
                        ...prev,
                        exam: value === "all" ? undefined : (value as CatPaperFilters["exam"]),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Exam" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All exams</SelectItem>
                      {(meta?.exams ?? ["CAT", "XAT"]).map(exam => (
                        <SelectItem key={exam} value={exam}>
                          {exam}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={draftFilters.year ? String(draftFilters.year) : "all"}
                    onValueChange={value =>
                      setDraftFilters(prev => ({
                        ...prev,
                        year: value === "all" ? undefined : Number(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All years</SelectItem>
                      {yearOptions.map(year => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={draftFilters.slot ? String(draftFilters.slot) : "all"}
                    onValueChange={value =>
                      setDraftFilters(prev => ({
                        ...prev,
                        slot: value === "all" ? undefined : Number(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Slot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All slots</SelectItem>
                      {slotOptions.map(slot => (
                        <SelectItem key={slot} value={String(slot)}>
                          Slot {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <Select
                    value={draftFilters.section ?? "all"}
                    onValueChange={value =>
                      setDraftFilters(prev => ({
                        ...prev,
                        section: value === "all" ? undefined : (value as CatPaperFilters["section"]),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sections</SelectItem>
                      {sectionOptions.map(section => (
                        <SelectItem key={section} value={section}>
                          {CAT_PAPER_SECTION_LABELS[section]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={handleApply} className="gap-2">
                    <Filter className="h-4 w-4" />
                    Apply filters
                  </Button>
                  <Button type="button" variant="outline" onClick={handleReset} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Available papers</h2>
                  <p className="text-xs text-muted-foreground">{meta ? `${meta.paperCount} total papers` : ""}</p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading papers...
                </div>
              ) : error ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  {error}
                </div>
              ) : papers.length === 0 ? (
                <div className="rounded-xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
                  No papers match your filters. Try adjusting them.
                </div>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {papers.map(paper => (
                    <Card key={paper.id} className="game-panel">
                      <CardHeader className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle className="text-base">{formatTitle(paper)}</CardTitle>
                            <p className="text-xs text-muted-foreground">{paper.pageTitle?.split("|")[0]?.trim()}</p>
                          </div>
                          <Button
                            type="button"
                            variant={favorites.has(paper.id) ? "default" : "outline"}
                            size="icon"
                            onClick={() => toggleFavorite(paper.id)}
                            aria-label="Toggle favorite"
                          >
                            <Bookmark className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="game-chip">{paper.exam}</span>
                          {paper.year ? <span className="game-chip">{paper.year}</span> : null}
                          {paper.slot ? <span className="game-chip">Slot {paper.slot}</span> : null}
                          <span className="game-chip">{CAT_PAPER_SECTION_LABELS[paper.paperSection]}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-muted-foreground">
                          {paper.sectionsCount} sections / {paper.questionsCount} questions
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handlePractice(paper)}
                          disabled={practiceLoadingPaperId === paper.id}
                          className="gap-2"
                        >
                          {practiceLoadingPaperId === paper.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          Practice
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {nextCursor ? (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => loadPapers({ reset: false })}
                    disabled={loadingMore}
                    className="gap-2"
                  >
                    {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Load more
                  </Button>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </AppContent>
    </div>
  );
}
