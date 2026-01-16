"use client";

import { BarChart3, ChevronDown, HelpCircle, MoreHorizontal } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { GameShellProps, HelpSheetContent } from "./game-shell.types";

function useElementHeight<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = () => {
      const next = Math.round(element.getBoundingClientRect().height);
      setHeight(prev => (prev === next ? prev : next));
    };

    update();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const observer = new ResizeObserver(() => update());
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, height };
}

function HeaderIconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onClick} aria-label={label}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function getHelpContent(helpSheetContent?: HelpSheetContent) {
  return {
    rules: helpSheetContent?.rules ?? <div className="text-sm text-muted-foreground">Add rules for this game.</div>,
    examples: helpSheetContent?.examples ?? (
      <div className="text-sm text-muted-foreground">Add worked examples here.</div>
    ),
    scoring: helpSheetContent?.scoring ?? (
      <div className="text-sm text-muted-foreground">Add scoring details here.</div>
    ),
    shortcuts: helpSheetContent?.shortcuts ?? (
      <div className="text-sm text-muted-foreground">Add keyboard or tap shortcuts here.</div>
    ),
  };
}

export function GameShell({
  headerLeft,
  headerCenter,
  headerRight,
  contextStrip,
  primaryCard,
  secondaryCard,
  feedbackSlot,
  bottomCoreActions,
  bottomGameControls,
  helpSheetContent,
  statsSheetContent,
  moreSheetContent,
  className,
}: GameShellProps) {
  const [statsOpen, setStatsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [controlsCollapsed, setControlsCollapsed] = useState(false);

  const { ref: bottomBarRef, height: bottomBarHeight } = useElementHeight<HTMLDivElement>();
  const contentPaddingBottom = bottomBarHeight || 72;
  const helpContent = getHelpContent(helpSheetContent);
  const containerClass = "mx-auto w-full max-w-7xl px-3 sm:px-6";

  return (
    <div className={cn("flex h-[calc(100dvh-48px)] flex-col overflow-hidden", className)}>
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className={cn("grid h-10 grid-cols-[1fr_auto_1fr] items-center gap-2", containerClass)}>
          <div className="flex min-w-0 items-center gap-2">{headerLeft}</div>
          <div className="min-w-0 max-w-[60vw] truncate text-center text-sm font-semibold">{headerCenter}</div>
          <div className="flex min-w-0 items-center justify-end gap-1.5">
            {headerRight}
            <HeaderIconButton label="Stats" onClick={() => setStatsOpen(true)}>
              <BarChart3 className="h-4 w-4" />
            </HeaderIconButton>
            <HeaderIconButton label="Help" onClick={() => setHelpOpen(true)}>
              <HelpCircle className="h-4 w-4" />
            </HeaderIconButton>
            <HeaderIconButton label="More" onClick={() => setMoreOpen(true)}>
              <MoreHorizontal className="h-4 w-4" />
            </HeaderIconButton>
          </div>
        </div>
        {contextStrip ? (
          <div className="border-t">
            <div className={cn("py-1.5", containerClass)}>
              <button
                type="button"
                onClick={() => setStatsOpen(true)}
                className="flex w-full items-center justify-between gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5 text-[11px] text-muted-foreground"
                aria-label="Open stats"
              >
                <div className="min-w-0 flex-1 overflow-hidden whitespace-nowrap">{contextStrip}</div>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </div>
          </div>
        ) : null}
      </header>

      <main className="flex-1 overflow-y-auto overscroll-contain" style={{ paddingBottom: contentPaddingBottom }}>
        <div className={cn("space-y-3 py-3", containerClass)}>
          <div className="game-surface">{primaryCard}</div>

          {feedbackSlot ? (
            <div
              className="rounded-md border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground"
              aria-live="polite"
            >
              {feedbackSlot}
            </div>
          ) : null}

          {secondaryCard ? <div className="game-surface">{secondaryCard}</div> : null}
        </div>
      </main>

      <div ref={bottomBarRef} className="sticky bottom-0 z-30 border-t bg-background/95 backdrop-blur">
        <div
          className={cn(
            controlsCollapsed
              ? "py-1.5 pb-[env(safe-area-inset-bottom)]"
              : "space-y-1.5 py-2 pb-[env(safe-area-inset-bottom)]",
            containerClass
          )}
        >
          {controlsCollapsed ? (
            <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>Controls hidden to save space.</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setControlsCollapsed(false)}
                aria-label="Show controls"
              >
                Show controls
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-nowrap items-center justify-center gap-2">
                {bottomCoreActions?.left ? (
                  <div className="flex items-center gap-2">{bottomCoreActions.left}</div>
                ) : null}
                {bottomCoreActions?.center ? (
                  <div className="flex items-center gap-2">{bottomCoreActions.center}</div>
                ) : null}
                <div className="flex items-center gap-2">
                  {bottomCoreActions?.right}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setControlsCollapsed(true)}
                    aria-label="Hide controls"
                    className="gap-2"
                  >
                    Hide
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {bottomGameControls ? <div className="border-t pt-1.5 text-[11px]">{bottomGameControls}</div> : null}
            </>
          )}
        </div>
      </div>

      <Sheet open={statsOpen} onOpenChange={setStatsOpen}>
        <SheetContent side="bottom" className="h-[85dvh] max-h-[85dvh] gap-0 p-0 pb-[env(safe-area-inset-bottom)]">
          <SheetHeader className="border-b">
            <SheetTitle className="text-base">Stats</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="p-4">
              {statsSheetContent ?? <div className="text-sm text-muted-foreground">Stats are not available yet.</div>}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Sheet open={helpOpen} onOpenChange={setHelpOpen}>
        <SheetContent side="bottom" className="h-[85dvh] max-h-[85dvh] gap-0 p-0 pb-[env(safe-area-inset-bottom)]">
          <SheetHeader className="border-b">
            <SheetTitle className="text-base">Help</SheetTitle>
          </SheetHeader>
          <Tabs defaultValue="rules" className="flex flex-1 flex-col gap-3 p-4 min-h-0">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
              <TabsTrigger value="scoring">Scoring</TabsTrigger>
              <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
            </TabsList>
            <TabsContent value="rules" className="flex-1 min-h-0">
              <ScrollArea className="h-full">{helpContent.rules}</ScrollArea>
            </TabsContent>
            <TabsContent value="examples" className="flex-1 min-h-0">
              <ScrollArea className="h-full">{helpContent.examples}</ScrollArea>
            </TabsContent>
            <TabsContent value="scoring" className="flex-1 min-h-0">
              <ScrollArea className="h-full">{helpContent.scoring}</ScrollArea>
            </TabsContent>
            <TabsContent value="shortcuts" className="flex-1 min-h-0">
              <ScrollArea className="h-full">{helpContent.shortcuts}</ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="h-[75dvh] max-h-[75dvh] gap-0 p-0 pb-[env(safe-area-inset-bottom)]">
          <SheetHeader className="border-b">
            <SheetTitle className="text-base">More</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="p-4">
              {moreSheetContent ?? <div className="text-sm text-muted-foreground">More options coming soon.</div>}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
