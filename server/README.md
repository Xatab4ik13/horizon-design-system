# FAKTURA self-hosted backend

Перенос бэкенда (Postgres + Auth + Storage + Edge Functions) с Lovable Cloud
на свой сервер Ubuntu в Яндекс.Облаке.

Стек — официальный self-hosted Supabase (docker compose) + nginx с TLS.
База поднимается **пустая**: миграции создают все таблицы, дальше товары/посты
добавляются через админку сайта.

---

## 0. Что должно быть готово до старта

- Ubuntu 22.04 LTS, 2 vCPU / 4 GB RAM, SSD 100 GB.
- Статический публичный IP: `93.77.178.53`.
- DNS: `api.faktura-wood.com` → `93.77.178.53` (A-запись).
- SSH-доступ с sudo.
- Ящик `no-reply@faktura-wood.com` на Timeweb Mail — есть пароль.

---

## 1. Базовая настройка сервера

```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install ufw fail2ban curl git ca-certificates gnupg python3-certbot-nginx nginx certbot

sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

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

git clone --depth 1 https://github.com/supabase/supabase supabase-upstream
cp -R supabase-upstream/docker/. .
rm -rf supabase-upstream

# Каталоги для данных
sudo mkdir -p /var/lib/faktura/storage /var/backups/faktura
sudo chown -R $USER:$USER /var/lib/faktura /var/backups/faktura
```

## 3. Заполнить `.env`

```bash
cp .env.example .env
nano .env
```

Сгенерировать секреты:

```bash
openssl rand -hex 32   # POSTGRES_PASSWORD, JWT_SECRET, DASHBOARD_PASSWORD
```

`ANON_KEY` и `SERVICE_ROLE_KEY` — сгенерировать из `JWT_SECRET` по
инструкции https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys

Прикладные ключи (`ADMIN_PASSWORD`, `TINKOFF_*`, `YANDEX_DELIVERY_TOKEN`,
`PEK_*`, `CDEK_*`) — те же значения, что были на Lovable Cloud.

## 4. Запуск стека

```bash
docker compose up -d
docker compose ps    # все контейнеры healthy
```

## 5. Накатить схему БД

```bash
bash scripts/apply-migrations.sh
```

Скрипт прогонит все `supabase/migrations/*.sql` и создаст storage-бакеты
(`product-images`, `product-models`, `blog-images`, `site-images`,
`site-documents`).

## 6. Задеплоить Edge Functions

Для текущего проекта основной деплой бэкенда на сервере выполняется одной командой:

```bash
cd /opt/faktura/server && bash scripts/deploy-backend.sh
```

Скрипт обновит код из GitHub, применит новые миграции, перезапустит edge-функции
(`admin-api`, `delivery-quote`, `delivery-create`, `order-place`, `tinkoff-payment`),
синхронизирует HTML-шаблоны писем GoTrue и поднимет вспомогательный контейнер
`email-templates`, который раздаёт эти шаблоны по HTTP внутри docker-сети.

**Все правки бэкенда (миграции, edge-функции, шаблоны писем, docker override) —
через коммит в репозиторий + один запуск этого скрипта на сервере. Больше
руками ничего править не нужно.**

Кастомизации compose (контейнер `email-templates`, env `GOTRUE_MAILER_TEMPLATES_*`)
лежат в `server/docker-compose.override.yml` — Docker Compose подхватывает его
автоматически рядом с основным `docker-compose.yml` из upstream-стека Supabase.

HTML-шаблоны писем лежат в `server/gotrue-templates/*.html`. Правь их коммитом,
скрипт `deploy-backend.sh` сам разложит их в `server/volumes/gotrue-templates/`
и перезапустит `auth` + `email-templates`.


Ручной вариант через CLI, если нужен отдельно:

```bash
# Установить supabase CLI
curl -Lo /tmp/supabase.deb https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.deb
sudo dpkg -i /tmp/supabase.deb

cd /opt/faktura
supabase functions deploy admin-api      --project-ref local --no-verify-jwt
supabase functions deploy delivery-quote  --project-ref local
supabase functions deploy delivery-create --project-ref local
supabase functions deploy order-place     --project-ref local
supabase functions deploy tinkoff-payment --project-ref local --no-verify-jwt
```

## 7. nginx + TLS

```bash
sudo cp server/nginx/faktura.conf /etc/nginx/sites-available/faktura
sudo ln -s /etc/nginx/sites-available/faktura /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.faktura-wood.com
```

## 8. Переключить фронтенд

В Lovable проекте (или локальном `.env`) заменить:

```env
VITE_SUPABASE_URL=https://api.faktura-wood.com
VITE_SUPABASE_PUBLISHABLE_KEY=<новый ANON_KEY>
VITE_SUPABASE_PROJECT_ID=faktura-selfhosted
```

## 9. Бэкапы

```bash
crontab -e
# 0 3 * * *  /opt/faktura/server/scripts/backup.sh
```

Скрипт кладёт `pg_dump` в `/var/backups/faktura`, ротация 14 дней.

---

Полный план — в `.lovable/plan.md`.
