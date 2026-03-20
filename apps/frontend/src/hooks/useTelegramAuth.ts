import { useEffect, useState } from 'react';
import { supabase, setAuthToken } from '@/lib/supabase';
import type { UserRow } from '@/lib/database.types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export interface AuthState {
  user: UserRow | null;
  telegramChatId: number | null;
  loading: boolean;
  error: string | null;
}

export function useTelegramAuth(): AuthState {
  const [user, setUser] = useState<UserRow | null>(null);
  const [telegramChatId, setTelegramChatId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function auth() {
      try {
        // Получаем initData из Telegram Mini App SDK
        const initData = window.Telegram?.WebApp?.initData;

        if (!initData) {
          // Локальная разработка вне Telegram — пропускаем авторизацию
          console.warn('No Telegram initData — running in dev mode');
          setLoading(false);
          return;
        }

        // start_param = "g{chatId}" — через direct link (приоритет)
        // chat.id — если открыто прямо из группы (только для групповых чатов)
        const unsafe = window.Telegram?.WebApp?.initDataUnsafe;
        const chatType = unsafe?.chat?.type;
        const isGroupChat = chatType === 'group' || chatType === 'supergroup';
        const chatId = (unsafe?.start_param?.startsWith('g')
            ? parseInt(unsafe.start_param.slice(1), 10)
            : null)
          ?? (isGroupChat ? unsafe?.chat?.id ?? null : null);

        // Верифицируем через Edge Function и получаем JWT
        const res = await fetch(`${SUPABASE_URL}/functions/v1/telegram-auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ initData, telegramChatId: chatId }),
        });

        if (!res.ok) {
          const { error: err } = await res.json();
          throw new Error(err ?? 'Auth failed');
        }

        const { token, user: dbUser, telegramChatId: serverChatId } = await res.json() as {
          token: string; user: UserRow; telegramChatId: number | null;
        };

        // Создаём аутентифицированный клиент с кастомным JWT
        setAuthToken(token);

        // Сервер извлекает chatId из верифицированного start_param — самый надёжный источник
        const effectiveChatId = serverChatId ?? chatId;
        if (effectiveChatId) setTelegramChatId(effectiveChatId);

        setUser(dbUser);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    auth();
  }, []);

  return { user, telegramChatId, loading, error };
}
