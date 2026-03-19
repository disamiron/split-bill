import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useGroup } from '@/hooks/useGroup';
import { useBills } from '@/hooks/useBills';
import { SplitBillCard } from '@/components/SplitBillCard';
import type { Bill } from '@/types';
import type { BillWithParticipants } from '@/hooks/useBills';

function mapToBill(b: BillWithParticipants): Bill {
  return {
    id: b.id,
    groupId: b.group_id,
    title: b.title,
    totalAmount: b.total_amount,
    currency: b.currency,
    splitType: b.split_type,
    createdAt: b.created_at,
    status: b.status,
    paidBy: {
      id: b.paid_by,
      telegramId: 0,
      firstName: b.paid_by_user.first_name,
      username: b.paid_by_user.username ?? undefined,
    },
    participants: b.bill_participants.map((p) => ({
      user: { id: p.user.id, telegramId: 0, firstName: p.user.first_name, username: p.user.username ?? undefined },
      share: p.share,
      isPaid: p.is_paid,
      paidAt: p.paid_at ?? undefined,
    })),
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);

export function BillsListPage() {
  const navigate = useNavigate();
  const { user, telegramChatId } = useAuth();
  const { group, loading: groupLoading } = useGroup(telegramChatId);
  const { bills, loading: billsLoading } = useBills(group?.id ?? '');

  const loading = groupLoading || billsLoading;

  const totalOwed = bills
    .flatMap((b) => b.bill_participants)
    .filter((p) => p.user.id === user?.id && !p.is_paid)
    .reduce((sum, p) => sum + p.share, 0);

  if (loading) {
    return (
      <div style={styles.center}>
        <span style={styles.hint}>Загрузка...</span>
      </div>
    );
  }

  if (!group) {
    return (
      <div style={styles.center}>
        <span style={styles.hint}>Открой Split Bill из группового чата 💬</span>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.heading}>{group.title}</h1>
        {totalOwed > 0 && (
          <div style={styles.owedBanner}>
            Ты должен: <strong>{fmt(totalOwed)}</strong>
          </div>
        )}
      </header>

      {bills.length === 0 ? (
        <div style={styles.center}>
          <span style={styles.hint}>Счетов пока нет. Создай первый! 👆</span>
        </div>
      ) : (
        <div style={styles.list}>
          {bills.map((bill) => (
            <SplitBillCard
              key={bill.id}
              bill={mapToBill(bill)}
              currentUserId={user?.id ?? ''}
              onClick={() => navigate(`/bill/${bill.id}`)}
            />
          ))}
        </div>
      )}

      <button style={styles.fab} onClick={() => navigate('/create')}>
        + Новый счет
      </button>
    </div>
  );
}

const styles = {
  page: { padding: 'var(--space-md)', paddingBottom: 80, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' } as React.CSSProperties,
  center: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60dvh' } as React.CSSProperties,
  header: { marginBottom: 'var(--space-sm)' } as React.CSSProperties,
  heading: { font: '700 22px/1.2 system-ui, sans-serif', color: 'var(--tg-theme-text-color)', marginBottom: 'var(--space-xs)' } as React.CSSProperties,
  owedBanner: { padding: 'var(--space-sm) var(--space-md)', background: '#fff3f3', borderRadius: 'var(--radius-card)', color: 'var(--color-danger)', font: 'var(--font-body)' } as React.CSSProperties,
  list: { display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' } as React.CSSProperties,
  hint: { font: 'var(--font-body)', color: 'var(--tg-theme-hint-color)', textAlign: 'center' as const },
  fab: { position: 'fixed', bottom: 70, left: '50%', transform: 'translateX(-50%)', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-chip)', padding: '12px 28px', font: '600 15px/1 system-ui', cursor: 'pointer', boxShadow: '0 4px 16px rgba(42,171,238,.4)' } as React.CSSProperties,
} satisfies Record<string, React.CSSProperties>;
