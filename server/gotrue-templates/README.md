# Кастомные шаблоны GoTrue (auth-письма FAKTURA)

Файлы этой папки — HTML-шаблоны писем Supabase Auth (GoTrue) в фирменном
дизайне FAKTURA (чёрный + золото + Franklin Gothic).

## Как подключить (self-hosted Supabase на сервере)

1. Убедиться, что SMTP уже прописан в `server/.env` (SMTP_HOST/USER/PASS/…).
   Без этого GoTrue вообще не сможет отправлять письма (в т.ч. восстановление пароля).

2. В `server/docker-compose.yml` добавить монтирование папки шаблонов и env-переменные
   в сервис `auth` (GoTrue):

   ```yaml
   auth:
     volumes:
       - ./gotrue-templates:/etc/gotrue/templates:ro
     environment:
       GOTRUE_MAILER_SUBJECTS_RECOVERY: "Восстановление пароля — FAKTURA"
       GOTRUE_MAILER_SUBJECTS_CONFIRMATION: "Подтверждение регистрации — FAKTURA"
       GOTRUE_MAILER_SUBJECTS_MAGIC_LINK: "Вход в FAKTURA"
       GOTRUE_MAILER_SUBJECTS_EMAIL_CHANGE: "Подтверждение смены email — FAKTURA"
       GOTRUE_MAILER_SUBJECTS_INVITE: "Приглашение в FAKTURA"

       GOTRUE_MAILER_TEMPLATES_RECOVERY: "file:///etc/gotrue/templates/recovery.html"
       GOTRUE_MAILER_TEMPLATES_CONFIRMATION: "file:///etc/gotrue/templates/confirmation.html"
       GOTRUE_MAILER_TEMPLATES_MAGIC_LINK: "file:///etc/gotrue/templates/magic_link.html"
       GOTRUE_MAILER_TEMPLATES_EMAIL_CHANGE: "file:///etc/gotrue/templates/email_change.html"
       GOTRUE_MAILER_TEMPLATES_INVITE: "file:///etc/gotrue/templates/invite.html"
   ```

3. Перезапустить сервис:

   ```bash
   cd /opt/faktura/server
   docker compose up -d auth
   ```

4. Проверить: на странице /auth нажать «Забыли пароль?» — на почту придёт
   письмо с чёрно-золотым дизайном и кнопкой «Сменить пароль».
