"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};

// The React-recommended way to detect "has this component hydrated on the
// client yet" without a setState-in-effect (flagged by
// react-hooks/set-state-in-effect): getServerSnapshot always returns false,
// so SSR and the first client render agree, then getSnapshot flips to true
// on the client-only re-render that follows.
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // resolvedTheme is undefined until after mount (next-themes reads
  // localStorage/system preference client-side only), so render a neutral
  // placeholder on the server to avoid a hydration mismatch.
  const mounted = useIsMounted();

  if (!mounted) {
    return <Button variant="ghost" size="icon" aria-label="Toggle theme" disabled />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
