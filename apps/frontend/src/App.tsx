import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { init, miniApp, viewport } from '@telegram-apps/sdk';

import { BillsListPage } from '@/pages/BillsListPage';
import { CreateBillPage } from '@/pages/CreateBillPage';
import { BillDetailsPage } from '@/pages/BillDetailsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { BottomNav } from '@/components/BottomNav';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { AuthContext } from '@/context/AuthContext';

import '@/styles/telegram-theme.css';

function useTelegramInit() {
  useEffect(() => {
    try {
      init();

      if (miniApp.isMounted()) {
        miniApp.setHeaderColor('secondary_bg_color');
        miniApp.setBottomBarColor('secondary_bg_color');
      }

      if (viewport.isMounted()) {
        viewport.expand();
      }
    } catch {
      // Running outside Telegram (local dev) — graceful degradation
    }
  }, []);
}

export function App() {
  useTelegramInit();
  const { user, telegramChatId, loading, error } = useTelegramAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <span style={{ font: '400 15px system-ui', color: 'var(--tg-theme-hint-color)' }}>Загрузка...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: 24 }}>
        <span style={{ font: '400 15px system-ui', color: 'var(--color-danger)', textAlign: 'center' }}>
          Ошибка авторизации: {error}
        </span>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, telegramChatId }}>
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<BillsListPage />} />
            <Route path="/create" element={<CreateBillPage />} />
            <Route path="/bill/:id" element={<BillDetailsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
    </AuthContext.Provider>
  );
}
