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
    <aside
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border bg-background shadow-sm",
        className
      )}
    >
      {title || actions ? (
        <div
          className={cn(
            "flex items-center justify-between gap-2 border-b px-3 py-2",
            headerClassName
          )}
        >
          {title ? (
            <p className="text-sm font-medium text-foreground">{title}</p>
          ) : (
            <span />
          )}
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn("min-h-0 flex-1 px-3 py-3", contentClassName)}>
        {children}
      </div>
      {footer ? <div className="border-t p-3">{footer}</div> : null}
    </aside>
  );
}
