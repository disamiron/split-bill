import { useEffect, useState } from 'react';
import { getAuthedClient } from '@/lib/supabase';
import type { GroupRow } from '@/lib/database.types';

export function useGroup(telegramChatId: number | null) {
  const [group, setGroup] = useState<GroupRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!telegramChatId) {
      setLoading(false);
      return;
    }

    getAuthedClient()
      .from('groups')
      .select('*')
      .eq('telegram_chat_id', telegramChatId)
      .single()
      .then(({ data }) => {
        setGroup(data);
        setLoading(false);
      });
  }, [telegramChatId]);

  return { group, loading };
}
