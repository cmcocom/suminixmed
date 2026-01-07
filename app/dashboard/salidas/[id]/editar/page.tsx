'use client';

import { api } from '@/lib/fetcher';
import { ArrowLeftIcon, ExclamationTriangleIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ConfirmacionGuardado from '../../../components/ConfirmacionGuardado';
import SelectorProducto from '../../../entradas/components/SelectorProducto';
import FilaPartidaSalida from '../../components/FilaPartidaSalida';
import SelectorCliente from '../../components/SelectorCliente';
import { useTiposSalida } from '../../hooks/useTiposSalida';
import { Cliente, LoteDisponible, PartidaSalida, Producto } from '../../types';

// Función auxiliar para generar IDs únicos compatible con todos los navegadores
function generarIdUnico(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Función para obtener la fecha local en formato YYYY-MM-DD desde un Date
function formatearFechaParaInput(fecha: Date | string | null | undefined): string {
  if (!fecha) {
    // Si no hay fecha, retornar fecha actual
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }

  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const año = fechaObj.getFullYear();
  const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
  const dia = String(fechaObj.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

export default function EditarSalidaPage() {
  const router = useRouter();
  const params = useParams();
  const salidaId = params?.id as string;

  const { tipos, loading: loadingTipos } = useTiposSalida();

  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>('');
  const [observaciones, setObservaciones] = useState('');
  const [referenciaExterna, setReferenciaExterna] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [fechaCaptura, setFechaCaptura] = useState<string>('');
  const [folioSalida, setFolioSalida] = useState<string>('');
  const [partidas, setPartidas] = useState<PartidaSalida[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Nuevos estados para el flujo de captura rápida
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidadInput, setCantidadInput] = useState('');
  const cantidadInputRef = useRef<HTMLInputElement>(null);
  const selectorInputRef = useRef<HTMLInputElement>(null);
  const botonAgregarRef = useRef<HTMLButtonElement>(null);

  // Estados para tracking de lotes
  const [capturarLotes, setCapturarLotes] = useState(false);
  const [lotesDisponibles, setLotesDisponibles] = useState<LoteDisponible[]>([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteDisponible | null>(null);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const loteInputRef = useRef<HTMLInputElement>(null);

  // Estado para controlar la contracción de la tarjeta de información general
  const [infoGeneralColapsada, setInfoGeneralColapsada] = useState(false);

  // Estado para notificación de duplicado
  const [notificacionDuplicado, setNotificacionDuplicado] = useState<{
    show: boolean;
    producto: string;
    clave: string;
    productoId: string;
  }>({ show: false, producto: '', clave: '', productoId: '' });

  // Estado para el modal de confirmación
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  // Obtener el tipo seleccionado
  const tipoActual = tipos.find((t) => t.id === tipoSeleccionado);

  // Verificar si los datos de información general están completos
  const infoGeneralCompleta = () => {
    if (!tipoSeleccionado) return false;
    if (tipoActual?.requiere_cliente && !clienteSeleccionado) return false;
    if (tipoActual?.requiere_referencia && !referenciaExterna.trim()) return false;
    return true;
  };

  // Cargar datos de la salida al iniciar
  useEffect(() => {
    const cargarSalida = async () => {
      if (!salidaId) return;

      try {
        setLoading(true);
        const response = await api.get(`/api/salidas/${salidaId}`);

        if (!response.ok) {
          throw new Error('Error al cargar la salida');
        }

        const salida = await response.json();

        // Establecer valores del formulario
        setFolioSalida(salida.folio || '');
        setTipoSeleccionado(salida.tipo_salida_id || '');
        setObservaciones(salida.observaciones || '');
        setReferenciaExterna(salida.motivo || '');
        setFechaCaptura(formatearFechaParaInput(salida.fecha_creacion));

        // Establecer cliente si existe
        if (salida.cliente) {
          setClienteSeleccionado({
            id: salida.cliente.id,
            nombre: salida.cliente.nombre,
            empresa: salida.cliente.empresa || null,
            rfc: salida.cliente.rfc || null,
            email: salida.cliente.email || null,
            telefono: salida.cliente.telefono || null,
            activo: salida.cliente.activo ?? true,
            clave: salida.cliente.clave || null,
            medico_tratante: salida.cliente.medico_tratante || null,
            especialidad: salida.cliente.especialidad || null,
            localidad: salida.cliente.localidad || null,
            estado: salida.cliente.estado || null,
            pais: salida.cliente.pais || null,
          });
        }

        // Convertir partidas al formato esperado
        const partidasFormateadas: PartidaSalida[] = salida.partidas_salida_inventario.map(
          (p: any) => ({
            id: p.id,
            producto: {
              id: p.Inventario.id,
              descripcion: p.Inventario.descripcion,
              clave: p.Inventario.clave,
              cantidad: p.Inventario.cantidad,
            },
            cantidad: p.cantidad,
            precio: p.precio,
            lote_entrada_id: p.lote_entrada_id,
            numero_lote: p.numero_lote,
            fecha_vencimiento_lote: p.fecha_vencimiento_lote,
          })
        );

        setPartidas(partidasFormateadas);

        // Si hay lotes, activar captura de lotes
        if (partidasFormateadas.some((p) => p.lote_entrada_id)) {
          setCapturarLotes(true);
        }
      } catch (err) {
        console.error('Error cargando salida:', err);
        setError('Error al cargar la salida');
      } finally {
        setLoading(false);
      }
    };

    cargarSalida();
  }, [salidaId]);

  // Efecto para cargar lotes cuando se selecciona un producto
  useEffect(() => {
    const cargarLotesDisponibles = async () => {
      if (!productoSeleccionado?.id || !capturarLotes) {
        setLotesDisponibles([]);
        setLoteSeleccionado(null);
        return;
      }

      try {
        setLoadingLotes(true);
        const response = await api.get(
          `/api/entradas/lotes-disponibles?inventario_id=${productoSeleccionado.id}`
        );

        if (response.ok) {
          const data = await response.json();
          setLotesDisponibles(data.lotes || []);
          setLoteSeleccionado(null);
        } else {
          setLotesDisponibles([]);
        }
      } catch (error) {
        console.error('Error cargando lotes:', error);
        setLotesDisponibles([]);
      } finally {
        setLoadingLotes(false);
      }
    };

    cargarLotesDisponibles();
  }, [productoSeleccionado?.id, capturarLotes]);

  // Manejar cambio de tipo de salida
  const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoTipo = e.target.value;
    setTipoSeleccionado(nuevoTipo);

    const tipo = tipos.find((t) => t.id === nuevoTipo);
    if (tipo && !tipo.requiere_cliente) {
      setClienteSeleccionado(null);
    }
    if (tipo && !tipo.requiere_referencia) {
      setReferenciaExterna('');
    }
  };

  // Manejar selección de producto
  const handleProductoSeleccionado = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setError(null);

    // Focus automático al campo de cantidad
    setTimeout(() => {
      cantidadInputRef.current?.focus();
      cantidadInputRef.current?.select();
    }, 100);
  };

  // Manejar agregar partida
  const handleAgregarPartida = () => {
    if (!productoSeleccionado) {
      setError('Debe seleccionar un producto');
      return;
    }

    const cantidad = parseInt(cantidadInput);
    if (isNaN(cantidad) || cantidad <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    // Verificar que no esté duplicado
    const yaExiste = partidas.some((p) => p.producto.id === productoSeleccionado.id);
    if (yaExiste) {
      setNotificacionDuplicado({
        show: true,
        producto: productoSeleccionado.descripcion,
        clave: productoSeleccionado.clave || 'Sin clave',
        productoId: productoSeleccionado.id,
      });

      setTimeout(() => {
        setNotificacionDuplicado({ show: false, producto: '', clave: '', productoId: '' });
      }, 5000);

      return;
    }

    // Verificar stock disponible
    if (cantidad > productoSeleccionado.cantidad) {
      setError(`Stock insuficiente. Disponible: ${productoSeleccionado.cantidad}`);
      return;
    }

    // Si se requiere lote y no se seleccionó
    if (capturarLotes && !loteSeleccionado) {
      setError('Debe seleccionar un lote');
      return;
    }

    // Verificar cantidad disponible en el lote
    if (capturarLotes && loteSeleccionado && cantidad > loteSeleccionado.cantidad_disponible) {
      setError(`El lote solo tiene ${loteSeleccionado.cantidad_disponible} unidades disponibles`);
      return;
    }

    const nuevaPartida: PartidaSalida = {
      id: generarIdUnico(),
      producto: productoSeleccionado,
      cantidad,
      precio: 0, // Precio 0 por defecto
      ...(capturarLotes &&
        loteSeleccionado && {
          lote_entrada_id: loteSeleccionado.id,
          numero_lote: loteSeleccionado.numero_lote,
          fecha_vencimiento_lote: loteSeleccionado.fecha_vencimiento,
        }),
    };

    setPartidas([...partidas, nuevaPartida]);
    setProductoSeleccionado(null);
    setCantidadInput('');
    setLoteSeleccionado(null);
    setLotesDisponibles([]);
    setError(null);

    // Contraer información general al agregar primera partida
    if (partidas.length === 0 && infoGeneralCompleta()) {
      setInfoGeneralColapsada(true);
    }

    // Focus de vuelta al selector
    setTimeout(() => {
      selectorInputRef.current?.focus();
    }, 100);
  };

  // Actualizar partida (usando index en lugar de id)
  const handleActualizarPartida = (index: number, cantidad: number, precio: number) => {
    setPartidas(partidas.map((p, i) => (i === index ? { ...p, cantidad, precio } : p)));
  };

  // Remover partida (usando index en lugar de id)
  const handleRemoverPartida = (index: number) => {
    setPartidas(partidas.filter((_, i) => i !== index));
  };

  // Enter en cantidad
  const handleCantidadKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (capturarLotes && lotesDisponibles.length > 0) {
        loteInputRef.current?.focus();
      } else {
        botonAgregarRef.current?.focus();
        handleAgregarPartida();
      }
    }
  };

  // Enter en lote
  const handleLoteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      botonAgregarRef.current?.focus();
      handleAgregarPartida();
    }
  };

  // Enter en partida (sin parámetros - se llama desde FilaPartidaSalida)
  const handleEnterEnPartida = () => {
    // Regresar al selector
    selectorInputRef.current?.focus();
  };

  // Guardar salida editada
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!tipoSeleccionado) {
      setError('Debe seleccionar un tipo de salida');
      return;
    }

    if (tipoActual?.requiere_cliente && !clienteSeleccionado) {
      setError('Este tipo de salida requiere un cliente');
      return;
    }

    if (tipoActual?.requiere_referencia && !referenciaExterna.trim()) {
      setError('Este tipo de salida requiere una referencia externa');
      return;
    }

    if (partidas.length === 0) {
      setError('Debe agregar al menos un producto');
      return;
    }

    if (!folioSalida.trim()) {
      setError('Debe especificar un folio');
      return;
    }

    // Mostrar modal de confirmación
    setMostrarConfirmacion(true);
  };

  // Confirmar guardado
  const handleConfirmarGuardado = async () => {
    try {
      setSaving(true);

      const payload = {
        folio: folioSalida,
        tipo_salida_id: tipoSeleccionado,
        cliente_id: clienteSeleccionado?.id || null,
        observaciones,
        referencia_externa: referenciaExterna,
        fecha_captura: fechaCaptura,
        partidas: partidas.map((p) => ({
          producto_id: p.producto.id,
          cantidad: p.cantidad,
          precio: p.precio,
          lote_entrada_id: p.lote_entrada_id || null,
          numero_lote: p.numero_lote || null,
          fecha_vencimiento_lote: p.fecha_vencimiento_lote || null,
        })),
      };

      const response = await api.put(`/api/salidas/${salidaId}`, payload);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar la salida');
      }

      // Redirigir a la lista de salidas
      router.push('/dashboard/salidas?success=edit');
    } catch (err: any) {
      console.error('Error al actualizar salida:', err);
      setError(err.message || 'Error al actualizar la salida');
      setMostrarConfirmacion(false);
    } finally {
      setSaving(false);
    }
  };

  // Cancelar confirmación
  const handleCancelarConfirmacion = () => {
    setMostrarConfirmacion(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Salida</h1>
            <p className="text-sm text-gray-500">Folio: {folioSalida}</p>
          </div>
        </div>
      </div>

      {/* Mensaje de error global */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información General */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div
            className="px-6 py-4 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setInfoGeneralColapsada(!infoGeneralColapsada)}
          >
            <h2 className="text-lg font-semibold text-gray-900">Información General</h2>
            <button type="button" className="text-gray-400 hover:text-gray-600">
              {infoGeneralColapsada ? '▼' : '▲'}
            </button>
          </div>

          {!infoGeneralColapsada && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Folio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Folio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={folioSalida}
                    onChange={(e) => setFolioSalida(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={fechaCaptura}
                    onChange={(e) => setFechaCaptura(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Tipo de Salida */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Salida <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={tipoSeleccionado}
                    onChange={handleTipoChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loadingTipos}
                  >
                    <option value="">Seleccione un tipo</option>
                    {tipos.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cliente (condicional) */}
                {tipoActual?.requiere_cliente && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cliente <span className="text-red-500">*</span>
                    </label>
                    <SelectorCliente
                      onSelect={setClienteSeleccionado}
                      value={clienteSeleccionado}
                    />
                  </div>
                )}

                {/* Referencia Externa (condicional) */}
                {tipoActual?.requiere_referencia && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Referencia Externa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={referenciaExterna}
                      onChange={(e) => setReferenciaExterna(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Orden de compra, factura, etc."
                      required
                    />
                  </div>
                )}

                {/* Observaciones */}
                <div
                  className={
                    tipoActual?.requiere_cliente || tipoActual?.requiere_referencia
                      ? ''
                      : 'md:col-span-2'
                  }
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notas adicionales (opcional)"
                  />
                </div>
              </div>

              {/* Toggle de Captura de Lotes */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="capturar-lotes"
                  checked={capturarLotes}
                  onChange={(e) => {
                    setCapturarLotes(e.target.checked);
                    setLoteSeleccionado(null);
                    setLotesDisponibles([]);
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="capturar-lotes"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Capturar información de lotes
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Productos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Productos</h2>
          </div>

          <div className="p-6 space-y-4">
            {/* Captura Rápida */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {/* Fila 1: Selector de Producto (100%) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Producto
                </label>
                <SelectorProducto ref={selectorInputRef} onSelect={handleProductoSeleccionado} />
              </div>

              {/* Fila 2: Cantidad (50%) + Lote (50% si aplica) */}
              <div className={capturarLotes ? 'grid grid-cols-2 gap-3' : ''}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                  <input
                    ref={cantidadInputRef}
                    type="number"
                    value={cantidadInput}
                    onChange={(e) => setCantidadInput(e.target.value)}
                    onKeyDown={handleCantidadKeyDown}
                    min="1"
                    step="1"
                    placeholder="Cantidad"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {capturarLotes && productoSeleccionado && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lote{' '}
                      {loadingLotes && <span className="text-xs text-gray-500">(cargando...)</span>}
                    </label>
                    <input
                      ref={loteInputRef}
                      type="text"
                      list="lotes-list"
                      value={loteSeleccionado?.id || ''}
                      onChange={(e) => {
                        const lote = lotesDisponibles.find((l) => l.id === e.target.value);
                        setLoteSeleccionado(lote || null);
                      }}
                      onKeyDown={handleLoteKeyDown}
                      disabled={loadingLotes || lotesDisponibles.length === 0}
                      title="Seleccionar lote disponible"
                      placeholder={
                        lotesDisponibles.length === 0
                          ? 'No hay lotes disponibles'
                          : 'Escribe o selecciona un lote'
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <datalist id="lotes-list">
                      {lotesDisponibles.map((lote) => (
                        <option key={lote.id} value={lote.id}>
                          {lote.numero_lote} | Vence:{' '}
                          {lote.fecha_vencimiento
                            ? new Date(lote.fecha_vencimiento).toLocaleDateString('es-MX')
                            : 'Sin vencimiento'}{' '}
                          | Disponible: {lote.cantidad_disponible}
                        </option>
                      ))}
                    </datalist>
                    {loteSeleccionado && (
                      <p className="text-xs text-gray-600 mt-1">
                        ✓ Entrada: {loteSeleccionado.entrada_folio} | Fecha:{' '}
                        {new Date(loteSeleccionado.entrada_fecha).toLocaleDateString('es-MX')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Fila 3: Producto Seleccionado (75%) + Botón Agregar (25%) */}
              <div className="grid grid-cols-4 gap-3 items-stretch">
                {/* Producto Seleccionado - 75% (col-span-3) */}
                <div className="col-span-3">
                  {productoSeleccionado ? (
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg h-full">
                      <p className="text-xs font-semibold text-blue-900 mb-1">
                        ✓ Producto Seleccionado
                      </p>
                      <p
                        className="text-sm font-medium text-gray-900 line-clamp-2"
                        title={productoSeleccionado.descripcion}
                      >
                        {productoSeleccionado.descripcion}
                      </p>
                      <div className="mt-2 space-y-1">
                        {productoSeleccionado.clave && (
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Clave:</span> {productoSeleccionado.clave}
                          </p>
                        )}
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Stock:</span>{' '}
                          <span
                            className={`font-bold ${
                              productoSeleccionado.cantidad > 10
                                ? 'text-green-600'
                                : productoSeleccionado.cantidad > 0
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                            }`}
                          >
                            {productoSeleccionado.cantidad}
                          </span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg h-full flex items-center justify-center bg-gray-50">
                      <p className="text-xs text-gray-400 text-center">
                        Ningún producto seleccionado
                      </p>
                    </div>
                  )}
                </div>

                {/* Botón Agregar - 25% (col-span-1) */}
                <div className="col-span-1">
                  <button
                    ref={botonAgregarRef}
                    type="button"
                    onClick={handleAgregarPartida}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAgregarPartida();
                      }
                    }}
                    disabled={
                      !productoSeleccionado || !cantidadInput || parseInt(cantidadInput) <= 0
                    }
                    className="w-full h-full px-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex flex-col items-center justify-center gap-1"
                    title="Agregar producto"
                  >
                    <PlusIcon className="h-6 w-6" />
                    <span className="text-xs font-medium">Agregar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Notificación de producto duplicado */}
            {notificacionDuplicado.show && (
              <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg animate-pulse">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">¡Producto Duplicado!</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      El producto{' '}
                      <span className="font-semibold">{notificacionDuplicado.producto}</span>
                      {notificacionDuplicado.clave !== 'Sin clave' && (
                        <span> (Clave: {notificacionDuplicado.clave})</span>
                      )}{' '}
                      ya está en la lista de partidas. Si deseas modificar la cantidad, edítala
                      directamente en la tabla.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {partidas.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <PlusIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No hay productos agregados</p>
              <p className="text-sm">Use el selector para agregar productos a la salida</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">#</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Cantidad
                    </th>
                    {capturarLotes && (
                      <>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Lote
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Vencimiento
                        </th>
                      </>
                    )}
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {partidas.map((partida, index) => (
                    <FilaPartidaSalida
                      key={partida.id}
                      partida={partida}
                      index={index}
                      numeroPartida={index + 1}
                      onUpdate={handleActualizarPartida}
                      onRemove={handleRemoverPartida}
                      onEnterPressed={handleEnterEnPartida}
                      isHighlighted={
                        notificacionDuplicado.show &&
                        partida.producto.id === notificacionDuplicado.productoId
                      }
                      mostrarLotes={capturarLotes}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || partidas.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>

      {/* Modal de Confirmación */}
      <ConfirmacionGuardado
        isOpen={mostrarConfirmacion}
        onClose={handleCancelarConfirmacion}
        onConfirm={handleConfirmarGuardado}
        title="Confirmar Edición de Salida"
        mensaje="¿Está seguro de que desea guardar los cambios en esta salida de inventario?"
        detalles={[
          { label: 'Folio', valor: folioSalida },
          { label: 'Tipo', valor: tipos.find((t) => t.id === tipoSeleccionado)?.nombre || '' },
          ...(clienteSeleccionado ? [{ label: 'Cliente', valor: clienteSeleccionado.nombre }] : []),
          { label: 'Productos', valor: partidas.length },
        ]}
        loading={saving}
        tipo="salida"
      />
    </div>
  );
}
