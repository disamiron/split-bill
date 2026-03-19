import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useMarkPaid() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markPaid = async (billId: string, userId: string) => {
    setLoading(true);
    setError(null);

    const { error: err } = await supabase
      .from('bill_participants')
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq('bill_id', billId)
      .eq('user_id', userId);

    setLoading(false);

    if (err) setError(err.message);
    return !err;
  };

  return { markPaid, loading, error };
}
