import { createContext, useContext } from 'react';
import type { UserRow } from '@/lib/database.types';

interface AuthContextValue {
  user: UserRow | null;
  telegramChatId: number | null;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  telegramChatId: null,
});

export const useAuth = () => useContext(AuthContext);
