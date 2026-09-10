import type { MetadataRoute } from "next";

// Everything under the (app) route group (dashboard, contacts, deals, ...)
// requires a signed-in session; proxy.ts redirects a crawler there to
// /auth/login anyway, so there's nothing worth indexing behind it.
const DISALLOW = [
  "/auth/",
  "/invite/",
  "/onboarding",
  "/dashboard",
  "/contacts",
  "/companies",
  "/deals",
  "/pipeline",
  "/tasks",
  "/tickets",
  "/projects",
  "/emails",
  "/lead-types",
  "/settings",
  "/tags",
  "/team",
  "/reports",
];

// Explicitly listed rather than relying on the wildcard rule below to
// cover them too: naming them means a future rule change aimed at some
// other bot can't silently start blocking these as a side effect.
const AI_CRAWLERS = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow: DISALLOW })),
    ],
    sitemap: "https://crm.covison.com/sitemap.xml",
  };
}
