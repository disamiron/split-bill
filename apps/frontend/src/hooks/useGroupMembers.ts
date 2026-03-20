import { useEffect, useState } from 'react';
import { getAuthedClient } from '@/lib/supabase';
import type { UserRow } from '@/lib/database.types';

export function useGroupMembers(groupId: string | null) {
  const [members, setMembers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    getAuthedClient()
      .from('group_members')
      .select('user:users(*)')
      .eq('group_id', groupId)
      .then(({ data }) => {
        const users = (data ?? []).map((row: { user: UserRow }) => row.user);
        setMembers(users);
        setLoading(false);
      });
  }, [groupId]);

  return { members, loading };
}
