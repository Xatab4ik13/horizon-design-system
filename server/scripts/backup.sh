#!/usr/bin/env bash
# Ежедневный pg_dump в Yandex Object Storage.
# Требуется установленный awscli, настроенный на endpoint YC.
#
# Пример cron:
#   0 3 * * * /opt/faktura/server/scripts/backup.sh >> /var/log/faktura-backup.log 2>&1

set -euo pipefail

cd "$(dirname "$0")/.."
[ -f .env ] && set -a && . ./.env && set +a

: "${S3_BACKUP_BUCKET:?S3_BACKUP_BUCKET not set}"
: "${S3_BACKUP_ENDPOINT:=https://storage.yandexcloud.net}"

STAMP=$(date -u +%Y%m%d-%H%M%S)
OUT="/tmp/faktura-${STAMP}.dump"

echo "[$(date -u +%FT%TZ)] pg_dump → $OUT"
docker compose exec -T db pg_dump -U postgres -Fc postgres > "$OUT"

echo "[$(date -u +%FT%TZ)] upload → s3://${S3_BACKUP_BUCKET}/postgres/"
aws --endpoint-url "$S3_BACKUP_ENDPOINT" s3 cp "$OUT" "s3://${S3_BACKUP_BUCKET}/postgres/"

rm -f "$OUT"

# Ротация: удалить объекты старше 30 дней
CUTOFF=$(date -u -d '30 days ago' +%Y-%m-%d)
aws --endpoint-url "$S3_BACKUP_ENDPOINT" s3 ls "s3://${S3_BACKUP_BUCKET}/postgres/" \
  | awk -v c="$CUTOFF" '$1 < c {print $4}' \
  | while read -r key; do
      [ -n "$key" ] && aws --endpoint-url "$S3_BACKUP_ENDPOINT" s3 rm "s3://${S3_BACKUP_BUCKET}/postgres/$key"
    done

echo "[$(date -u +%FT%TZ)] done"
