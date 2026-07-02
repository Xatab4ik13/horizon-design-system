# FAKTURA self-hosted backend

Перенос бэкенда (Postgres + Auth + Storage + Edge Functions) с Lovable Cloud
на свой сервер Ubuntu в Яндекс.Облаке.

Стек — официальный self-hosted Supabase (docker compose) + nginx с TLS.

---

## 0. Что должно быть готово до старта

- Ubuntu 22.04 LTS, минимум 2 vCPU / 4 GB RAM / 40 GB SSD.
- Статический публичный IP.
- Домен/поддомен, указывающий A-записью на этот IP (пример: `api.faktura.ru`).
- SSH-доступ с sudo под непривилегированным пользователем.
- Дамп БД, полученный из Lovable → **Cloud → Advanced settings → Export data**.

---

## 1. Базовая настройка сервера

```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install ufw fail2ban curl git ca-certificates gnupg

# Firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
```

## 2. Клонирование репозитория и стека Supabase

```bash
cd /opt
sudo git clone https://github.com/Xatab4ik13/horizon-design-system.git faktura
sudo chown -R $USER:$USER /opt/faktura
cd /opt/faktura/server

# Стягиваем официальный self-hosted стек Supabase внутрь server/supabase
git clone --depth 1 https://github.com/supabase/supabase supabase-upstream
cp -R supabase-upstream/docker supabase
rm -rf supabase-upstream
```

## 3. Заполнить `.env`

```bash
cp .env.example .env
nano .env
```

Сгенерировать секреты:

```bash
openssl rand -hex 32   # для POSTGRES_PASSWORD, JWT_SECRET, DASHBOARD_PASSWORD
```

`ANON_KEY` и `SERVICE_ROLE_KEY` генерируются из `JWT_SECRET` — см.
инструкцию в `.env.example` (используем supabase/self-hosting docs).

Все прикладные ключи (`ADMIN_PASSWORD`, `TINKOFF_*`, `YANDEX_DELIVERY_TOKEN`,
`PEK_*`, `CDEK_*`) — те же, что были в Lovable Cloud.

## 4. Запуск стека

```bash
cd /opt/faktura/server
docker compose up -d
docker compose ps
```

Через пару минут проверить:

```bash
curl -s https://<домен>/rest/v1/ -H "apikey: $ANON_KEY"
```

## 5. Импорт данных из Lovable Cloud

1. Положить дамп на сервер: `scp faktura.dump user@host:/tmp/`.
2. Восстановить:

```bash
docker compose exec -T db psql -U postgres -d postgres < /tmp/faktura.dump
```

3. Скачать файлы Storage из Lovable Cloud и залить в новый бакет:

```bash
# На локальной машине, с SERVICE_ROLE_KEY Lovable Cloud:
bun run scripts/export-storage.ts

# На сервере, с SERVICE_ROLE_KEY нового стека:
bun run scripts/import-storage.ts
```

## 6. nginx + TLS

Конфиг в `nginx/faktura.conf`. Certbot:

```bash
sudo apt -y install certbot python3-certbot-nginx
sudo certbot --nginx -d api.faktura.ru
```

## 7. Переключение фронтенда

В `.env` фронта (Lovable/локально):

```env
VITE_SUPABASE_URL=https://api.faktura.ru
VITE_SUPABASE_PUBLISHABLE_KEY=<новый ANON_KEY>
VITE_SUPABASE_PROJECT_ID=faktura-selfhosted
```

Регенерировать `src/integrations/supabase/types.ts` с помощью
`supabase gen types typescript --db-url ...`.

## 8. Бэкапы

Cron:

```cron
0 3 * * *  /opt/faktura/server/scripts/backup.sh
```

Скрипт кладёт `pg_dump` в Yandex Object Storage (см. переменные `S3_*` в `.env`).

---

Полный план и обоснование архитектуры — в `.lovable/plan.md`.
