import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useBill } from '@/hooks/useBill';
import { useMarkPaid } from '@/hooks/useMarkPaid';
import { getAuthedClient } from '@/lib/supabase';

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

export function BillDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bill, loading, error, refetch } = useBill(id);
  const { markPaid, loading: markingPaid } = useMarkPaid();

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div style={styles.center}>
        <span style={styles.hint}>Загрузка...</span>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div style={styles.page}>
        <button onClick={() => navigate(-1)} style={styles.back}>← Назад</button>
        <div style={styles.center}>
          <span style={styles.hint}>{error ?? 'Счёт не найден'}</span>
        </div>
      </div>
    );
  }

  const paidCount = bill.bill_participants.filter((p) => p.is_paid).length;
  const totalCount = bill.bill_participants.length;
  const isSettled = bill.status === 'settled' || paidCount === totalCount;
  const isPaidBy = bill.paid_by === user?.id;

  const myParticipant = bill.bill_participants.find((p) => p.user.id === user?.id);
  const canMarkPaid = myParticipant && !myParticipant.is_paid;

  const handleMarkPaid = async () => {
    if (!user || !id) return;
    const ok = await markPaid(id, user.id);
    if (ok) refetch();
  };

  const startEdit = () => {
    setEditTitle(bill.title);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!editTitle.trim()) return;
    setSaving(true);
    // @ts-expect-error supabase-js generic inference issue with .update partial type
    await getAuthedClient().from('bills').update({ title: editTitle.trim() }).eq('id', bill.id);
    setSaving(false);
    setEditing(false);
    refetch();
  };

  return (
    <div style={styles.page}>
      <div style={styles.topRow}>
        <button onClick={() => navigate(-1)} style={styles.back}>← Назад</button>
        {isPaidBy && !editing && (
          <button onClick={startEdit} style={styles.editBtn}>Изменить</button>
        )}
      </div>

      {/* Header */}
      {editing ? (
        <div style={styles.editRow}>
          <input
            style={styles.editInput}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            autoFocus
          />
          <button onClick={saveEdit} style={styles.saveBtn} disabled={saving}>
            {saving ? '...' : '✓'}
          </button>
          <button onClick={() => setEditing(false)} style={styles.cancelBtn}>✕</button>
        </div>
      ) : (
        <h1 style={styles.heading}>{bill.title}</h1>
      )}

      <div style={styles.metaRow}>
        <span style={styles.metaAmount}>{fmt(bill.total_amount)}</span>
        <span style={styles.metaDot}>·</span>
        <span style={styles.metaText}>{totalCount} участн.</span>
        <span style={styles.metaDot}>·</span>
        <span style={styles.metaText}>{fmtDate(bill.created_at)}</span>
      </div>

      {/* Status badge */}
      <div style={{
        ...styles.statusBadge,
        background: isSettled ? 'rgba(49,195,95,.1)' : 'rgba(249,168,37,.1)',
        color: isSettled ? 'var(--color-success)' : 'var(--color-warning)',
      }}>
        {isSettled ? 'Счёт закрыт' : `${paidCount} из ${totalCount} оплатили`}
      </div>

      {/* Paid by */}
      <div style={styles.paidByRow}>
        <span style={styles.paidByLabel}>Оплатил</span>
        <span style={styles.paidByName}>
          {bill.paid_by_user.first_name}
          {isPaidBy ? ' (ты)' : ''}
        </span>
      </div>

      {/* Participants */}
      <section style={styles.section}>
        <span style={styles.sectionTitle}>Участники</span>
        <div style={styles.list}>
          {bill.bill_participants.map((p) => {
            const isMe = p.user.id === user?.id;
            return (
              <div key={p.id} style={styles.row}>
                {p.user.avatar_url ? (
                  <img src={p.user.avatar_url} alt={p.user.first_name} style={styles.avatarImg} />
                ) : (
                  <div style={styles.avatar}>
                    {p.user.first_name[0]}
                  </div>
                )}
                <div style={styles.nameCol}>
                  <span style={styles.name}>
                    {p.user.first_name}
                    {isMe ? ' (ты)' : ''}
                  </span>
                  <span style={{
                    ...styles.status,
                    color: p.is_paid ? 'var(--color-success)' : 'var(--tg-theme-hint-color)',
                  }}>
                    {p.is_paid ? 'Оплачено' : 'Ожидание'}
                  </span>
                </div>
                <span style={{
                  ...styles.share,
                  color: p.is_paid ? 'var(--color-success)' : 'var(--tg-theme-text-color)',
                }}>
                  {fmt(p.share)}
                  {p.is_paid ? ' ✓' : ''}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Actions */}
      <div style={styles.actions}>
        {canMarkPaid && (
          <button
            style={styles.primaryBtn}
            onClick={handleMarkPaid}
            disabled={markingPaid}
          >
            {markingPaid ? 'Отмечаем...' : `Я оплатил ${fmt(myParticipant.share)}`}
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: 'var(--space-md)',
    paddingBottom: 40,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)',
  } as React.CSSProperties,
  center: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60dvh',
  } as React.CSSProperties,

  // Top row
  topRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  } as React.CSSProperties,
  back: {
    border: 'none', background: 'none',
    color: 'var(--color-accent)', font: 'var(--font-body)',
    cursor: 'pointer', padding: 0,
  } as React.CSSProperties,
  editBtn: {
    border: 'none', background: 'none',
    color: 'var(--color-accent)', font: 'var(--font-caption)',
    fontWeight: 600, cursor: 'pointer', padding: 0,
  } as React.CSSProperties,

  // Heading
  heading: {
    font: '700 22px/1.2 system-ui, sans-serif',
    color: 'var(--tg-theme-text-color)',
    margin: 0,
  } as React.CSSProperties,

  // Edit row
  editRow: {
    display: 'flex', gap: 'var(--space-xs)', alignItems: 'center',
  } as React.CSSProperties,
  editInput: {
    flex: 1,
    padding: '10px var(--space-md)',
    background: 'var(--tg-theme-secondary-bg-color)',
    border: '2px solid var(--color-accent)',
    borderRadius: 'var(--radius-button)',
    font: '600 17px/1.2 system-ui',
    color: 'var(--tg-theme-text-color)',
    outline: 'none',
  } as React.CSSProperties,
  saveBtn: {
    width: 36, height: 36,
    borderRadius: '50%', border: 'none',
    background: 'var(--color-accent)', color: '#fff',
    font: '600 16px system-ui', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  } as React.CSSProperties,
  cancelBtn: {
    width: 36, height: 36,
    borderRadius: '50%', border: 'none',
    background: 'var(--tg-theme-secondary-bg-color)',
    color: 'var(--tg-theme-hint-color)',
    font: '600 16px system-ui', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  } as React.CSSProperties,

  // Meta
  metaRow: {
    display: 'flex', alignItems: 'baseline', gap: 'var(--space-xs)',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  metaAmount: {
    font: '700 28px/1 system-ui',
    color: 'var(--tg-theme-text-color)',
  } as React.CSSProperties,
  metaDot: {
    color: 'var(--tg-theme-hint-color)',
    font: 'var(--font-caption)',
  } as React.CSSProperties,
  metaText: {
    font: 'var(--font-caption)',
    color: 'var(--tg-theme-hint-color)',
  } as React.CSSProperties,

  // Status badge
  statusBadge: {
    alignSelf: 'flex-start',
    padding: '6px 14px',
    borderRadius: 'var(--radius-chip)',
    font: '600 13px/1 system-ui',
  } as React.CSSProperties,

  // Paid by
  paidByRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: 'var(--space-sm) var(--space-md)',
    background: 'var(--tg-theme-secondary-bg-color)',
    borderRadius: 'var(--radius-card)',
  } as React.CSSProperties,
  paidByLabel: {
    font: 'var(--font-caption)', color: 'var(--tg-theme-hint-color)',
  } as React.CSSProperties,
  paidByName: {
    font: 'var(--font-body)', fontWeight: 600,
    color: 'var(--tg-theme-text-color)',
  } as React.CSSProperties,

  // Participants section
  section: {
    display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)',
  } as React.CSSProperties,
  sectionTitle: {
    font: 'var(--font-caption)', color: 'var(--tg-theme-hint-color)',
  } as React.CSSProperties,
  list: {
    background: 'var(--tg-theme-secondary-bg-color)',
    borderRadius: 'var(--radius-card)',
    overflow: 'hidden',
  } as React.CSSProperties,
  row: {
    display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
    padding: 'var(--space-md)',
    borderBottom: '0.5px solid var(--tg-theme-bg-color)',
  } as React.CSSProperties,
  avatar: {
    width: 36, height: 36,
    borderRadius: '50%',
    background: 'var(--color-accent)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    font: '600 15px system-ui',
    flexShrink: 0,
  } as React.CSSProperties,
  avatarImg: {
    width: 36, height: 36,
    borderRadius: '50%',
    objectFit: 'cover' as const,
    flexShrink: 0,
  } as React.CSSProperties,
  nameCol: {
    flex: 1, display: 'flex', flexDirection: 'column', gap: 2,
  } as React.CSSProperties,
  name: {
    font: 'var(--font-body)', color: 'var(--tg-theme-text-color)',
  } as React.CSSProperties,
  status: {
    font: 'var(--font-caption)',
  } as React.CSSProperties,
  share: {
    font: '600 15px/1 system-ui',
    flexShrink: 0,
  } as React.CSSProperties,

  // Actions
  actions: {
    display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)',
    marginTop: 'var(--space-sm)',
  } as React.CSSProperties,
  primaryBtn: {
    padding: '14px',
    background: 'var(--color-accent)', color: '#fff',
    border: 'none', borderRadius: 'var(--radius-button)',
    font: '600 16px/1 system-ui', cursor: 'pointer',
  } as React.CSSProperties,

  hint: {
    font: 'var(--font-body)', color: 'var(--tg-theme-hint-color)',
  } as React.CSSProperties,
} satisfies Record<string, React.CSSProperties>;
