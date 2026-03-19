import { useNavigate } from 'react-router-dom';
import { SplitBillCard } from '@/components/SplitBillCard';
import type { Bill } from '@/types';

// Mock data — replace with Supabase query
const MOCK_BILLS: Bill[] = [
  {
    id: '1',
    groupId: 'g1',
    title: 'Ужин в ресторане',
    totalAmount: 4300,
    currency: 'RUB',
    paidBy: { id: 'u1', telegramId: 1, firstName: 'Алексей' },
    splitType: 'equal',
    createdAt: new Date().toISOString(),
    status: 'active',
    participants: [
      { user: { id: 'u1', telegramId: 1, firstName: 'Алексей' }, share: 1075, isPaid: true },
      { user: { id: 'u2', telegramId: 2, firstName: 'Мария' }, share: 1075, isPaid: true },
      { user: { id: 'u3', telegramId: 3, firstName: 'Игорь' }, share: 1075, isPaid: false },
      { user: { id: 'u4', telegramId: 4, firstName: 'Дима' }, share: 1075, isPaid: false },
    ],
  },
  {
    id: '2',
    groupId: 'g1',
    title: 'Такси домой',
    totalAmount: 800,
    currency: 'RUB',
    paidBy: { id: 'u2', telegramId: 2, firstName: 'Мария' },
    splitType: 'equal',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'settled',
    participants: [
      { user: { id: 'u1', telegramId: 1, firstName: 'Алексей' }, share: 400, isPaid: true },
      { user: { id: 'u2', telegramId: 2, firstName: 'Мария' }, share: 400, isPaid: true },
    ],
  },
];

const CURRENT_USER_ID = 'u1';

export function BillsListPage() {
  const navigate = useNavigate();
  const totalOwed = MOCK_BILLS.flatMap((b) => b.participants)
    .filter((p) => p.user.id === CURRENT_USER_ID && !p.isPaid)
    .reduce((sum, p) => sum + p.share, 0);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.heading}>Счета</h1>
        {totalOwed > 0 && (
          <div style={styles.owedBanner}>
            Ты должен:{' '}
            <strong>
              {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(totalOwed)}
            </strong>
          </div>
        )}
      </header>

      <div style={styles.list}>
        {MOCK_BILLS.map((bill) => (
          <SplitBillCard
            key={bill.id}
            bill={bill}
            currentUserId={CURRENT_USER_ID}
            onClick={() => navigate(`/bill/${bill.id}`)}
          />
        ))}
      </div>

      <button style={styles.fab} onClick={() => navigate('/create')}>
        + Новый счет
      </button>
    </div>
  );
}

const styles = {
  page: { padding: 'var(--space-md)', paddingBottom: 80, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' } as React.CSSProperties,
  header: { marginBottom: 'var(--space-sm)' } as React.CSSProperties,
  heading: { font: '700 22px/1.2 system-ui, sans-serif', color: 'var(--tg-theme-text-color)', marginBottom: 'var(--space-xs)' } as React.CSSProperties,
  owedBanner: { padding: 'var(--space-sm) var(--space-md)', background: '#fff3f3', borderRadius: 'var(--radius-card)', color: 'var(--color-danger)', font: 'var(--font-body)' } as React.CSSProperties,
  list: { display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' } as React.CSSProperties,
  fab: { position: 'fixed', bottom: 70, left: '50%', transform: 'translateX(-50%)', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-chip)', padding: '12px 28px', font: '600 15px/1 system-ui', cursor: 'pointer', boxShadow: '0 4px 16px rgba(42,171,238,.4)' } as React.CSSProperties,
} satisfies Record<string, React.CSSProperties>;
