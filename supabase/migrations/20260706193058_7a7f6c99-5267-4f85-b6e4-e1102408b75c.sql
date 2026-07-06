CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  show_on_home BOOLEAN NOT NULL DEFAULT true,
  show_in_menu BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_categories TO anon;
GRANT SELECT ON public.product_categories TO authenticated;
GRANT ALL ON public.product_categories TO service_role;

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active categories"
  ON public.product_categories FOR SELECT
  USING (is_active = true);

CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX product_categories_sort_idx ON public.product_categories (sort_order, name);

-- Seed из текущего хардкода (данные из src/data/products.ts).
-- image_url оставляем NULL — на фронте фолбэк на встроенные ассеты по slug.
INSERT INTO public.product_categories (slug, name, sort_order, show_on_home, show_in_menu, is_active) VALUES
  ('furniture', 'Мебель', 10, true, true, true),
  ('kitchen', 'Кухонные принадлежности', 20, true, true, true),
  ('storage', 'Системы хранения', 30, true, true, true),
  ('interior', 'Предметы интерьера', 40, true, true, true),
  ('crafts', 'Заготовки для творчества', 50, true, true, true),
  ('doors', 'Двери', 60, true, true, true)
ON CONFLICT (slug) DO NOTHING;