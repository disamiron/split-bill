import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useGroup } from '@/hooks/useGroup';
import { useGroupMembers } from '@/hooks/useGroupMembers';
import { useCreateBill } from '@/hooks/useCreateBill';
import type { SplitType } from '@/lib/database.types';
import type { UserRow } from '@/lib/database.types';

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);

export function CreateBillPage() {
  const navigate = useNavigate();
  const { user, telegramChatId } = useAuth();
  const { group } = useGroup(telegramChatId);
  const { members, loading: membersLoading } = useGroupMembers(group?.id ?? null);
  const { createBill, loading: submitting, error } = useCreateBill();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customShares, setCustomShares] = useState<Record<string, string>>({});

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setCustomShares((s) => { const n = { ...s }; delete n[id]; return n; });
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === members.length) {
      setSelectedIds(new Set());
      setCustomShares({});
    } else {
      setSelectedIds(new Set(members.map((m) => m.id)));
    }
  };

  const setShare = (id: string, value: string) => {
    setCustomShares((prev) => ({ ...prev, [id]: value }));
  };

  // Total for custom mode = sum of individual shares
  const customTotal = [...selectedIds].reduce((sum, id) => {
    const val = parseFloat(customShares[id] || '0');
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const perPerson = splitType === 'equal' && selectedIds.size > 0 && amount
    ? parseFloat(amount) / selectedIds.size
    : 0;

  const isFormValid = (() => {
    if (!title.trim() || selectedIds.size === 0) return false;
    if (splitType === 'equal') return !!amount && parseFloat(amount) > 0;
    // custom: every selected participant must have a share > 0
    return [...selectedIds].every((id) => {
      const val = parseFloat(customShares[id] || '0');
      return val > 0;
    });
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !isFormValid) return;

    if (splitType === 'equal') {
      const result = await createBill({
        groupId: group.id,
        title: title.trim(),
        totalAmount: parseFloat(amount),
        splitType: 'equal',
        participantIds: [...selectedIds],
      });
      if (result) navigate('/');
    } else {
      const shares = [...selectedIds].map((id) => ({
        user_id: id,
        share: parseFloat(customShares[id] || '0'),
      }));
      const result = await createBill({
        groupId: group.id,
        title: title.trim(),
        totalAmount: customTotal,
        splitType: 'custom',
        participantShares: shares,
      });
      if (result) navigate('/');
    }
  };

  if (!group) {
    return (
      <div style={styles.center}>
        <span style={styles.hint}>Открой Split Bill из группового чата</span>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Новый счёт</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>
          Название
          <input
            style={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ужин в ресторане"
            required
          />
        </label>

        {/* Toggle: equal / custom */}
        <div style={styles.toggleRow}>
          <button
            type="button"
            style={{ ...styles.toggleBtn, ...(splitType === 'equal' ? styles.toggleActive : {}) }}
            onClick={() => setSplitType('equal')}
          >
            Поровну
          </button>
          <button
            type="button"
            style={{ ...styles.toggleBtn, ...(splitType === 'custom' ? styles.toggleActive : {}) }}
            onClick={() => setSplitType('custom')}
          >
            Разные доли
          </button>
        </div>

        {/* Amount field */}
        <label style={styles.label}>
          {splitType === 'equal' ? 'Сумма (₽)' : 'Итого (₽)'}
          <input
            style={{
              ...styles.input,
              ...(splitType === 'custom' ? styles.inputDisabled : {}),
            }}
            type="number"
            inputMode="decimal"
            value={splitType === 'custom' ? (customTotal > 0 ? customTotal.toString() : '') : amount}
            onChange={splitType === 'equal' ? (e) => setAmount(e.target.value) : undefined}
            placeholder="0"
            min="1"
            step="any"
            disabled={splitType === 'custom'}
            required={splitType === 'equal'}
          />
        </label>

        {/* Participants */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>Разделить между</span>
            <button type="button" style={styles.selectAllBtn} onClick={selectAll}>
              {selectedIds.size === members.length ? 'Снять все' : 'Выбрать всех'}
            </button>
          </div>

          {membersLoading ? (
            <span style={styles.hint}>Загрузка участников...</span>
          ) : members.length === 0 ? (
            <span style={styles.hint}>Нет участников в группе</span>
          ) : (
            <div style={styles.memberList}>
              {members.map((member) => (
                <MemberChip
                  key={member.id}
                  member={member}
                  selected={selectedIds.has(member.id)}
                  isYou={member.id === user?.id}
                  onToggle={() => toggleMember(member.id)}
                  splitType={splitType}
                  shareValue={customShares[member.id] ?? ''}
                  onShareChange={(val) => setShare(member.id, val)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        {splitType === 'equal' && perPerson > 0 && (
          <div style={styles.preview}>
            <span style={styles.previewLabel}>
              {fmt(perPerson)} на каждого ({selectedIds.size} чел.)
            </span>
          </div>
        )}
        {splitType === 'custom' && customTotal > 0 && (
          <div style={styles.preview}>
            <span style={styles.previewLabel}>
              Итого: {fmt(customTotal)} ({selectedIds.size} чел.)
            </span>
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}

        <button
          type="submit"
          style={{
            ...styles.submit,
            opacity: submitting || !isFormValid ? 0.5 : 1,
          }}
          disabled={submitting || !isFormValid}
        >
          {submitting ? 'Создаём...' : 'Создать счёт'}
        </button>
      </form>
    </div>
  );
}

function MemberChip({
  member,
  selected,
  isYou,
  onToggle,
  splitType,
  shareValue,
  onShareChange,
}: {
  member: UserRow;
  selected: boolean;
  isYou: boolean;
  onToggle: () => void;
  splitType: SplitType;
  shareValue: string;
  onShareChange: (val: string) => void;
}) {
  const name = member.first_name + (isYou ? ' (ты)' : '');
  return (
    <div style={{ ...styles.chip, ...(selected ? styles.chipSelected : {}) }}>
      <button type="button" onClick={onToggle} style={styles.chipButton}>
        <span style={styles.chipAvatar}>
          {member.avatar_url
            ? <img src={member.avatar_url} alt="" style={styles.avatarImg} />
            : member.first_name[0]}
        </span>
        <span style={styles.chipName}>{name}</span>
        <span style={styles.chipCheck}>{selected ? '✓' : ''}</span>
      </button>
      {splitType === 'custom' && selected && (
        <input
          type="number"
          inputMode="decimal"
          style={styles.shareInput}
          value={shareValue}
          onChange={(e) => onShareChange(e.target.value)}
          placeholder="0 ₽"
          min="0"
          step="any"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: 'var(--space-md)',
    paddingBottom: 100,
  } as React.CSSProperties,
  center: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60dvh',
  } as React.CSSProperties,
  heading: {
    font: '700 22px/1.2 system-ui, sans-serif',
    color: 'var(--tg-theme-text-color)',
    marginBottom: 'var(--space-lg)',
  } as React.CSSProperties,
  form: {
    display: 'flex', flexDirection: 'column', gap: 'var(--space-md)',
  } as React.CSSProperties,
  label: {
    display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)',
    font: 'var(--font-caption)', color: 'var(--tg-theme-hint-color)',
  } as React.CSSProperties,
  input: {
    padding: '12px var(--space-md)',
    background: 'var(--tg-theme-secondary-bg-color)',
    border: 'none',
    borderRadius: 'var(--radius-button)',
    font: 'var(--font-body)',
    color: 'var(--tg-theme-text-color)',
    outline: 'none',
  } as React.CSSProperties,
  inputDisabled: {
    opacity: 0.6,
    cursor: 'default',
  } as React.CSSProperties,

  // Toggle
  toggleRow: {
    display: 'flex', gap: 'var(--space-xs)',
    background: 'var(--tg-theme-secondary-bg-color)',
    borderRadius: 'var(--radius-button)',
    padding: 3,
  } as React.CSSProperties,
  toggleBtn: {
    flex: 1,
    padding: '10px 0',
    border: 'none',
    borderRadius: 8,
    background: 'transparent',
    font: '500 14px/1 system-ui',
    color: 'var(--tg-theme-hint-color)',
    cursor: 'pointer',
    transition: 'all .2s',
  } as React.CSSProperties,
  toggleActive: {
    background: 'var(--tg-theme-bg-color)',
    color: 'var(--color-accent)',
    fontWeight: 600,
    boxShadow: '0 1px 3px rgba(0,0,0,.08)',
  } as React.CSSProperties,

  // Participants
  section: {
    display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)',
  } as React.CSSProperties,
  sectionHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  } as React.CSSProperties,
  sectionTitle: {
    font: 'var(--font-caption)', color: 'var(--tg-theme-hint-color)',
  } as React.CSSProperties,
  selectAllBtn: {
    background: 'none', border: 'none', font: 'var(--font-caption)',
    color: 'var(--color-accent)', cursor: 'pointer', padding: 0,
  } as React.CSSProperties,
  memberList: {
    display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)',
  } as React.CSSProperties,

  // Chip
  chip: {
    display: 'flex', flexDirection: 'column',
    background: 'var(--tg-theme-secondary-bg-color)',
    border: '2px solid transparent',
    borderRadius: 'var(--radius-card)',
    transition: 'border-color .15s',
    overflow: 'hidden',
  } as React.CSSProperties,
  chipSelected: {
    borderColor: 'var(--color-accent)',
    background: 'rgba(42, 171, 238, 0.08)',
  } as React.CSSProperties,
  chipButton: {
    display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
    padding: '10px var(--space-md)',
    background: 'none', border: 'none', cursor: 'pointer',
    width: '100%',
  } as React.CSSProperties,
  chipAvatar: {
    width: 32, height: 32,
    borderRadius: '50%',
    background: 'var(--color-accent)',
    color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    font: '600 14px system-ui',
    overflow: 'hidden',
    flexShrink: 0,
  } as React.CSSProperties,
  avatarImg: {
    width: '100%', height: '100%', objectFit: 'cover',
  } as React.CSSProperties,
  chipName: {
    flex: 1,
    font: 'var(--font-body)',
    color: 'var(--tg-theme-text-color)',
    textAlign: 'left',
  } as React.CSSProperties,
  chipCheck: {
    width: 20,
    font: '600 16px system-ui',
    color: 'var(--color-accent)',
    textAlign: 'center',
  } as React.CSSProperties,
  shareInput: {
    padding: '8px var(--space-md)',
    margin: '0 var(--space-md) 10px',
    background: 'var(--tg-theme-bg-color)',
    border: '1px solid rgba(42, 171, 238, 0.3)',
    borderRadius: 'var(--radius-button)',
    font: '500 15px/1 system-ui',
    color: 'var(--tg-theme-text-color)',
    outline: 'none',
    textAlign: 'right',
  } as React.CSSProperties,

  // Preview
  preview: {
    padding: 'var(--space-sm) var(--space-md)',
    background: 'rgba(42, 171, 238, 0.08)',
    borderRadius: 'var(--radius-card)',
    textAlign: 'center',
  } as React.CSSProperties,
  previewLabel: {
    font: 'var(--font-body)',
    color: 'var(--color-accent)',
    fontWeight: 600,
  } as React.CSSProperties,

  error: {
    padding: 'var(--space-sm) var(--space-md)',
    background: '#fff3f3',
    borderRadius: 'var(--radius-card)',
    color: 'var(--color-danger)',
    font: 'var(--font-caption)',
  } as React.CSSProperties,

  submit: {
    marginTop: 'var(--space-sm)',
    padding: '14px',
    background: 'var(--color-accent)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-button)',
    font: '600 16px/1 system-ui',
    cursor: 'pointer',
  } as React.CSSProperties,

  hint: {
    font: 'var(--font-body)', color: 'var(--tg-theme-hint-color)',
  } as React.CSSProperties,
} satisfies Record<string, React.CSSProperties>;
