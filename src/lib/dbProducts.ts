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

export const dbToUiProduct = (row: DbProductRow): Product => {
  const opts = row.options ?? {};
  const subFromOpts = typeof (opts as any).subcategory === "string" ? (opts as any).subcategory : undefined;
  const map = CATEGORY_MAP[row.category] ?? { category: row.category, subcategory: row.category };
  const subcategory = subFromOpts ?? map.subcategory;
  const material = typeof (opts as any).material === "string" ? (opts as any).material : "";
  const coating = typeof (opts as any).coating === "string" ? (opts as any).coating : "";
  const arModel = row.ar_glb_url || row.ar_usdz_url
    ? { glb: row.ar_glb_url ?? "", usdz: row.ar_usdz_url ?? "" }
    : undefined;
  return {
    id: row.id,
    sku: row.sku ?? row.id.slice(0, 8).toUpperCase(),
    name: row.name,
    price: Number(row.price),
    category: map.category,
    subcategory,
    material,
    coating,
    description: row.description ?? "",
    details: row.description ?? "",
    dimensions: formatDimensions(row.width_cm, row.height_cm, row.depth_cm),
    weight: row.weight_kg ? `${row.weight_kg} кг` : "",
    images: row.images && row.images.length > 0 ? row.images : ["/placeholder.svg"],
    inStock: true,
    arModel,
    reviews: [],
    qa: [],
    rating: 0,
  };
};

/** Хук — все активные товары из БД, преобразованные к UI-форме. */
export const useDbProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(error.message);
          setProducts([]);
        } else {
          setProducts((data ?? []).map((r) => dbToUiProduct(r as unknown as DbProductRow)));
        }
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
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setNotFound(true);
          setProduct(null);
        } else {
          setProduct(dbToUiProduct(data as unknown as DbProductRow));
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { product, loading, notFound };
};
