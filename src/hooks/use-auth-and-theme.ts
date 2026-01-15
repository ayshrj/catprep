"use client";

import { useTheme } from "next-themes";
import { useCallback } from "react";
import { toast } from "sonner";

export function useAuthAndTheme() {
  const { theme, setTheme } = useTheme();

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/";
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleThemeToggle = useCallback(() => {
    const current = theme ?? "system";
    const next = current === "system" ? "light" : current === "light" ? "dark" : "system";
    setTheme(next);
    toast.success(`Theme set to ${next}`);
  }, [theme, setTheme]);

  return {
    handleLogout,
    handleThemeToggle,
  };
}
