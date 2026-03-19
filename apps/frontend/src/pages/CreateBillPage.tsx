import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function CreateBillPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: save to Supabase
    navigate('/');
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Новый счет</h1>
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
        <label style={styles.label}>
          Сумма (₽)
          <input
            style={styles.input}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min="1"
            required
          />
        </label>
        {/* TODO: receipt photo upload, participant picker, split type toggle */}
        <button type="submit" style={styles.submit}>
          Создать счет
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: { padding: 'var(--space-md)' } as React.CSSProperties,
  heading: { font: '700 22px/1.2 system-ui, sans-serif', color: 'var(--tg-theme-text-color)', marginBottom: 'var(--space-lg)' } as React.CSSProperties,
  form: { display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' } as React.CSSProperties,
  label: { display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', font: 'var(--font-body)', color: 'var(--tg-theme-hint-color)' } as React.CSSProperties,
  input: { padding: '12px var(--space-md)', background: 'var(--tg-theme-secondary-bg-color)', border: 'none', borderRadius: 'var(--radius-button)', font: 'var(--font-body)', color: 'var(--tg-theme-text-color)', outline: 'none' } as React.CSSProperties,
  submit: { marginTop: 'var(--space-md)', padding: '14px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-button)', font: '600 16px/1 system-ui', cursor: 'pointer' } as React.CSSProperties,
} satisfies Record<string, React.CSSProperties>;
