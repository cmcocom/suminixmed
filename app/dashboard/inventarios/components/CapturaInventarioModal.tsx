/**
 * @fileoverview Modal de Captura de Inventario Físico
 * @description Permite buscar productos y capturar cantidades contadas
 * @date 2025-10-07
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/fetcher';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  cantidad: number;
}

interface Detalle {
  id: string;
  producto_id: string;
  cantidad_sistema: number;
  cantidad_contada: number | null;
  diferencia: number | null;
  observaciones: string | null;
  producto: Producto;
}

interface CapturaInventarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventarioId: string;
  inventarioNombre: string;
  onActualizacion: () => void;
}

export function CapturaInventarioModal({
  isOpen,
  onClose,
  inventarioId,
  inventarioNombre,
  onActualizacion,
}: CapturaInventarioModalProps) {
  const [busqueda, setBusqueda] = useState('');
  const [detalles, setDetalles] = useState<Detalle[]>([]);
  const [detallesFiltrados, setDetallesFiltrados] = useState<Detalle[]>([]);
  const [loading, setLoading] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState<Detalle | null>(null);
  const [cantidadContada, setCantidadContada] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Cargar detalles del inventario
  const cargarDetalles = useCallback(async () => {
    if (!isOpen) return;

    setLoading(true);
    try {
      const response = await api.get(`/api/inventarios-fisicos/${inventarioId}/detalles`);

      if (!response.ok) throw new Error('Error al cargar detalles');

      const data = await response.json();
      setDetalles(data.data || []);
      setDetallesFiltrados(data.data || []);
    } catch (error) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [inventarioId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      cargarDetalles();
      setBusqueda('');
      setDetalleSeleccionado(null);
    }
  }, [isOpen, cargarDetalles]);

  // Filtrar productos por búsqueda
  useEffect(() => {
    if (!busqueda.trim()) {
      setDetallesFiltrados(detalles);
      return;
    }

    const busquedaLower = busqueda.toLowerCase();
    const filtrados = detalles.filter(
      (d) =>
        d.producto.descripcion.toLowerCase().includes(busquedaLower) ||
        d.producto.descripcion?.toLowerCase().includes(busquedaLower) ||
        d.producto.id.toLowerCase().includes(busquedaLower)
    );
    setDetallesFiltrados(filtrados);
  }, [busqueda, detalles]);

  // Seleccionar producto
  const seleccionarProducto = (detalle: Detalle) => {
    setDetalleSeleccionado(detalle);
    setCantidadContada(detalle.cantidad_contada?.toString() || '');
    setObservaciones(detalle.observaciones || '');
    setBusqueda('');
  };

  // Guardar cantidad contada
  const guardarCantidad = async () => {
    if (!detalleSeleccionado) return;

    const cantidad = parseInt(cantidadContada);
    if (isNaN(cantidad) || cantidad < 0) {
      toast.error('Ingresa una cantidad válida');
      return;
    }

    setGuardando(true);
    try {
      const response = await api.put(
        `/api/inventarios-fisicos/${inventarioId}/detalles/${detalleSeleccionado.id}`,
        {
          cantidad_contada: cantidad,
          observaciones: observaciones.trim() || null,
        }
      );

      if (!response.ok) throw new Error('Error al guardar');

      const data = await response.json();

      // Actualizar lista de detalles
      setDetalles((prev) => prev.map((d) => (d.id === data.data.id ? data.data : d)));

      toast.success('Cantidad guardada correctamente');

      // Limpiar selección
      setDetalleSeleccionado(null);
      setCantidadContada('');
      setObservaciones('');

      onActualizacion();
    } catch (error) {
      toast.error('Error al guardar cantidad');
    } finally {
      setGuardando(false);
    }
  };

  // Calcular diferencia en tiempo real
  const calcularDiferencia = () => {
    if (!detalleSeleccionado || !cantidadContada) return null;
    const cantidad = parseInt(cantidadContada);
    if (isNaN(cantidad)) return null;
    return cantidad - detalleSeleccionado.cantidad_sistema;
  };

  const diferencia = calcularDiferencia();

  // Obtener color de diferencia
  const getColorDiferencia = (dif: number | null) => {
    if (dif === null || dif === 0) return 'text-gray-600';
    return dif > 0 ? 'text-green-600' : 'text-red-600';
  };

  // Calcular progreso
  const totalProductos = detalles.length;
  const productosCapturados = detalles.filter((d) => d.cantidad_contada !== null).length;
  const porcentaje =
    totalProductos > 0 ? Math.round((productosCapturados / totalProductos) * 100) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">📦 Captura de Inventario</h3>
                <p className="text-sm text-blue-100 mt-1">{inventarioNombre}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Barra de progreso */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-blue-100 mb-1">
                <span>
                  {productosCapturados} de {totalProductos} productos
                </span>
                <span>{porcentaje}%</span>
              </div>
              <div className="w-full bg-blue-900 bg-opacity-30 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            {!detalleSeleccionado ? (
              // Vista de búsqueda
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔍 Buscar Producto
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar por nombre, descripción o código..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* Lista de productos */}
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                  {loading ? (
                    <div className="p-8 text-center text-gray-500">Cargando productos...</div>
                  ) : detallesFiltrados.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      {busqueda ? 'No se encontraron productos' : 'No hay productos'}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {detallesFiltrados.slice(0, 50).map((detalle) => (
                        <button
                          key={detalle.id}
                          onClick={() => seleccionarProducto(detalle)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {detalle.producto.descripcion}
                              </p>
                              {detalle.producto.descripcion && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {detalle.producto.descripcion}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                Sistema: {detalle.cantidad_sistema} unidades
                              </p>
                            </div>
                            <div className="ml-4 text-right">
                              {detalle.cantidad_contada !== null ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✓ Capturado
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Pendiente
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Vista de captura
              <div className="space-y-4">
                {/* Información del producto */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="font-semibold text-gray-900">
                    {detalleSeleccionado.producto.descripcion}
                  </h4>
                  {detalleSeleccionado.producto.descripcion && (
                    <p className="text-sm text-gray-600 mt-1">
                      {detalleSeleccionado.producto.descripcion}
                    </p>
                  )}
                </div>

                {/* Cantidad sistema */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad en Sistema
                  </label>
                  <div className="text-2xl font-bold text-gray-900">
                    {detalleSeleccionado.cantidad_sistema} unidades
                  </div>
                </div>

                {/* Cantidad contada */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad Contada <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cantidadContada}
                    onChange={(e) => setCantidadContada(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    placeholder="Ingresa la cantidad contada"
                    autoFocus
                  />
                </div>

                {/* Diferencia */}
                {diferencia !== null && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Diferencia:</span>
                      <span className={`text-lg font-bold ${getColorDiferencia(diferencia)}`}>
                        {diferencia > 0 ? '+' : ''}
                        {diferencia} unidades
                        {diferencia > 0 ? ' (Sobra)' : diferencia < 0 ? ' (Falta)' : ' (Igual)'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones (Opcional)
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notas adicionales..."
                  />
                </div>

                {/* Botones */}
                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => {
                      setDetalleSeleccionado(null);
                      setCantidadContada('');
                      setObservaciones('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    ← Buscar otro producto
                  </button>
                  <button
                    onClick={guardarCantidad}
                    disabled={guardando || !cantidadContada}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {guardando ? 'Guardando...' : 'Guardar y Continuar'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
