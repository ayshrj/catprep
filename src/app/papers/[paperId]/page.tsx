"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { APP_CONTENT_HEIGHT, AppContent } from "@/components/app-content";
import { AppNavbar } from "@/components/app-navbar";
import { AppNavbarActions } from "@/components/app-navbar-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CAT_PAPER_SECTION_LABELS } from "@/constants/cat-paper-filters";
import { useAuthAndTheme } from "@/hooks/use-auth-and-theme";
import { fetchPaper } from "@/lib/cat-papers-service";
import type { CatPaperSectionSummary, CatPaperSummary } from "@/types/cat-paper-firestore";

function sectionTitle(section: CatPaperSectionSummary, index: number) {
  const trimmed = section.heading?.trim();
  return trimmed ? trimmed : `Section ${index + 1}`;
}

function truncate(value: string, max = 220) {
  if (!value) return "";
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

export default function PaperDetailPage() {
  const { handleLogout, handleThemeToggle } = useAuthAndTheme();
  const params = useParams();
  const paperId = Array.isArray(params?.paperId) ? params?.paperId[0] : (params?.paperId as string);

  const [paper, setPaper] = useState<CatPaperSummary | null>(null);
  const [sections, setSections] = useState<CatPaperSectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paperId) return;
    let active = true;
    setLoading(true);
    setError(null);

    fetchPaper(paperId)
      .then(data => {
        if (!active) return;
        setPaper(data.paper);
        setSections(data.sections);
      })
      .catch(err => {
        console.error(err);
        if (!active) return;
        setError("Unable to load this paper.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [paperId]);

  const heading = useMemo(() => paper?.topic ?? "Paper", [paper]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      <AppNavbar
        title="Cat99"
        subtitle="Paper detail"
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
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/papers">Back to papers</Link>
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading paper...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : paper ? (
              <>
                <Card className="game-panel">
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-xl">{heading}</CardTitle>
                    <p className="text-sm text-muted-foreground">{paper.pageTitle?.split("|")[0]?.trim()}</p>
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
                    {paper.url ? (
                      <Button asChild variant="outline" size="sm" className="gap-2">
                        <a href={paper.url} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          Source page
                        </a>
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">Sections</h2>
                    <span className="text-xs text-muted-foreground">{sections.length} total</span>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {sections.map((section, index) => (
                      <Card key={section.id} className="game-panel">
                        <CardHeader className="space-y-2">
                          <CardTitle className="text-base">{sectionTitle(section, index)}</CardTitle>
                          {section.passageOrSetText ? (
                            <p className="text-xs text-muted-foreground">{truncate(section.passageOrSetText)}</p>
                          ) : null}
                        </CardHeader>
                        <CardContent className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-xs text-muted-foreground">{section.questionCount} questions</div>
                          <Button asChild variant="secondary">
                            <Link href={`/papers/${paper.id}/sections/${section.id}`}>Open section</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              </>
            ) : null}
          </div>
        </div>
      </AppContent>
    </div>
  );
}
