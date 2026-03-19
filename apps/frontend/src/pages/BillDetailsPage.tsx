import { useNavigate, useParams } from "react-router-dom";
import type { BillParticipant } from "@/types";

const formatAmount = (n: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(n);

// Mock — replace with Supabase fetch by id
const MOCK_PARTICIPANTS: BillParticipant[] = [
  {
    user: { id: "u1", telegramId: 1, firstName: "Алексей" },
    share: 1075,
    isPaid: true,
    paidAt: new Date().toISOString(),
  },
  {
    user: { id: "u2", telegramId: 2, firstName: "Мария" },
    share: 1075,
    isPaid: true,
  },
  {
    user: { id: "u3", telegramId: 3, firstName: "Игорь" },
    share: 1075,
    isPaid: false,
  },
  {
    user: { id: "u4", telegramId: 4, firstName: "Дима" },
    share: 1075,
    isPaid: false,
  },
];

export function BillDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div style={styles.page} data-bill-id={id ?? ""}>
      <button onClick={() => navigate(-1)} style={styles.back}>
        ← Назад
      </button>
      <h1 style={styles.heading}>Ужин в ресторане</h1>
      <p style={styles.meta}>4 300 ₽ · 4 участника · 19 марта</p>

      <section style={styles.section}>
        {MOCK_PARTICIPANTS.map((p) => (
          <div key={p.user.id} style={styles.row}>
            <div style={styles.avatar}>{p.user.firstName[0]}</div>
            <span style={styles.name}>{p.user.firstName}</span>
            <span
              style={{
                ...styles.share,
                color: p.isPaid
                  ? "var(--color-success)"
                  : "var(--tg-theme-text-color)",
              }}
            >
              {formatAmount(p.share)} {p.isPaid ? "✓" : "⏳"}
            </span>
          </div>
        ))}
      </section>

      <div style={styles.actions}>
        <button style={styles.btn}>Отметить как оплачен</button>
        <button
          style={{
            ...styles.btn,
            background: "var(--tg-theme-bg-color)",
            color: "var(--color-accent)",
          }}
        >
          Отправить напоминание
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "var(--space-md)",
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-md)",
  } as React.CSSProperties,
  back: {
    alignSelf: "flex-start",
    border: "none",
    background: "none",
    color: "var(--color-accent)",
    font: "var(--font-body)",
    cursor: "pointer",
    padding: 0,
  } as React.CSSProperties,
  heading: {
    font: "700 20px/1.2 system-ui, sans-serif",
    color: "var(--tg-theme-text-color)",
  } as React.CSSProperties,
  meta: {
    font: "var(--font-caption)",
    color: "var(--tg-theme-hint-color)",
  } as React.CSSProperties,
  section: {
    background: "var(--tg-theme-secondary-bg-color)",
    borderRadius: "var(--radius-card)",
    overflow: "hidden",
  } as React.CSSProperties,
  row: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-sm)",
    padding: "var(--space-md)",
    borderBottom: "0.5px solid var(--tg-theme-bg-color)",
  } as React.CSSProperties,
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "var(--color-accent)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    font: "600 15px system-ui",
    flexShrink: 0,
  } as React.CSSProperties,
  name: {
    flex: 1,
    font: "var(--font-body)",
    color: "var(--tg-theme-text-color)",
  } as React.CSSProperties,
  share: { font: "600 15px/1 system-ui" } as React.CSSProperties,
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-sm)",
  } as React.CSSProperties,
  btn: {
    padding: "14px",
    background: "var(--color-accent)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius-button)",
    font: "600 16px/1 system-ui",
    cursor: "pointer",
  } as React.CSSProperties,
} satisfies Record<string, React.CSSProperties>;
