'use client';

import { useState, useEffect, useCallback } from 'react';
import apiFetch from '@/lib/fetcher';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Decimal } from '@prisma/client/runtime/library';
import {
  CheckCircleIcon,
  ClockIcon,
  ArchiveBoxIcon,
  UserIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface SolicitudPendiente {
  id: string;
  motivo: string;
  observaciones: string;
  total: Decimal;
  fecha_creacion: string;
  tipo_salida: string;
  estado_surtido: string;
  solicitud_origen_id: string | null;
  user_id: string;
  User: {
    name: string | null;
    email: string | null;
  };
  partidas_salida_inventario: Array<{
    id: string;
    cantidad: number;
    precio: Decimal;
    Inventario: {
      descripcion: string;
    };
  }>;
}

export default function SurtidoPage() {
  const { data: session } = useSession();
  const [solicitudes, setSolicitudes] = useState<SolicitudPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  // Función para cargar solicitudes pendientes
  const cargarSolicitudesPendientes = useCallback(async () => {
    if (!session?.user?.email) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiFetch('/api/salidas/pendientes');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(
          `Error ${response.status}: ${errorData.error || 'Error al cargar solicitudes'}`
        );
      }

      const data = await response.json();
      setSolicitudes(data.solicitudes || []);

      if (data.solicitudes && data.solicitudes.length > 0) {
      } else {
      }
    } catch (error) {
      toast.error('Error al cargar las solicitudes pendientes');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  // Cargar solicitudes pendientes cuando cambia la sesión
  useEffect(() => {
    if (session?.user?.email) {
      cargarSolicitudesPendientes();
    }
  }, [session?.user?.email, cargarSolicitudesPendientes]);

  const marcarComoSurtido = async (solicitudId: string, observaciones?: string) => {
    try {
      const response = await apiFetch(`/api/salidas/${solicitudId}/surtir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          observaciones: observaciones || '',
          surtido_por: session?.user?.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al marcar como surtido');
      }

      toast.success('Solicitud marcada como surtida exitosamente');
      await cargarSolicitudesPendientes(); // Recargar lista
    } catch (error) {
      toast.error('Error al marcar la solicitud como surtida');
    }
  };

  // Filtrar solicitudes
  const solicitudesFiltradas = solicitudes.filter((solicitud) => {
    const cumpleFiltroTipo = filtroTipo === 'todos' || solicitud.tipo_salida === filtroTipo;
    const cumpleBusqueda =
      solicitud.motivo.toLowerCase().includes(busqueda.toLowerCase()) ||
      solicitud.User.name?.toLowerCase().includes(busqueda.toLowerCase()) ||
      solicitud.partidas_salida_inventario.some((p) =>
        p.Inventario.descripcion.toLowerCase().includes(busqueda.toLowerCase())
      );

    return cumpleFiltroTipo && cumpleBusqueda;
  });

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'vale':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pendiente':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'vale':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'pendiente':
        return <ClockIcon className="w-4 h-4" />;
      case 'normal':
        return <ArchiveBoxIcon className="w-4 h-4" />;
      default:
        return <ArchiveBoxIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-900">Cargando solicitudes pendientes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Surtido de Solicitudes</h1>
          <p className="text-gray-900 mt-1">
            Gestiona las solicitudes pendientes de surtido (vale y pendientes)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-1">
            <UserIcon className="w-4 h-4" />
            {session?.user?.name || session?.user?.email}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="filtro-tipo" className="block text-sm font-medium text-gray-900 mb-1">
              Tipo de solicitud
            </label>
            <select
              id="filtro-tipo"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos los tipos</option>
              <option value="vale">Solo vales</option>
              <option value="pendiente">Solo pendientes</option>
              <option value="normal">Solo normales</option>
            </select>
          </div>
          <div>
            <label htmlFor="busqueda" className="block text-sm font-medium text-gray-900 mb-1">
              Buscar
            </label>
            <div className="relative">
              <input
                id="busqueda"
                type="text"
                placeholder="Buscar por motivo, usuario o producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de solicitudes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Solicitudes Pendientes ({solicitudesFiltradas.length})
          </h2>
          <button
            onClick={cargarSolicitudesPendientes}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Actualizar
          </button>
        </div>

        {solicitudesFiltradas.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <div className="text-center text-gray-900">
              <ArchiveBoxIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium">No hay solicitudes pendientes</p>
              <p className="text-sm">
                {solicitudes.length === 0
                  ? 'No se encontraron solicitudes para surtir'
                  : 'No se encontraron solicitudes que coincidan con los filtros'}
              </p>
            </div>
          </div>
        ) : (
          solicitudesFiltradas.map((solicitud) => (
            <SolicitudCard
              key={solicitud.id}
              solicitud={solicitud}
              onMarcarSurtido={marcarComoSurtido}
              getTipoColor={getTipoColor}
              getTipoIcon={getTipoIcon}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Componente para cada tarjeta de solicitud
function SolicitudCard({
  solicitud,
  onMarcarSurtido,
  getTipoColor,
  getTipoIcon,
}: {
  solicitud: SolicitudPendiente;
  onMarcarSurtido: (id: string, observaciones?: string) => void;
  getTipoColor: (tipo: string) => string;
  getTipoIcon: (tipo: string) => React.ReactElement;
}) {
  const [observaciones, setObservaciones] = useState('');
  const [confirmando, setConfirmando] = useState(false);

  const handleConfirmarSurtido = () => {
    onMarcarSurtido(solicitud.id, observaciones);
    setConfirmando(false);
    setObservaciones('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-l-4 border-l-orange-400">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getTipoColor(solicitud.tipo_salida)}`}
              >
                {getTipoIcon(solicitud.tipo_salida)}
                {solicitud.tipo_salida.toUpperCase()}
              </div>
              <span className="text-sm text-gray-900">ID: {solicitud.id}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{solicitud.motivo}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-900">
              <div className="flex items-center gap-1">
                <UserIcon className="w-4 h-4" />
                {solicitud.User.name || solicitud.User.email}
              </div>
              <div className="flex items-center gap-1">
                <CalendarDaysIcon className="w-4 h-4" />
                {new Date(solicitud.fecha_creacion).toLocaleDateString('es-ES')}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900">
              ${Number(solicitud.total).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Productos */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Productos solicitados:</h4>
          <div className="space-y-2">
            {solicitud.partidas_salida_inventario.map((partida) => (
              <div
                key={partida.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
              >
                <div>
                  <span className="font-medium">{partida.Inventario.descripcion}</span>
                  <span className="text-sm text-gray-900 ml-2">x{partida.cantidad}</span>
                </div>
                <span className="text-sm font-medium">
                  ${(Number(partida.precio) * partida.cantidad).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Observaciones originales */}
        {solicitud.observaciones && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-1">Observaciones:</h4>
            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
              {solicitud.observaciones}
            </p>
          </div>
        )}

        {/* ID de origen si existe */}
        {solicitud.solicitud_origen_id && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-1">Solicitud origen:</h4>
            <p className="text-sm text-gray-600 font-mono">{solicitud.solicitud_origen_id}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="border-t pt-4">
          {!confirmando ? (
            <button
              onClick={() => setConfirmando(true)}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              Marcar como Surtido
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label
                  htmlFor={`obs-${solicitud.id}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Observaciones del surtido (opcional)
                </label>
                <textarea
                  id={`obs-${solicitud.id}`}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Agregar comentarios sobre el surtido..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmarSurtido}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Confirmar Surtido
                </button>
                <button
                  onClick={() => {
                    setConfirmando(false);
                    setObservaciones('');
                  }}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
