// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Fetches dynamic entries (blog posts, products, categories) from the same API the site uses,
// reading VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY from .env at build time.

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

// Домен боевого сайта (уже используется в robots.txt).
const BASE_URL = "https://faktura-wood.com";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const file of [".env", ".env.production", ".env.local"]) {
    if (!existsSync(resolve(file))) continue;
    for (const line of readFileSync(resolve(file), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (m) env[m[1]] = m[2];
    }
  }
  return env;
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
];

async function fetchRows(restUrl: string, headers: Record<string, string>): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [];
  // Категории каталога (активные)
  try {
    const res = await fetch(`${restUrl}/product_categories?select=slug&is_active=eq.true&order=sort_order.asc`, { headers });
    if (res.ok) {
      const rows = (await res.json()) as { slug: string }[];
      for (const r of rows) {
        entries.push({ path: `/catalog?category=${encodeURIComponent(r.slug)}`, changefreq: "weekly", priority: "0.8" });
      }
    }
  } catch { /* категории опциональны */ }
  // Товары (активные)
  try {
    const res = await fetch(`${restUrl}/products?select=id&is_active=eq.true`, { headers });
    if (res.ok) {
      const rows = (await res.json()) as { id: string }[];
      for (const r of rows) {
        entries.push({ path: `/product/${encodeURIComponent(r.id)}`, changefreq: "weekly", priority: "0.8" });
      }
    }
  } catch { /* товары опциональны */ }
  // Статьи блога (опубликованные)
  try {
    const res = await fetch(`${restUrl}/blog_posts?select=slug,published_at,created_at&is_published=eq.true&order=published_at.desc`, { headers });
    if (res.ok) {
      const rows = (await res.json()) as { slug: string; published_at: string | null; created_at: string | null }[];
      for (const r of rows) {
        const date = (r.published_at ?? r.created_at)?.slice(0, 10);
        entries.push({ path: `/blog/${encodeURIComponent(r.slug)}`, lastmod: date, changefreq: "monthly", priority: "0.6" });
      }
    }
  } catch { /* блог опционален */ }
  return entries;
}

function generateSitemap(entries: SitemapEntry[]) {
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
  const env = loadEnv();
  const url = (env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

  let dynamicEntries: SitemapEntry[] = [];
  if (url && key) {
    const headers = { apikey: key, Authorization: `Bearer ${key}` };
    dynamicEntries = await fetchRows(`${url}/rest/v1`, headers);
  } else {
    console.warn("sitemap: VITE_SUPABASE_URL/KEY не найдены — пишем только статические страницы");
  }

  const entries = [...staticEntries, ...dynamicEntries];
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
  console.log(`sitemap.xml written (${entries.length} entries: ${staticEntries.length} static + ${dynamicEntries.length} dynamic)`);
}

main();
