import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppSidebarProps = {
  title?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
};

export function AppSidebar({
  title,
  actions,
  footer,
  children,
  className,
  headerClassName,
  contentClassName,
}: AppSidebarProps) {
  return (
    <aside className={cn("flex h-full flex-col overflow-hidden rounded-3xl border bg-card shadow-sm", className)}>
      {title || actions ? (
        <div className={cn("flex items-center justify-between gap-2 border-b px-4 py-3", headerClassName)}>
          {title ? <p className="text-sm font-semibold text-foreground">{title}</p> : <span />}
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-3", contentClassName)}>{children}</div>
      {footer ? <div className="border-t px-4 py-3">{footer}</div> : null}
    </aside>
  );
}
