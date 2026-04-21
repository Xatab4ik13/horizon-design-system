-- Поля для AR-моделей
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS ar_glb_url TEXT,
  ADD COLUMN IF NOT EXISTS ar_usdz_url TEXT;

-- Бакет для AR-моделей (публичный)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-models', 'product-models', true)
ON CONFLICT (id) DO NOTHING;

-- Публичное чтение моделей
DROP POLICY IF EXISTS "Public read product-models" ON storage.objects;
CREATE POLICY "Public read product-models"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-models');