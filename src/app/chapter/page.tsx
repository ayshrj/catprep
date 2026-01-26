"use client";

import { PanelLeft } from "lucide-react";
import { useCallback, useState } from "react";

import { APP_CONTENT_HEIGHT, AppContent } from "@/components/app-content";
import { AppNavbar } from "@/components/app-navbar";
import { AppNavbarActionsRoute } from "@/components/app-navbar-actions-route";
import { AppSidebar } from "@/components/app-sidebar";
import { Pnc } from "@/components/pnc";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuthAndTheme } from "@/hooks/use-auth-and-theme";
import { PNC_PARTS } from "@/lib/pnc";

export default function ChapterPage() {
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const { handleLogout, handleThemeToggle } = useAuthAndTheme();

  const handleSectionClick = useCallback((sectionId: string) => {
    if (typeof window !== "undefined") {
      const hash = sectionId.startsWith("#") ? sectionId : `#${sectionId}`;
      if (window.location.hash !== hash) {
        window.history.replaceState(null, "", hash);
        window.dispatchEvent(new Event("hashchange"));
      } else {
        window.dispatchEvent(new Event("hashchange"));
      }
    }
    setChaptersOpen(false);
  }, []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <AppNavbar
        title="Cat99"
        subtitle="Chapter"
        leading={
          <div className="md:hidden">
            <Sheet open={chaptersOpen} onOpenChange={setChaptersOpen}>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" size="icon" aria-label="Chapters">
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[92vw] max-w-[22rem] p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Chapters</SheetTitle>
                </SheetHeader>
                <AppSidebar
                  title="Chapters"
                  className="h-full w-full rounded-none border-0 shadow-none"
                  contentClassName="p-0"
                >
                  <ScrollArea className="h-full">
                    <div className="space-y-4 p-4">
                      {PNC_PARTS.map(part => (
                        <div key={part.id} className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {part.title}
                          </p>
                          <div className="space-y-1">
                            {part.sections.map(section => (
                              <button
                                key={section.id}
                                type="button"
                                onClick={() => handleSectionClick(section.id)}
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
              </SheetContent>
            </Sheet>
          </div>
        }
        trailing={<AppNavbarActionsRoute value="chapter" onLogout={handleLogout} onThemeToggle={handleThemeToggle} />}
      />

      <AppContent className={APP_CONTENT_HEIGHT}>
        <div className="h-full min-h-0 py-3 sm:py-4">
          <Pnc />
        </div>
      </AppContent>
    </div>
  );
}
