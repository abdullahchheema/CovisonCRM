"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Scroll-reveal used only on the marketing site, the app itself has no
// scroll-triggered motion. Plays the slide-up keyframe from globals.css
// once the element enters the viewport, then disconnects.
// prefers-reduced-motion is already handled globally there (durations
// forced to ~0), so this needs no separate check.
export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn(visible ? "animate-slide-up" : "opacity-0", className)}>
      {children}
    </div>
  );
}
