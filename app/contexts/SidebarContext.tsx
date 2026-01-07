'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  isHydrated: boolean;
  autoHideEnabled: boolean;
  setAutoHideEnabled: (enabled: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [autoHideEnabled, setAutoHideEnabled] = useState(false);

  // Asegurar que el componente esté hidratado antes de mostrar contenido condicional
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const setSidebarOpen = (open: boolean) => {
    setIsSidebarOpen(open);
  };

  return (
    <SidebarContext.Provider
      value={{
        isSidebarOpen,
        toggleSidebar,
        setSidebarOpen,
        isHydrated,
        autoHideEnabled,
        setAutoHideEnabled,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }
  return context;
}
