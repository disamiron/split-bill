import { useLocation, useNavigate } from 'react-router-dom';

const TABS = [
  { path: '/', label: 'Счета', icon: '📋' },
  { path: '/create', label: 'Создать', icon: '➕' },
  { path: '/profile', label: 'Профиль', icon: '👤' },
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
            <span style={{ fontSize: 22 }}>{tab.icon}</span>
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
  nav: { display: 'flex', background: 'var(--tg-theme-secondary-bg-color)', borderTop: '0.5px solid var(--tg-theme-hint-color)', paddingBottom: 'env(safe-area-inset-bottom)' } as React.CSSProperties,
  tab: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 0 10px', border: 'none', background: 'none', cursor: 'pointer' } as React.CSSProperties,
  label: { font: 'var(--font-caption)' } as React.CSSProperties,
} satisfies Record<string, React.CSSProperties>;
