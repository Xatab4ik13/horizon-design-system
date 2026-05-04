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
