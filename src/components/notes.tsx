import { CAT_KB_PARTS } from "@/lib/cat";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/ui/copy-button";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, ChevronUp, ChevronDown } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AppSidebar } from "@/components/app-sidebar";

import "katex/dist/katex.min.css";

interface MarkdownRendererProps {
  children: string;
  searchQuery?: string;
  currentMatchIndex?: number;
  matchOffset?: number;
}

export function MarkdownRenderer({
  children,
  searchQuery = "",
  currentMatchIndex = 0,
  matchOffset = 0,
}: MarkdownRendererProps) {
  let matchCounter = matchOffset;
  const nextMatchIndex = () => matchCounter++;

  const highlightChildren = (node: React.ReactNode): React.ReactNode => {
    if (!searchQuery.trim()) return node;

    if (typeof node === "string") {
      return (
        <HighlightTextMatch
          text={node}
          highlight={searchQuery}
          currentMatchIndex={currentMatchIndex}
          nextMatchIndex={nextMatchIndex}
        />
      );
    }

    if (typeof node === "number" || typeof node === "boolean" || node == null) {
      return node;
    }

    if (Array.isArray(node)) {
      return node.map((child, idx) => (
        <React.Fragment
          key={
            React.isValidElement(child) && child.key != null ? child.key : idx
          }
        >
          {highlightChildren(child)}
        </React.Fragment>
      ));
    }

    if (React.isValidElement(node)) {
      const element = node as React.ReactElement<any>;
      const className =
        typeof element.props?.className === "string"
          ? element.props.className
          : "";

      const shouldSkip =
        (typeof element.type === "string" &&
          (element.type === "code" || element.type === "pre")) ||
        className.includes("katex");

      if (shouldSkip || element.props?.children == null) {
        return element;
      }

      return React.cloneElement(element, {
        ...element.props,
        children: highlightChildren(element.props.children),
      });
    }

    return node;
  };

  const withHighlightedClass = (
    Tag: keyof React.JSX.IntrinsicElements,
    classes: string
  ) => {
    const Component = ({ node, ...props }: any) => (
      <Tag className={classes} {...props}>
        {highlightChildren(props.children)}
      </Tag>
    );
    Component.displayName = String(Tag);
    return Component;
  };

  return (
    <div className="space-y-3">
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          ...COMPONENTS,
          p: withHighlightedClass("p", "whitespace-pre-wrap"),
          h1: withHighlightedClass("h1", "text-2xl font-semibold"),
          h2: withHighlightedClass("h2", "font-semibold text-xl"),
          h3: withHighlightedClass("h3", "font-semibold text-lg"),
          h4: withHighlightedClass("h4", "font-semibold text-base"),
          h5: withHighlightedClass("h5", "font-medium"),
          li: withHighlightedClass("li", "my-1.5"),
          td: withHighlightedClass(
            "td",
            "border border-foreground/20 px-4 py-2 text-left [[align=center]]:text-center [[align=right]]:text-right"
          ),
          th: withHighlightedClass(
            "th",
            "border border-foreground/20 px-4 py-2 text-left font-bold [[align=center]]:text-center [[align=right]]:text-right"
          ),
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  children: React.ReactNode;
  className?: string;
  language: string;
}

const CodeBlock = ({
  children,
  className,
  language,
  ...restProps
}: CodeBlockProps) => {
  const code =
    typeof children === "string"
      ? children
      : childrenTakeAllStringContents(children);

  const preClass = cn(
    "overflow-x-scroll rounded-md border bg-background/50 p-4 font-mono text-sm [scrollbar-width:none]",
    className
  );

  return (
    <div className="group/code relative mb-4">
      <pre className={preClass} {...restProps}>
        <code>{code}</code>
      </pre>

      <div className="invisible absolute right-2 top-2 flex space-x-1 rounded-lg p-1 opacity-0 transition-all duration-200 group-hover/code:visible group-hover/code:opacity-100">
        <CopyButton content={code} copyMessage="Copied code to clipboard" />
      </div>
    </div>
  );
};

function childrenTakeAllStringContents(element: any): string {
  if (typeof element === "string") {
    return element;
  }

  if (element?.props?.children) {
    let children = element.props.children;

    if (Array.isArray(children)) {
      return children
        .map((child) => childrenTakeAllStringContents(child))
        .join("");
    } else {
      return childrenTakeAllStringContents(children);
    }
  }

  return "";
}

const COMPONENTS = {
  h1: withClass("h1", "text-2xl font-semibold"),
  h2: withClass("h2", "font-semibold text-xl"),
  h3: withClass("h3", "font-semibold text-lg"),
  h4: withClass("h4", "font-semibold text-base"),
  h5: withClass("h5", "font-medium"),
  strong: withClass("strong", "font-semibold"),
  a: withClass("a", "text-primary underline underline-offset-2"),
  blockquote: withClass("blockquote", "border-l-2 border-primary pl-4"),
  code: ({ children, className, node, ...rest }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    return match ? (
      <CodeBlock className={className} language={match[1]} {...rest}>
        {children}
      </CodeBlock>
    ) : (
      <code
        className={cn(
          "font-mono [:not(pre)>&]:rounded-md [:not(pre)>&]:bg-background/50 [:not(pre)>&]:px-1 [:not(pre)>&]:py-0.5"
        )}
        {...rest}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }: any) => children,
  ol: withClass("ol", "list-decimal space-y-2 pl-6"),
  ul: withClass("ul", "list-disc space-y-2 pl-6"),
  li: withClass("li", "my-1.5"),
  table: ({ node, className, children, ...props }: any) => (
    <div className="my-4 w-full overflow-hidden rounded-lg border border-foreground/20">
      <table className={cn("w-full border-collapse", className)} {...props}>
        {children}
      </table>
    </div>
  ),

  th: ({ node, className, ...props }: any) => (
    <th
      className={cn(
        "border border-foreground/20 px-4 py-2 text-left font-bold",
        "first:rounded-tl-lg last:rounded-tr-lg",
        "[[align=center]]:text-center [[align=right]]:text-right",
        className
      )}
      {...props}
    />
  ),

  td: ({ node, className, ...props }: any) => (
    <td
      className={cn(
        "border border-foreground/20 px-4 py-2 text-left",
        "[[align=center]]:text-center [[align=right]]:text-right",
        className
      )}
      {...props}
    />
  ),

  tr: ({ node, className, ...props }: any) => (
    <tr
      className={cn("m-0 border-t p-0 even:bg-muted", className)}
      {...props}
    />
  ),
  p: withClass("p", "whitespace-pre-wrap"),
  hr: withClass("hr", "border-foreground/20"),
};

function withClass(Tag: keyof React.JSX.IntrinsicElements, classes: string) {
  const Component = ({ node, ...props }: any) => (
    <Tag className={classes} {...props} />
  );
  Component.displayName = String(Tag);
  return Component;
}

const buildRegex = (highlight: string) => {
  if (!highlight.trim()) return null;

  const pattern = highlight
    .split("")
    .map((char) => {
      const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return escaped;
    })
    .join("\\s*");

  try {
    return new RegExp(pattern, "gi");
  } catch {
    return null;
  }
};

const stripMath = (content: string) => {
  // Keep search behavior aligned with KaTeX rendering (math isn't plain text anymore).
  return content
    .replace(/\$\$[\s\S]*?\$\$/g, "")
    .replace(/\$(?!\$)(?:\\.|[^$\\])*?\$(?!\$)/g, "");
};

const HighlightTextMatch = ({
  text,
  highlight,
  currentMatchIndex = 0,
  nextMatchIndex,
}: {
  text: string;
  highlight?: string;
  currentMatchIndex?: number;
  nextMatchIndex: () => number;
}): React.ReactNode => {
  if (!highlight?.trim()) {
    return text;
  }

  try {
    const regex = buildRegex(highlight);
    if (!regex) return text;

    const matches: Array<{ start: number; end: number; text: string }> = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
      });
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
    }

    if (matches.length === 0) return text;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((match) => {
      if (match.start > lastIndex) {
        parts.push(text.substring(lastIndex, match.start));
      }

      const matchIndex = nextMatchIndex();
      const isCurrentMatch = matchIndex === currentMatchIndex;

      parts.push(
        <mark
          key={matchIndex}
          data-match-index={matchIndex}
          className={cn(
            "rounded px-0.5",
            isCurrentMatch
              ? "bg-chart-1 text-primary-foreground"
              : "bg-chart-2 text-foreground"
          )}
        >
          {match.text}
        </mark>
      );

      lastIndex = match.end;
    });

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return <>{parts}</>;
  } catch {
    return text;
  }
};

export const Notes: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  const flatSections = useMemo(
    () => CAT_KB_PARTS.flatMap((part) => part.sections),
    []
  );

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
    () =>
      flatSections.map((section) => countMatches(searchQuery, section.content)),
    [countMatches, flatSections, searchQuery]
  );

  const totalMatches = useMemo(
    () => sectionMatchCounts.reduce((sum, count) => sum + count, 0),
    [sectionMatchCounts]
  );

  const sectionOffsets = useMemo(() => {
    let offset = 0;
    return sectionMatchCounts.map((count) => {
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
      const targetTop =
        elementRect.top - containerRect.top + container.scrollTop - 16;
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
      const element = document.querySelector(
        `[data-match-index="${currentMatchIndex}"]`
      );
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentMatchIndex, searchQuery, totalMatches]);

  const handleNext = () => {
    if (totalMatches > 0) {
      setCurrentMatchIndex((prev) => (prev + 1) % totalMatches);
    }
  };

  const handlePrevious = () => {
    if (totalMatches > 0) {
      setCurrentMatchIndex((prev) => (prev - 1 + totalMatches) % totalMatches);
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
            <p className="text-sm font-semibold text-foreground">
              CAT Knowledge Base
            </p>
            <p className="text-xs text-muted-foreground">
              Jump to a section or search inside the playbook.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSearchOpen((open) => !open)}
          >
            {isSearchOpen ? "Close search" : "Find"}
          </Button>
        </div>

        {isSearchOpen && (
          <div className="border-t px-3 py-2 sm:px-4">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Find in playbook..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentMatchIndex(0);
                }}
                className="min-w-[180px] flex-1"
                onKeyDown={(e) => {
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
                  {totalMatches > 0
                    ? `${currentMatchIndex + 1}/${totalMatches}`
                    : "0/0"}
                </span>
              )}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  disabled={totalMatches === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  disabled={totalMatches === 0}
                >
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
              {flatSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  className="whitespace-nowrap rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
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
              {CAT_KB_PARTS.map((part) => (
                <div key={part.id} className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {part.title}
                  </p>
                  <div className="space-y-1">
                    {part.sections.map((section) => (
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

        <section
          ref={contentRef}
          className="min-h-0 flex-1 overflow-y-auto p-4"
        >
          <div className="space-y-6">
            {CAT_KB_PARTS.map((part) => (
              <div key={part.id} className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>{part.title}</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                {part.sections.map((section) => {
                  const meta = sectionMeta.get(section.id);
                  return (
                    <article
                      key={section.id}
                      id={section.id}
                      className="scroll-mt-24 rounded-2xl border bg-background p-4 shadow-sm"
                    >
                      {meta?.matches ? (
                        <div className="mb-2 text-[11px] text-muted-foreground">
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
