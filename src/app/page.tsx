import { Suspense } from "react";

import { HomeClient } from "@/app/home-client";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">Loading...</div>
      }
    >
      <HomeClient />
    </Suspense>
  );
}
