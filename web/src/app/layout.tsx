import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import "./globals.css";

// One family for everything — headlines and body both — per the "bold,
// professional, minimalist" direction: a single strong grotesque rather
// than the serif+sans pairing this design started with. Variable weight
// covers both the bold headline weights and regular body text from one
// font file. --font-display and --font-sans both point at this same
// variable in globals.css, so every existing `font-display`/`font-sans`
// className site across the app repoints without being touched.
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal"],
  display: "swap",
});

export const metadata: Metadata = {
  // Resolves the opengraph-image/icon routes to an absolute URL. VERCEL_URL
  // is set automatically by Vercel at build time to the deployment's own
  // domain — falling back to localhost only matters for a local build,
  // never for what actually ships.
  metadataBase: new URL(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000",
  ),
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
      className={`${geist.variable} h-full antialiased`}
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
