import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const APP_CONTENT_HEIGHT = "h-[calc(100dvh-49px)] md:h-[calc(100dvh-57px)]";

export function AppContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-7xl min-h-0 px-3 sm:px-6", className)}>{children}</div>;
}
