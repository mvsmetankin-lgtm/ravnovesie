# Telegram Auth Setup

## 1. Supabase

Paste the contents of [supabase-telegram-auth.sql](/Users/makssmetankin/.codex/worktrees/f9c1/Codex/supabase-telegram-auth.sql) into the Supabase SQL editor and run it.

## 2. Backend env

Copy `.env.example` to `.env` and fill in:

- `APP_SESSION_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY`

## 3. Install and run

```bash
npm install
npm start
```

The backend listens on `3001` by default.

## 4. nginx

Add a proxy for `/api` to the Node backend:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

If you are serving the frontend on `8444`, add this `location` block inside the same `server` that already serves `index.html`.

## 5. Telegram bot

Set your Mini App URL in BotFather to the same public origin where the frontend is hosted.

## 6. Auth behavior

- In Telegram Mini App: the app auto-signs in through `/api/auth/telegram`
- Outside Telegram: the app keeps the current Supabase email/password flow
