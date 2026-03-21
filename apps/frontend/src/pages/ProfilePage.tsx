import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export function ProfilePage() {
  const { user } = useAuth();
  const [notifications] = useState(false);

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ');
  const initials = (user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? '');

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Профиль</h1>

      <div style={styles.card}>
        {user?.avatar_url ? (
          <img src={user.avatar_url} style={styles.avatarImg} alt={fullName} />
        ) : (
          <div style={styles.avatar}>{initials || '?'}</div>
        )}
        <div>
          <p style={styles.name}>{fullName || '—'}</p>
          {user?.username && <p style={styles.username}>@{user.username}</p>}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.row}>
          <span style={styles.rowLabel}>🔔 Уведомления</span>
          <button
            disabled
            style={{ ...styles.toggle, background: 'var(--tg-theme-hint-color)', opacity: 0.5, cursor: 'not-allowed' }}
          >
            <span style={{ ...styles.toggleKnob, transform: 'none' }} />
          </button>
        </div>
        <div style={styles.row}>
          <span style={styles.rowLabel}>🆔 Telegram ID</span>
          <span style={styles.rowValue}>{user?.telegram_id ?? '—'}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' } as React.CSSProperties,
  heading: { font: '700 22px/1.2 system-ui, sans-serif', color: 'var(--tg-theme-text-color)' } as React.CSSProperties,
  card: { display: 'flex', alignItems: 'center', gap: 'var(--space-md)', background: 'var(--tg-theme-secondary-bg-color)', borderRadius: 'var(--radius-card)', padding: 'var(--space-md)' } as React.CSSProperties,
  avatar: { width: 56, height: 56, borderRadius: '50%', background: 'var(--color-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 24px system-ui', flexShrink: 0 } as React.CSSProperties,
  avatarImg: { width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' as const, flexShrink: 0 },
  name: { font: 'var(--font-title)', color: 'var(--tg-theme-text-color)' } as React.CSSProperties,
  username: { font: 'var(--font-caption)', color: 'var(--tg-theme-hint-color)' } as React.CSSProperties,
  section: { background: 'var(--tg-theme-secondary-bg-color)', borderRadius: 'var(--radius-card)', overflow: 'hidden' } as React.CSSProperties,
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-md)', borderBottom: '0.5px solid var(--tg-theme-bg-color)' } as React.CSSProperties,
  rowLabel: { font: 'var(--font-body)', color: 'var(--tg-theme-text-color)' } as React.CSSProperties,
  rowValue: { font: 'var(--font-body)', color: 'var(--tg-theme-hint-color)' } as React.CSSProperties,
  toggle: { width: 44, height: 24, borderRadius: 12, border: 'none', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', padding: 0 } as React.CSSProperties,
  toggleKnob: { position: 'absolute', top: 2, left: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'transform 0.2s', display: 'block' } as React.CSSProperties,
} satisfies Record<string, React.CSSProperties>;
