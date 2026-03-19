# CLAUDE.md — Split Bill Telegram Mini App

Инструкции для Claude Code при работе с этим репозиторием.

## Стек

| Слой | Технология |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Telegram SDK | `@telegram-apps/sdk`, `@telegram-apps/sdk-react`, `@telegram-apps/telegram-ui` |
| Роутер | react-router-dom v6 |
| Backend | Supabase (PostgreSQL + Edge Functions + Realtime) |
| Бот | Node.js + Grammy (в `apps/bot/`) |
| Package manager | **pnpm** (монорепо) |
| Хостинг | Vercel (frontend), Supabase (backend) |

## Структура монорепо

```
split-bill/
├── apps/
│   ├── frontend/          # Telegram Mini App (React + Vite)
│   └── bot/               # Telegram-бот (Grammy)
├── packages/
│   └── shared/            # Общие типы TypeScript
├── supabase/              # Миграции, Edge Functions, seed
├── CLAUDE.md
├── README.md
└── pnpm-workspace.yaml
```

## Команды

```bash
# Установка зависимостей (из корня)
pnpm install

# Запуск frontend в dev-режиме
pnpm dev
# или напрямую:
pnpm --filter frontend dev

# Сборка frontend
pnpm build

# Линтинг
pnpm lint
```

## Frontend (`apps/frontend/`)

### Структура `src/`

```
src/
├── App.tsx              # Роутинг + инициализация Telegram SDK
├── main.tsx
├── types/index.ts       # Bill, User, BillParticipant, Group
├── styles/
│   └── telegram-theme.css  # CSS-переменные + 8px grid
├── lib/
│   ├── supabase.ts         # Типизированный клиент
│   └── database.types.ts   # TypeScript-типы схемы БД
├── components/          # Переиспользуемые компоненты
│   ├── SplitBillCard.tsx
│   └── BottomNav.tsx
├── hooks/               # Хуки для работы с Supabase
│   ├── useBills.ts
│   ├── useCreateBill.ts
│   └── useMarkPaid.ts
└── pages/               # Экраны приложения
    ├── BillsListPage.tsx
    ├── CreateBillPage.tsx
    ├── BillDetailsPage.tsx
    └── ProfilePage.tsx
```

### Экраны и роуты

| Роут | Страница | Описание |
|---|---|---|
| `/` | `BillsListPage` | Список всех счетов группы |
| `/create` | `CreateBillPage` | Форма создания счета |
| `/bill/:id` | `BillDetailsPage` | Детали счета, статусы оплаты |
| `/profile` | `ProfilePage` | Настройки пользователя |

### Дизайн-система

Стили строятся на CSS-переменных Telegram (`--tg-theme-*`) из `src/styles/telegram-theme.css`.

**Отступы — 8px grid:**
```
--space-xs: 4px   --space-sm: 8px
--space-md: 16px  --space-lg: 24px  --space-xl: 32px
```

**Цвета:**
```
--color-accent:  #2AABEE   (Telegram blue — кнопки, ссылки)
--color-success: #31C35F   (оплачено)
--color-danger:  #E53935   (долг)
--color-warning: #F9A825   (ожидание)
```

**Типографика:**
```
--font-title:   600 17px  (заголовки карточек)
--font-body:    400 15px  (основной текст)
--font-caption: 400 13px  (подписи, мета)
```

**Радиусы:** card `12px`, button `10px`, chip `20px`.

### Правила кода

- Не использовать `any` — все типы в `src/types/index.ts`
- Инлайн-стили через объект `styles` с `satisfies Record<string, React.CSSProperties>` внизу файла
- Mock-данные временно живут в страницах; при подключении Supabase выносить в хуки `src/hooks/`
- Для Telegram-специфичных вызовов — всегда оборачивать в `try/catch` (graceful degradation вне Telegram)
- Все новые компоненты и страницы — на TypeScript, без `React.FC` (использовать обычные функции)

## Backend — Supabase

```
supabase/
├── config.toml
├── migrations/
│   ├── 20260319000001_init_schema.sql   # таблицы, индексы, функции
│   ├── 20260319000002_rls.sql           # Row Level Security
│   └── 20260319000003_create_bill_fn.sql # атомарная rpc create_bill
├── functions/
│   └── notify-debtors/index.ts          # Edge Function: уведомления должникам
└── seed/
    └── dev_seed.sql                     # тестовые данные
```

### Схема таблиц

| Таблица | Описание |
|---|---|
| `users` | Telegram-пользователи (upsert при каждом запуске) |
| `groups` | Telegram-чаты |
| `group_members` | M2M: users ↔ groups |
| `bills` | Счета (title, amount, paid_by, split_type, status) |
| `bill_participants` | Доли участников + флаг is_paid |

### Ключевые решения

- **RLS повсюду** — пользователь видит только данные групп, где он член (`is_group_member()`)
- **Триггер `trg_check_bill_settled`** — автоматически закрывает счёт, когда все оплатили
- **`rpc('create_bill', ...)`** — атомарно создаёт bill + bill_participants (вызывается с клиента)
- **`upsert_telegram_user()`** — вызывается при каждом старте Mini App для синхронизации профиля
- **Realtime** — `useBills` подписывается на изменения через `supabase.channel()`

### Локальный запуск Supabase

```bash
# Установить Supabase CLI
brew install supabase/tap/supabase

# Запустить локально (Docker required)
supabase start

# Применить миграции + seed
supabase db reset

# Сгенерировать типы TypeScript
supabase gen types typescript --local > apps/frontend/src/lib/database.types.ts
```

### Edge Functions

| Функция | Метод | Описание |
|---|---|---|
| `notify-debtors` | POST `{ bill_id }` | Отправляет Telegram-сообщения неоплатившим |

### Работа с данными во фронтенде

Все запросы к Supabase — через хуки в `src/hooks/`:

| Хук | Описание |
|---|---|
| `useBills(groupId)` | Список счетов + Realtime подписка |
| `useCreateBill()` | Вызов `rpc('create_bill', ...)` |
| `useMarkPaid()` | Обновление `is_paid` для участника |

## Переменные окружения

Создать `apps/frontend/.env.local` (не коммитить):

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## Бот (`apps/bot/`)

```
src/
├── index.ts              # Точка входа, регистрация хендлеров
├── commands/
│   └── start.ts          # /start — приветствие + кнопка Mini App
├── handlers/
│   └── group.ts          # Добавление в группу, вход/выход участников
└── lib/
    └── supabase.ts       # Service role клиент (bypasses RLS)
```

### Переменные окружения бота

```env
TELEGRAM_BOT_TOKEN=     # токен от @BotFather
SUPABASE_URL=           # тот же URL что и у фронтенда
SUPABASE_SERVICE_ROLE_KEY=  # secret ключ, НЕ anon!
MINI_APP_URL=           # URL задеплоенного фронтенда на Vercel
```

### Что делает бот

| Событие | Действие |
|---|---|
| `/start` в личке | Приветствие + кнопка открыть Mini App |
| `/start` в группе | Кнопка открыть Mini App |
| Бот добавлен в группу | `upsert` группы в БД + приветственное сообщение |
| Новый участник в группе | `upsert` пользователя + добавление в `group_members` |
| Участник покинул группу | Удаление из `group_members` |

### Запуск бота

```bash
pnpm --filter bot install
pnpm dev:bot
```

## Агенты (`.claude.yml`)

Проект использует ролевую модель агентов:
- **architect** — схемы, технические решения
- **designer** — UI/UX, компоненты
- **frontend** — React, SDK
- **backend** — Supabase, бот
- **tester** — тесты, безопасность
- **docs** — документация
