#!/usr/bin/env bash
# Применяет все миграции из supabase/migrations по порядку
# и создаёт публичные storage-бакеты.
# Запускать после `docker compose up -d` на VM из /opt/faktura/server.
set -euo pipefail

MIGRATIONS_DIR="${MIGRATIONS_DIR:-../supabase/migrations}"
DB_CONTAINER="${DB_CONTAINER:-supabase-db}"

echo "==> Применяю миграции из $MIGRATIONS_DIR"
for f in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
  echo "  -> $(basename "$f")"
  docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$f"
done

echo "==> Создаю storage-бакеты"
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO storage.buckets (id, name, public) VALUES
  ('product-images',  'product-images',  true),
  ('product-models',  'product-models',  true),
  ('blog-images',     'blog-images',     true),
  ('site-images',     'site-images',     true),
  ('site-documents',  'site-documents',  true)
ON CONFLICT (id) DO NOTHING;
SQL

echo "==> Готово. Осталось задеплоить edge-функции (supabase/functions/*)."
