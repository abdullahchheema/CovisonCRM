import type { Metadata } from "next";
import { Instrument_Serif, Inter_Tight } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import "./globals.css";

// UI sans — variable weight, used everywhere text-* utilities already are.
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

// Display serif — headlines, hero numerals, marketing copy. Google only
// ships this at weight 400; that's the intended editorial character, not a
// missing config.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Covison CRM",
  description: "One workspace for contacts, deals, tasks, and communication.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning is required by next-themes: it sets the
    // .dark class via an inline script before React hydrates (to avoid a
    // flash of the wrong theme), which would otherwise show as a mismatch.
    <html
      lang="en"
      className={`${interTight.variable} ${instrumentSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          {/* richColors removed — Toaster now themes off the [data-sonner-toaster]
              CSS custom properties defined in globals.css, so toasts follow
              our palette instead of sonner's baked-in one. */}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
