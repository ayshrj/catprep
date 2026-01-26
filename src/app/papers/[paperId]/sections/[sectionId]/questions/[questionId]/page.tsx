"use client";

import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info,
  Layers,
  ListChecks,
  Loader2,
  Play,
  Square,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { APP_CONTENT_HEIGHT, AppContent } from "@/components/app-content";
import { AppNavbar } from "@/components/app-navbar";
import { AppNavbarActionsRoute } from "@/components/app-navbar-actions-route";
import { ContentBlocks } from "@/components/papers/content-blocks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogShell } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CAT_PAPER_SECTION_LABELS } from "@/constants/cat-paper-filters";
import { formatTime } from "@/games/core/timer";
import { useAuthAndTheme } from "@/hooks/use-auth-and-theme";
import { fetchPaper, fetchQuestion, fetchQuestions } from "@/lib/cat-papers-service";
import { cn } from "@/lib/utils";
import type {
  CatPaperQuestionSummary,
  CatPaperSectionSummary,
  CatPaperSolutionDoc,
  CatPaperSummary,
} from "@/types/cat-paper-firestore";
import { normalizeMathDelimiters } from "@/utils/markdown-math";

const CHOICE_LABELS = ["A", "B", "C", "D", "E"];

function parseNumericValue(value: string) {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return null;
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function sectionHeading(section: CatPaperSectionSummary) {
  const heading = section.heading?.trim();
  return heading || `Section ${section.index + 1}`;
}

export default function QuestionDetailPage() {
  const { handleLogout, handleThemeToggle } = useAuthAndTheme();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const paperId = Array.isArray(params?.paperId) ? params?.paperId[0] : (params?.paperId as string);
  const sectionId = Array.isArray(params?.sectionId) ? params?.sectionId[0] : (params?.sectionId as string);
  const questionId = Array.isArray(params?.questionId) ? params?.questionId[0] : (params?.questionId as string);

  const practiceMode = searchParams.get("practice") === "1";
  const practiceQuery = "?practice=1";

  const [question, setQuestion] = useState<CatPaperQuestionSummary | null>(null);
  const [solution, setSolution] = useState<CatPaperSolutionDoc | null>(null);
  const [questionList, setQuestionList] = useState<CatPaperQuestionSummary[]>([]);
  const [paper, setPaper] = useState<CatPaperSummary | null>(null);
  const [paperSections, setPaperSections] = useState<CatPaperSectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paperError, setPaperError] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [loadingNeighbors, setLoadingNeighbors] = useState(false);
  const [sectionSwitching, setSectionSwitching] = useState(false);
  const [practicePromptOpen, setPracticePromptOpen] = useState(false);
  const [practiceReady, setPracticeReady] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [hasChecked, setHasChecked] = useState(false);
  const [titaAnswer, setTitaAnswer] = useState("");
  const [titaStatus, setTitaStatus] = useState<"idle" | "correct" | "incorrect" | "unavailable">("idle");
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null);
  const [mcqStatus, setMcqStatus] = useState<"idle" | "correct" | "incorrect" | "unavailable">("idle");
  const [answerOpen, setAnswerOpen] = useState(false);

  const practiceStorageKey = useMemo(() => {
    if (!paperId || !sectionId) return null;
    return `cat99-practice-confirmed:${paperId}:${sectionId}`;
  }, [paperId, sectionId]);

  const currentSection = useMemo(() => {
    if (!paperSections.length) return null;
    return paperSections.find(section => section.id === sectionId) ?? null;
  }, [paperSections, sectionId]);

  const sectionImageBlocks = useMemo(() => {
    if (!currentSection?.content?.length) return [];
    return currentSection.content.filter(block => block.type === "image");
  }, [currentSection]);
  const sectionImageUrls = useMemo(() => currentSection?.images ?? [], [currentSection]);
  const showSectionImages = sectionImageUrls.length > 0 && sectionImageBlocks.length === 0;

  const paperTitle = useMemo(() => {
    const topic = paper?.topic?.trim();
    if (topic) return topic;
    return paper?.pageTitle?.split("|")[0]?.trim() || "Paper";
  }, [paper]);

  const practiceActive = practiceMode && practiceReady;
  const checkLocked = practiceActive && hasChecked;
  const canRevealAnswer = !practiceActive || hasChecked;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperId, sectionId, questionId, fetchQuestion]);

  const loadQuestionList = useCallback(async () => {
    if (!paperId || !sectionId) return;
    setLoadingNeighbors(true);
    try {
      const data = await fetchQuestions(paperId, sectionId, { limit: 50 });
      setQuestionList(data.questions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNeighbors(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperId, sectionId, fetchQuestions]);

  const loadPaper = useCallback(async () => {
    if (!paperId) return;
    setPaperError(null);
    setPaper(null);
    setPaperSections([]);
    try {
      const data = await fetchPaper(paperId);
      setPaper(data.paper);
      setPaperSections(data.sections);
    } catch (err) {
      console.error(err);
      setPaperError("Unable to load paper details.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperId, fetchPaper]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  useEffect(() => {
    loadQuestionList();
  }, [loadQuestionList]);

  useEffect(() => {
    loadPaper();
  }, [loadPaper]);

  useEffect(() => {
    setTitaAnswer("");
    setTitaStatus("idle");
    setSelectedChoiceIndex(null);
    setMcqStatus("idle");
    setHasChecked(false);
    setAnswerOpen(false);
  }, [questionId]);

  useEffect(() => {
    if (!practiceMode) {
      setPracticePromptOpen(false);
      setPracticeReady(false);
      setTimerSeconds(0);
      if (practiceStorageKey) {
        sessionStorage.removeItem(practiceStorageKey);
      }
      return;
    }
    if (!practiceStorageKey) return;
    const stored = sessionStorage.getItem(practiceStorageKey);
    if (stored === "1") {
      setPracticeReady(true);
      setPracticePromptOpen(false);
    } else {
      setPracticeReady(false);
      setPracticePromptOpen(true);
    }
  }, [practiceMode, practiceStorageKey]);

  useEffect(() => {
    if (!practiceActive) return;
    const timerId = window.setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [practiceActive]);

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
  const normalizedSectionText = useMemo(
    () => (currentSection?.passageOrSetText ? normalizeMathDelimiters(currentSection.passageOrSetText) : ""),
    [currentSection]
  );

  const hasSectionContent = Boolean(currentSection?.content?.length || currentSection?.passageOrSetText);

  const needsManualAnswer = useMemo(() => {
    if (!question) return false;
    return !question.correctAnswerChoice;
  }, [question]);
  const titaCorrectValue = useMemo(() => question?.correctAnswerText?.trim() ?? "", [question]);

  const handleTitaCheck = useCallback(() => {
    if (!needsManualAnswer) return;
    if (checkLocked) return;
    const userValue = titaAnswer.trim();
    if (!userValue) return;
    if (!titaCorrectValue) {
      setTitaStatus("unavailable");
      if (practiceActive) setHasChecked(true);
      return;
    }

    const numericUser = parseNumericValue(userValue);
    const numericCorrect = parseNumericValue(titaCorrectValue);
    const matches =
      numericUser !== null && numericCorrect !== null ? numericUser == numericCorrect : userValue == titaCorrectValue;

    setTitaStatus(matches ? "correct" : "incorrect");
    if (practiceActive) setHasChecked(true);
  }, [checkLocked, needsManualAnswer, practiceActive, titaAnswer, titaCorrectValue]);

  const handleChoiceCheck = useCallback(() => {
    if (!question || selectedChoiceIndex === null) return;
    if (checkLocked) return;
    const selectedLabel = CHOICE_LABELS[selectedChoiceIndex] ?? "";
    if (question.correctAnswerChoice) {
      setMcqStatus(selectedLabel == question.correctAnswerChoice ? "correct" : "incorrect");
      if (practiceActive) setHasChecked(true);
      return;
    }
    const correctText = question.correctAnswerText?.trim() ?? "";
    if (!correctText) {
      setMcqStatus("unavailable");
      if (practiceActive) setHasChecked(true);
      return;
    }
    const selectedText = question.choices[selectedChoiceIndex] ?? "";
    const numericSelected = parseNumericValue(selectedText);
    const numericCorrect = parseNumericValue(correctText);
    const matches =
      numericSelected !== null && numericCorrect !== null
        ? numericSelected == numericCorrect
        : selectedText.trim() == correctText;
    setMcqStatus(matches ? "correct" : "incorrect");
    if (practiceActive) setHasChecked(true);
  }, [checkLocked, practiceActive, question, selectedChoiceIndex]);

  const handlePracticeConfirm = useCallback(() => {
    setPracticeReady(true);
    setPracticePromptOpen(false);
    setTimerSeconds(0);
    setHasChecked(false);
    setSelectedChoiceIndex(null);
    setMcqStatus("idle");
    setTitaAnswer("");
    setTitaStatus("idle");
    if (practiceStorageKey) {
      sessionStorage.setItem(practiceStorageKey, "1");
    }
  }, [practiceStorageKey]);

  const handlePracticeCancel = useCallback(() => {
    setPracticePromptOpen(false);
    setPracticeReady(false);
    setTimerSeconds(0);
    if (practiceStorageKey) {
      sessionStorage.removeItem(practiceStorageKey);
    }
    if (paperId && sectionId && questionId) {
      router.replace(`/papers/${paperId}/sections/${sectionId}/questions/${questionId}`);
    }
  }, [paperId, questionId, router, sectionId, practiceStorageKey]);

  const handlePracticePromptChange = useCallback(
    (open: boolean) => {
      if (open) {
        setPracticePromptOpen(true);
        return;
      }
      if (practiceMode && !practiceReady) {
        handlePracticeCancel();
        return;
      }
      setPracticePromptOpen(false);
    },
    [handlePracticeCancel, practiceMode, practiceReady]
  );

  const handleSectionChange = useCallback(
    async (nextSectionId: string) => {
      if (!paperId || !nextSectionId) return;
      if (nextSectionId === sectionId) return;
      setSectionSwitching(true);
      try {
        const data = await fetchQuestions(paperId, nextSectionId, { limit: 1 });
        const firstQuestion = data.questions[0];
        if (!firstQuestion) {
          toast.error("No questions found in that section.");
          return;
        }
        const query = practiceMode ? practiceQuery : "";
        router.push(`/papers/${paperId}/sections/${nextSectionId}/questions/${firstQuestion.id}${query}`);
      } catch (err) {
        console.error(err);
        toast.error("Unable to switch sections right now.");
      } finally {
        setSectionSwitching(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paperId, practiceMode, practiceQuery, router, sectionId, fetchQuestions]
  );

  const manualAnswerNode = needsManualAnswer ? (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type your answer</div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Input
          value={titaAnswer}
          onChange={event => {
            setTitaAnswer(event.target.value);
            setTitaStatus("idle");
          }}
          onKeyDown={event => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleTitaCheck();
            }
          }}
          placeholder="Your answer"
          className={cn(
            "w-44 sm:w-52",
            titaStatus === "correct"
              ? "border-emerald-600 text-foreground focus-visible:ring-emerald-600/40"
              : titaStatus === "incorrect"
                ? "border-rose-600 text-foreground focus-visible:ring-rose-600/40"
                : ""
          )}
          disabled={checkLocked}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleTitaCheck}
          disabled={!titaAnswer.trim() || checkLocked}
        >
          Check answer
        </Button>
        {titaStatus === "correct" ? (
          <span className="rounded-4xl border border-foreground/40 bg-foreground/5 px-2 py-0.5 text-xs font-semibold text-foreground">
            Correct
          </span>
        ) : null}
        {titaStatus === "incorrect" ? (
          <span className="rounded-4xl border border-border-strong bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            Incorrect
          </span>
        ) : null}
        {titaStatus === "unavailable" ? (
          <span className="text-xs text-muted-foreground">Answer not available.</span>
        ) : null}
      </div>
    </div>
  ) : null;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <AppNavbar
        title="Cat99"
        subtitle="Question detail"
        trailing={<AppNavbarActionsRoute value="papers" onLogout={handleLogout} onThemeToggle={handleThemeToggle} />}
      />

      <AppContent className={APP_CONTENT_HEIGHT}>
        <div className="h-full min-h-0 overflow-y-auto py-3 sm:py-4">
          <div className="space-y-6 pb-6">
            <section className="game-panel relative overflow-hidden">
              <div className="relative game-panel-padded space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="game-chip">Past papers</span>
                      <span>{paperTitle}</span>
                      {paper?.exam ? <span className="game-chip">{paper.exam}</span> : null}
                      {paper?.year ? <span className="game-chip">{paper.year}</span> : null}
                      {paper?.slot ? <span className="game-chip">Slot {paper.slot}</span> : null}
                      {paper?.paperSection ? (
                        <span className="game-chip">{CAT_PAPER_SECTION_LABELS[paper.paperSection]}</span>
                      ) : null}
                      {practiceMode ? <span className="game-chip">Practice</span> : <span>Review</span>}
                    </div>
                    <div className="space-y-1">
                      <h1 className="text-xl font-semibold tracking-tight">
                        Question {question ? question.index + 1 : "--"}
                      </h1>
                      <p className="text-sm text-muted-foreground">
                        {currentSection ? sectionHeading(currentSection) : "Loading section"}{" "}
                        {currentSection ? `• ${currentSection.questionCount} questions` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="grid w-full gap-2 sm:grid-cols-3 lg:w-auto">
                    <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2 shadow-sm">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ListChecks className="h-3.5 w-3.5" />
                        Progress
                      </div>
                      <div className="text-lg font-semibold">
                        {currentIndex >= 0 && questionList.length ? `${currentIndex + 1}/${questionList.length}` : "--"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2 shadow-sm">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Layers className="h-3.5 w-3.5" />
                        Section Qs
                      </div>
                      <div className="text-lg font-semibold">
                        {currentSection ? currentSection.questionCount.toLocaleString() : "--"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2 shadow-sm">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Timer className="h-3.5 w-3.5" />
                        Timer
                      </div>
                      <div className="text-lg font-semibold">{practiceActive ? formatTime(timerSeconds) : "Ready"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Card className="game-panel">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/papers">Back to papers</Link>
                  </Button>
                  {paperSections.length > 1 ? (
                    <div className="w-full sm:w-[240px]">
                      <Select value={sectionId ?? ""} onValueChange={handleSectionChange}>
                        <SelectTrigger size="sm" disabled={sectionSwitching} className="w-full">
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {paperSections.map(section => (
                            <SelectItem key={section.id} value={section.id}>
                              {sectionHeading(section)} / {section.questionCount} Qs
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setInfoOpen(true)}>
                    <Info className="h-4 w-4" />
                    Info
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {practiceMode ? (
                    <Button asChild variant="secondary" size="sm" className="gap-2">
                      <Link href={`/papers/${paperId}/sections/${sectionId}/questions/${questionId}`}>
                        <Square className="h-4 w-4" />
                        Exit practice
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="secondary" size="sm" className="gap-2">
                      <Link href={`/papers/${paperId}/sections/${sectionId}/questions/${questionId}${practiceQuery}`}>
                        <Play className="h-4 w-4" />
                        Practice mode
                      </Link>
                    </Button>
                  )}
                  {practiceActive ? (
                    <div className="flex items-center gap-2 rounded-4xl border border-border/60 bg-card px-3 py-1 text-xs text-muted-foreground">
                      <Timer className="h-3.5 w-3.5" />
                      {formatTime(timerSeconds)}
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

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
                {sectionImageBlocks.length || showSectionImages ? (
                  <Card className="game-panel">
                    <CardHeader className="space-y-1">
                      <CardTitle className="text-base">Section visuals</CardTitle>
                      {currentSection ? (
                        <p className="text-xs text-muted-foreground">
                          {sectionHeading(currentSection)} / {currentSection.questionCount} Qs
                        </p>
                      ) : null}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {sectionImageBlocks.length ? (
                        <ContentBlocks blocks={sectionImageBlocks} />
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {sectionImageUrls.map((image, index) => (
                            <figure key={`${image}-${index}`} className="rounded-xl border border-border/60 p-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={image}
                                alt="Section visual"
                                loading="lazy"
                                className="h-auto w-full rounded-lg"
                              />
                            </figure>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : null}

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
                            {/* eslint-disable-next-line @next/next/no-img-element */}
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
                      <div className="space-y-3">
                        <div className="space-y-2">
                          {normalizedChoices.map((choice, index) => {
                            const isSelected = selectedChoiceIndex === index;
                            const isCorrect = isSelected && mcqStatus === "correct";
                            const isIncorrect = isSelected && mcqStatus === "incorrect";
                            const stateStyles = isCorrect
                              ? "border-emerald-600/70 bg-emerald-600/10 text-foreground"
                              : isIncorrect
                                ? "border-rose-600/70 bg-rose-600/10 text-foreground"
                                : isSelected
                                  ? "border-primary/40 bg-primary/5"
                                  : "border-border/60 bg-card hover:border-foreground/30 hover:bg-muted/40";
                            const labelStyles = isCorrect
                              ? "border-emerald-600/70 bg-emerald-600/15 text-emerald-700"
                              : isIncorrect
                                ? "border-rose-600/70 bg-rose-600/15 text-rose-700"
                                : isSelected
                                  ? "border-primary/40 bg-primary/10 text-primary"
                                  : "border-border/60 text-muted-foreground";

                            return (
                              <button
                                key={`choice-${index}`}
                                type="button"
                                onClick={() => {
                                  setSelectedChoiceIndex(index);
                                  setMcqStatus("idle");
                                }}
                                disabled={checkLocked}
                                aria-pressed={isSelected}
                                className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm transition ${stateStyles} ${checkLocked ? "cursor-not-allowed opacity-70" : ""}`}
                              >
                                <span
                                  className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-4xl border text-xs font-semibold ${labelStyles}`}
                                >
                                  {CHOICE_LABELS[index] ?? ""}
                                </span>
                                <span className="flex-1 text-sm">
                                  <MarkdownRenderer>{choice}</MarkdownRenderer>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleChoiceCheck}
                            disabled={selectedChoiceIndex === null || checkLocked}
                          >
                            Check answer
                          </Button>
                          {selectedChoiceIndex === null ? <span>Select an option to check.</span> : null}
                          {mcqStatus === "correct" ? (
                            <span className="rounded-4xl border border-foreground/40 bg-foreground/5 px-2 py-0.5 text-xs font-semibold text-foreground">
                              Correct
                            </span>
                          ) : null}
                          {mcqStatus === "incorrect" ? (
                            <span className="rounded-4xl border border-border-strong bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                              Incorrect
                            </span>
                          ) : null}
                          {mcqStatus === "unavailable" ? <span>Answer not available.</span> : null}
                          {checkLocked ? <span>Locked in practice mode.</span> : null}
                        </div>
                        {manualAnswerNode}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                          TITA question - type your answer to check.
                        </div>
                        {manualAnswerNode}
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

                {canRevealAnswer ? (
                  <Collapsible open={answerOpen} onOpenChange={setAnswerOpen}>
                    <Card className="game-panel">
                      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <CardTitle className="text-base">Answer & Explanation</CardTitle>
                          <p className="text-xs text-muted-foreground">Reveal only when you are ready.</p>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button type="button" variant="outline" size="sm">
                            {answerOpen ? "Hide answer" : "Reveal answer"}
                          </Button>
                        </CollapsibleTrigger>
                      </CardHeader>
                      <CollapsibleContent>
                        <CardContent className="space-y-4">
                          <div className="rounded-xl border border-border/60 bg-muted/40 p-3 text-sm">
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
                                    <figure
                                      key={`${image}-${index}`}
                                      className="rounded-xl border border-border/60 p-2"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
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
                ) : (
                  <Card className="game-panel">
                    <CardHeader className="space-y-1">
                      <CardTitle className="text-base">Answer locked</CardTitle>
                      <p className="text-xs text-muted-foreground">Check your answer once to unlock the explanation.</p>
                    </CardHeader>
                  </Card>
                )}

                <Card className="game-panel">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="text-xs text-muted-foreground">
                      {loadingNeighbors
                        ? "Loading navigation..."
                        : questionList.length
                          ? `${currentIndex + 1} of ${questionList.length}`
                          : "Navigation unavailable"}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {prevQuestion ? (
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/papers/${paperId}/sections/${sectionId}/questions/${prevQuestion.id}${practiceMode ? practiceQuery : ""}`}
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
                            href={`/papers/${paperId}/sections/${sectionId}/questions/${nextQuestion.id}${practiceMode ? practiceQuery : ""}`}
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
              </>
            ) : null}
          </div>
        </div>

        <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
          <DialogShell title={paperTitle} description={paper?.pageTitle?.split("|")[0]?.trim() || "Paper details"}>
            <div className="space-y-6 px-6 py-4">
              {paperError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  {paperError}
                </div>
              ) : null}

              {paper ? (
                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Paper</p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="game-chip">{paper.exam}</span>
                    {paper.year ? <span className="game-chip">{paper.year}</span> : null}
                    {paper.slot ? <span className="game-chip">Slot {paper.slot}</span> : null}
                    {paper.paperSection ? (
                      <span className="game-chip">{CAT_PAPER_SECTION_LABELS[paper.paperSection]}</span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {paper.sectionsCount} sections / {paper.questionsCount} questions
                  </p>
                  {paper.url ? (
                    <Button asChild variant="outline" size="sm" className="gap-2">
                      <a href={paper.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Source page
                      </a>
                    </Button>
                  ) : null}
                </section>
              ) : (
                <p className="text-sm text-muted-foreground">Loading paper details...</p>
              )}

              {currentSection ? (
                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Section</p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{sectionHeading(currentSection)}</p>
                    <span className="text-xs text-muted-foreground">
                      {currentSection.questionCount} Qs / {currentSection.images?.length ?? 0} visuals
                    </span>
                  </div>
                  {hasSectionContent ? (
                    <div className="rounded-xl border border-border/60 bg-background/60 p-3 text-sm">
                      {currentSection.content?.length ? (
                        <ContentBlocks blocks={currentSection.content} />
                      ) : (
                        <MarkdownRenderer>{normalizedSectionText}</MarkdownRenderer>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No passage text for this section.</p>
                  )}
                  {showSectionImages ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Section visuals
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {sectionImageUrls.map((image, index) => (
                          <figure key={`${image}-${index}`} className="rounded-xl border border-border/60 p-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={image} alt="Section visual" loading="lazy" className="h-auto w-full rounded-lg" />
                          </figure>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : paper ? (
                <p className="text-sm text-muted-foreground">Section details unavailable.</p>
              ) : (
                <p className="text-sm text-muted-foreground">Loading section details...</p>
              )}
            </div>
          </DialogShell>
        </Dialog>

        <AlertDialog open={practicePromptOpen} onOpenChange={handlePracticePromptChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start practice mode?</AlertDialogTitle>
              <AlertDialogDescription>
                Practice mode starts the timer and locks answers until you check once.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handlePracticeCancel}>Not now</AlertDialogCancel>
              <AlertDialogAction onClick={handlePracticeConfirm}>Start practice</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AppContent>
    </div>
  );
}
