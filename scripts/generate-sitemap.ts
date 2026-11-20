// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Fetches dynamic entries (blog posts, products, categories) from the same API the site uses,
// reading VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY from .env at build time.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { pathToFileURL } from "node:url";
import { SITE_URL, publicRows, publishedArticles } from "./seo-data";

// Домен боевого сайта (уже используется в robots.txt).
const BASE_URL = SITE_URL;

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/catalog", changefreq: "daily", priority: "0.9" },
  { path: "/gallery", changefreq: "weekly", priority: "0.7" },
  { path: "/blog", changefreq: "daily", priority: "0.7" },
  { path: "/services", changefreq: "monthly", priority: "0.7" },
  { path: "/delivery", changefreq: "monthly", priority: "0.6" },
  { path: "/contacts", changefreq: "monthly", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/services/cnc-milling", changefreq: "monthly", priority: "0.8" },
];

async function fetchRows(): Promise<SitemapEntry[]> {
  const [categories, products, posts] = await Promise.all([
    publicRows<{ slug: string }>("product_categories?select=slug&is_active=eq.true&order=sort_order.asc,slug.asc"),
    publicRows<{ id: string }>("products?select=id&is_active=eq.true&order=id.asc"),
    publishedArticles(),
  ]);
  // Publication date is page-specific; never substitute build time or creation time.
  return [
    ...categories.map(r => ({ path: `/catalog?category=${encodeURIComponent(r.slug)}`, priority: "0.8" })),
    ...products.map(r => ({ path: `/product/${encodeURIComponent(r.id)}`, priority: "0.8" })),
    ...posts.map(r => ({ path: `/blog/${encodeURIComponent(r.slug)}`, lastmod: r.published_at?.slice(0, 10), priority: "0.6" })),
  ];
}

export function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${xmlEscape(e.path)}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}

async function main() {
  const dynamicEntries = await fetchRows();

  const entries = [...staticEntries, ...dynamicEntries];
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
  console.log(`sitemap.xml written (${entries.length} entries: ${staticEntries.length} static + ${dynamicEntries.length} dynamic)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
