'use client';

import { api } from '@/lib/fetcher';
import { ArrowLeftIcon, ExclamationTriangleIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ConfirmacionGuardado from '../../components/ConfirmacionGuardado';
import FilaPartida from '../components/FilaPartida';
import SelectorProducto from '../components/SelectorProducto';
import { useEntradasList } from '../hooks/useEntradas';
import { useTiposEntrada } from '../hooks/useTiposEntrada';
import { PartidaEntrada, Producto } from '../types';

interface Proveedor {
  id: string;
  nombre: string;
  razon_social: string | null;
  rfc: string | null;
}

// Función auxiliar para generar IDs únicos compatible con todos los navegadores
function generarIdUnico(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Función para obtener la fecha local en formato YYYY-MM-DD
function obtenerFechaLocal(): string {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

export default function NuevaEntradaPage() {
  const router = useRouter();
  const { tipos, loading: loadingTipos } = useTiposEntrada();
  const { createEntrada, loading: saving, error: errorEntrada } = useEntradasList();

  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>('');
  const [observaciones, setObservaciones] = useState('');
  const [referenciaExterna, setReferenciaExterna] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [fechaCaptura, setFechaCaptura] = useState<string>(obtenerFechaLocal());
  const [folioEntrada, setFolioEntrada] = useState<string>('');
  const [loadingFolio, setLoadingFolio] = useState(true);
  const [partidas, setPartidas] = useState<PartidaEntrada[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Nuevos estados para el flujo de captura rápida
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidadInput, setCantidadInput] = useState('');
  const cantidadInputRef = useRef<HTMLInputElement>(null);
  const selectorInputRef = useRef<HTMLInputElement>(null);
  const loteInputRef = useRef<HTMLInputElement>(null);
  const vencimientoInputRef = useRef<HTMLInputElement>(null);
  const botonAgregarRef = useRef<HTMLButtonElement>(null);

  // ✅ Refs para navegación con teclado
  const tipoEntradaRef = useRef<HTMLSelectElement>(null);
  const proveedorRef = useRef<HTMLSelectElement>(null);
  const referenciaRef = useRef<HTMLInputElement>(null);
  const observacionesRef = useRef<HTMLTextAreaElement>(null);

  // Estados para captura de lote y vencimiento
  const [capturarLotes, setCapturarLotes] = useState(false);
  const [numeroLote, setNumeroLote] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [_loadingConfig, setLoadingConfig] = useState(true);

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
  const [datosParaGuardar, setDatosParaGuardar] = useState<any>(null);

  // Obtener el tipo seleccionado
  const tipoActual = tipos.find((t) => t.id === tipoSeleccionado);

  // Verificar si los datos de información general están completos
  const infoGeneralCompleta = () => {
    if (!tipoSeleccionado) return false;
    if (!proveedorId) return false; // Proveedor siempre requerido
    // La referencia ya no es necesaria para contraer la sección
    return true;
  };

  // Efecto para obtener el próximo folio al cargar la página
  useEffect(() => {
    const obtenerProximoFolio = async () => {
      try {
        setLoadingFolio(true);
        const response = await api.get('/api/config/folios?tipo=entrada');

        if (!response.ok) {
          console.warn('⚠️ No se pudo obtener el folio automático, status:', response.status);
          setFolioEntrada(''); // Dejar vacío para que el usuario lo ingrese manualmente
          return;
        }

        const data = await response.json();

        // Validar que la respuesta sea exitosa y contenga el próximo folio
        if (data.success && data.proximo_folio !== undefined && data.proximo_folio !== null) {
          setFolioEntrada(data.proximo_folio.toString());
          console.log('✅ Próximo folio cargado:', data.proximo_folio);
        } else {
          console.warn('⚠️ Respuesta del servidor sin próximo folio:', data);
          setFolioEntrada(''); // Dejar vacío
        }
      } catch (error) {
        console.error('❌ Error al obtener folio:', error);
        setFolioEntrada(''); // Dejar vacío en caso de error
      } finally {
        setLoadingFolio(false);
      }
    };

    obtenerProximoFolio();
  }, []);

  // Cargar proveedores al inicio (siempre)
  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        setLoadingProveedores(true);
        const response = await api.get('/api/proveedores?activo=true&limit=1000');
        if (response.ok) {
          const result = await response.json();
          // El API devuelve { success: true, data: [...] }
          setProveedores(Array.isArray(result.data) ? result.data : []);
        }
      } catch (err) {
        console.error('Error al cargar proveedores:', err);
        setProveedores([]);
      } finally {
        setLoadingProveedores(false);
      }
    };

    fetchProveedores();
  }, []); // Se ejecuta solo al montar el componente

  // Cargar configuración de captura de lotes
  useEffect(() => {
    const fetchConfiguracion = async () => {
      try {
        setLoadingConfig(true);
        const response = await api.get('/api/entidades/active');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setCapturarLotes(result.data.capturar_lotes_entradas || false);
          }
        }
      } catch (err) {
        console.error('Error al cargar configuración:', err);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfiguracion();
  }, []);

  // ✅ Auto-focus en Tipo de Entrada al cargar la página
  useEffect(() => {
    // Esperar a que termine de cargar folios y tipos
    if (!loadingFolio && !loadingTipos && tipoEntradaRef.current) {
      setTimeout(() => {
        tipoEntradaRef.current?.focus();
      }, 100);
    }
  }, [loadingFolio, loadingTipos]);

  // ✅ Auto-focus en Cantidad cuando hay producto pero cantidad es 0
  useEffect(() => {
    const cantidad = parseFloat(cantidadInput) || 0;
    if (productoSeleccionado && cantidad <= 0 && cantidadInputRef.current) {
      setTimeout(() => {
        cantidadInputRef.current?.focus();
      }, 100);
    }
  }, [productoSeleccionado, cantidadInput]);

  // ✅ Funciones de navegación con teclado
  const handleTipoEntradaKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
      // Avanzar al siguiente campo (Proveedor)
      setTimeout(() => {
        proveedorRef.current?.focus();
      }, 50);
    }
  };

  const handleProveedorKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Avanzar a Referencia Externa
      setTimeout(() => {
        referenciaRef.current?.focus();
      }, 50);
    }
  };

  const handleReferenciaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Avanzar a Observaciones
      setTimeout(() => {
        observacionesRef.current?.focus();
      }, 50);
    }
  };

  const handleObservacionesKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab forzado a Cantidad (saltar botones)
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      // Contraer info general si está completa
      if (infoGeneralCompleta() && !infoGeneralColapsada) {
        setInfoGeneralColapsada(true);
      }
      // Ir directo al campo Cantidad
      setTimeout(() => {
        cantidadInputRef.current?.focus();
      }, 50);
    }
  };

  const handleAgregarProducto = (producto: Producto) => {
    // Verificar si el producto ya existe en la lista de partidas
    const productoYaExiste = partidas.some((p) => p.producto.id === producto.id);

    if (productoYaExiste) {
      // Mostrar notificación de duplicado
      setNotificacionDuplicado({
        show: true,
        producto: producto.descripcion,
        clave: producto.clave || 'Sin clave',
        productoId: producto.id,
      });

      // Ocultar la notificación después de 3 segundos
      setTimeout(() => {
        setNotificacionDuplicado({ show: false, producto: '', clave: '', productoId: '' });
      }, 3000);

      // No continuar con la selección
      return;
    }

    // Guardar el producto seleccionado
    setProductoSeleccionado(producto);

    // Mover el foco al siguiente campo según la configuración
    setTimeout(() => {
      if (capturarLotes) {
        // Si está habilitado capturar lotes, ir al campo de lote
        loteInputRef.current?.focus();
      } else {
        // Si no hay captura de lotes, ir directamente al botón agregar
        botonAgregarRef.current?.focus();
      }
    }, 50);
  };

  const handleAgregarPartida = () => {
    if (!productoSeleccionado || !cantidadInput || parseInt(cantidadInput) <= 0) {
      return;
    }

    const cantidad = parseInt(cantidadInput);
    const nuevaPartida: PartidaEntrada = {
      id: generarIdUnico(),
      producto: productoSeleccionado,
      cantidad: cantidad,
      precio: productoSeleccionado.precio,
      subtotal: cantidad * productoSeleccionado.precio,
      ...(capturarLotes && {
        numero_lote: numeroLote || null,
        fecha_vencimiento: fechaVencimiento || null,
      }),
    };

    // Agregar al principio de la lista
    setPartidas([nuevaPartida, ...partidas]);

    // Limpiar el estado para la siguiente captura
    setProductoSeleccionado(null);
    setCantidadInput('');
    setNumeroLote('');
    setFechaVencimiento('');

    // Regresar el foco al campo de cantidad para captura rápida
    setTimeout(() => {
      cantidadInputRef.current?.focus();
    }, 100);
  };

  const handleCantidadKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation(); // Previene propagación al form

      // Contraer la información general al dar Enter en cantidad
      if (infoGeneralCompleta() && !infoGeneralColapsada) {
        setInfoGeneralColapsada(true);
      }

      const cantidad = parseInt(cantidadInput) || 0;

      // 🎯 FLUJO INTELIGENTE: Si ya hay producto seleccionado y cantidad válida → AGREGAR
      if (productoSeleccionado && cantidad > 0) {
        handleAgregarPartida();
        return;
      }

      // ⚠️ Si hay producto pero cantidad inválida → Error y mantener focus
      if (productoSeleccionado && cantidad <= 0) {
        setError('Debe capturar una cantidad mayor a 0');
        // Mantener foco en cantidad y seleccionar texto
        cantidadInputRef.current?.focus();
        setTimeout(() => {
          cantidadInputRef.current?.select();
        }, 10);
        return;
      }

      // ⚠️ Si NO hay producto y cantidad es 0 → Error y mantener focus
      if (cantidad <= 0) {
        setError('Debe capturar una cantidad mayor a 0');
        // Mantener foco en cantidad y seleccionar texto
        cantidadInputRef.current?.focus();
        setTimeout(() => {
          cantidadInputRef.current?.select();
        }, 10);
        return;
      }

      // ✅ Flujo normal: hay cantidad pero no hay producto → ir a selector
      setTimeout(() => {
        selectorInputRef.current?.focus();
      }, 100);
      return;
    }
  };

  const handleLoteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation(); // Previene propagación al form

      // Mover el foco al campo de vencimiento
      setTimeout(() => {
        vencimientoInputRef.current?.focus();
      }, 50);
      return;
    }
  };

  const handleVencimientoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation(); // Previene propagación al form

      // Mover el foco al botón agregar
      setTimeout(() => {
        botonAgregarRef.current?.focus();
      }, 50);
      return;
    }
  };

  const handleActualizarPartida = (index: number, cantidad: number) => {
    const nuevasPartidas = [...partidas];
    nuevasPartidas[index] = {
      ...nuevasPartidas[index],
      cantidad,
      subtotal: cantidad * nuevasPartidas[index].precio,
    };
    setPartidas(nuevasPartidas);
  };

  const handleEliminarPartida = (index: number) => {
    setPartidas(partidas.filter((_, i) => i !== index));
  };

  const calcularTotal = () => {
    return partidas.reduce((sum, p) => sum + p.subtotal, 0);
  };

  // Prevenir submit del formulario con Enter desde inputs
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // SIEMPRE prevenir Enter excepto en textareas
    if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault(); // Prevenir el submit automático del formulario
      e.stopPropagation(); // Prevenir propagación adicional
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!tipoSeleccionado) {
      setError('Debe seleccionar un tipo de entrada');
      return;
    }

    if (partidas.length === 0) {
      setError('Debe agregar al menos un producto');
      return;
    }

    // Validar proveedor (siempre requerido)
    if (!proveedorId) {
      setError('Debe seleccionar un proveedor');
      return;
    }

    // Validar referencia si es requerida
    if (tipoActual?.requiere_referencia && !referenciaExterna.trim()) {
      setError('Debe ingresar una referencia/folio para este tipo de entrada');
      return;
    }

    // Preparar los datos para mostrar en la confirmación
    const tipoNombre = tipos.find((t) => t.id === tipoSeleccionado)?.nombre || '';

    // Determinar la fecha a enviar
    const fechaActual = obtenerFechaLocal();
    const usuarioModificoFecha = fechaCaptura !== fechaActual;

    const fechaParaEnviar = usuarioModificoFecha
      ? fechaCaptura // Solo fecha (YYYY-MM-DD)
      : new Date().toISOString(); // Fecha y hora completa del cliente

    // Guardar los datos y mostrar confirmación
    setDatosParaGuardar({
      motivo: tipoNombre,
      observaciones: observaciones.trim() || null,
      total: calcularTotal(),
      tipo_entrada_id: tipoSeleccionado,
      proveedor_id: proveedorId,
      referencia_externa: referenciaExterna.trim() || null,
      fecha_captura: fechaParaEnviar,
      folio: parseInt(folioEntrada) || undefined,
      partidas: partidas.map((p) => ({
        inventario_id: p.producto.id,
        cantidad: p.cantidad,
        precio: p.precio,
        ...(capturarLotes && {
          numero_lote: p.numero_lote || null,
          fecha_vencimiento: p.fecha_vencimiento || null,
        }),
      })),
    });

    setMostrarConfirmacion(true);
  };

  const handleConfirmarGuardado = async () => {
    if (!datosParaGuardar) return;

    try {
      await createEntrada(datosParaGuardar);

      // Cerrar modal
      setMostrarConfirmacion(false);

      // Solo redirigir si no hubo error
      router.push('/dashboard/entradas');
      router.refresh(); // Forzar refresh de la página
    } catch (err) {
      // El error ya se maneja en el hook
      console.error('Error al guardar:', err);
      // Mantener el modal abierto si hay error
    }
  };

  const handleCancelarConfirmacion = () => {
    setMostrarConfirmacion(false);
    setDatosParaGuardar(null);
  };

  if (loadingTipos) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Volver"
            aria-label="Volver a la lista de entradas"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Entrada de Inventario</h1>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-6">
        {/* Error general */}
        {(error || errorEntrada) && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{error || errorEntrada}</div>
          </div>
        )}

        {/* Información General */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            infoGeneralColapsada
              ? 'bg-gradient-to-r from-green-50 to-blue-50 border border-green-200'
              : 'bg-white shadow-md border border-gray-200'
          } rounded-lg overflow-hidden`}
        >
          {/* Vista Colapsada - Resumen Compacto */}
          {infoGeneralColapsada && infoGeneralCompleta() && (
            <div
              className="p-4 cursor-pointer hover:from-green-100 hover:to-blue-100 transition-all duration-200"
              onClick={() => setInfoGeneralColapsada(false)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">Información General</span>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Tipo:</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                        {tipoActual?.nombre}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Fecha:</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-xs font-medium">
                        {new Date(fechaCaptura + 'T00:00:00').toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {proveedorId && (
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">Proveedor:</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs font-medium max-w-32 truncate">
                          {proveedores.find((p) => p.id === proveedorId)?.nombre || 'N/A'}
                        </span>
                      </div>
                    )}

                    {referenciaExterna && (
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">Ref:</span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-xs font-medium">
                          {referenciaExterna}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                    ✓ Completado
                  </span>
                  <div className="transform transition-transform rotate-180">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vista Expandida - Formulario Completo */}
          {!infoGeneralColapsada && (
            <>
              <div
                className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
                onClick={() => infoGeneralCompleta() && setInfoGeneralColapsada(true)}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Información General</h2>
                  <div className="flex items-center space-x-3">
                    {infoGeneralCompleta() && (
                      <span className="text-sm text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                        ✓ Completo - Click para contraer
                      </span>
                    )}
                    {infoGeneralCompleta() && (
                      <div className="transform transition-transform">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white">
                {/* Folio y Fecha */}
                <div className="flex justify-between gap-4 mb-4">
                  {/* Folio */}
                  <div className="w-full md:w-32">
                    <label htmlFor="folio" className="block text-sm font-medium text-gray-700 mb-2">
                      Folio *
                    </label>
                    <input
                      type="number"
                      id="folio"
                      value={folioEntrada}
                      onChange={(e) => setFolioEntrada(e.target.value)}
                      min="1"
                      disabled={loadingFolio}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder={
                        loadingFolio ? 'Obteniendo folio...' : folioEntrada || 'Ingrese folio'
                      }
                      required
                    />
                  </div>

                  {/* Fecha de Captura */}
                  <div className="w-full md:w-64">
                    <label
                      htmlFor="fechaCaptura"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Fecha de Captura *
                    </label>
                    <input
                      type="date"
                      id="fechaCaptura"
                      value={fechaCaptura}
                      onChange={(e) => setFechaCaptura(e.target.value)}
                      max={obtenerFechaLocal()}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tipo de Entrada */}
                  <div className="col-span-full">
                    <label
                      htmlFor="tipo"
                      className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between"
                    >
                      <span>Tipo de Entrada *</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-300 rounded">
                        Enter ↵
                      </kbd>
                    </label>
                    <select
                      ref={tipoEntradaRef}
                      id="tipo"
                      value={tipoSeleccionado}
                      onChange={(e) => {
                        setTipoSeleccionado(e.target.value);
                        // Resetear campos condicionales al cambiar tipo
                        setProveedorId('');
                        setReferenciaExterna('');
                      }}
                      onKeyDown={handleTipoEntradaKeyDown}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    >
                      <option value="">Seleccione un tipo de entrada</option>
                      {tipos.map((tipo) => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Campo de Proveedor (siempre visible y obligatorio) */}
                  <div className="col-span-full">
                    <label
                      htmlFor="proveedor"
                      className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between"
                    >
                      <span>Proveedor *</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-300 rounded">
                        Enter ↵
                      </kbd>
                    </label>
                    <select
                      ref={proveedorRef}
                      id="proveedor"
                      value={proveedorId}
                      onChange={(e) => setProveedorId(e.target.value)}
                      onKeyDown={handleProveedorKeyDown}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                      disabled={loadingProveedores}
                    >
                      <option value="">
                        {loadingProveedores ? 'Cargando proveedores...' : 'Seleccione un proveedor'}
                      </option>
                      {proveedores.map((prov) => (
                        <option key={prov.id} value={prov.id}>
                          {prov.nombre} {prov.razon_social ? `- ${prov.razon_social}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Campo de Referencia Externa (condicional) */}
                  {tipoActual?.requiere_referencia && (
                    <div className="col-span-full">
                      <label
                        htmlFor="referencia"
                        className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between"
                      >
                        <span>
                          Referencia/Folio Externo *
                          <span className="text-xs text-gray-500 ml-2">
                            (Número de factura, orden de compra, etc.)
                          </span>
                        </span>
                        <kbd className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-300 rounded">
                          Enter ↵
                        </kbd>
                      </label>
                      <input
                        ref={referenciaRef}
                        type="text"
                        id="referencia"
                        value={referenciaExterna}
                        onChange={(e) => setReferenciaExterna(e.target.value)}
                        onKeyDown={handleReferenciaKeyDown}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Ej: FAC-2025-001, OC-123456"
                        required={tipoActual.requiere_referencia}
                        maxLength={100}
                      />
                    </div>
                  )}

                  {/* Observaciones */}
                  <div className="col-span-full">
                    <label
                      htmlFor="observaciones"
                      className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between"
                    >
                      <span>
                        Observaciones
                        <span className="text-xs text-gray-500 ml-2">(Opcional)</span>
                      </span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-300 rounded">
                        Tab ↹
                      </kbd>
                    </label>
                    <textarea
                      ref={observacionesRef}
                      id="observaciones"
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      onKeyDown={handleObservacionesKeyDown}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Información adicional sobre esta entrada (opcional)..."
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Botones de acción - Siempre visibles */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {infoGeneralCompleta() ? (
                <>
                  <span className="font-medium">Información general completada.</span>
                  <span className="text-gray-500 ml-1">
                    Ahora puedes agregar productos y guardar la entrada.
                  </span>
                </>
              ) : (
                <>
                  <span className="font-medium text-orange-600">
                    Complete la información general
                  </span>
                  <span className="text-gray-500 ml-1">para poder agregar productos.</span>
                </>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || partidas.length === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm"
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Guardando...</span>
                  </div>
                ) : (
                  'Guardar Entrada'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Productos</h2>
            <div className="text-sm text-gray-600">
              Productos: <span className="font-bold text-lg text-blue-600">{partidas.length}</span>
            </div>
          </div>

          {/* Captura rápida de productos */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-3">
              {/* Fila 1: Campo Cantidad (50%) + Selector de Producto con Check (50%) */}
              <div className="grid grid-cols-2 gap-4 items-end">
                {/* Campo de Cantidad - 50% */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                    <span>Cantidad</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-300 rounded">
                      Enter ↵
                    </kbd>
                  </label>
                  <input
                    ref={cantidadInputRef}
                    type="number"
                    value={cantidadInput}
                    onChange={(e) => setCantidadInput(e.target.value)}
                    onKeyDown={handleCantidadKeyDown}
                    onFocus={() => {
                      // Contraer la información general al hacer clic en cantidad
                      if (infoGeneralCompleta() && !infoGeneralColapsada) {
                        setInfoGeneralColapsada(true);
                      }
                    }}
                    min="1"
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Selector de Producto - 50% */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar Producto
                  </label>
                  <SelectorProducto
                    ref={selectorInputRef}
                    onSelect={handleAgregarProducto}
                    productosExcluidos={partidas.map((p) => p.producto.id)}
                    productoSeleccionado={productoSeleccionado}
                    mostrarProductoSeleccionado={false}
                  />
                </div>
              </div>

              {/* Campos de Lote y Vencimiento (si está habilitado) */}
              {capturarLotes && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Lote <span className="text-gray-400 text-xs">(Opcional)</span>
                    </label>
                    <input
                      ref={loteInputRef}
                      type="text"
                      value={numeroLote}
                      onChange={(e) => setNumeroLote(e.target.value)}
                      onKeyDown={handleLoteKeyDown}
                      placeholder="Ej: LOTE-2025-001"
                      maxLength={50}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Vencimiento <span className="text-gray-400 text-xs">(Opcional)</span>
                    </label>
                    <input
                      ref={vencimientoInputRef}
                      type="date"
                      value={fechaVencimiento}
                      onChange={(e) => setFechaVencimiento(e.target.value)}
                      onKeyDown={handleVencimientoKeyDown}
                      min={obtenerFechaLocal()}
                      title="Fecha de vencimiento del lote"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Fila 2: Producto Seleccionado (75%) + Botón Agregar (25%) */}
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

          {partidas.length > 0 ? (
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
                    <FilaPartida
                      key={partida.id}
                      partida={partida}
                      index={index}
                      numeroPartida={index + 1}
                      onUpdate={handleActualizarPartida}
                      onRemove={handleEliminarPartida}
                      isHighlighted={
                        notificacionDuplicado.show &&
                        partida.producto.id === notificacionDuplicado.productoId
                      }
                      selectorRef={selectorInputRef}
                      mostrarLotes={capturarLotes}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <PlusIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay productos agregados</p>
              <p className="text-sm">Busca y selecciona productos arriba</p>
            </div>
          )}
        </div>
      </form>

      {/* Modal de Confirmación */}
      <ConfirmacionGuardado
        isOpen={mostrarConfirmacion}
        onClose={handleCancelarConfirmacion}
        onConfirm={handleConfirmarGuardado}
        title="Confirmar Nueva Entrada"
        mensaje="¿Está seguro de que desea guardar esta entrada de inventario?"
        detalles={[
          { label: 'Folio', valor: folioEntrada },
          { label: 'Tipo', valor: tipos.find((t) => t.id === tipoSeleccionado)?.nombre || '' },
          {
            label: 'Proveedor',
            valor: proveedores.find((p) => p.id === proveedorId)?.nombre || '',
          },
          { label: 'Productos', valor: partidas.length },
        ]}
        loading={saving}
        tipo="entrada"
      />
    </div>
  );
}
