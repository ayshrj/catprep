import Link from "next/link";
import type { ReactNode } from "react";

import Logo from "@/lib/logo";

type AppNavbarProps = {
  title: string;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function AppNavbar({ title, subtitle, leading, trailing }: AppNavbarProps) {
  return (
    <div className="sticky top-0 z-40 h-12 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-3 px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {leading}
          <div className="min-w-0">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-5 w-5" />
              <div className="truncate text-base font-semibold tracking-tight">{title}</div>
            </Link>
            {subtitle ? <div className="truncate text-[11px] text-muted-foreground">{subtitle}</div> : null}
          </div>
        </div>
        {trailing ? <div className="flex items-center gap-2">{trailing}</div> : null}
      </div>
    </div>
  );
}
