#!/usr/bin/env bash
# Восстановление БД из дампа pg_dump -Fc.
#   ./restore.sh /path/to/faktura-YYYYMMDD.dump
set -euo pipefail

DUMP="${1:?usage: restore.sh <dump-file>}"
cd "$(dirname "$0")/.."

echo "!! Это перезапишет БД. Продолжить? (yes/no)"
read -r ans
[ "$ans" = "yes" ] || exit 1

docker compose exec -T db pg_restore -U postgres -d postgres --clean --if-exists < "$DUMP"
echo "Готово."
