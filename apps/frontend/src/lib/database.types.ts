// Auto-generated types for Supabase schema.
// Regenerate after schema changes:
//   supabase gen types typescript --local > src/lib/database.types.ts

export type SplitType = 'equal' | 'custom';
export type BillStatus = 'active' | 'settled';

// ── Row types ─────────────────────────────────────────────

export interface UserRow {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface GroupRow {
  id: string;
  telegram_chat_id: number;
  title: string;
  created_at: string;
}

export interface GroupMemberRow {
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface BillRow {
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
}

export interface BillParticipantRow {
  id: string;
  bill_id: string;
  user_id: string;
  share: number;
  is_paid: boolean;
  paid_at: string | null;
}

// ── Database schema ───────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: Omit<UserRow, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<UserRow, 'id' | 'created_at'>>;
      };
      groups: {
        Row: GroupRow;
        Insert: Omit<GroupRow, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<GroupRow, 'id' | 'created_at'>>;
      };
      group_members: {
        Row: GroupMemberRow;
        Insert: Omit<GroupMemberRow, 'joined_at'> & { joined_at?: string };
        Update: Partial<Omit<GroupMemberRow, 'group_id' | 'user_id'>>;
      };
      bills: {
        Row: BillRow;
        Insert: Omit<BillRow, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<BillRow, 'id' | 'created_at'>>;
      };
      bill_participants: {
        Row: BillParticipantRow;
        Insert: Omit<BillParticipantRow, 'id'> & { id?: string };
        Update: Partial<Omit<BillParticipantRow, 'id' | 'bill_id' | 'user_id'>>;
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      upsert_telegram_user: {
        Args: {
          p_telegram_id: number;
          p_username: string | null;
          p_first_name: string;
          p_last_name: string | null;
          p_avatar_url?: string | null;
        };
        Returns: UserRow;
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
        Returns: BillRow;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
