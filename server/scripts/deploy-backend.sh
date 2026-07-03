#!/usr/bin/env bash
# Деплой backend-части FAKTURA на self-hosted сервере в Яндекс.Облаке.
# Запускать на сервере из /opt/faktura/server:
#   bash scripts/deploy-backend.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SERVER_DIR="$ROOT_DIR/server"
MIGRATIONS_DIR="$ROOT_DIR/supabase/migrations"
FUNCTIONS_SRC="$ROOT_DIR/supabase/functions"
FUNCTIONS_DST="$SERVER_DIR/volumes/functions"
DB_CONTAINER="${DB_CONTAINER:-supabase-db}"

cd "$SERVER_DIR"

echo "==> Обновляю код из GitHub"
git pull --ff-only

echo "==> Проверяю backend-контейнеры"
docker compose ps >/dev/null

psql_exec() {
  docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 "$@"
}

table_exists() {
  local table="$1"
  docker exec "$DB_CONTAINER" psql -U postgres -d postgres -tAc \
    "select to_regclass('public.${table}') is not null" | tr -d '[:space:]'
}

apply_if_table_missing() {
  local table="$1"
  local file="$2"
  if [[ "$(table_exists "$table")" == "t" ]]; then
    echo "  -> $table уже есть, пропускаю $file"
  else
    echo "  -> применяю $file"
    psql_exec < "$MIGRATIONS_DIR/$file"
  fi
}

echo "==> Накатываю новые миграции админки/галереи/email/платежей"
apply_if_table_missing "gallery_items" "20260703121524_4a279bd2-6bfc-404e-be96-e788e743de9d.sql"
apply_if_table_missing "email_log" "20260703123557_79cdea4b-50c0-4cb7-8946-2682bbe8b2f7.sql"
apply_if_table_missing "payment_log" "20260703124312_a5ae3479-60b9-4721-943e-f26335b88762.sql"

echo "==> Дожимаю grants/колонки на случай частичного прогона"
psql_exec <<'SQL'
GRANT SELECT ON public.gallery_items TO anon;
GRANT SELECT ON public.gallery_items TO authenticated;
GRANT ALL ON public.gallery_items TO service_role;

GRANT ALL ON public.email_log TO service_role;
GRANT ALL ON public.payment_log TO service_role;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT,
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_url TEXT,
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(12, 2) DEFAULT 0;
SQL

if [[ ! -d "$FUNCTIONS_DST/main" ]]; then
  echo "ERROR: $FUNCTIONS_DST/main не найден. Сначала должен быть поднят self-hosted Supabase docker stack." >&2
  exit 1
fi

echo "==> Копирую Edge Functions в self-hosted runtime"
for fn in admin-api delivery-quote delivery-create order-place tinkoff-payment; do
  if [[ ! -d "$FUNCTIONS_SRC/$fn" ]]; then
    echo "ERROR: функция $FUNCTIONS_SRC/$fn не найдена" >&2
    exit 1
  fi
  rm -rf "$FUNCTIONS_DST/$fn"
  mkdir -p "$FUNCTIONS_DST/$fn"
  cp -R "$FUNCTIONS_SRC/$fn/." "$FUNCTIONS_DST/$fn/"
  echo "  -> $fn"
done

echo "==> Перезапускаю functions runtime"
docker compose up -d functions
docker compose restart functions

echo "==> Проверка"
docker compose ps functions
echo "Готово: backend обновлён. Проверь /functions/v1/admin-api и админку сайта."