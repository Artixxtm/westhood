# Westhood® waitlist

Fullscreen waitlist experience built with Next.js 16, JSX and Tailwind CSS 4.

## Run locally

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. In development, form submissions succeed in demo mode when Telegram variables are absent.

## Telegram setup

1. Create a bot with `@BotFather` and copy its token.
2. Message the bot once.
3. Open `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` and find `message.chat.id`.
4. Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in `.env.local` or your hosting provider.

The token remains server-side in `src/app/api/waitlist/route.js` and is never exposed to the browser.
