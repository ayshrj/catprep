"use client";

import { ChevronRight, Loader2, Play } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { APP_CONTENT_HEIGHT, AppContent } from "@/components/app-content";
import { AppNavbar } from "@/components/app-navbar";
import { AppNavbarActions } from "@/components/app-navbar-actions";
import { ContentBlocks } from "@/components/papers/content-blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthAndTheme } from "@/hooks/use-auth-and-theme";
import { fetchQuestions, fetchSection } from "@/lib/cat-papers-service";
import type { CatPaperQuestionSummary, CatPaperSectionSummary } from "@/types/cat-paper-firestore";

function sectionHeading(section: CatPaperSectionSummary) {
  const heading = section.heading?.trim();
  return heading || `Section ${section.index + 1}`;
}

function questionPreview(prompt: string, max = 160) {
  const normalized = prompt.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max)}...`;
}

export default function SectionDetailPage() {
  const { handleLogout, handleThemeToggle } = useAuthAndTheme();
  const params = useParams();
  const paperId = Array.isArray(params?.paperId) ? params?.paperId[0] : (params?.paperId as string);
  const sectionId = Array.isArray(params?.sectionId) ? params?.sectionId[0] : (params?.sectionId as string);

  const [section, setSection] = useState<CatPaperSectionSummary | null>(null);
  const [questions, setQuestions] = useState<CatPaperQuestionSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSection = useCallback(async () => {
    if (!paperId || !sectionId) return;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchSection(paperId, sectionId);
      setSection(data.section);
    } catch (err) {
      console.error(err);
      setError("Unable to load this section.");
    } finally {
      setLoading(false);
    }
  }, [paperId, sectionId, fetchSection]);

  const loadQuestions = useCallback(
    async ({ reset }: { reset: boolean }) => {
      if (!paperId || !sectionId) return;
      setLoadingQuestions(true);
      try {
        const data = await fetchQuestions(paperId, sectionId, {
          limit: 12,
          cursor: reset ? null : nextCursor,
        });
        setQuestions(prev => (reset ? data.questions : [...prev, ...data.questions]));
        setNextCursor(data.nextCursor);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingQuestions(false);
      }
    },
    [nextCursor, paperId, sectionId, fetchQuestions]
  );

  useEffect(() => {
    loadSection();
    loadQuestions({ reset: true });
  }, [loadQuestions, loadSection]);

  const practiceHref = useMemo(() => {
    if (!questions.length) return null;
    return `/papers/${paperId}/sections/${sectionId}/questions/${questions[0].id}?practice=1`;
  }, [paperId, sectionId, questions]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      <AppNavbar
        title="Cat99"
        subtitle="Section detail"
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
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href={`/papers/${paperId}`}>Back to paper</Link>
              </Button>
              {practiceHref ? (
                <Button asChild variant="secondary" size="sm" className="gap-2">
                  <Link href={practiceHref}>
                    <Play className="h-4 w-4" />
                    Practice mode
                  </Link>
                </Button>
              ) : null}
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading section...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : section ? (
              <>
                <Card className="game-panel">
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-xl">{sectionHeading(section)}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {section.questionCount} questions / {section.images.length} visuals
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {section.content?.length ? (
                      <ContentBlocks blocks={section.content} />
                    ) : section.passageOrSetText ? (
                      <div className="rounded-xl border border-border/60 bg-background/60 p-3 text-sm whitespace-pre-wrap">
                        {section.passageOrSetText}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No passage content in this section.</p>
                    )}
                  </CardContent>
                </Card>

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">Questions</h2>
                    <span className="text-xs text-muted-foreground">{section.questionCount} total</span>
                  </div>
                  <div className="space-y-3">
                    {questions.map(question => (
                      <Card key={question.id} className="game-panel">
                        <CardHeader className="space-y-2">
                          <CardTitle className="text-sm">Question {question.index + 1}</CardTitle>
                          <p className="text-xs text-muted-foreground">{questionPreview(question.prompt)}</p>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{question.choices.length ? `${question.choices.length} choices` : "TITA"}</span>
                            {question.hasSolution ? <Badge variant="secondary">Solution</Badge> : null}
                          </div>
                          <Button asChild variant="secondary" size="sm" className="gap-2">
                            <Link href={`/papers/${paperId}/sections/${sectionId}/questions/${question.id}`}>
                              View
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {nextCursor !== null ? (
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => loadQuestions({ reset: false })}
                        disabled={loadingQuestions}
                        className="gap-2"
                      >
                        {loadingQuestions ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Load more questions
                      </Button>
                    </div>
                  ) : null}
                </section>
              </>
            ) : null}
          </div>
        </div>
      </AppContent>
    </div>
  );
}
