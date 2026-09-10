import type { MetadataRoute } from "next";

const BASE_URL = "https://crm.covison.com";

// Only the pages that render the same way for every visitor, signed in or
// not, and are meant to be found by a search engine. Everything under the
// (app) route group needs a session (see robots.ts's disallow list) and
// has no reason to be here.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE_URL}/auth/sign-up`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/auth/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
