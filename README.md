# Split Bill — Telegram Mini App

Мини-приложение для разделения счетов в группах Telegram. Создай счет, добавь участников — бот сам напомнит кто и сколько должен.

## Возможности

- Создание счетов с фото чека
- Разделение поровну или вручную
- Отслеживание статуса оплаты каждого участника
- Напоминания должникам через бота
- Работает прямо в Telegram (Mini App)

## Стек

- **Frontend:** React 18 + TypeScript + Vite + `@telegram-apps/sdk`
- **Backend:** Supabase (PostgreSQL + Edge Functions + Realtime)
- **Бот:** Grammy (Node.js)
- **Пакеты:** pnpm монорепо
- **Хостинг:** Vercel + Supabase

## Быстрый старт

```bash
# 1. Клонировать
git clone https://github.com/your-org/split-bill.git
cd split-bill

# 2. Установить зависимости
pnpm install

# 3. Переменные окружения
cp apps/frontend/.env.example apps/frontend/.env.local
# Заполнить VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY

# 4. Запустить
pnpm dev
```

Приложение откроется на [http://localhost:5173](http://localhost:5173).
В браузере работает без Telegram (graceful degradation).

## Структура проекта

```
split-bill/
├── apps/
│   ├── frontend/          # Telegram Mini App
│   └── bot/               # Telegram-бот
├── packages/
│   └── shared/            # Общие типы
├── supabase/              # Миграции и Edge Functions
├── CLAUDE.md              # Инструкции для Claude Code
└── pnpm-workspace.yaml
```

Подробнее об архитектуре и соглашениях — в [CLAUDE.md](./CLAUDE.md).

## Скриншоты

> Будут добавлены после первого деплоя.

## Лицензия

MIT
