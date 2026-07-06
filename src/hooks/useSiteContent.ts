import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type HomepageContent = {
  hero?: {
    marqueeText?: string;
    marqueeEnabled?: boolean;
    videoUrl?: string;
    posterUrl?: string;
  };
  popular?: {
    bgImage?: string;
    items?: { title?: string; tagline?: string; description?: string; cta?: string; image?: string; enabled?: boolean }[];
  };
  categories?: {
    title?: string;
    bgImage?: string;
    items?: { name?: string; image?: string; enabled?: boolean }[];
  };
  advantages?: {
    title?: string;
    bgImage?: string;
    items?: { title?: string; desc?: string; enabled?: boolean }[];
  };
  contact?: {
    title?: string;
    subtitle?: string;
    consent?: string;
    submitLabel?: string;
    bgImage?: string;
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

const NAV_LS_KEY = "site:nav_menu:v1";

function readNavLS(): NavItem[] | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(NAV_LS_KEY) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((i) => i && typeof i.name === "string" && typeof i.url === "string")) {
      return parsed;
    }
  } catch {}
  return null;
}

function writeNavLS(items: NavItem[] | null) {
  try {
    if (typeof window === "undefined") return;
    if (items && items.length > 0) localStorage.setItem(NAV_LS_KEY, JSON.stringify(items));
    else localStorage.removeItem(NAV_LS_KEY);
  } catch {}
}

let navCache: NavItem[] | null = readNavLS();
let navInflight: Promise<NavItem[] | null> | null = null;

export async function fetchNavMenu(): Promise<NavItem[] | null> {
  if (navInflight) return navInflight;
  navInflight = (async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "nav_menu")
      .maybeSingle();
    const v = data?.value as { items?: NavItem[] } | null | undefined;
    const next = (v?.items && Array.isArray(v.items) && v.items.length > 0) ? v.items : null;
    navCache = next;
    writeNavLS(next);
    return navCache;
  })();
  return navInflight;
}

export function invalidateNavMenu() {
  navCache = null;
  navInflight = null;
  writeNavLS(null);
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

// ─── Page headers (catalog/services/gallery/delivery/contacts) ───
export type PageKey = "catalog" | "services" | "gallery" | "delivery" | "contacts";
export type PageHeader = { title?: string; subtitle?: string };
export type PagesContent = Partial<Record<PageKey, PageHeader>>;

let pagesCache: PagesContent | null = null;
let pagesInflight: Promise<PagesContent> | null = null;

export async function fetchPagesContent(): Promise<PagesContent> {
  if (pagesCache) return pagesCache;
  if (pagesInflight) return pagesInflight;
  pagesInflight = (async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "pages")
      .maybeSingle();
    pagesCache = ((data?.value as PagesContent) ?? {}) as PagesContent;
    return pagesCache;
  })();
  return pagesInflight;
}

export function invalidatePagesContent() {
  pagesCache = null;
  pagesInflight = null;
}

export function usePageHeader(key: PageKey, fallback: PageHeader): PageHeader {
  const [h, setH] = useState<PageHeader>(pagesCache?.[key] ?? fallback);
  useEffect(() => {
    let alive = true;
    fetchPagesContent().then((c) => {
      if (!alive) return;
      const v = c?.[key];
      setH({
        title: v?.title?.trim() || fallback.title,
        subtitle: v?.subtitle?.trim() || fallback.subtitle,
      });
    });
    return () => { alive = false; };
  }, [key]);
  return h;
}

// ─── Contacts page ───
export type ContactsContent = {
  contacts?: { title?: string; value?: string; href?: string; note?: string; type?: "phone" | "email" | "messenger" | "address" }[];
  hours?: { day?: string; time?: string }[];
  hoursNote?: string;
  careers?: { title?: string; intro?: string; ctaTitle?: string; ctaText?: string; email?: string; phone?: string };
};

let contactsCache: ContactsContent | null = null;
let contactsInflight: Promise<ContactsContent> | null = null;

export async function fetchContactsContent(): Promise<ContactsContent> {
  if (contactsCache) return contactsCache;
  if (contactsInflight) return contactsInflight;
  contactsInflight = (async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "contacts_page")
      .maybeSingle();
    contactsCache = ((data?.value as ContactsContent) ?? {}) as ContactsContent;
    return contactsCache;
  })();
  return contactsInflight;
}

export function invalidateContactsContent() {
  contactsCache = null;
  contactsInflight = null;
}

export function useContactsContent(): ContactsContent {
  const [c, setC] = useState<ContactsContent>(contactsCache ?? {});
  useEffect(() => {
    let alive = true;
    fetchContactsContent().then((v) => { if (alive) setC(v); });
    return () => { alive = false; };
  }, []);
  return c;
}

// ─── Services page ───
export type ServicesContent = {
  items?: { title?: string; description?: string; features?: string[]; timing?: string; price?: string; enabled?: boolean }[];
  downloadsTitle?: string;
  cta?: { title?: string; text?: string; primary?: string; secondary?: string; phone?: string };
};

let servicesCache: ServicesContent | null = null;
let servicesInflight: Promise<ServicesContent> | null = null;

export async function fetchServicesContent(): Promise<ServicesContent> {
  if (servicesCache) return servicesCache;
  if (servicesInflight) return servicesInflight;
  servicesInflight = (async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "services_page")
      .maybeSingle();
    servicesCache = ((data?.value as ServicesContent) ?? {}) as ServicesContent;
    return servicesCache;
  })();
  return servicesInflight;
}

export function invalidateServicesContent() {
  servicesCache = null;
  servicesInflight = null;
}

export function useServicesContent(): ServicesContent {
  const [c, setC] = useState<ServicesContent>(servicesCache ?? {});
  useEffect(() => {
    let alive = true;
    fetchServicesContent().then((v) => { if (alive) setC(v); });
    return () => { alive = false; };
  }, []);
  return c;
}


// ─── Delivery & Payment page ───
export type DeliveryContent = {
  companies?: {
    name?: string;
    logo?: string;
    description?: string;
    timing?: string;
    features?: string[];
    enabled?: boolean;
  }[];
  pickup?: {
    title?: string;
    subtitle?: string;
    description?: string;
    features?: string[];
    address?: string;
    hours?: string;
    phone?: string;
  };
  packaging?: {
    title?: string;
    items?: { title?: string; desc?: string }[];
  };
  paymentMethods?: {
    name?: string;
    description?: string;
    icon?: "card" | "shield" | "receipt" | "tag";
    enabled?: boolean;
  }[];
  faq?: { q?: string; a?: string }[];
};

let deliveryCache: DeliveryContent | null = null;
let deliveryInflight: Promise<DeliveryContent> | null = null;

export async function fetchDeliveryContent(): Promise<DeliveryContent> {
  if (deliveryCache) return deliveryCache;
  if (deliveryInflight) return deliveryInflight;
  deliveryInflight = (async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "delivery_page")
      .maybeSingle();
    deliveryCache = ((data?.value as DeliveryContent) ?? {}) as DeliveryContent;
    return deliveryCache;
  })();
  return deliveryInflight;
}

export function invalidateDeliveryContent() {
  deliveryCache = null;
  deliveryInflight = null;
}

export function useDeliveryContent(): DeliveryContent {
  const [c, setC] = useState<DeliveryContent>(deliveryCache ?? {});
  useEffect(() => {
    let alive = true;
    fetchDeliveryContent().then((v) => { if (alive) setC(v); });
    return () => { alive = false; };
  }, []);
  return c;
}

// ─── SEO metadata (per-page) ───
export type SeoPageKey =
  | "home"
  | "catalog"
  | "gallery"
  | "services"
  | "delivery"
  | "blog"
  | "contacts";

export type SeoPageValue = {
  title?: string;
  description?: string;
  ogImage?: string;
  noindex?: boolean;
};

export type SeoContent = Partial<Record<SeoPageKey, SeoPageValue>>;

let seoCache: SeoContent | null = null;
let seoInflight: Promise<SeoContent> | null = null;

export async function fetchSeoContent(): Promise<SeoContent> {
  if (seoCache) return seoCache;
  if (seoInflight) return seoInflight;
  seoInflight = (async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "seo")
      .maybeSingle();
    seoCache = ((data?.value as SeoContent) ?? {}) as SeoContent;
    return seoCache;
  })();
  return seoInflight;
}

export function invalidateSeoContent() {
  seoCache = null;
  seoInflight = null;
}

export function useSeoPage(key?: SeoPageKey): SeoPageValue | undefined {
  const [v, setV] = useState<SeoPageValue | undefined>(key ? seoCache?.[key] : undefined);
  useEffect(() => {
    if (!key) { setV(undefined); return; }
    let alive = true;
    fetchSeoContent().then((c) => { if (alive) setV(c?.[key]); });
    return () => { alive = false; };
  }, [key]);
  return v;
}
