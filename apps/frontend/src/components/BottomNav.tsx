import { useLocation, useNavigate } from 'react-router-dom';

function IconBills({ active }: { active: boolean }) {
  const color = active ? 'var(--color-accent)' : 'var(--tg-theme-hint-color)';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="12" y2="16" />
    </svg>
  );
}

function IconPlus({ active }: { active: boolean }) {
  const color = active ? 'var(--color-accent)' : 'var(--tg-theme-hint-color)';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function IconProfile({ active }: { active: boolean }) {
  const color = active ? 'var(--color-accent)' : 'var(--tg-theme-hint-color)';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 16 0v1" />
    </svg>
  );
}

const TABS = [
  { path: '/', label: 'Счета', Icon: IconBills },
  { path: '/create', label: 'Создать', Icon: IconPlus },
  { path: '/profile', label: 'Профиль', Icon: IconProfile },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (pathname.startsWith('/bill/')) return null;

  return (
    <nav style={styles.nav}>
      {TABS.map((tab) => {
        const isActive = tab.path === '/' ? pathname === '/' : pathname.startsWith(tab.path);
        return (
          <button key={tab.path} onClick={() => navigate(tab.path)} style={styles.tab}>
            <tab.Icon active={isActive} />
            <span style={{ ...styles.label, color: isActive ? 'var(--color-accent)' : 'var(--tg-theme-hint-color)', fontWeight: isActive ? 600 : 400 }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

const styles = {
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, display: 'flex', background: 'var(--tg-theme-secondary-bg-color)', borderTop: '0.5px solid rgba(0,0,0,.08)', paddingBottom: 'env(safe-area-inset-bottom)' } as React.CSSProperties,
  tab: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 0 10px', border: 'none', background: 'none', cursor: 'pointer' } as React.CSSProperties,
  label: { font: 'var(--font-caption)' } as React.CSSProperties,
} satisfies Record<string, React.CSSProperties>;
