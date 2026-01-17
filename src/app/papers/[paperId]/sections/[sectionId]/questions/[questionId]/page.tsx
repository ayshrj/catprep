"use client";

import { ChevronLeft, ChevronRight, ExternalLink, Loader2, Play, Square } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { APP_CONTENT_HEIGHT, AppContent } from "@/components/app-content";
import { AppNavbar } from "@/components/app-navbar";
import { AppNavbarActions } from "@/components/app-navbar-actions";
import { ContentBlocks } from "@/components/papers/content-blocks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { useAuthAndTheme } from "@/hooks/use-auth-and-theme";
import { fetchQuestion, fetchQuestions } from "@/lib/cat-papers-service";
import type { CatPaperQuestionSummary, CatPaperSolutionDoc } from "@/types/cat-paper-firestore";
import { normalizeMathDelimiters } from "@/utils/markdown-math";

const CHOICE_LABELS = ["A", "B", "C", "D", "E"];

export default function QuestionDetailPage() {
  const { handleLogout, handleThemeToggle } = useAuthAndTheme();
  const params = useParams();
  const searchParams = useSearchParams();

  const paperId = Array.isArray(params?.paperId) ? params?.paperId[0] : (params?.paperId as string);
  const sectionId = Array.isArray(params?.sectionId) ? params?.sectionId[0] : (params?.sectionId as string);
  const questionId = Array.isArray(params?.questionId) ? params?.questionId[0] : (params?.questionId as string);

  const practiceMode = searchParams.get("practice") === "1";

  const [question, setQuestion] = useState<CatPaperQuestionSummary | null>(null);
  const [solution, setSolution] = useState<CatPaperSolutionDoc | null>(null);
  const [questionList, setQuestionList] = useState<CatPaperQuestionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingNeighbors, setLoadingNeighbors] = useState(false);

  const loadQuestion = useCallback(async () => {
    if (!paperId || !sectionId || !questionId) return;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchQuestion(paperId, sectionId, questionId, true);
      setQuestion(data.question);
      setSolution(data.solution);
    } catch (err) {
      console.error(err);
      setError("Unable to load this question.");
    } finally {
      setLoading(false);
    }
  }, [paperId, sectionId, questionId, fetchQuestion]);

  const loadPracticeList = useCallback(async () => {
    if (!practiceMode || !paperId || !sectionId) return;
    setLoadingNeighbors(true);
    try {
      const data = await fetchQuestions(paperId, sectionId, { limit: 50 });
      setQuestionList(data.questions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNeighbors(false);
    }
  }, [paperId, practiceMode, sectionId, fetchQuestions]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  useEffect(() => {
    loadPracticeList();
  }, [loadPracticeList]);

  const currentIndex = useMemo(() => {
    if (!questionList.length || !question) return -1;
    return questionList.findIndex(item => item.id === question.id);
  }, [question, questionList]);

  const prevQuestion = currentIndex > 0 ? questionList[currentIndex - 1] : null;
  const nextQuestion =
    currentIndex >= 0 && currentIndex < questionList.length - 1 ? questionList[currentIndex + 1] : null;

  const answerLine = useMemo(() => {
    if (!question) return "";
    if (question.correctAnswerChoice) {
      const text = question.correctAnswerText?.trim();
      return text ? `Choice ${question.correctAnswerChoice} - ${text}` : `Choice ${question.correctAnswerChoice}`;
    }
    if (question.correctAnswerText) {
      return question.correctAnswerText;
    }
    return question.correctAnswerRaw || "Not available";
  }, [question]);

  const normalizedPrompt = useMemo(
    () => (question?.prompt ? normalizeMathDelimiters(question.prompt) : ""),
    [question]
  );
  const normalizedChoices = useMemo(
    () => question?.choices.map(choice => normalizeMathDelimiters(choice)) ?? [],
    [question]
  );
  const normalizedAnswerLine = useMemo(() => normalizeMathDelimiters(answerLine), [answerLine]);
  const normalizedExplanationText = useMemo(
    () => (solution?.explanationText ? normalizeMathDelimiters(solution.explanationText) : ""),
    [solution]
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      <AppNavbar
        title="Cat99"
        subtitle="Question detail"
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
                <Link href={`/papers/${paperId}/sections/${sectionId}`}>Back to section</Link>
              </Button>
              {practiceMode ? (
                <Button asChild variant="secondary" size="sm" className="gap-2">
                  <Link href={`/papers/${paperId}/sections/${sectionId}/questions/${questionId}`}>
                    <Square className="h-4 w-4" />
                    Exit practice
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="secondary" size="sm" className="gap-2">
                  <Link href={`/papers/${paperId}/sections/${sectionId}/questions/${questionId}?practice=1`}>
                    <Play className="h-4 w-4" />
                    Practice mode
                  </Link>
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading question...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : question ? (
              <>
                <Card className="game-panel">
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-base">Question {question.index + 1}</CardTitle>
                    {question.title ? <p className="text-xs text-muted-foreground">{question.title}</p> : null}
                    <div className="text-sm">
                      <MarkdownRenderer>{normalizedPrompt}</MarkdownRenderer>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {question.images.length ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {question.images.map((image, index) => (
                          <figure key={`${image}-${index}`} className="rounded-xl border border-border/60 p-2">
                            <img
                              src={image}
                              alt="Question visual"
                              loading="lazy"
                              className="h-auto w-full rounded-lg"
                            />
                          </figure>
                        ))}
                      </div>
                    ) : null}

                    {question.choices.length ? (
                      <div className="space-y-2">
                        {normalizedChoices.map((choice, index) => (
                          <div key={`${choice}-${index}`} className="rounded-lg border border-border/60 p-2 text-sm">
                            <div className="flex gap-2">
                              <span className="text-xs font-semibold text-muted-foreground">
                                {CHOICE_LABELS[index] ?? ""}
                              </span>
                              <div className="flex-1">
                                <MarkdownRenderer>{choice}</MarkdownRenderer>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                        TITA question - write your own answer.
                      </div>
                    )}

                    {question.links.length ? (
                      <div className="flex flex-wrap gap-2">
                        {question.links.map((link, index) => (
                          <Button asChild key={index} variant="outline" size="sm" className="gap-2">
                            <a href={link.href} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                              {link.text}
                            </a>
                          </Button>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <Collapsible>
                  <Card className="game-panel">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Answer & Explanation</CardTitle>
                        <p className="text-xs text-muted-foreground">Reveal only when you are ready.</p>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          Toggle
                        </Button>
                      </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="space-y-4">
                        <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
                          <span className="text-xs uppercase text-muted-foreground">Correct answer</span>
                          <div className="mt-1 font-semibold">
                            <MarkdownRenderer>{normalizedAnswerLine}</MarkdownRenderer>
                          </div>
                        </div>

                        {solution ? (
                          <div className="space-y-3">
                            {solution.explanationContent?.length ? (
                              <ContentBlocks blocks={solution.explanationContent} />
                            ) : null}

                            {!solution.explanationContent?.length && solution.explanationText ? (
                              <div className="rounded-xl border border-border/60 bg-background/60 p-3 text-sm">
                                <MarkdownRenderer>{normalizedExplanationText}</MarkdownRenderer>
                              </div>
                            ) : null}

                            {!solution.explanationContent?.length && solution.explanationImages?.length ? (
                              <div className="grid gap-3 sm:grid-cols-2">
                                {solution.explanationImages.map((image, index) => (
                                  <figure key={`${image}-${index}`} className="rounded-xl border border-border/60 p-2">
                                    <img
                                      src={image}
                                      alt="Explanation visual"
                                      loading="lazy"
                                      className="h-auto w-full rounded-lg"
                                    />
                                  </figure>
                                ))}
                              </div>
                            ) : null}

                            {!solution.explanationContent?.length &&
                            !solution.explanationText &&
                            !solution.explanationImages?.length ? (
                              <p className="text-sm text-muted-foreground">No explanation available.</p>
                            ) : null}

                            {solution.youtubeWatchUrl ? (
                              <Button asChild variant="secondary" size="sm" className="gap-2">
                                <a href={solution.youtubeWatchUrl} target="_blank" rel="noreferrer">
                                  <Play className="h-4 w-4" />
                                  Watch solution video
                                </a>
                              </Button>
                            ) : null}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No solution available for this question.</p>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {practiceMode ? (
                  <Card className="game-panel">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="text-xs text-muted-foreground">
                        {loadingNeighbors
                          ? "Loading practice list..."
                          : `${currentIndex + 1} of ${questionList.length}`}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {prevQuestion ? (
                          <Button asChild variant="outline" size="sm">
                            <Link
                              href={`/papers/${paperId}/sections/${sectionId}/questions/${prevQuestion.id}?practice=1`}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Prev
                            </Link>
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            <ChevronLeft className="h-4 w-4" />
                            Prev
                          </Button>
                        )}
                        {nextQuestion ? (
                          <Button asChild variant="outline" size="sm">
                            <Link
                              href={`/papers/${paperId}/sections/${sectionId}/questions/${nextQuestion.id}?practice=1`}
                            >
                              Next
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </AppContent>
    </div>
  );
}
