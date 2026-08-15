import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppRealtime from './AppRealtime.tsx';
import { DailyCheckinsPortal } from './components/DailyCheckinsPortal.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import './index.css';
import './mobile-enhancements.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRealtime />
    <DailyCheckinsPortal />
    <MobileBottomNav />
  </StrictMode>,
);
