import { Suspense } from "react";

import { HomeClient } from "@/app/home-client";
import { Skeleton } from "@/components/ui/skeleton";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center px-6">
          <div className="w-full max-w-3xl space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-[40vh] w-full rounded-2xl" />
          </div>
        </div>
      }
    >
      <HomeClient />
    </Suspense>
  );
}
