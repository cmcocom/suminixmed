'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import apiFetch from '@/lib/fetcher';
import { toast } from 'react-hot-toast';
import { ProductosAgotadosIndicator } from '../components/indicators/ProductosAgotadosIndicator';
import { ProductosPorAgotarseIndicator } from '../components/indicators/ProductosPorAgotarseIndicator';
import { ProductosSobreStockIndicator } from '../components/indicators/ProductosSobreStockIndicator';
import ProductosProximosVencerIndicator from '../components/indicators/ProductosProximosVencerIndicator';
import ProductosVencidosIndicator from '../components/indicators/ProductosVencidosIndicator';

interface DashboardStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    totalProducts: number;
    totalCategories: number;
    totalClients: number;
    totalFondosFijos: number;
    concurrentUsers: number; // Usuarios conectados concurrentemente
  };
  licenses: {
    maxUsers: number;
    activeUsers: number;
    availableSlots: number;
    usagePercentage: number;
    sessionTimeout: number;
  };
  inventory: {
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    expiredProducts: number;
    nearExpiryProducts: number;
    stockAlerts: number;
    expiryAlerts: number;
  };
  categories: {
    total: number;
    active: number;
    inactive: number;
    topCategories: Array<{
      id: string;
      nombre: string;
      productCount: number;
    }>;
  };
  clients: {
    total: number;
    active: number;
    inactive: number;
  };
  fondosFijos: {
    total: number;
    lowStock: number;
    needsAttention: number;
  };
  entity: {
    name: string;
    isConfigured: boolean;
  };
  topProducts: Array<{
    id: string;
    nombre: string;
    cantidad: number;
    categoria: string;
  }>;
  systemHealth: {
    alertsCount: number;
    hasAlerts: boolean;
    licenseStatus: 'good' | 'warning' | 'critical';
  };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Cargar estadísticas
  const fetchStats = async () => {
    try {
      const response = await apiFetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Error al cargar estadísticas');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      toast.error('Error al cargar las estadísticas del dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Actualizar estadísticas cada 5 minutos
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          {/* Logo animado */}
          <div className="relative">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0M8 15v0"
                />
              </svg>
            </div>
            {/* Anillos animados */}
            <div className="absolute inset-0 w-20 h-20 mx-auto">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-2xl animate-ping"></div>
              <div className="absolute inset-2 border-2 border-indigo-300 rounded-xl animate-pulse"></div>
            </div>
          </div>

          {/* Texto de carga */}
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-gray-800">Cargando Dashboard</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Estamos preparando tus datos y estadísticas más recientes
            </p>

            {/* Barra de progreso animada */}
            <div className="w-64 mx-auto">
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-full rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Indicadores de carga */}
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce delay-100"></div>
            <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="space-y-8 p-6">
        {/* Header mejorado con saludo y hora */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl shadow-xl">
          {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

          <div className="relative z-10 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0M8 15v0"
                      />
                    </svg>
                  </div>
                  <h1 className="text-4xl font-bold !text-white tracking-tight">
                    {getGreeting()}, {session?.user?.name?.split(' ')[0] || 'Usuario'}
                  </h1>
                </div>
                <p className="text-xl !text-white font-medium">
                  Bienvenido al sistema de gestión - {stats?.entity.name || 'Sistema'}
                </p>
                <div className="flex items-center space-x-4 !text-white">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm">Última actualización: hace 5 min</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm">Sistema operativo</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-3">
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-right">
                    <div className="text-3xl font-bold !text-white tracking-wider">
                      {formatTime(currentTime)}
                    </div>
                    <div className="!text-white text-sm font-medium mt-1">
                      {formatDate(currentTime)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Indicador de estado del sistema mejorado */}
            {stats?.systemHealth.hasAlerts && (
              <div className="mt-6 bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <svg
                        className="w-5 h-5 text-yellow-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="!text-white font-semibold">
                        {stats.systemHealth.alertsCount} alerta
                        {stats.systemHealth.alertsCount !== 1 ? 's' : ''} del sistema
                      </div>
                      <div className="!text-white text-sm">
                        Requiere{stats.systemHealth.alertsCount !== 1 ? 'n' : ''} atención inmediata
                      </div>
                    </div>
                  </div>
                  <button className="bg-white/20 hover:bg-white/30 !text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium">
                    Ver detalles
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Indicadores de Stock - Disponibles para todos los usuarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <ProductosAgotadosIndicator />
          <ProductosPorAgotarseIndicator />
          <ProductosSobreStockIndicator />
          <ProductosProximosVencerIndicator />
          <ProductosVencidosIndicator />
        </div>
      </div>
    </div>
  );
}
