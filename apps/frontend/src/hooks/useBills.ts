import { useEffect, useState } from 'react';
import { getAuthedClient } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type BillRow = Database['public']['Tables']['bills']['Row'];

export interface BillWithParticipants extends BillRow {
  paid_by_user: {
    id: string;
    first_name: string;
    username: string | null;
  };
  bill_participants: Array<{
    id: string;
    share: number;
    is_paid: boolean;
    paid_at: string | null;
    user: {
      id: string;
      first_name: string;
      username: string | null;
    };
  }>;
}

export function useBills(groupId: string) {
  const [bills, setBills] = useState<BillWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;

    const fetchBills = async () => {
      setLoading(true);
      setError(null);

      const { data, error: err } = await getAuthedClient()
        .from('bills')
        .select(`
          *,
          paid_by_user:users!bills_paid_by_fkey(id, first_name, username),
          bill_participants(
            id, share, is_paid, paid_at,
            user:users(id, first_name, username)
          )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (err) {
        setError(err.message);
      } else {
        setBills((data as BillWithParticipants[]) ?? []);
      }
      setLoading(false);
    };

    fetchBills();

    const channel = getAuthedClient()
      .channel(`bills:${groupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills', filter: `group_id=eq.${groupId}` }, fetchBills)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bill_participants' }, fetchBills)
      .subscribe();

    return () => { getAuthedClient().removeChannel(channel); };
  }, [groupId]);

  return { bills, loading, error };
}
