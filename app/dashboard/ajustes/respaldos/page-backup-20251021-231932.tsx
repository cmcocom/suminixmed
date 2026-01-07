'use client';

import AutomaticBackupConfig from '@/app/components/backup/AutomaticBackupConfig';
import ProtectedPage from '@/app/components/ProtectedPage';
import { api } from '@/lib/fetcher';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  CircleStackIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface BackupMetadata {
  filename: string;
  date: string;
  size: number;
  tables: number;
  createdBy: string;
  description?: string;
  validationStatus?: string;
  validationIcon?: string;
  validationDate?: string;
  validationDetails?: any;
  validationError?: string;
}

interface DatabaseInfo {
  database: string;
  size: string;
  tables: number;
  connections: number;
}

export default function RespaldosPage() {
  const [activeTab, setActiveTab] = useState<'manual' | 'import' | 'automatic'>('manual');
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [validating, setValidating] = useState<string | null>(null); // filename siendo validado
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Cargar respaldos y información de BD
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadBackups(), loadDatabaseInfo()]);
    setLoading(false);
  };

  const loadBackups = async () => {
    try {
      const res = await api.get('/api/backup/list');
      const data = await res.json();
      if (data.success) {
        setBackups(data.backups);
      }
    } catch (error) {
      toast.error('Error cargando respaldos');
    }
  };

  const loadDatabaseInfo = async () => {
    try {
      const res = await api.get('/api/backup/info');
      const data = await res.json();
      if (data.success) {
        setDbInfo(data.data);
      }
    } catch (error) {}
  };

  const createBackup = async () => {
    if (creating) return;

    setCreating(true);
    toast.loading('Creando respaldo...', { id: 'creating-backup' });

    try {
      const res = await api.post('/api/backup/create', { description });
      const data = await res.json();

      if (data.success) {
        toast.success('✅ Respaldo creado exitosamente', { id: 'creating-backup' });
        setDescription('');
        await loadBackups();
      } else {
        // Manejar diferentes tipos de errores
        const errorMsg = data.error || 'Error creando respaldo';
        const suggestion = data.suggestion;
        const canRetry = data.canRetry;

        // Mostrar error principal
        toast.error(errorMsg, { id: 'creating-backup', duration: 6000 });

        // Mostrar sugerencia si existe
        if (suggestion) {
          setTimeout(() => {
            toast(suggestion, {
              icon: '💡',
              duration: 8000,
              style: {
                background: '#3b82f6',
                color: '#fff',
              },
            });
          }, 500);
        }

        // Si se puede reintentar, mostrar botón
        if (canRetry) {
          setTimeout(() => {
            toast(
              (t) => (
                <div className="flex flex-col gap-2">
                  <span>¿Deseas intentar nuevamente?</span>
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      createBackup();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    🔄 Reintentar
                  </button>
                </div>
              ),
              {
                duration: 10000,
                style: {
                  background: '#f59e0b',
                  color: '#fff',
                },
              }
            );
          }, 1000);
        }
      }
    } catch (error) {
      toast.error('Error de conexión al crear respaldo', { id: 'creating-backup' });

      // Ofrecer reintentar después de error de conexión
      setTimeout(() => {
        toast(
          (t) => (
            <div className="flex flex-col gap-2">
              <span>Error de conexión. ¿Intentar de nuevo?</span>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  createBackup();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                🔄 Reintentar
              </button>
            </div>
          ),
          {
            duration: 10000,
          }
        );
      }, 500);
    } finally {
      setCreating(false);
    }
  };

  const downloadBackup = (filename: string) => {
    const url = `/api/backup/download/${filename}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Descargando respaldo...');
  };

  const uploadBackup = async () => {
    if (!selectedFile || uploading) return;

    setUploading(true);
    toast.loading('Subiendo respaldo...', { id: 'uploading-backup' });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('description', description || `Importado: ${selectedFile.name}`);

      const res = await api.form('/api/backup/upload', formData);
      const data = await res.json();

      if (data.success) {
        toast.success(`Respaldo importado: ${data.filename}`, { id: 'uploading-backup' });
        setDescription('');
        setSelectedFile(null);
        // Reset input file
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        await loadBackups();
      } else {
        toast.error(data.error || 'Error subiendo respaldo', { id: 'uploading-backup' });
      }
    } catch (error) {
      toast.error('Error subiendo respaldo', { id: 'uploading-backup' });
    } finally {
      setUploading(false);
    }
  };

  const confirmRestore = (filename: string) => {
    setSelectedBackup(filename);
    setShowRestoreModal(true);
  };

  const restoreBackup = async () => {
    if (!selectedBackup || restoring) return;

    setRestoring(true);
    setShowRestoreModal(false);
    toast.loading('Restaurando base de datos...', { id: 'restoring-backup' });

    try {
      const res = await api.post('/api/backup/restore', { filename: selectedBackup });
      const data = await res.json();

      if (data.success) {
        toast.success('Base de datos restaurada exitosamente. Recargando página...', {
          id: 'restoring-backup',
        });

        // Recargar la página después de 2 segundos
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(data.error || 'Error restaurando respaldo', { id: 'restoring-backup' });
        setRestoring(false);
      }
    } catch (error) {
      toast.error('Error restaurando respaldo', { id: 'restoring-backup' });
      setRestoring(false);
    }
  };

  const deleteBackup = async (filename: string) => {
    if (!confirm('¿Estás seguro de eliminar este respaldo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const res = await api.del(`/api/backup/delete/${filename}`);
      const data = await res.json();

      if (data.success) {
        toast.success('Respaldo eliminado');
        await loadBackups();
      } else {
        toast.error(data.error || 'Error eliminando respaldo');
      }
    } catch (error) {
      toast.error('Error eliminando respaldo');
    }
  };

  // 🆕 Función para re-validar un respaldo manualmente
  const revalidateBackup = async (filename: string) => {
    if (validating) return;

    setValidating(filename);
    toast.loading('Validando respaldo...', { id: 'validating-backup' });

    try {
      const res = await api.post(`/api/backup/validate/${filename}`);
      const data = await res.json();

      if (data.success && data.validation) {
        if (data.validation.valid) {
          toast.success(
            `✅ Respaldo válido - ${data.validation.details.tablesFound} tablas encontradas`,
            {
              id: 'validating-backup',
            }
          );
        } else {
          toast.error(`❌ Validación fallida: ${data.validation.errors.join(', ')}`, {
            id: 'validating-backup',
          });
        }
        await loadBackups();
      } else {
        toast.error('Error en validación', { id: 'validating-backup' });
      }
    } catch (error) {
      toast.error('Error validando respaldo', { id: 'validating-backup' });
    } finally {
      setValidating(null);
    }
  };

  // Obtener tooltip para el estado de validación
  const getValidationTooltip = (backup: BackupMetadata): string => {
    if (!backup.validationStatus || backup.validationStatus === 'pending') {
      return 'Sin validar - Haz clic para validar';
    }
    if (backup.validationStatus === 'validating') {
      return 'Validación en progreso...';
    }
    if (backup.validationStatus === 'valid') {
      const details = backup.validationDetails?.details;
      return (
        `Respaldo válido\n` +
        `Tablas: ${details?.tablesFound || 0}\n` +
        `Índices: ${details?.objectsCount?.indexes || 0}\n` +
        `Secuencias: ${details?.objectsCount?.sequences || 0}\n` +
        `Validado: ${backup.validationDate ? new Date(backup.validationDate).toLocaleString('es-MX') : 'N/A'}`
      );
    }
    return `Validación fallida\nError: ${backup.validationError || 'Desconocido'}`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <ProtectedPage
      requiredPermission={{
        modulo: 'AJUSTES',
        accion: 'LEER',
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        {/* Header Compacto y Elegante */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <CircleStackIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Respaldos de Base de Datos</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Gestiona la seguridad de tus datos</p>
                </div>
              </div>

              {/* Info rápida de BD */}
              {dbInfo && (
                <div className="hidden lg:flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Base de Datos</p>
                    <p className="text-sm font-semibold text-gray-900">{dbInfo.database}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Tamaño</p>
                    <p className="text-sm font-semibold text-gray-900">{dbInfo.size}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Tablas</p>
                    <p className="text-sm font-semibold text-gray-900">{dbInfo.tables}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Tabs Modernos */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1.5">
            <nav className="flex gap-1">
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'manual'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <CircleStackIcon className="h-4 w-4" />
                  <span>Manuales</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'import'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>Importar</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('automatic')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'automatic'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  <span>Automáticos</span>
                </div>
              </button>
            </nav>
          </div>
        </div>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Contenido según tab activo */}
          {activeTab === 'manual' ? (
            <>
              {/* Grid de 2 columnas en pantallas grandes */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Crear Respaldo - Compacto */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <ArrowUpTrayIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Crear Respaldo</h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Descripción (opcional)
                        </label>
                        <input
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Ej: Antes de actualización..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={creating}
                        />
                      </div>

                      <button
                        onClick={createBackup}
                        disabled={creating}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                      >
                        {creating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Creando...</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpTrayIcon className="w-4 h-4" />
                            <span>Crear Ahora</span>
                          </>
                        )}
                      </button>

                      {/* Info compacta */}
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                        <div className="flex gap-2">
                          <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-yellow-800">
                            <p className="font-medium mb-1">Importante:</p>
                            <ul className="space-y-0.5 list-disc list-inside">
                              <li>Validación automática SHA-256</li>
                              <li>Incluye 45 tablas + índices</li>
                              <li>Puede tardar varios minutos</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lista de Respaldos - Más amplio */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Respaldos Disponibles
                        </h2>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          {backups.length} {backups.length === 1 ? 'respaldo' : 'respaldos'}
                        </span>
                      </div>
                    </div>

                    {loading ? (
                      <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-blue-500 border-t-transparent"></div>
                        <p className="mt-3 text-sm text-gray-600">Cargando respaldos...</p>
                      </div>
                    ) : backups.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <CircleStackIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">No hay respaldos disponibles</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Crea tu primer respaldo con el formulario de la izquierda
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[600px] overflow-y-auto">
                        {backups.map((backup, index) => (
                          <div
                            key={backup.filename}
                            className={`p-5 hover:bg-gray-50 transition-colors ${
                              index !== backups.length - 1 ? 'border-b border-gray-100' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-medium text-gray-900 truncate text-sm">
                                    {backup.filename}
                                  </h3>
                                  {/* Badge de validación compacto */}
                                  <button
                                    onClick={() => revalidateBackup(backup.filename)}
                                    disabled={validating === backup.filename}
                                    className="text-lg hover:scale-110 transition-transform disabled:opacity-50"
                                    title={getValidationTooltip(backup)}
                                  >
                                    {backup.validationIcon || '⚠️'}
                                  </button>
                                  {backup.validationStatus && (
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                        backup.validationStatus === 'valid'
                                          ? 'bg-green-100 text-green-700'
                                          : backup.validationStatus === 'validating'
                                            ? 'bg-blue-100 text-blue-700 animate-pulse'
                                            : backup.validationStatus === 'invalid' ||
                                                backup.validationStatus === 'corrupted'
                                              ? 'bg-red-100 text-red-700'
                                              : 'bg-yellow-100 text-yellow-700'
                                      }`}
                                    >
                                      {backup.validationStatus === 'valid' && 'Válido'}
                                      {backup.validationStatus === 'validating' && 'Validando'}
                                      {backup.validationStatus === 'invalid' && 'Inválido'}
                                      {backup.validationStatus === 'corrupted' && 'Corrupto'}
                                      {backup.validationStatus === 'pending' && 'Pendiente'}
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                  <div>
                                    <p className="text-gray-500">Fecha</p>
                                    <p className="font-medium text-gray-900">
                                      {new Date(backup.date).toLocaleDateString('es-MX', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                      })}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Tamaño</p>
                                    <p className="font-medium text-gray-900">
                                      {formatBytes(backup.size)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Tablas</p>
                                    <p className="font-medium text-gray-900">{backup.tables}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Por</p>
                                    <p className="font-medium text-gray-900 truncate">
                                      {backup.createdBy}
                                    </p>
                                  </div>
                                </div>

                                {backup.description && (
                                  <p className="mt-2 text-xs text-gray-600 italic truncate">
                                    {backup.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => downloadBackup(backup.filename)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Descargar"
                                >
                                  <ArrowDownTrayIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => confirmRestore(backup.filename)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Restaurar"
                                  disabled={
                                    restoring ||
                                    backup.validationStatus === 'invalid' ||
                                    backup.validationStatus === 'corrupted'
                                  }
                                >
                                  <CheckCircleIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteBackup(backup.filename)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Eliminar"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'import' ? (
            <>
              {/* PESTAÑA DE IMPORTAR RESPALDOS - Diseño Moderno */}
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <ArrowDownTrayIcon className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Importar Respaldo</h2>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Sube un archivo de respaldo (.sql) para restaurar
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Zona de Selección de Archivo */}
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-green-400 transition-colors bg-gradient-to-br from-gray-50 to-white">
                      <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center mb-4">
                          <ArrowUpTrayIcon className="w-8 h-8 text-green-600" />
                        </div>

                        <input
                          type="file"
                          id="file-upload"
                          accept=".sql"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          disabled={uploading}
                          className="hidden"
                        />

                        <label
                          htmlFor="file-upload"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 cursor-pointer disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                        >
                          <ArrowUpTrayIcon className="w-4 h-4" />
                          Seleccionar Archivo .sql
                        </label>

                        <p className="mt-3 text-xs text-gray-600">
                          Solo archivos .sql (máximo 500 MB recomendado)
                        </p>
                      </div>
                    </div>

                    {/* Archivo Seleccionado */}
                    {selectedFile && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <DocumentTextIcon className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                Tamaño: {formatBytes(selectedFile.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedFile(null)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Quitar archivo seleccionado"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Campo de Descripción */}
                    {selectedFile && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Descripción (opcional)
                        </label>
                        <input
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Ej: Respaldo de producción - 10 Oct 2025"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          disabled={uploading}
                        />
                      </div>
                    )}

                    {/* Botón de Importar */}
                    {selectedFile && (
                      <button
                        onClick={uploadBackup}
                        disabled={!selectedFile || uploading}
                        className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                      >
                        {uploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Importando...</span>
                          </>
                        ) : (
                          <>
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            <span>Importar Respaldo</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Información y Casos de Uso - Compacto */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex gap-2">
                          <InformationCircleIcon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-blue-800">
                            <p className="font-medium mb-1.5">Acerca de importar:</p>
                            <ul className="space-y-0.5 list-disc list-inside">
                              <li>Validación automática SHA-256</li>
                              <li>Aparecerá en respaldos manuales</li>
                              <li>Se puede restaurar normalmente</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-green-800">
                            <p className="font-medium mb-1.5">Casos de uso:</p>
                            <ul className="space-y-0.5 list-disc list-inside">
                              <li>
                                <strong>Migración</strong> de otro servidor
                              </li>
                              <li>
                                <strong>Recuperación</strong> desde backup externo
                              </li>
                              <li>
                                <strong>Testing</strong> con datos de prueba
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comando pg_dump - Compacto */}
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="flex gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                            ?
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-purple-800 mb-1.5">
                            ¿Cómo crear un respaldo en otro sistema?
                          </p>
                          <div className="bg-white rounded p-2 font-mono text-[10px] overflow-x-auto">
                            <p className="text-purple-900">
                              pg_dump -U usuario -d nombre_db &gt; backup.sql
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Link a respaldos manuales */}
                {backups.length > 0 && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 text-center">
                    <p className="text-sm text-gray-600">
                      Para gestionar y restaurar respaldos, ve a{' '}
                      <button
                        onClick={() => setActiveTab('manual')}
                        className="text-blue-600 hover:text-blue-700 font-medium underline"
                      >
                        Respaldos Manuales
                      </button>
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="max-w-6xl mx-auto">
              <AutomaticBackupConfig />
            </div>
          )}

          {/* Modal de confirmación de restauración */}
          {showRestoreModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-red-100 rounded-full">
                      <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      ⚠️ Confirmar Restauración
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <p className="text-gray-700">
                      Estás a punto de restaurar la base de datos desde:
                    </p>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">{selectedBackup}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800 font-medium mb-2">ADVERTENCIA:</p>
                      <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                        <li>Todos los datos actuales serán eliminados</li>
                        <li>Todas las conexiones activas serán terminadas</li>
                        <li>Esta acción NO se puede deshacer</li>
                        <li>La aplicación se recargará automáticamente</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowRestoreModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={restoreBackup}
                      className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Sí, Restaurar Base de Datos
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>{' '}
        {/* Cierre de max-w-7xl */}
      </div>{' '}
      {/* Cierre de min-h-screen */}
    </ProtectedPage>
  );
}
