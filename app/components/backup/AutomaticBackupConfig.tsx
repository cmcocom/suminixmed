'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/fetcher';
import {
  ClockIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface BackupConfig {
  id: number;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  hour: number;
  minute: number;
  retentionDays: number;
  retentionCount?: number | null;
  lastRun?: string | null;
  nextRun?: string | null;
}

interface BackupHistoryEntry {
  id: number;
  filename: string;
  backupType: 'automatic' | 'manual';
  status: 'success' | 'failed';
  sizeBytes?: number | null;
  tablesCount?: number | null;
  errorMessage?: string | null;
  startedAt: string;
  completedAt?: string | null;
  durationSeconds?: number | null;
  createdBy?: string | null;
  description?: string | null;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

export default function AutomaticBackupConfig() {
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [history, setHistory] = useState<BackupHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadConfig();
    loadHistory();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await api.get('/api/backup/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await api.get('/api/backup/history?limit=20');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      // ignore history load errors silently
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const response = await api.put('/api/backup/config', config);

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        toast.success('Configuración guardada correctamente');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar configuración');
      }
    } catch (error) {
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (updates: Partial<BackupConfig>) => {
    if (!config) return;
    setConfig({ ...config, ...updates });
  };

  const formatBytes = (bytes?: number | null) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se pudo cargar la configuración</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estado y Toggle Principal */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <ClockIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Respaldos Automáticos</h2>
              <p className="text-sm text-gray-600">
                Configura respaldos programados de tu base de datos
              </p>
            </div>
          </div>

          <button
            onClick={() => updateConfig({ enabled: !config.enabled })}
            className={`relative inline-flex h-8 w-16 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              config.enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                config.enabled ? 'translate-x-8' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {config.enabled && (
          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
            <CheckCircleIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-blue-800">
              Respaldos automáticos <strong>activados</strong>
            </span>
          </div>
        )}

        {!config.enabled && (
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <XCircleIcon className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-700">
              Respaldos automáticos <strong>desactivados</strong>
            </span>
          </div>
        )}
      </div>

      {/* Configuración de Frecuencia */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2 text-gray-600" />
          Frecuencia de Respaldos
        </h3>

        <div className="space-y-4">
          {/* Selector de Frecuencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia</label>
            <select
              value={config.frequency}
              onChange={(e) =>
                updateConfig({ frequency: e.target.value as BackupConfig['frequency'] })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>

          {/* Día de la Semana (solo para semanal) */}
          {config.frequency === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Día de la Semana
              </label>
              <select
                value={config.dayOfWeek ?? 1}
                onChange={(e) => updateConfig({ dayOfWeek: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Día del Mes (solo para mensual) */}
          {config.frequency === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Día del Mes</label>
              <select
                value={config.dayOfMonth ?? 1}
                onChange={(e) => updateConfig({ dayOfMonth: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Hora y Minuto */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hora (0-23)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={config.hour}
                onChange={(e) => updateConfig({ hour: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minuto (0-59)</label>
              <input
                type="number"
                min="0"
                max="59"
                value={config.minute}
                onChange={(e) => updateConfig({ minute: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Política de Retención */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Cog6ToothIcon className="h-5 w-5 mr-2 text-gray-600" />
          Política de Retención
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Días de Retención
            </label>
            <input
              type="number"
              min="1"
              value={config.retentionDays}
              onChange={(e) => updateConfig({ retentionDays: parseInt(e.target.value) || 30 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              Los respaldos más antiguos que {config.retentionDays} días serán eliminados
              automáticamente
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número Máximo de Respaldos (Opcional)
            </label>
            <input
              type="number"
              min="0"
              value={config.retentionCount ?? ''}
              onChange={(e) =>
                updateConfig({ retentionCount: e.target.value ? parseInt(e.target.value) : null })
              }
              placeholder="Sin límite"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              Mantener solo los últimos N respaldos (dejar vacío para sin límite)
            </p>
          </div>
        </div>
      </div>

      {/* Información de Ejecución */}
      {config.enabled && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Ejecución</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Último Respaldo</p>
              <p className="text-lg font-semibold text-gray-900">
                {config.lastRun ? new Date(config.lastRun).toLocaleString('es-MX') : 'Nunca'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Próximo Respaldo</p>
              <p className="text-lg font-semibold text-blue-600">
                {config.nextRun
                  ? new Date(config.nextRun).toLocaleString('es-MX')
                  : 'Calculando...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveConfig}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5" />
              <span>Guardar Configuración</span>
            </>
          )}
        </button>
      </div>

      {/* Historial de Respaldos Automáticos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Historial de Respaldos</h3>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showHistory ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        {showHistory && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tamaño
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Duración
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          entry.backupType === 'automatic'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {entry.backupType === 'automatic' ? 'Automático' : 'Manual'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.startedAt).toLocaleString('es-MX')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {entry.status === 'success' ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Exitoso
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Fallido
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {formatBytes(entry.sizeBytes)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {formatDuration(entry.durationSeconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {history.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay historial de respaldos disponible
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
