import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import MinimalApp from './MinimalApp.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MinimalApp />
  </StrictMode>,
);
