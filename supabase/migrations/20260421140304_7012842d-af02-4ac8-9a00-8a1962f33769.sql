-- Настройки магазина (адрес отправителя и пр.)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Публичных политик нет: читать/писать только через admin-api (service role).

-- Поля доставки в orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_provider TEXT,           -- 'yandex' | 'pek' | 'pickup'
  ADD COLUMN IF NOT EXISTS delivery_cost NUMERIC,
  ADD COLUMN IF NOT EXISTS delivery_days TEXT,
  ADD COLUMN IF NOT EXISTS delivery_city TEXT,
  ADD COLUMN IF NOT EXISTS delivery_tracking TEXT,
  ADD COLUMN IF NOT EXISTS delivery_external_id TEXT,        -- claim_id Яндекса / orderID ПЭК
  ADD COLUMN IF NOT EXISTS delivery_payload JSONB;           -- сырой ответ перевозчика

-- Дефолтные настройки отправителя (заглушка, отредактируете в админке)
INSERT INTO public.app_settings (key, value)
VALUES (
  'sender',
  jsonb_build_object(
    'city', 'Москва',
    'address', 'Москва, ул. Примерная, 1',
    'contact_name', 'FAKTURA',
    'contact_phone', '+79991234567',
    'pek_city_id', ''
  )
)
ON CONFLICT (key) DO NOTHING;