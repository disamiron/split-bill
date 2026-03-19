export interface User {
  id: string;
  telegramId: number;
  username?: string;
  firstName: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface Bill {
  id: string;
  groupId: string;
  title: string;
  totalAmount: number;
  currency: string;
  paidBy: User;
  participants: BillParticipant[];
  receiptImageUrl?: string;
  splitType: 'equal' | 'custom';
  createdAt: string;
  status: 'active' | 'settled';
}

export interface BillParticipant {
  user: User;
  share: number;
  isPaid: boolean;
  paidAt?: string;
}

export interface Group {
  id: string;
  telegramChatId: number;
  title: string;
  members: User[];
  bills: Bill[];
}
