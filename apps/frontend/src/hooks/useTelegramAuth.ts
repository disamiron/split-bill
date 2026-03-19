import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserRow } from '@/lib/database.types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export interface AuthState {
  user: UserRow | null;
  loading: boolean;
  error: string | null;
}

export function useTelegramAuth(): AuthState {
  const [user, setUser] = useState<UserRow | null>(null);
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

        // Верифицируем через Edge Function и получаем JWT
        const res = await fetch(`${SUPABASE_URL}/functions/v1/telegram-auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        });

        if (!res.ok) {
          const { error: err } = await res.json();
          throw new Error(err ?? 'Auth failed');
        }

        const { token, user: dbUser } = await res.json() as { token: string; user: UserRow };

        // Устанавливаем JWT в Supabase клиент
        await supabase.auth.setSession({ access_token: token, refresh_token: token });

        setUser(dbUser);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    auth();
  }, []);

  return { user, loading, error };
}
