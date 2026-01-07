'use client';

import { api } from '@/lib/fetcher';
import { ArrowLeftIcon, ExclamationTriangleIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ConfirmacionGuardado from '../../components/ConfirmacionGuardado';
import SelectorProducto from '../../entradas/components/SelectorProducto';
import FilaPartidaSalida from '../components/FilaPartidaSalida';
import SelectorCliente from '../components/SelectorCliente';
import { useSalidas } from '../hooks/useSalidas';
import { useTiposSalida } from '../hooks/useTiposSalida';
import { Cliente, LoteDisponible, PartidaSalida, Producto } from '../types';

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

export default function NuevaSalidaPage() {
  const router = useRouter();
  const { tipos, loading: loadingTipos } = useTiposSalida();
  const { createSalida, loading: saving, error: errorSalida } = useSalidas();

  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>('');
  const [observaciones, setObservaciones] = useState('');
  const [referenciaExterna, setReferenciaExterna] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [fechaCaptura, setFechaCaptura] = useState<string>(
    obtenerFechaLocal() // Fecha actual LOCAL en formato YYYY-MM-DD
  );
  const [folioSalida, setFolioSalida] = useState<string>('');
  const [loadingFolio, setLoadingFolio] = useState(true);
  const [partidas, setPartidas] = useState<PartidaSalida[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Nuevos estados para el flujo de captura rápida
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidadInput, setCantidadInput] = useState('');
  const cantidadInputRef = useRef<HTMLInputElement>(null);
  const selectorInputRef = useRef<HTMLInputElement>(null);
  const botonAgregarRef = useRef<HTMLButtonElement>(null);

  // ✅ Refs para navegación con teclado
  const tipoSalidaRef = useRef<HTMLSelectElement>(null);
  const clienteInputRef = useRef<HTMLInputElement>(null);
  const referenciaRef = useRef<HTMLInputElement>(null);
  const observacionesRef = useRef<HTMLTextAreaElement>(null);

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
  const [datosParaGuardar, setDatosParaGuardar] = useState<any>(null);

  // Obtener el tipo seleccionado
  const tipoActual = tipos.find((t) => t.id === tipoSeleccionado);

  // Verificar si los datos de información general están completos
  const infoGeneralCompleta = () => {
    if (!tipoSeleccionado) return false;
    if (tipoActual?.requiere_cliente && !clienteSeleccionado) return false;
    if (tipoActual?.requiere_referencia && !referenciaExterna.trim()) return false;
    return true;
  };

  // Efecto para obtener el próximo folio al cargar la página
  useEffect(() => {
    const obtenerProximoFolio = async () => {
      try {
        setLoadingFolio(true);
        const response = await api.get('/api/config/folios?tipo=salida');
        if (response.ok) {
          const data = await response.json();
          setFolioSalida(data.proximo_folio?.toString() || '1');
        } else {
          // Si falla, usar un folio por defecto
          setFolioSalida('1');
        }
      } catch (error) {
        console.error('Error al obtener folio:', error);
        setFolioSalida('1');
      } finally {
        setLoadingFolio(false);
      }
    };

    obtenerProximoFolio();
  }, []);

  // Efecto para obtener la configuración de captura de lotes
  useEffect(() => {
    const obtenerConfiguracionLotes = async () => {
      try {
        const response = await api.get('/api/entidades/active');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setCapturarLotes(result.data.capturar_lotes_salidas || false);
          }
        }
      } catch (error) {
        console.error('Error al obtener configuración de lotes:', error);
      }
    };

    obtenerConfiguracionLotes();
  }, []);

  // Auto-focus en el primer campo después de cargar
  useEffect(() => {
    if (!loadingFolio && !loadingTipos) {
      setTimeout(() => {
        tipoSalidaRef.current?.focus();
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

  // Efecto para cargar lotes disponibles cuando se selecciona un producto
  useEffect(() => {
    const cargarLotesDisponibles = async () => {
      if (!productoSeleccionado || !capturarLotes) {
        setLotesDisponibles([]);
        setLoteSeleccionado(null);
        return;
      }

      try {
        setLoadingLotes(true);
        const response = await api.get(
          `/api/lotes/disponibles?producto_id=${productoSeleccionado.id}`
        );
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setLotesDisponibles(result.data);
            // Auto-seleccionar el primer lote (FEFO)
            if (result.data.length > 0) {
              setLoteSeleccionado(result.data[0]);
            }
          }
        } else {
          console.error('Error al cargar lotes disponibles');
          setLotesDisponibles([]);
        }
      } catch (error) {
        console.error('Error al cargar lotes:', error);
        setLotesDisponibles([]);
      } finally {
        setLoadingLotes(false);
      }
    };

    cargarLotesDisponibles();
  }, [productoSeleccionado, capturarLotes]);

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

    // Mover el foco al botón agregar
    setTimeout(() => {
      botonAgregarRef.current?.focus();
    }, 50);
  };

  const handleAgregarPartida = () => {
    if (!productoSeleccionado || !cantidadInput || parseInt(cantidadInput) <= 0) {
      return;
    }

    const cantidad = parseInt(cantidadInput);

    // Si se capturan lotes, validar que haya un lote seleccionado
    if (capturarLotes && !loteSeleccionado) {
      setError('Debe seleccionar un lote');
      setTimeout(() => setError(null), 5000);
      loteInputRef.current?.focus();
      return;
    }

    // Si hay lote seleccionado, validar contra la cantidad disponible del lote
    if (capturarLotes && loteSeleccionado) {
      if (cantidad > loteSeleccionado.cantidad_disponible) {
        setError(
          `La cantidad solicitada (${cantidad}) excede la disponible en el lote (${loteSeleccionado.cantidad_disponible})`
        );
        setTimeout(() => setError(null), 5000);
        cantidadInputRef.current?.focus();
        cantidadInputRef.current?.select();
        return;
      }
    } else {
      // Si no se capturan lotes, validar contra el stock total
      if (cantidad > productoSeleccionado.cantidad) {
        setError(
          `La cantidad solicitada (${cantidad}) excede el stock disponible (${productoSeleccionado.cantidad})`
        );
        setTimeout(() => setError(null), 5000);
        cantidadInputRef.current?.focus();
        cantidadInputRef.current?.select();
        return;
      }
    }

    const nuevaPartida: PartidaSalida = {
      id: generarIdUnico(),
      producto: productoSeleccionado,
      cantidad: cantidad,
      precio: productoSeleccionado.precio,
      ...(capturarLotes &&
        loteSeleccionado && {
          lote_entrada_id: loteSeleccionado.id,
          numero_lote: loteSeleccionado.numero_lote,
          fecha_vencimiento_lote: loteSeleccionado.fecha_vencimiento,
        }),
    };

    // Agregar al principio de la lista
    setPartidas([nuevaPartida, ...partidas]);

    // Limpiar el estado para la siguiente captura
    setProductoSeleccionado(null);
    setCantidadInput('');
    setLoteSeleccionado(null);
    setLotesDisponibles([]);
    setError(null);

    // Regresar el foco al campo de cantidad para captura rápida
    setTimeout(() => {
      cantidadInputRef.current?.focus();
    }, 100);
  };

  // Handlers de teclado para navegación rápida
  const handleTipoSalidaKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();

      // Flujo dinámico según configuración del tipo de salida
      if (tipoActual?.requiere_cliente) {
        // Si requiere cliente, ir al campo cliente
        setTimeout(() => clienteInputRef.current?.focus(), 50);
      } else if (tipoActual?.requiere_referencia) {
        // Si no requiere cliente pero sí referencia, ir a referencia
        setTimeout(() => referenciaRef.current?.focus(), 50);
      } else {
        // Si no requiere ni cliente ni referencia, ir a observaciones
        setTimeout(() => observacionesRef.current?.focus(), 50);
      }
    }
  };

  const handleClienteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      // Después de cliente, ir a referencia u observaciones según configuración
      if (tipoActual?.requiere_referencia) {
        setTimeout(() => referenciaRef.current?.focus(), 50);
      } else {
        setTimeout(() => observacionesRef.current?.focus(), 50);
      }
    }
  };

  const handleReferenciaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setTimeout(() => observacionesRef.current?.focus(), 50);
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      setTimeout(() => observacionesRef.current?.focus(), 50);
    }
  };

  const handleObservacionesKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setTimeout(() => cantidadInputRef.current?.focus(), 50);
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      setTimeout(() => cantidadInputRef.current?.focus(), 50);
    }
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
      // Mover el foco al botón agregar
      setTimeout(() => {
        botonAgregarRef.current?.focus();
      }, 50);
    }
  };

  const handleActualizarPartida = (index: number, cantidad: number, precio: number) => {
    const nuevasPartidas = [...partidas];
    nuevasPartidas[index] = {
      ...nuevasPartidas[index],
      cantidad,
      precio,
    };
    setPartidas(nuevasPartidas);
  };

  const handleRemoverPartida = (index: number) => {
    setPartidas(partidas.filter((_, i) => i !== index));
  };

  const handleEnterEnPartida = () => {
    // Regresar el foco al campo de cantidad
    setTimeout(() => {
      cantidadInputRef.current?.focus();
    }, 150);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!tipoSeleccionado) {
      setError('Debe seleccionar un tipo de salida');
      return;
    }

    if (partidas.length === 0) {
      setError('Debe agregar al menos un producto');
      return;
    }

    // Validar que ninguna partida exceda el stock
    const partidasConStockInsuficiente = partidas.filter((p) => p.cantidad > p.producto.cantidad);
    if (partidasConStockInsuficiente.length > 0) {
      const productos = partidasConStockInsuficiente.map((p) => p.producto.descripcion).join(', ');
      setError(
        `Las siguientes productos exceden el stock disponible: ${productos}. Por favor, corrige las cantidades.`
      );
      return;
    }

    // Validar campos condicionales
    if (tipoActual?.requiere_cliente && !clienteSeleccionado) {
      setError('Debe seleccionar un cliente');
      return;
    }

    if (tipoActual?.requiere_referencia && !referenciaExterna.trim()) {
      setError('Debe ingresar una referencia/folio externo');
      return;
    }

    // ✅ REVALIDAR FOLIO: Obtener el folio actual justo antes del modal
    let folioActualizado = folioSalida;
    try {
      setLoadingFolio(true);
      const response = await api.get('/api/config/folios?tipo=salida');
      if (response.ok) {
        const data = await response.json();
        const nuevoFolio = data.proximo_folio?.toString() || folioSalida;

        if (nuevoFolio !== folioSalida) {
          console.log(`📊 [REVALIDACIÓN] Folio actualizado: ${folioSalida} → ${nuevoFolio}`);
          folioActualizado = nuevoFolio;
          setFolioSalida(nuevoFolio);
        } else {
          console.log(`✅ [REVALIDACIÓN] Folio vigente: ${folioSalida}`);
        }
      }
    } catch (error) {
      console.error('⚠️ Error revalidando folio, usando valor actual:', error);
      // Continuar con el folio actual si falla la revalidación
    } finally {
      setLoadingFolio(false);
    }

    // Determinar la fecha a enviar
    const fechaActual = obtenerFechaLocal();
    const usuarioModificoFecha = fechaCaptura !== fechaActual;

    const fechaParaEnviar = usuarioModificoFecha
      ? fechaCaptura // Solo fecha (YYYY-MM-DD)
      : new Date().toISOString(); // Fecha y hora completa del cliente

    // Preparar los datos y mostrar confirmación (con folio actualizado)
    setDatosParaGuardar({
      tipo_salida_id: tipoSeleccionado,
      observaciones: observaciones.trim() || undefined,
      referencia_externa: tipoActual?.requiere_referencia ? referenciaExterna.trim() : undefined,
      cliente_id: tipoActual?.requiere_cliente ? clienteSeleccionado?.id : undefined,
      fecha_captura: fechaParaEnviar,
      folio: parseInt(folioActualizado) || undefined,
      partidas: partidas.map((p) => ({
        producto_id: p.producto.id,
        cantidad: p.cantidad,
        precio: p.precio,
        ...(p.lote_entrada_id && {
          lote_entrada_id: p.lote_entrada_id,
          numero_lote: p.numero_lote,
          // Aceptar fecha como Date o string; normalizar a YYYY-MM-DD
          fecha_vencimiento_lote: p.fecha_vencimiento_lote
            ? typeof p.fecha_vencimiento_lote === 'string'
              ? String(p.fecha_vencimiento_lote).split('T')[0]
              : p.fecha_vencimiento_lote.toISOString().split('T')[0]
            : undefined,
        }),
      })),
    });

    setMostrarConfirmacion(true);
  };

  const handleConfirmarGuardado = async () => {
    if (!datosParaGuardar) return;

    try {
      await createSalida(datosParaGuardar);

      // Cerrar modal
      setMostrarConfirmacion(false);

      // Redirigir solo si no hubo error (el hook useSalidas ya maneja la redirección)
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Cargando tipos de salida...</div>
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
            aria-label="Volver a la lista de salidas"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Salida de Inventario</h1>
        </div>
      </div>

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          // SIEMPRE prevenir Enter excepto en textareas
          if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="space-y-6"
      >
        {/* Error general */}
        {(error || errorSalida) && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{error || errorSalida}</div>
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

                    {clienteSeleccionado && (
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">Cliente:</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs font-medium max-w-32 truncate">
                          {clienteSeleccionado.nombre}
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
                {/* Folio y Fecha - Folio a la izquierda, Fecha a la derecha */}
                <div className="flex justify-between gap-4 mb-4">
                  {/* Folio */}
                  <div className="w-full md:w-32">
                    <label htmlFor="folio" className="block text-sm font-medium text-gray-700 mb-2">
                      Folio *
                    </label>
                    <input
                      type="number"
                      id="folio"
                      value={folioSalida}
                      onChange={(e) => setFolioSalida(e.target.value)}
                      min="1"
                      disabled={loadingFolio}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder={loadingFolio ? 'Cargando...' : '1'}
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
                  {/* Tipo de Salida */}
                  <div className="col-span-full">
                    <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Salida *{' '}
                      <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                        Enter ↵
                      </kbd>
                    </label>
                    <select
                      id="tipo"
                      ref={tipoSalidaRef}
                      value={tipoSeleccionado}
                      onChange={(e) => {
                        setTipoSeleccionado(e.target.value);
                        // Limpiar campos condicionales al cambiar tipo
                        setClienteSeleccionado(null);
                        setReferenciaExterna('');
                      }}
                      onKeyDown={handleTipoSalidaKeyDown}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    >
                      <option value="">Seleccione un tipo de salida</option>
                      {tipos.map((tipo) => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Campo de Cliente (condicional) */}
                  {tipoActual?.requiere_cliente && (
                    <div className="col-span-full">
                      <label
                        htmlFor="cliente"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Cliente *{' '}
                        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                          Enter ↵
                        </kbd>
                        <span className="text-xs text-gray-500 ml-2">
                          (Requerido para {tipoActual.nombre})
                        </span>
                      </label>
                      <SelectorCliente
                        ref={clienteInputRef}
                        value={clienteSeleccionado}
                        onSelect={(cliente) => setClienteSeleccionado(cliente)}
                        onKeyDown={handleClienteKeyDown}
                      />
                    </div>
                  )}

                  {/* Campo de Referencia Externa (condicional) */}
                  {tipoActual?.requiere_referencia && (
                    <div className="col-span-full">
                      <label
                        htmlFor="referencia"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Referencia/Folio Externo *{' '}
                        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                          Enter ↵
                        </kbd>
                        <span className="text-xs text-gray-500 ml-2">
                          (Número de orden, folio, etc.)
                        </span>
                      </label>
                      <input
                        type="text"
                        id="referencia"
                        ref={referenciaRef}
                        value={referenciaExterna}
                        onChange={(e) => setReferenciaExterna(e.target.value)}
                        onKeyDown={handleReferenciaKeyDown}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Ej: ORD-2024-001, FAC-123"
                        required
                        maxLength={100}
                      />
                    </div>
                  )}

                  {/* Observaciones */}
                  <div className="col-span-full">
                    <label
                      htmlFor="observaciones"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Observaciones{' '}
                      <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                        Enter ↵
                      </kbd>
                    </label>
                    <textarea
                      id="observaciones"
                      ref={observacionesRef}
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      onKeyDown={handleObservacionesKeyDown}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Información adicional sobre esta salida..."
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Botones de acción */}
        {infoGeneralCompleta() && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Información general completada.</span>
                <span className="text-gray-500 ml-1">
                  Ahora puedes agregar productos y guardar la salida.
                </span>
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
                    'Guardar Salida'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Productos */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Productos</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad{' '}
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
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
                    validarStock={true}
                    productoSeleccionado={productoSeleccionado}
                    mostrarProductoSeleccionado={false}
                  />
                </div>
              </div>

              {/* Selector de Lote (si está habilitado) */}
              {capturarLotes && productoSeleccionado && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Lote{' '}
                    {loadingLotes && <span className="text-xs text-gray-500">(cargando...)</span>}
                  </label>
                  {/* Combobox simple usando input + datalist para búsqueda rápida */}
                  <input
                    ref={loteInputRef}
                    list="lotes-list"
                    value={loteSeleccionado?.id || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Intentar encontrar por id o por numero_lote
                      let lote = lotesDisponibles.find((l) => l.id === val);
                      if (!lote) lote = lotesDisponibles.find((l) => l.numero_lote === val);
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
      </form>

      {/* Modal de Confirmación */}
      <ConfirmacionGuardado
        isOpen={mostrarConfirmacion}
        onClose={handleCancelarConfirmacion}
        onConfirm={handleConfirmarGuardado}
        title="Confirmar Nueva Salida"
        mensaje="¿Está seguro de que desea guardar esta salida de inventario?"
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
