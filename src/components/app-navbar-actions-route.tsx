"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { AppNavbarActions } from "@/components/app-navbar-actions";

type NavValue = "chat" | "notes" | "chapter" | "saved" | "games" | "papers" | "timer";

type AppNavbarActionsRouteProps = Omit<React.ComponentProps<typeof AppNavbarActions>, "onChange"> & {
  value: NavValue;
};

export function AppNavbarActionsRoute(props: AppNavbarActionsRouteProps) {
  const router = useRouter();

  const handleChange = useCallback(
    (next: NavValue) => {
      if (next === "saved") {
        router.push("/rough-notes");
      } else {
        router.push(`/${next}`);
      }
    },
    [router]
  );

  return <AppNavbarActions {...props} onChange={handleChange} />;
}
