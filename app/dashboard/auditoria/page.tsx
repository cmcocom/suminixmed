'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ClockIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CalendarIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CircleStackIcon,
  ChartBarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import ProtectedPage from '@/app/components/ProtectedPage';
import apiFetch from '@/lib/fetcher';
import { toast } from 'react-hot-toast';

// Interfaces
interface AuditLog {
  id: number;
  table_name: string;
  record_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  changed_at: string;
  user_id?: string;
  username?: string;
}

interface Filters {
  table_name: string;
  action: string;
  dateFrom: string;
  dateTo: string;
  recordId: string;
  search: string;
}

interface Stats {
  totalRegistros: number;
  totalTablas: number;
  registrosHoy: number;
  registrosEsteMes: number;
}

interface ApiResponse {
  logs: AuditLog[];
  stats: Stats;
  totalPages: number;
  totalRecords: number;
  currentPage: number;
}

export default function AuditoriaPage() {
  // Estados principales
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Estados de filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    table_name: '',
    action: '',
    dateFrom: '',
    dateTo: '',
    recordId: '',
    search: '',
  });

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 20;

  // Estados de estadísticas
  const [stats, setStats] = useState<Stats>({
    totalRegistros: 0,
    totalTablas: 0,
    registrosHoy: 0,
    registrosEsteMes: 0,
  });

  // Estados adicionales
  const [exporting, setExporting] = useState(false);

  // Función principal para cargar datos
  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(filters.table_name && { table_name: filters.table_name }),
        ...(filters.action && { action: filters.action }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.recordId && { recordId: filters.recordId }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await apiFetch(`/api/auditoria?${params}`);

      if (response.ok) {
        const data: ApiResponse = await response.json();
        setAuditLogs(data.logs || []);
        setStats(
          data.stats || {
            totalRegistros: 0,
            totalTablas: 0,
            registrosHoy: 0,
            registrosEsteMes: 0,
          }
        );
        setTotalPages(data.totalPages || 1);
        setTotalRecords(data.totalRecords || 0);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar los registros de auditoría');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      toast.error('Error al cargar los registros de auditoría');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  // Efecto para cargar datos
  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  // Funciones de manejo de eventos
  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset a primera página al filtrar
  };

  const clearFilters = () => {
    setFilters({
      table_name: '',
      action: '',
      dateFrom: '',
      dateTo: '',
      recordId: '',
      search: '',
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
  };

  const handleCloseModal = () => {
    setSelectedLog(null);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const refreshData = () => {
    loadAuditLogs();
    toast.success('Datos actualizados');
  };

  const exportToCSV = async () => {
    try {
      setExporting(true);

      const params = new URLSearchParams({
        export: 'csv',
        ...(filters.table_name && { table_name: filters.table_name }),
        ...(filters.action && { action: filters.action }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.recordId && { recordId: filters.recordId }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await apiFetch(`/api/auditoria?${params}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Exportación completada');
      } else {
        toast.error('Error al exportar los datos');
      }
    } catch (error) {
      toast.error('Error al exportar');
    } finally {
      setExporting(false);
    }
  };

  // Funciones de utilidad
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'Crear';
      case 'UPDATE':
        return 'Actualizar';
      case 'DELETE':
        return 'Eliminar';
      default:
        return action;
    }
  };

  return (
    <ProtectedPage requiredPermission={{ modulo: 'AJUSTES_AUDITORIA', accion: 'LEER' }}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <ClockIcon className="h-8 w-8 mr-3 text-blue-600" />
                  Auditoría del Sistema
                </h1>
                <p className="text-gray-600 mt-2">
                  Seguimiento detallado de todos los cambios realizados en el sistema
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={toggleFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                </button>
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar
                </button>
                <button
                  onClick={exportToCSV}
                  disabled={exporting || loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {exporting ? (
                    <svg
                      className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  )}
                  Exportar CSV
                </button>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Registros
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalRegistros.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CircleStackIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Tablas Monitoreadas
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalTablas}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CalendarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Registros Hoy</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.registrosHoy.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Este Mes</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.registrosEsteMes.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de Filtros */}
          {showFilters && (
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center mb-4">
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  Filtros de Búsqueda
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Búsqueda General
                    </label>
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={filters.search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleFilterChange('search', e.target.value)
                        }
                        className="pl-9 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tabla</label>
                    <input
                      type="text"
                      placeholder="Nombre de tabla"
                      value={filters.table_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFilterChange('table_name', e.target.value)
                      }
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
                    <select
                      value={filters.action}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        handleFilterChange('action', e.target.value)
                      }
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">Todas</option>
                      <option value="CREATE">Crear</option>
                      <option value="UPDATE">Actualizar</option>
                      <option value="DELETE">Eliminar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID Registro
                    </label>
                    <input
                      type="text"
                      placeholder="ID del registro"
                      value={filters.recordId}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFilterChange('recordId', e.target.value)
                      }
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFilterChange('dateFrom', e.target.value)
                      }
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFilterChange('dateTo', e.target.value)
                      }
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Limpiar Filtros
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mensaje de Error */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XMarkIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de Registros */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Registros de Auditoría
                </h3>
                <span className="text-sm text-gray-500">{totalRecords} registros totales</span>
              </div>
            </div>
            <div className="bg-white">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="text-gray-600">Cargando registros...</span>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay registros</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No se encontraron registros de auditoría con los filtros actuales.
                  </p>
                  {Object.values(filters).some((v) => v) && (
                    <div className="mt-6">
                      <button
                        onClick={clearFilters}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {auditLogs.map((log) => (
                    <li key={log.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionBadgeColor(log.action)}`}
                            >
                              {getActionLabel(log.action)}
                            </span>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {log.table_name}
                            </p>
                            {log.record_id && (
                              <p className="text-sm text-gray-500">ID: {log.record_id}</p>
                            )}
                            {log.username && (
                              <p className="text-sm text-indigo-600">por {log.username}</p>
                            )}
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            {formatDate(log.changed_at)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewDetails(log)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Página <span className="font-medium">{currentPage}</span> de{' '}
                        <span className="font-medium">{totalPages}</span> ({totalRecords} registros)
                      </p>
                    </div>
                    <div>
                      <nav
                        className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage <= 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Anterior
                        </button>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Siguiente
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal de Detalles */}
          {selectedLog && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Detalles del Registro de Auditoría
                    </h3>
                    <button
                      onClick={handleCloseModal}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Información General */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          ID del Registro
                        </label>
                        <p className="mt-1 text-sm text-gray-900">{selectedLog.id}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tabla</label>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {selectedLog.table_name}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Acción</label>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionBadgeColor(selectedLog.action)} mt-1`}
                        >
                          {getActionLabel(selectedLog.action)}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          ID Registro Afectado
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedLog.record_id || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Fecha y Hora
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatDate(selectedLog.changed_at)}
                        </p>
                      </div>
                      {selectedLog.username && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Usuario</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedLog.username}</p>
                        </div>
                      )}
                    </div>

                    {/* Valores Anteriores */}
                    {selectedLog.old_values && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Valores Anteriores
                        </label>
                        <pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-auto max-h-48 border">
                          {JSON.stringify(selectedLog.old_values, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Valores Nuevos */}
                    {selectedLog.new_values && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Valores Nuevos
                        </label>
                        <pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-auto max-h-48 border">
                          {JSON.stringify(selectedLog.new_values, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Botones de Acción */}
                    <div className="flex justify-end pt-4 border-t">
                      <button
                        onClick={handleCloseModal}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}
