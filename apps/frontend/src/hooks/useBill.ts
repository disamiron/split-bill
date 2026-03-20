import { useEffect, useState } from 'react';
import { getAuthedClient } from '@/lib/supabase';
import type { BillWithParticipants } from '@/hooks/useBills';

export function useBill(billId: string | undefined) {
  const [bill, setBill] = useState<BillWithParticipants | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBill = async () => {
    if (!billId) return;
    setLoading(true);
    setError(null);

    const { data, error: err } = await getAuthedClient()
      .from('bills')
      .select(`
        *,
        paid_by_user:users!bills_paid_by_fkey(id, first_name, username, avatar_url),
        bill_participants(
          id, share, is_paid, paid_at,
          user:users(id, first_name, username, avatar_url)
        )
      `)
      .eq('id', billId)
      .single();

    if (err) {
      setError(err.message);
    } else {
      setBill(data as unknown as BillWithParticipants);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!billId) return;

    fetchBill();

    const channel = getAuthedClient()
      .channel(`bill:${billId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills', filter: `id=eq.${billId}` }, fetchBill)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bill_participants', filter: `bill_id=eq.${billId}` }, fetchBill)
      .subscribe();

    return () => { getAuthedClient().removeChannel(channel); };
  }, [billId]);

  return { bill, loading, error, refetch: fetchBill };
}
