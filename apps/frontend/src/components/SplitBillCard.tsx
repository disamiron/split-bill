import type { Bill } from '@/types';

interface SplitBillCardProps {
  bill: Bill;
  currentUserId: string;
  onClick: () => void;
}

const formatAmount = (amount: number, currency = 'RUB') =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

export function SplitBillCard({ bill, currentUserId, onClick }: SplitBillCardProps) {
  const currentParticipant = bill.participants.find((p) => p.user.id === currentUserId);
  const paidCount = bill.participants.filter((p) => p.isPaid).length;
  const totalCount = bill.participants.length;
  const isFullySettled = paidCount === totalCount;

  const statusInfo = (() => {
    if (bill.status === 'settled' || isFullySettled) {
      return { label: 'Оплачено', color: 'var(--color-success)' };
    }
    if (currentParticipant && !currentParticipant.isPaid) {
      return {
        label: `Ты должен ${formatAmount(currentParticipant.share, bill.currency)}`,
        color: 'var(--color-danger)',
      };
    }
    return { label: `${paidCount}/${totalCount} оплатили`, color: 'var(--color-warning)' };
  })();

  const progressPercent = Math.round((paidCount / totalCount) * 100);

  return (
    <button onClick={onClick} style={styles.card}>
      <div style={styles.icon}>🧾</div>

      <div style={styles.info}>
        <span style={styles.title}>{bill.title}</span>
        <span style={styles.meta}>
          {formatAmount(bill.totalAmount, bill.currency)} · {totalCount} участника
        </span>
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${progressPercent}%`, background: statusInfo.color }} />
        </div>
      </div>

      <div style={{ ...styles.badge, color: statusInfo.color }}>{statusInfo.label}</div>
    </button>
  );
}

const styles = {
  card: { display: 'flex', alignItems: 'center', gap: 'var(--space-md)', width: '100%', padding: 'var(--space-md)', background: 'var(--tg-theme-secondary-bg-color)', border: 'none', borderRadius: 'var(--radius-card)', cursor: 'pointer', textAlign: 'left', transition: 'opacity 0.15s' } as React.CSSProperties,
  icon: { width: 44, height: 44, borderRadius: '50%', background: 'var(--tg-theme-bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 } as React.CSSProperties,
  info: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 } as React.CSSProperties,
  title: { font: 'var(--font-title)', color: 'var(--tg-theme-text-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as React.CSSProperties,
  meta: { font: 'var(--font-caption)', color: 'var(--tg-theme-hint-color)' } as React.CSSProperties,
  progressTrack: { height: 3, background: 'var(--tg-theme-bg-color)', borderRadius: 2, overflow: 'hidden', marginTop: 4 } as React.CSSProperties,
  progressFill: { height: '100%', borderRadius: 2, transition: 'width 0.3s ease' } as React.CSSProperties,
  badge: { font: 'var(--font-caption)', fontWeight: 600, flexShrink: 0, maxWidth: 90, textAlign: 'right' } as React.CSSProperties,
} satisfies Record<string, React.CSSProperties>;
