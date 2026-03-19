// Auto-generated types for Supabase schema.
// Regenerate after schema changes:
//   supabase gen types typescript --local > src/lib/database.types.ts

export type SplitType = 'equal' | 'custom';
export type BillStatus = 'active' | 'settled';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          telegram_id: number;
          username: string | null;
          first_name: string;
          last_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      groups: {
        Row: {
          id: string;
          telegram_chat_id: number;
          title: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['groups']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['groups']['Insert']>;
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: Omit<Database['public']['Tables']['group_members']['Row'], 'joined_at'> & {
          joined_at?: string;
        };
        Update: Partial<Database['public']['Tables']['group_members']['Insert']>;
      };
      bills: {
        Row: {
          id: string;
          group_id: string;
          title: string;
          total_amount: number;
          currency: string;
          paid_by: string;
          split_type: SplitType;
          receipt_image_url: string | null;
          status: BillStatus;
          created_at: string;
          settled_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['bills']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['bills']['Insert']>;
      };
      bill_participants: {
        Row: {
          id: string;
          bill_id: string;
          user_id: string;
          share: number;
          is_paid: boolean;
          paid_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['bill_participants']['Row'], 'id'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['bill_participants']['Insert']>;
      };
    };
    Functions: {
      upsert_telegram_user: {
        Args: {
          p_telegram_id: number;
          p_username: string | null;
          p_first_name: string;
          p_last_name: string | null;
          p_avatar_url?: string | null;
        };
        Returns: Database['public']['Tables']['users']['Row'];
      };
      create_bill: {
        Args: {
          p_group_id: string;
          p_title: string;
          p_total_amount: number;
          p_currency: string;
          p_split_type: SplitType;
          p_receipt_image_url: string | null;
          p_participant_ids: string[];
        };
        Returns: Database['public']['Tables']['bills']['Row'];
      };
    };
  };
}
