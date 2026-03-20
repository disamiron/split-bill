// @ts-nocheck — supabase-js 2.99 types require generated schema; replace with `supabase gen types` later
import { useState } from 'react';
import { getAuthedClient } from '@/lib/supabase';
import type { SplitType } from '@/lib/database.types';

interface CreateBillParams {
  groupId: string;
  title: string;
  totalAmount: number;
  currency?: string;
  splitType?: SplitType;
  receiptImageUrl?: string;
  participantIds: string[];
}

export function useCreateBill() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBill = async (params: CreateBillParams) => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await getAuthedClient().rpc('create_bill', {
      p_group_id:          params.groupId,
      p_title:             params.title,
      p_total_amount:      params.totalAmount,
      p_currency:          params.currency ?? 'RUB',
      p_split_type:        params.splitType ?? 'equal',
      p_receipt_image_url: params.receiptImageUrl ?? null,
      p_participant_ids:   params.participantIds,
    });

    setLoading(false);

    if (err) {
      setError(err.message);
      return null;
    }
    return data;
  };

  return { createBill, loading, error };
}
