import { useState } from 'react';

export function ProfilePage() {
  const [notifications, setNotifications] = useState(true);

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Профиль</h1>

      <div style={styles.card}>
        <div style={styles.avatar}>А</div>
        <div>
          <p style={styles.name}>Алексей Петров</p>
          <p style={styles.username}>@alex_p</p>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.row}>
          <span style={styles.rowLabel}>🔔 Уведомления</span>
          <button
            onClick={() => setNotifications((v) => !v)}
            style={{ ...styles.toggle, background: notifications ? 'var(--color-success)' : 'var(--tg-theme-hint-color)' }}
          >
            <span style={{ ...styles.toggleKnob, transform: notifications ? 'translateX(20px)' : 'none' }} />
          </button>
        </div>
        <div style={styles.row}>
          <span style={styles.rowLabel}>💬 Язык</span>
          <span style={styles.rowValue}>Русский</span>
        </div>
        <div style={styles.row}>
          <span style={styles.rowLabel}>🌙 Тема</span>
          <span style={styles.rowValue}>Авто</span>
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
  name: { font: 'var(--font-title)', color: 'var(--tg-theme-text-color)' } as React.CSSProperties,
  username: { font: 'var(--font-caption)', color: 'var(--tg-theme-hint-color)' } as React.CSSProperties,
  section: { background: 'var(--tg-theme-secondary-bg-color)', borderRadius: 'var(--radius-card)', overflow: 'hidden' } as React.CSSProperties,
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-md)', borderBottom: '0.5px solid var(--tg-theme-bg-color)' } as React.CSSProperties,
  rowLabel: { font: 'var(--font-body)', color: 'var(--tg-theme-text-color)' } as React.CSSProperties,
  rowValue: { font: 'var(--font-body)', color: 'var(--tg-theme-hint-color)' } as React.CSSProperties,
  toggle: { width: 44, height: 24, borderRadius: 12, border: 'none', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', padding: 0 } as React.CSSProperties,
  toggleKnob: { position: 'absolute', top: 2, left: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'transform 0.2s', display: 'block' } as React.CSSProperties,
} satisfies Record<string, React.CSSProperties>;
