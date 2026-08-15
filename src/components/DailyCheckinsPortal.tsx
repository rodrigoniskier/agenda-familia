import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { INITIAL_MEMBERS } from '../constants';
import { DailyCheckins } from './DailyCheckins';

export const DailyCheckinsPortal: React.FC = () => {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    let container = document.getElementById('daily-checkins-host');
    if (!container) {
      container = document.createElement('div');
      container.id = 'daily-checkins-host';
      container.className = 'max-w-[1600px] w-full mx-auto px-3 sm:px-6 pt-2';
      header.insertAdjacentElement('afterend', container);
    }
    setHost(container);

    return () => {
      if (container?.parentNode) container.parentNode.removeChild(container);
    };
  }, []);

  if (!host) return null;
  return createPortal(<DailyCheckins members={INITIAL_MEMBERS} />, host);
};
