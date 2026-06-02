import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/data/products";

// Запись из таблицы public.products
export interface DbProductRow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  discount_percent?: number | null;
  stock_status?: string | null;
  width_cm: number | null;
  height_cm: number | null;
  depth_cm: number | null;
  weight_kg: number | null;
  images: string[];
  options: Record<string, unknown>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  sku?: string | null;
  ar_glb_url?: string | null;
  ar_usdz_url?: string | null;
  material?: string | null;
  coating?: string | null;
  wood_species?: string | null;
  package_info?: string | null;
}

// Маппинг "категорий админки" в category/subcategory сайта
const CATEGORY_MAP: Record<string, { category: string; subcategory: string }> = {
  mirrors: { category: "interior", subcategory: "mirrors" },
  panels: { category: "interior", subcategory: "pano" },
  doors: { category: "doors", subcategory: "interior-doors" },
  furniture: { category: "furniture", subcategory: "tables" },
  kitchen: { category: "kitchen", subcategory: "cutting-boards" },
  storage: { category: "storage", subcategory: "hangers" },
  interior: { category: "interior", subcategory: "pano" },
  crafts: { category: "crafts", subcategory: "decoupage-bases" },
};

const formatDimensions = (
  w: number | null,
  h: number | null,
  d: number | null,
): string => {
  const parts = [w, h, d].filter((v): v is number => v !== null && v !== undefined);
  if (parts.length === 0) return "";
  return `${parts.join(" × ")} см`;
};

// "Наличие" из 1С: считаем "В наличии" / "" / "есть" — товар на складе;
// "На заказ", "Под заказ", "Нет" — товар не в моментальном наличии.
const isInStockStatus = (s?: string | null): boolean => {
  if (!s) return true; // нет данных — считаем доступным
  const t = s.toLowerCase().trim();
  if (!t) return true;
  if (/(на\s*заказ|под\s*заказ|нет|отсут)/i.test(t)) return false;
  return true;
};

export const dbToUiProduct = (row: DbProductRow): Product => {
  const opts = row.options ?? {};
  const subFromOpts = typeof (opts as any).subcategory === "string" ? (opts as any).subcategory : undefined;
  const map = CATEGORY_MAP[row.category] ?? { category: row.category, subcategory: row.category };
  const subcategory = subFromOpts ?? map.subcategory;
  const material =
    row.material ??
    (typeof (opts as any).material === "string" ? (opts as any).material : "") ??
    "";
  const coating =
    row.coating ??
    (typeof (opts as any).coating === "string" ? (opts as any).coating : "") ??
    "";
  const arModel = row.ar_glb_url || row.ar_usdz_url
    ? { glb: row.ar_glb_url ?? "", usdz: row.ar_usdz_url ?? "" }
    : undefined;

  const basePrice = Number(row.price);
  const discount = Math.max(0, Math.min(100, Number(row.discount_percent ?? 0)));
  const finalPrice = discount > 0 ? Math.round(basePrice * (1 - discount / 100)) : basePrice;
  const oldPrice = discount > 0 ? basePrice : undefined;

  // Вариации и карта картинок по варианту (из products.options)
  const rawVariations = Array.isArray((opts as any).variations) ? (opts as any).variations : undefined;
  const variations = rawVariations as Product["variations"] | undefined;
  const imagesByVariation =
    (opts as any).imagesByVariation && typeof (opts as any).imagesByVariation === "object"
      ? ((opts as any).imagesByVariation as Record<string, string>)
      : undefined;

  return {
    id: row.id,
    sku: row.sku ?? row.id.slice(0, 8).toUpperCase(),
    name: row.name,
    price: finalPrice,
    oldPrice,
    category: map.category,
    subcategory,
    material: material || "",
    coating: coating || "",
    description: row.description ?? "",
    details: row.description ?? "",
    dimensions: formatDimensions(row.width_cm, row.height_cm, row.depth_cm),
    weight: row.weight_kg ? `${row.weight_kg} кг` : "",
    images: row.images && row.images.length > 0 ? row.images : ["/placeholder.svg"],
    inStock: isInStockStatus(row.stock_status),
    arModel,
    variations,
    packageInfo: row.package_info ?? (typeof (opts as any).package_info === "string" ? (opts as any).package_info : (typeof (opts as any)["Упаковка"] === "string" ? (opts as any)["Упаковка"] : undefined)),
    imagesByVariation,
    reviews: [],
    qa: [],
    rating: 0,
  };
};

// ─── In-memory cache ───
let listCache: Product[] | null = null;
let listInflight: Promise<Product[]> | null = null;
const productCache = new Map<string, Product>();
const productInflight = new Map<string, Promise<Product | null>>();

const seedProductCache = (products: Product[]) => {
  for (const p of products) productCache.set(p.id, p);
};

export const fetchAllProducts = (): Promise<Product[]> => {
  if (listCache) return Promise.resolve(listCache);
  if (listInflight) return listInflight;
  listInflight = (async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      listInflight = null;
      throw error;
    }
    const mapped = (data ?? []).map((r) => dbToUiProduct(r as unknown as DbProductRow));
    listCache = mapped;
    seedProductCache(mapped);
    return mapped;
  })();
  return listInflight;
};

export const fetchProductById = (id: string): Promise<Product | null> => {
  const cached = productCache.get(id);
  if (cached) return Promise.resolve(cached);
  const inflight = productInflight.get(id);
  if (inflight) return inflight;
  // If we have a full list cache and product not in it, it doesn't exist
  if (listCache) return Promise.resolve(null);
  const p = (async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();
    productInflight.delete(id);
    if (!data) return null;
    const product = dbToUiProduct(data as unknown as DbProductRow);
    productCache.set(id, product);
    return product;
  })();
  productInflight.set(id, p);
  return p;
};

/** Хук — все активные товары из БД, преобразованные к UI-форме. */
export const useDbProducts = () => {
  const [products, setProducts] = useState<Product[]>(() => listCache ?? []);
  const [loading, setLoading] = useState(!listCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAllProducts()
      .then((data) => {
        if (cancelled) return;
        setProducts(data);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message ?? "Error");
        setProducts([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading, error };
};

/** Загрузка одного товара по id. */
export const useDbProduct = (id: string | undefined) => {
  const initial = id ? productCache.get(id) ?? null : null;
  const [product, setProduct] = useState<Product | null>(initial);
  const [loading, setLoading] = useState(!initial && !!id);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    const cached = productCache.get(id);
    if (cached) {
      setProduct(cached);
      setLoading(false);
      setNotFound(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    fetchProductById(id).then((p) => {
      if (cancelled) return;
      if (!p) {
        setNotFound(true);
        setProduct(null);
      } else {
        setProduct(p);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { product, loading, notFound };
};

export const prefetchProduct = (id: string) => {
  if (!id || productCache.has(id) || productInflight.has(id)) return;
  void fetchProductById(id);
};
