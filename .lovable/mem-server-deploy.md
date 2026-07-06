---
name: Server deploy commands
description: Правильные команды деплоя FAKTURA на self-hosted сервере (Яндекс.Облако)
type: reference
---
Сервер: `/opt/faktura` (репозиторий), скрипты — в `/opt/faktura/server/scripts/`.

## Полный деплой бэкенда (git pull + миграции + edge functions + перезапуск)
```bash
cd /opt/faktura/server && bash scripts/deploy-backend.sh
```
Скрипт САМ делает `git pull --ff-only`, накатывает недостающие миграции, копирует функции из `supabase/functions/` в `volumes/functions/` и перезапускает контейнер `supabase-edge-functions`.

## Только фронтенд (без бэкенд-изменений)
Обычно достаточно того, что фронт пересобирается на хостинге автоматически. Если сервер держит собственный билд — команда сборки фронта та, что уже настроена в docker-compose (`docker compose build web` или аналог).

## НЕ давать пользователю
- Отдельный `cd /opt/faktura/server && git pull` — не хватает копирования функций, миграций и рестарта.
- Ручные `supabase functions deploy` — на self-hosted не работают, деплой делает `deploy-backend.sh`.
