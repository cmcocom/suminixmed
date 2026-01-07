'use client';

import Sidebar from '@/app/components/Sidebar';
import { useSidebarContext } from '@/app/contexts/SidebarContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isSidebarOpen } = useSidebarContext();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content - Con margen izquierdo dinámico para el sidebar */}
      <div
        className={`min-h-screen transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-24'}`}
      >
        <main className="overflow-y-auto bg-white min-h-screen">{children}</main>
      </div>
    </div>
  );
}
