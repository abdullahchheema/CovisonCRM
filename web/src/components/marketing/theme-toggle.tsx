"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};

// next-themes resolves the theme on the client, so the first server render
// can't know which icon to show. Rendering a placeholder until mounted
// avoids a hydration mismatch, same approach the app's UserMenu uses for
// its theme options.
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

// The marketing site inherits the visitor's OS theme (next-themes is set to
// `system`), but until now nothing out here could change it, a visitor on a
// dark OS got the dark site with no say in it. The app has this control in
// the user menu; the public pages need their own.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsMounted();

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={mounted ? (isDark ? "Switch to light theme" : "Switch to dark theme") : "Switch theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {/* Before mount, render the sun as a neutral placeholder so the button
          keeps its footprint and the header doesn't shift. */}
      {mounted && isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </Button>
  );
}
