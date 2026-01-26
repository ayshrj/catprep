import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { buildRegex, MarkdownRenderer, stripMath } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PNC_PARTS, PNC_TITLE } from "@/lib/pnc";

export const Pnc = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  const flatSections = useMemo(() => PNC_PARTS.flatMap(part => part.sections), []);

  const countMatches = useCallback((query: string, content: string) => {
    if (!query.trim()) return 0;
    const regex = buildRegex(query);
    if (!regex) return 0;

    content = stripMath(content);
    let count = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      count++;
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
    }

    return count;
  }, []);

  const sectionMatchCounts = useMemo(
    () => flatSections.map(section => countMatches(searchQuery, section.content)),
    [countMatches, flatSections, searchQuery]
  );

  const totalMatches = useMemo(() => sectionMatchCounts.reduce((sum, count) => sum + count, 0), [sectionMatchCounts]);

  const sectionOffsets = useMemo(() => {
    let offset = 0;
    return sectionMatchCounts.map(count => {
      const currentOffset = offset;
      offset += count;
      return currentOffset;
    });
  }, [sectionMatchCounts]);

  const scrollToSection = useCallback((id: string) => {
    const performScroll = () => {
      const element = document.getElementById(id);
      const container = contentRef.current;
      if (!element || !container) return false;
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const targetTop = elementRect.top - containerRect.top + container.scrollTop - 16;
      container.scrollTo({
        top: Math.max(targetTop, 0),
        behavior: "smooth",
      });
      return true;
    };

    if (performScroll()) return;
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        performScroll();
      });
    }
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setCurrentMatchIndex(0);
      return;
    }
    if (totalMatches === 0) {
      setCurrentMatchIndex(0);
    } else if (currentMatchIndex >= totalMatches) {
      setCurrentMatchIndex(0);
    }
  }, [currentMatchIndex, searchQuery, totalMatches]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const scrollFromHash = () => {
      const id = window.location.hash.replace("#", "").trim();
      if (id) {
        scrollToSection(id);
      }
    };
    scrollFromHash();
    window.addEventListener("hashchange", scrollFromHash);
    return () => window.removeEventListener("hashchange", scrollFromHash);
  }, [scrollToSection]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery("");
        setCurrentMatchIndex(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const timer = setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [isSearchOpen]);

  useEffect(() => {
    if (searchQuery && totalMatches > 0) {
      const element = document.querySelector(`[data-match-index="${currentMatchIndex}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentMatchIndex, searchQuery, totalMatches]);

  const handleNext = () => {
    if (totalMatches > 0) {
      setCurrentMatchIndex(prev => (prev + 1) % totalMatches);
    }
  };

  const handlePrevious = () => {
    if (totalMatches > 0) {
      setCurrentMatchIndex(prev => (prev - 1 + totalMatches) % totalMatches);
    }
  };

  const handleClose = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setCurrentMatchIndex(0);
  };

  const sectionMeta = useMemo(() => {
    const meta = new Map<string, { offset: number; matches: number }>();
    flatSections.forEach((section, index) => {
      meta.set(section.id, {
        offset: sectionOffsets[index] ?? 0,
        matches: sectionMatchCounts[index] ?? 0,
      });
    });
    return meta;
  }, [flatSections, sectionMatchCounts, sectionOffsets]);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">PNC Chapter</p>
            <p className="text-xs text-muted-foreground">{PNC_TITLE}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsSearchOpen(open => !open)}>
            {isSearchOpen ? "Close search" : "Find"}
          </Button>
        </div>

        {isSearchOpen && (
          <div className="border-t px-3 py-2 sm:px-4">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Find in PNC..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentMatchIndex(0);
                }}
                className="min-w-[180px] flex-1"
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (e.shiftKey) {
                      handlePrevious();
                    } else {
                      handleNext();
                    }
                  }
                }}
              />
              {searchQuery && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {totalMatches > 0 ? `${currentMatchIndex + 1}/${totalMatches}` : "0/0"}
                </span>
              )}
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={handlePrevious} disabled={totalMatches === 0}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNext} disabled={totalMatches === 0}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="border-t md:hidden">
          <ScrollArea className="w-full">
            <div className="flex gap-2 px-3 py-2">
              {flatSections.map(section => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  className="whitespace-nowrap rounded-4xl border bg-background px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {section.title}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <AppSidebar
          title="Sections"
          className="hidden h-full w-[18rem] shrink-0 rounded-none border-0 border-r border-border/60 bg-muted/20 shadow-none md:flex"
          contentClassName="p-0"
        >
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              {PNC_PARTS.map(part => (
                <div key={part.id} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{part.title}</p>
                  <div className="space-y-1">
                    {part.sections.map(section => (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => scrollToSection(section.id)}
                        className="w-full rounded-lg px-2 py-1 text-left text-xs text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
                      >
                        {section.title}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </AppSidebar>

        <section ref={contentRef} className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {PNC_PARTS.map(part => (
              <div key={part.id} className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>{part.title}</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                {part.sections.map(section => {
                  const meta = sectionMeta.get(section.id);
                  return (
                    <article
                      key={section.id}
                      id={section.id}
                      className="scroll-mt-24 rounded-2xl border bg-background p-4 shadow-sm"
                    >
                      {meta?.matches ? (
                        <div className="mb-2 text-xs text-muted-foreground">
                          {meta.matches} match{meta.matches === 1 ? "" : "es"}
                        </div>
                      ) : null}
                      <MarkdownRenderer
                        searchQuery={searchQuery}
                        currentMatchIndex={currentMatchIndex}
                        matchOffset={meta?.offset ?? 0}
                      >
                        {section.content}
                      </MarkdownRenderer>
                    </article>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
