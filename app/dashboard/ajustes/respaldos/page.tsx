'use client';

import { useState, useEffect } from 'react';
import ProtectedPage from '@/app/components/ProtectedPage';
import {
  CircleStackIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  ServerIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import AutomaticBackupConfig from '@/app/components/backup/AutomaticBackupConfig';
import apiFetch from '@/lib/fetcher';

interface Backup {
  filename: string;
  timestamp: string;
  size: number;
  sizeFormatted: string;
  tables: number;
  checksum: string;
  createdBy: string;
  description: string;
}

interface DbInfo {
  database: string;
  size: string;
  tables: number;
  connections: number;
}

export default function RespaldosPage() {
  const [activeTab, setActiveTab] = useState<'manual' | 'automatic'>('manual');
  const [backups, setBackups] = useState<Backup[]>([]);
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [description, setDescription] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string>('');

  // Cargamos respaldos e info de BD al montar
  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadBackups(), loadDbInfo()]);
      setLoading(false);
    })();
  }, []);

  const loadBackups = async () => {
    try {
      const res = await apiFetch('/api/backup/list');
      const data = await res.json();
      setBackups(data.backups || []);
    } catch (error) {
      toast.error('Error cargando respaldos');
    }
  };

  const loadDbInfo = async () => {
    try {
      const res = await apiFetch('/api/backup/info');
      const data = await res.json();
      setDbInfo(data);
    } catch (error) {
      console.error('Error cargando info DB:', error);
    }
  };

  const createBackup = async () => {
    if (creating) return;
    setCreating(true);
    const toastId = toast.loading('Creando respaldo...');

    try {
      const res = await apiFetch('/api/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, format: 'custom', compress: 9 }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Respaldo creado: ${data.sizeFormatted}`, { id: toastId });
        setDescription('');
        await loadBackups();
      } else {
        toast.error(data.error || 'Error creando respaldo', { id: toastId });
      }
    } catch (error: any) {
      toast.error(error.message || 'Error creando respaldo', { id: toastId });
    } finally {
      setCreating(false);
    }
  };

  const downloadBackup = (filename: string) => {
    window.open(`/api/backup/download?filename=${encodeURIComponent(filename)}`, '_blank');
    toast.success('Descargando respaldo');
  };

  const deleteBackup = async (filename: string) => {
    if (!confirm(`¿Eliminar respaldo ${filename}?`)) return;

    try {
      const res = await apiFetch('/api/backup/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });

      if (res.ok) {
        toast.success('Respaldo eliminado');
        await loadBackups();
      } else {
        toast.error('Error eliminando respaldo');
      }
    } catch (error) {
      toast.error('Error eliminando respaldo');
    }
  };

  const restoreBackup = async () => {
    if (!selectedBackup) return;

    const confirmed = confirm(
      `⚠️ ADVERTENCIA: Esto restaurará la base de datos.\n\n` +
        `Se creará un respaldo automático antes de la restauración.\n\n` +
        `¿Continuar con la restauración de ${selectedBackup}?`
    );

    if (!confirmed) return;

    const toastId = toast.loading('Restaurando base de datos...');

    try {
      const res = await apiFetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: selectedBackup }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          `Base de datos restaurada: ${data.tablesRestored} tablas\n` +
            `Pre-backup: ${data.preBackupFile || 'N/A'}`,
          { id: toastId, duration: 5000 }
        );
        setShowRestoreModal(false);
        await loadBackups();
      } else {
        toast.error(data.error || 'Error restaurando', { id: toastId });
      }
    } catch (error: any) {
      toast.error(error.message || 'Error restaurando', { id: toastId });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.sql') && !file.name.endsWith('.backup')) {
      toast.error('Solo archivos .sql o .backup');
      return;
    }

    const toastId = toast.loading('Importando respaldo...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiFetch('/api/backup/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Respaldo importado: ${data.filename}`, { id: toastId });
        await loadBackups();
      } else {
        toast.error(data.error || 'Error importando', { id: toastId });
      }
    } catch (error: any) {
      toast.error(error.message || 'Error importando', { id: toastId });
    }

    e.target.value = '';
  };

  const formatDate = (dateStr: string) => {
    // Convertir el formato del filename de vuelta a ISO válido
    // Ej: "2025-10-22T05-43-31-667Z" -> "2025-10-22T05:43:31.667Z"
    const isoDate = dateStr.replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/, 'T$1:$2:$3.$4Z');

    const date = new Date(isoDate);

    if (isNaN(date.getTime())) {
      return dateStr; // Si no se puede parsear, devolver el original
    }

    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ProtectedPage
      requiredPermission={{
        modulo: 'AJUSTES',
        accion: 'LEER',
      }}
    >
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <CircleStackIcon className="h-8 w-8 text-blue-600" />
              Respaldos de Base de Datos
            </h1>
            <p className="mt-2 text-gray-600">
              Sistema de respaldo con pg_dump • Compresión automática • Validación SHA-256
            </p>
          </div>

          {dbInfo && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <ServerIcon className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-gray-900">{dbInfo.database}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Tamaño</div>
                  <div className="font-semibold text-gray-900">{dbInfo.size}</div>
                </div>
                <div>
                  <div className="text-gray-600">Tablas</div>
                  <div className="font-semibold text-gray-900">{dbInfo.tables}</div>
                </div>
                <div>
                  <div className="text-gray-600">Conexiones</div>
                  <div className="font-semibold text-gray-900">{dbInfo.connections}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs de Navegación */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <DocumentDuplicateIcon className="h-5 w-5" />
                <span>Respaldos Manuales</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('automatic')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'automatic'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ClockIcon className="h-5 w-5" />
                <span>Respaldos Automáticos</span>
              </div>
            </button>
          </div>
        </div>

        {/* Contenido según Tab Activo */}
        {activeTab === 'manual' && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[300px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción del respaldo
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ej: Respaldo antes de actualización"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={createBackup}
                      disabled={creating}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
                    >
                      <DocumentDuplicateIcon className="h-5 w-5" />
                      {creating ? 'Creando...' : 'Crear Respaldo'}
                    </button>
                  </div>
                </div>

                <div className="flex items-end">
                  <label className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer flex items-center gap-2 font-medium transition-colors">
                    <ArrowUpTrayIcon className="h-5 w-5" />
                    Importar Archivo
                    <input
                      type="file"
                      accept=".sql,.backup"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Respaldos Disponibles ({backups.length})
                </h2>
              </div>

              {loading ? (
                <div className="p-12 text-center text-gray-500">
                  <CircleStackIcon className="h-12 w-12 mx-auto mb-3 animate-spin" />
                  Cargando respaldos...
                </div>
              ) : backups.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <CircleStackIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">No hay respaldos disponibles</p>
                  <p className="text-sm mt-1">Crea tu primer respaldo usando el botón superior</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Archivo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tamaño
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tablas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Creado por
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {backups.map((backup) => (
                        <tr key={backup.filename} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <CheckCircleIcon className="h-5 w-5 text-green-500" />
                              <div>
                                <div className="font-medium text-gray-900">{backup.filename}</div>
                                {backup.description && (
                                  <div className="text-sm text-gray-500">{backup.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              <ClockIcon className="h-4 w-4 text-gray-400" />
                              {formatDate(backup.timestamp)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {backup.sizeFormatted}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {backup.tables} tablas
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{backup.createdBy}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => downloadBackup(backup.filename)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Descargar"
                              >
                                <ArrowDownTrayIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedBackup(backup.filename);
                                  setShowRestoreModal(true);
                                }}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Restaurar"
                              >
                                <CircleStackIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => deleteBackup(backup.filename)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {showRestoreModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
                    <h3 className="text-xl font-bold text-gray-900">Confirmar Restauración</h3>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Archivo:</strong> {selectedBackup}
                    </p>
                    <p className="text-sm text-gray-700">
                      Se creará un respaldo automático de seguridad antes de restaurar.
                    </p>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-800 font-medium">
                      ⚠️ Esta acción sobrescribirá la base de datos actual.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowRestoreModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={restoreBackup}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                    >
                      Restaurar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab de Respaldos Automáticos */}
        {activeTab === 'automatic' && <AutomaticBackupConfig />}
      </div>
    </ProtectedPage>
  );
}
