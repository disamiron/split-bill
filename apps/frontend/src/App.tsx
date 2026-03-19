import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { init, miniApp, viewport } from '@telegram-apps/sdk';

import { BillsListPage } from '@/pages/BillsListPage';
import { CreateBillPage } from '@/pages/CreateBillPage';
import { BillDetailsPage } from '@/pages/BillDetailsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { BottomNav } from '@/components/BottomNav';

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

  return (
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
  );
}
