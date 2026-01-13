import { Loader2, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const ThemeTogglePlugin = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loader until hydration is complete and theme is resolved
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="p-2" disabled>
        <Loader2 className="animate-spin size-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={"ghost"}
          onClick={() => setTheme(isDark ? "light" : "dark")}
          title="Theme"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          size={"sm"}
          className="p-2"
        >
          {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}</TooltipContent>
    </Tooltip>
  );
};
