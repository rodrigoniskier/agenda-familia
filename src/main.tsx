import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppRealtime from './AppRealtime.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRealtime />
  </StrictMode>,
);
