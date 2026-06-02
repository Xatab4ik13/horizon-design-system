import { supabase } from "@/integrations/supabase/client";

export interface BlogPostListRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  created_at: string;
}

export interface BlogPostFullRow extends BlogPostListRow {
  content: string;
}

let listCache: BlogPostListRow[] | null = null;
let listInflight: Promise<BlogPostListRow[]> | null = null;
const postCache = new Map<string, BlogPostFullRow>();
const postInflight = new Map<string, Promise<BlogPostFullRow | null>>();

export function getCachedBlogList(): BlogPostListRow[] | null {
  return listCache;
}

export function fetchBlogList(): Promise<BlogPostListRow[]> {
  if (listCache) return Promise.resolve(listCache);
  if (listInflight) return listInflight;
  listInflight = (async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, cover_image, published_at, created_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    listCache = (data as BlogPostListRow[]) ?? [];
    // Seed post cache partials so post page can render headers instantly
    return listCache;
  })();
  return listInflight;
}

export function getCachedBlogPost(slug: string): BlogPostFullRow | null {
  return postCache.get(slug) ?? null;
}

export function fetchBlogPost(slug: string): Promise<BlogPostFullRow | null> {
  const cached = postCache.get(slug);
  if (cached) return Promise.resolve(cached);
  const inflight = postInflight.get(slug);
  if (inflight) return inflight;
  const p = (async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (data) postCache.set(slug, data as BlogPostFullRow);
    postInflight.delete(slug);
    return (data as BlogPostFullRow) ?? null;
  })();
  postInflight.set(slug, p);
  return p;
}
