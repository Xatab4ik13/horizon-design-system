import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type HomepageContent = {
  hero?: {
    marqueeText?: string;
    videoUrl?: string;
  };
  popular?: {
    items?: { title?: string; tagline?: string; description?: string; cta?: string; image?: string }[];
  };
  categories?: {
    title?: string;
    items?: { name?: string; image?: string }[];
  };
  advantages?: {
    title?: string;
    items?: { title?: string; desc?: string }[];
  };
  contact?: {
    title?: string;
    subtitle?: string;
    consent?: string;
    submitLabel?: string;
  };
  footer?: {
    tagline?: string;
    phone?: string;
    email?: string;
    copyright?: string;
  };
};

let cache: HomepageContent | null = null;
let inflight: Promise<HomepageContent> | null = null;

export async function fetchHomepageContent(): Promise<HomepageContent> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "homepage")
      .maybeSingle();
    cache = ((data?.value as HomepageContent) ?? {}) as HomepageContent;
    return cache;
  })();
  return inflight;
}

export function invalidateHomepageContent() {
  cache = null;
  inflight = null;
}

export function useHomepageContent(): HomepageContent {
  const [content, setContent] = useState<HomepageContent>(cache ?? {});
  useEffect(() => {
    let alive = true;
    fetchHomepageContent().then((c) => {
      if (alive) setContent(c);
    });
    return () => {
      alive = false;
    };
  }, []);
  return content;
}

// ─── Nav menu (header items) ───
export type NavItem = { name: string; url: string };

let navCache: NavItem[] | null = null;
let navInflight: Promise<NavItem[] | null> | null = null;

export async function fetchNavMenu(): Promise<NavItem[] | null> {
  if (navCache) return navCache;
  if (navInflight) return navInflight;
  navInflight = (async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "nav_menu")
      .maybeSingle();
    const v = data?.value as { items?: NavItem[] } | null | undefined;
    navCache = (v?.items && Array.isArray(v.items) && v.items.length > 0) ? v.items : null;
    return navCache;
  })();
  return navInflight;
}

export function invalidateNavMenu() {
  navCache = null;
  navInflight = null;
}

export function useNavMenu(fallback: NavItem[]): NavItem[] {
  const [items, setItems] = useState<NavItem[]>(navCache ?? fallback);
  useEffect(() => {
    let alive = true;
    fetchNavMenu().then((c) => {
      if (alive && c) setItems(c);
    });
    return () => { alive = false; };
  }, []);
  return items;
}

// ─── Homepage block order ───
export type HomeBlockId = "hero" | "popular" | "categories" | "advantages" | "contact";

let blocksCache: HomeBlockId[] | null = null;
let blocksInflight: Promise<HomeBlockId[] | null> | null = null;

export async function fetchHomepageBlocks(): Promise<HomeBlockId[] | null> {
  if (blocksCache) return blocksCache;
  if (blocksInflight) return blocksInflight;
  blocksInflight = (async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "homepage_blocks")
      .maybeSingle();
    const v = data?.value as { order?: HomeBlockId[] } | null | undefined;
    blocksCache = (v?.order && Array.isArray(v.order) && v.order.length > 0) ? v.order : null;
    return blocksCache;
  })();
  return blocksInflight;
}

export function invalidateHomepageBlocks() {
  blocksCache = null;
  blocksInflight = null;
}

export function useHomepageBlocks(fallback: HomeBlockId[]): HomeBlockId[] {
  const [order, setOrder] = useState<HomeBlockId[]>(blocksCache ?? fallback);
  useEffect(() => {
    let alive = true;
    fetchHomepageBlocks().then((c) => { if (alive && c) setOrder(c); });
    return () => { alive = false; };
  }, []);
  return order;
}
