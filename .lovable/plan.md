
# План переноса бэкенда на свой сервер (Yandex Cloud, Ubuntu)

## Что переносим

Сейчас бэкенд = Lovable Cloud (управляемый Supabase). В нём:

- **Postgres** с таблицами: `products`, `orders`, `profiles`, `blog_posts`, `contact_requests`, `vacancies`, `app_settings` + функции/триггеры (`handle_new_user`, `update_updated_at_column`).
- **Auth** (email/password, JWT).
- **Storage** (бакеты: `product-images`, `blog-images`, `product-models`, `site-images`, `site-documents`).
- **Edge Functions** (Deno): `admin-api`, `order-place`, `delivery-quote`, `delivery-create`.
- **Секреты**: `ADMIN_PASSWORD`, `TINKOFF_TERMINAL_KEY`, `TINKOFF_PASSWORD`, `YANDEX_DELIVERY_TOKEN`, `PEK_API_LOGIN`, `PEK_API_KEY`, `CDEK_ACCOUNT`, `CDEK_SECURE_PASSWORD`.

Frontend (React/Vite) остаётся как есть — меняется только адрес API и ключи.

## Целевая архитектура

На арендуемом Ubuntu-сервере поднимаем **self-hosted Supabase** (официальный docker-compose). Это даёт 1-в-1 те же API (PostgREST, GoTrue, Storage, Edge Runtime), поэтому фронт почти не переписываем.

```text
Yandex Cloud VM (Ubuntu 22.04, статический IP, домен api.faktura.ru)
 └── Docker
     ├── nginx (reverse proxy + TLS от Let's Encrypt)
     └── supabase-stack (docker-compose)
         ├── postgres        (данные в /var/lib/faktura/postgres)
         ├── gotrue          (auth)
         ├── postgrest       (data API)
         ├── storage-api     (+ imgproxy)
         ├── edge-runtime    (наши Deno-функции)
         ├── realtime, meta, studio
         └── kong (API gateway)
```

Репозиторий: в существующий GitHub-репо добавляем папку `server/` с compose-файлом, конфигами nginx, скриптами бэкапа и `README`. Функции уже лежат в `supabase/functions/*` — их прокидываем в edge-runtime как volume.

## Этапы

### 1. Подготовка сервера (Yandex Cloud)

1. VM Ubuntu 22.04, минимум 2 vCPU / 4 GB RAM / 40 GB SSD, статический публичный IP.
2. DNS: A-запись `api.faktura.ru` → IP сервера.
3. Базовая настройка: пользователь без root, SSH по ключу, `ufw` (22, 80, 443), `fail2ban`, автообновления.
4. Установить Docker + docker compose plugin.

### 2. Экспорт данных из Lovable Cloud

1. Через Lovable: **Cloud → Advanced settings → Export data** — получаем дамп Postgres.
2. Файлы Storage: скачиваем содержимое всех 5 бакетов (скрипт на клиенте, через service-role ключ; выгружаю подготовленный скрипт `server/scripts/export-storage.ts`).
3. Список пользователей `auth.users` попадает в дамп; сохраняются хэши паролей — пользователям **не придётся сбрасывать пароль**.

### 3. Развёртывание self-hosted Supabase

1. `git clone https://github.com/supabase/supabase` → копируем `docker/` в наш репозиторий как `server/supabase/`.
2. Генерируем секреты: `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `DASHBOARD_PASSWORD`, ключ Storage.
3. `.env` кладём **только на сервер** (в репо — `.env.example`).
4. Volume-маунт наших функций: `./supabase/functions:/home/deno/functions:ro`.
5. Запуск: `docker compose up -d`.

### 4. Импорт данных

1. `psql` — восстановление дампа в контейнер `postgres` (включая схемы `auth`, `storage`, `public`).
2. Раскладка файлов Storage в `/var/lib/faktura/storage` через `storage-api` (либо `s3` backend, если решим хранить в Object Storage Яндекса — рекомендую, отдельный шаг).
3. Проверка `select count(*)` по всем таблицам, тест логина существующим пользователем.

### 5. nginx + HTTPS

- `nginx` перед kong: `api.faktura.ru` → `kong:8000`.
- TLS: `certbot` с автопродлением.
- CORS уже настроен внутри edge-функций.

### 6. Секреты edge-функций

Переносим через `supabase secrets set` (или напрямую в `.env` edge-runtime) те же 8 ключей: `ADMIN_PASSWORD`, `TINKOFF_*`, `YANDEX_DELIVERY_TOKEN`, `PEK_*`, `CDEK_*`.

### 7. Переключение фронтенда

В `.env` фронта меняем 3 переменные:

```env
VITE_SUPABASE_URL=https://api.faktura.ru
VITE_SUPABASE_PUBLISHABLE_KEY=<новый ANON_KEY>
VITE_SUPABASE_PROJECT_ID=faktura-selfhosted
```

Код `src/integrations/supabase/client.ts` не трогаем — он уже читает из env. Файл `src/integrations/supabase/types.ts` регенерируем от новой БД.

### 8. Бэкапы и мониторинг

- `pg_dump` ежедневно cron'ом в Yandex Object Storage (7 дней hot, 30 cold).
- Snapshot диска VM раз в неделю средствами Yandex Cloud.
- Логи: `docker compose logs` → `journald`; опционально Grafana/Loki позже.
- Healthcheck: uptime-мониторинг на `https://api.faktura.ru/rest/v1/`.

### 9. Переезд без даунтайма

1. Поднять self-hosted **параллельно** с Lovable Cloud.
2. Прогнать полный smoke-тест на staging-домене (`api-stage.faktura.ru`).
3. Заморозить админку на Lovable Cloud (баннер «идут работы»).
4. Финальный дельта-дамп → импорт → переключение фронта → DNS/переменные окружения.
5. Lovable Cloud держим read-only ещё 1–2 недели как страховку.

## Что понадобится от вас

- IP и SSH-доступ к VM (пользователь с sudo).
- Домен/поддомен для API (`api.faktura.ru` или другой) с доступом к DNS.
- Подтверждение: хранить файлы Storage **локально на диске VM** или в **Yandex Object Storage** (S3-совместимо, надёжнее и дешевле для роста). Рекомендую второй вариант.
- Согласие: после переезда Lovable Cloud отключаем (в Lovable нет кнопки «удалить Cloud из проекта» — просто перестаём им пользоваться, фронт смотрит на новый URL).

## Что появится в репозитории

```text
server/
├── README.md                    # шаг-в-шаг деплой
├── .env.example
├── docker-compose.yml           # supabase stack + nginx
├── nginx/
│   ├── nginx.conf
│   └── faktura.conf
├── scripts/
│   ├── export-storage.ts        # выгрузка бакетов из Lovable Cloud
│   ├── import-storage.ts        # заливка в self-hosted
│   ├── backup.sh                # pg_dump → S3
│   └── restore.sh
└── supabase/                    # docker-конфиги из upstream, с нашими правками
```

Функции (`supabase/functions/*`) и миграции (`supabase/migrations/*`) остаются на месте — их и подхватит self-hosted стек.

## Оценка

- Подготовка сервера + деплой стека: ~0.5 дня.
- Экспорт/импорт данных + storage: ~0.5 дня (зависит от объёма файлов).
- nginx/TLS/бэкапы: ~0.5 дня.
- Тесты и переключение: ~0.5 дня.

Итого: ~2 рабочих дня, из них даунтайм при финальном переключении — 15–30 минут.

## Риски

- **Storage-миграция**: если файлов много (сотни МБ+), экспорт из Lovable Cloud идёт через API, лимиты по времени — делаем чанками.
- **Пароли пользователей** переезжают только если экспорт включает `auth.users` с полем `encrypted_password` (в Lovable-экспорте — да).
- **Edge-runtime self-hosted** чуть отличается от Lovable-версии Deno; наши функции написаны на стандартных API, но потребуется прогнать все 4 функции на dev-стенде.
- **Обратной дороги нет**: после отключения фронта от Lovable Cloud обновлять данные там смысла не будет.

## Что делаю дальше после вашего «ок»

1. Создаю `server/` с compose-файлом, nginx-конфигом, `.env.example`, README.
2. Пишу скрипты `export-storage.ts` / `import-storage.ts` / `backup.sh`.
3. Даю чеклист команд для запуска на вашей VM (по шагам, копипастой).
4. Регенерирую `src/integrations/supabase/types.ts` после того, как поднимете стек.

Жду подтверждения + ответ по хранилищу файлов (локально vs Yandex Object Storage) + IP/домен, когда будут готовы.
