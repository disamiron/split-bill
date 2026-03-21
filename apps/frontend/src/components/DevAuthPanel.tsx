import { useState } from 'react';
import { setAuthToken } from '@/lib/supabase';
import type { UserRow } from '@/lib/database.types';

// Тестовые пользователи из dev_seed.sql
const DEV_USERS = [
  { telegramId: 100000001, name: 'Алексей Петров', username: 'alex_p' },
  { telegramId: 100000002, name: 'Мария Кузнецова', username: 'maria_k' },
  { telegramId: 100000003, name: 'Игорь Сидоров', username: 'igor_s' },
  { telegramId: 100000004, name: 'Дима Волков', username: 'dima_v' },
];

const DEV_GROUP = {
  telegramChatId: -1001234567890,
  title: 'Отпуск в Турции 🏖',
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface DevAuthPanelProps {
  onAuth: (user: UserRow, telegramChatId: number) => void;
}

export function DevAuthPanel({ onAuth }: DevAuthPanelProps) {
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loginAs = async (telegramId: number) => {
    setLoading(telegramId);
    setError(null);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/dev-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          telegramId,
          telegramChatId: DEV_GROUP.telegramChatId,
        }),
      });

      if (!res.ok) {
        const { error: err } = await res.json();
        throw new Error(err ?? `HTTP ${res.status}`);
      }

      const { token, user, telegramChatId } = await res.json() as {
        token: string;
        user: UserRow;
        telegramChatId: number;
      };

      setAuthToken(token);
      onAuth(user, telegramChatId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.badge}>DEV MODE</div>
        <h2 style={styles.title}>Выбери пользователя</h2>
        <p style={styles.subtitle}>Группа: {DEV_GROUP.title}</p>

        <div style={styles.list}>
          {DEV_USERS.map((u) => (
            <button
              key={u.telegramId}
              style={styles.userBtn}
              onClick={() => loginAs(u.telegramId)}
              disabled={loading !== null}
            >
              <span style={styles.avatar}>{u.name[0]}</span>
              <span style={styles.info}>
                <span style={styles.name}>{u.name}</span>
                <span style={styles.username}>@{u.username}</span>
              </span>
              {loading === u.telegramId && <span style={styles.spinner}>⏳</span>}
            </button>
          ))}
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <p style={styles.hint}>
          Данные из dev_seed.sql. Запусти Edge Function dev-auth с APP_ENV=development.
        </p>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100dvh',
    padding: 'var(--space-md)',
    background: 'var(--tg-theme-bg-color)',
  } as React.CSSProperties,
  panel: {
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)',
    alignItems: 'center',
  } as React.CSSProperties,
  badge: {
    padding: '4px 12px',
    background: 'var(--color-warning)',
    color: '#000',
    borderRadius: 'var(--radius-chip)',
    font: '700 11px/1 system-ui',
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  title: {
    font: '700 22px/1.2 system-ui, sans-serif',
    color: 'var(--tg-theme-text-color)',
    margin: 0,
  } as React.CSSProperties,
  subtitle: {
    font: 'var(--font-caption)',
    color: 'var(--tg-theme-hint-color)',
    margin: 0,
  } as React.CSSProperties,
  list: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)',
  } as React.CSSProperties,
  userBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: '12px var(--space-md)',
    background: 'var(--tg-theme-secondary-bg-color)',
    border: 'none',
    borderRadius: 'var(--radius-card)',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: 'opacity .15s',
  } as React.CSSProperties,
  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'var(--color-accent)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    font: '600 16px system-ui',
    flexShrink: 0,
  } as React.CSSProperties,
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  } as React.CSSProperties,
  name: {
    font: 'var(--font-body)',
    fontWeight: 600,
    color: 'var(--tg-theme-text-color)',
  } as React.CSSProperties,
  username: {
    font: 'var(--font-caption)',
    color: 'var(--tg-theme-hint-color)',
  } as React.CSSProperties,
  spinner: {
    fontSize: 18,
  } as React.CSSProperties,
  error: {
    width: '100%',
    padding: 'var(--space-sm) var(--space-md)',
    background: '#fff3f3',
    borderRadius: 'var(--radius-card)',
    color: 'var(--color-danger)',
    font: 'var(--font-caption)',
    textAlign: 'center',
  } as React.CSSProperties,
  hint: {
    font: 'var(--font-caption)',
    color: 'var(--tg-theme-hint-color)',
    textAlign: 'center',
    margin: 0,
  } as React.CSSProperties,
} satisfies Record<string, React.CSSProperties>;
