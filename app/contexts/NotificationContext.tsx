'use client';

import React, { createContext, useContext, useRef } from 'react';

interface NotificationContextType {
  idleWarningShown: React.MutableRefObject<boolean>;
  autoLogoutTimer: React.MutableRefObject<NodeJS.Timeout | null>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const idleWarningShown = useRef(false);
  const autoLogoutTimer = useRef<NodeJS.Timeout | null>(null);

  return (
    <NotificationContext.Provider value={{ idleWarningShown, autoLogoutTimer }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
