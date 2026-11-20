import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export const SITE_URL = "https://faktura-wood.com";
export interface PublishedArticle {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
}

export function apiConfig() {
  const env: Record<string, string> = {};
  for (const file of [".env", ".env.production", ".env.local"]) {
    if (!existsSync(resolve(file))) continue;
    for (const line of readFileSync(resolve(file), "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*["']?([^"'\n]*)["']?\s*$/);
      if (match) env[match[1]] = match[2].trim();
    }
  }
  // Hosting environment must win over the checked-out preview configuration.
  const url = (process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  if (!url || !key) throw new Error("SEO: missing site API configuration; existing sitemap left unchanged");
  return { url, key };
}

export async function publicRows<T>(query: string): Promise<T[]> {
  const { url, key } = apiConfig();
  const rows: T[] = [];
  for (let offset = 0; ; offset += 1000) {
    const response = await fetch(`${url}/rest/v1/${query}&limit=1000&offset=${offset}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`SEO: API returned ${response.status}; refusing incomplete pages`);
    const batch = await response.json() as T[];
    if (!Array.isArray(batch)) throw new Error("SEO: invalid API response");
    rows.push(...batch);
    if (batch.length < 1000) return rows;
  }
}

export function publishedArticles() {
  return publicRows<PublishedArticle>("blog_posts?select=slug,title,excerpt,content,seo_title,seo_description,published_at,created_at&is_published=eq.true&order=published_at.desc,slug.asc");
}