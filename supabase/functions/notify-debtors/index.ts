import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Edge Function: POST /functions/v1/notify-debtors
// Body: { bill_id: string }
// Отправляет напоминание неоплатившим участникам через Telegram Bot API.

const TELEGRAM_API = `https://api.telegram.org/bot${Deno.env.get('TELEGRAM_BOT_TOKEN')}`;

Deno.serve(async (req) => {
  try {
    const { bill_id } = await req.json() as { bill_id: string };
    if (!bill_id) return new Response('bill_id required', { status: 400 });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Получаем счёт и неоплативших участников
    const { data: bill, error: billErr } = await supabase
      .from('bills')
      .select(`
        id, title, total_amount, currency,
        paid_by:users!bills_paid_by_fkey(first_name, username),
        bill_participants(
          share, is_paid,
          user:users(telegram_id, first_name, username)
        )
      `)
      .eq('id', bill_id)
      .single();

    if (billErr || !bill) {
      return new Response(JSON.stringify({ error: 'Bill not found' }), { status: 404 });
    }

    const debtors = (bill.bill_participants as any[]).filter((p) => !p.is_paid);

    const results = await Promise.allSettled(
      debtors.map(async (p) => {
        const amount = new Intl.NumberFormat('ru-RU', {
          style: 'currency',
          currency: bill.currency,
          maximumFractionDigits: 0,
        }).format(p.share);

        const text =
          `👋 Привет, ${p.user.first_name}!\n\n` +
          `Напоминаем: ты должен *${amount}* за «${bill.title}».\n` +
          `Оплатил: ${(bill.paid_by as any).first_name}`;

        const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: p.user.telegram_id,
            text,
            parse_mode: 'Markdown',
          }),
        });
        return res.json();
      }),
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    return new Response(JSON.stringify({ sent, total: debtors.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
