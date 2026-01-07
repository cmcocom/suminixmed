'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiFetch from '@/lib/fetcher';
import {
  ClockIcon,
  UserIcon,
  KeyIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: {
    id: string;
    email: string;
    nombre: string;
  };
}

interface User {
  id: string;
  email: string;
  nombre: string;
}

interface AuditPanelProps {
  updating: boolean;
}

interface AuditFilters {
  user_id: string;
  action: string;
  resource_type: string;
  start_date: string;
  end_date: string;
  ip_address: string;
}

export default function AuditPanel({ updating }: AuditPanelProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<AuditFilters>({
    user_id: '',
    action: '',
    resource_type: '',
    start_date: '',
    end_date: '',
    ip_address: '',
  });

  // Cargar logs de auditoría
  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      // Agregar filtros no vacíos a los parámetros de consulta
      Object.entries(filters).forEach(([key, value]) => {
        if (value.trim()) {
          queryParams.set(key, value);
        }
      });

      if (searchTerm.trim()) {
        queryParams.set('search', searchTerm);
      }

      const response = await apiFetch(`/api/rbac/audit?${queryParams.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.data || []);
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm]);

  // Cargar usuarios para el filtro
  const loadUsers = useCallback(async () => {
    try {
      const response = await apiFetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      void error;
    }
  }, []);

  // Efecto para cargar usuarios inicialmente
  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  // Efecto para cargar logs inicialmente y cuando la función de carga cambie
  useEffect(() => {
    void loadAuditLogs();
  }, [loadAuditLogs]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadAuditLogs();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters, loadAuditLogs]);

  const resetFilters = () => {
    setFilters({
      user_id: '',
      action: '',
      resource_type: '',
      start_date: '',
      end_date: '',
      ip_address: '',
    });
    setSearchTerm('');
  };

  const getActionIcon = (action: string) => {
    const iconMap: Record<string, React.JSX.Element> = {
      CREATE: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
      UPDATE: <CogIcon className="h-4 w-4 text-blue-500" />,
      DELETE: <XMarkIcon className="h-4 w-4 text-red-500" />,
      LOGIN: <UserIcon className="h-4 w-4 text-purple-500" />,
      LOGOUT: <UserIcon className="h-4 w-4 text-gray-500" />,
      ASSIGN_ROLE: <KeyIcon className="h-4 w-4 text-orange-500" />,
      REMOVE_ROLE: <KeyIcon className="h-4 w-4 text-red-500" />,
      GRANT_PERMISSION: <KeyIcon className="h-4 w-4 text-green-500" />,
      REVOKE_PERMISSION: <KeyIcon className="h-4 w-4 text-red-500" />,
      ERROR: <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />,
    };

    return iconMap[action] || <CogIcon className="h-4 w-4 text-gray-500" />;
  };

  const getActionColor = (action: string) => {
    const colorMap: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      LOGIN: 'bg-purple-100 text-purple-800',
      LOGOUT: 'bg-gray-100 text-gray-800',
      ASSIGN_ROLE: 'bg-orange-100 text-orange-800',
      REMOVE_ROLE: 'bg-red-100 text-red-800',
      GRANT_PERMISSION: 'bg-green-100 text-green-800',
      REVOKE_PERMISSION: 'bg-red-100 text-red-800',
      ERROR: 'bg-red-100 text-red-800',
    };

    return colorMap[action] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const uniqueActions = [...new Set(auditLogs.map((log) => log.action))];
  const uniqueResourceTypes = [...new Set(auditLogs.map((log) => log.resource_type))];

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Auditoría del Sistema RBAC</h2>
          <p className="text-gray-600">
            Registro de actividades y cambios en el sistema de permisos
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              showFilters
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filtros
          </button>
          <button
            onClick={loadAuditLogs}
            disabled={updating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <ClockIcon className="h-4 w-4 mr-2" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Búsqueda y filtros */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="space-y-4">
          {/* Búsqueda general */}
          <div>
            <label htmlFor="search-audit" className="sr-only">
              Buscar en auditoría
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="search-audit"
                type="text"
                placeholder="Buscar en acciones, recursos, usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtros avanzados */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label
                  htmlFor="filter-user"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Usuario
                </label>
                <select
                  id="filter-user"
                  value={filters.user_id}
                  onChange={(e) => setFilters((prev) => ({ ...prev, user_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los usuarios</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nombre || user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="filter-action"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Acción
                </label>
                <select
                  id="filter-action"
                  value={filters.action}
                  onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas las acciones</option>
                  {uniqueActions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="filter-resource"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Recurso
                </label>
                <select
                  id="filter-resource"
                  value={filters.resource_type}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, resource_type: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los recursos</option>
                  {uniqueResourceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="filter-start-date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fecha inicio
                </label>
                <input
                  id="filter-start-date"
                  type="datetime-local"
                  value={filters.start_date}
                  onChange={(e) => setFilters((prev) => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="filter-end-date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fecha fin
                </label>
                <input
                  id="filter-end-date"
                  type="datetime-local"
                  value={filters.end_date}
                  onChange={(e) => setFilters((prev) => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista de logs de auditoría */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        {auditLogs.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">No se encontraron registros</h3>
            <p className="text-sm text-gray-500">
              No hay actividad de auditoría que coincida con los filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {getActionIcon(log.action)}
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${getActionColor(log.action)}`}
                      >
                        {log.action}
                      </span>
                      <span className="text-sm text-gray-500">{log.resource_type}</span>
                      {log.resource_id && (
                        <span className="text-xs text-gray-400">ID: {log.resource_id}</span>
                      )}
                    </div>

                    <div className="mt-2">
                      <p className="text-sm text-gray-900">
                        Usuario:{' '}
                        <span className="font-medium">
                          {log.user?.nombre || log.user?.email || `ID: ${log.user_id}`}
                        </span>
                      </p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {formatDate(log.created_at)}
                        </span>
                        {log.ip_address && <span>IP: {log.ip_address}</span>}
                      </div>
                    </div>

                    {log.details && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                          <strong>Detalles:</strong> {JSON.stringify(log.details, null, 2)}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedLog(log);
                      setShowDetails(true);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Ver detalles completos"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Detalles del Registro de Auditoría
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                title="Cerrar detalles"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID del Registro</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedLog.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha y Hora</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedLog.created_at)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Acción</label>
                  <div className="flex items-center space-x-2 mt-1">
                    {getActionIcon(selectedLog.action)}
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${getActionColor(selectedLog.action)}`}
                    >
                      {selectedLog.action}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Recurso</label>
                  <p className="text-sm text-gray-900">{selectedLog.resource_type}</p>
                </div>
              </div>

              {selectedLog.resource_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID del Recurso</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedLog.resource_id}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Usuario</label>
                <div className="mt-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">
                      {selectedLog.user?.nombre ||
                        selectedLog.user?.email ||
                        'Usuario no encontrado'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">ID: {selectedLog.user_id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección IP</label>
                  <p className="text-sm text-gray-900">
                    {selectedLog.ip_address || 'No disponible'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User Agent</label>
                  <p
                    className="text-sm text-gray-900 truncate"
                    title={selectedLog.user_agent || undefined}
                  >
                    {selectedLog.user_agent || 'No disponible'}
                  </p>
                </div>
              </div>

              {selectedLog.details && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detalles Adicionales
                  </label>
                  <pre className="text-xs text-gray-700 bg-gray-50 p-4 rounded border overflow-auto max-h-64">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 mt-6">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas de auditoría */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{auditLogs.length}</div>
          <div className="text-sm text-blue-600">Total de Registros</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700">
            {
              auditLogs.filter((log) =>
                ['CREATE', 'GRANT_PERMISSION', 'ASSIGN_ROLE'].includes(log.action)
              ).length
            }
          </div>
          <div className="text-sm text-green-600">Acciones Positivas</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-700">
            {
              auditLogs.filter((log) =>
                ['DELETE', 'REVOKE_PERMISSION', 'REMOVE_ROLE', 'ERROR'].includes(log.action)
              ).length
            }
          </div>
          <div className="text-sm text-red-600">Acciones Críticas</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-700">
            {new Set(auditLogs.map((log) => log.user_id)).size}
          </div>
          <div className="text-sm text-purple-600">Usuarios Únicos</div>
        </div>
      </div>
    </div>
  );
}
