// Единый источник верхнеуровневых категорий каталога для главной, каталога и меню.
// Читает public.product_categories (RLS: только is_active=true).
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Фолбэк-картинки: если в БД не задан image_url — берём встроенный ассет по slug.
import categoryTable from "@/assets/category-table.png";
import categoryChairs from "@/assets/category-chairs.png";
import categoryDecor from "@/assets/category-decor.png";
import categoryShelves from "@/assets/category-shelves.png";
import categoryCrafts from "@/assets/category-crafts.png";
import categoryDoors from "@/assets/category-doors.png";

export const fallbackCategoryImage: Record<string, string> = {
  furniture: categoryTable,
  kitchen: categoryChairs,
  storage: categoryDecor,
  interior: categoryShelves,
  crafts: categoryCrafts,
  doors: categoryDoors,
};

export type ProductCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  show_on_home: boolean;
  show_in_menu: boolean;
  is_active: boolean;
};

let cache: ProductCategory[] | null = null;
let inflight: Promise<ProductCategory[]> | null = null;

export async function fetchProductCategories(): Promise<ProductCategory[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data, error } = await supabase
      .from("product_categories")
      .select("id,slug,name,description,image_url,sort_order,show_on_home,show_in_menu,is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) {
      console.error("fetchProductCategories failed", error);
      cache = [];
    } else {
      cache = (data ?? []) as ProductCategory[];
    }
    return cache;
  })();
  return inflight;
}

export function invalidateProductCategories() {
  cache = null;
  inflight = null;
}

export function useProductCategories(): ProductCategory[] {
  const [items, setItems] = useState<ProductCategory[]>(cache ?? []);
  useEffect(() => {
    let alive = true;
    fetchProductCategories().then((c) => {
      if (alive) setItems(c);
    });
    return () => { alive = false; };
  }, []);
  return items;
}

export function resolveCategoryImage(cat: Pick<ProductCategory, "slug" | "image_url">): string {
  const url = cat.image_url?.trim();
  if (url) return url;
  return fallbackCategoryImage[cat.slug] ?? "";
}
