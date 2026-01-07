'use client';

import apiFetch from '@/lib/fetcher';
import {
  DocumentArrowDownIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx-js-style';

// ========================================
// INTERFACES
// ========================================

interface Cliente {
  cliente_id: string;
  nombre: string;
}

interface Categoria {
  id: string;
  nombre: string;
}

interface Producto {
  id: string;
  clave: string;
  nombre: string;
}

type TipoAgrupacion = 'cliente' | 'categoria' | 'producto';

interface Filtros {
  fechaInicio: string;
  fechaFin: string;
  clienteId: string | null;
  categoriaId: string | null;
  productoId: string | null;
  agruparPor: TipoAgrupacion;
}

interface ProductoConsolidado {
  clave: string;
  producto: string;
  unidad_medida: string;
  cantidad_total: number;
}

interface GrupoCliente {
  cliente_id: string;
  cliente_nombre: string;
  productos: ProductoConsolidado[];
  total_productos: number;
  total_unidades: number;
}

interface GrupoCategoria {
  categoria_id: string;
  categoria_nombre: string;
  productos: ProductoConsolidado[];
  total_productos: number;
  total_unidades: number;
}

interface SalidaDetalle {
  folio: string;
  fecha: string;
  cliente_nombre: string;
  cantidad: number;
}

interface GrupoProducto {
  producto_id: string;
  producto_clave: string;
  producto_nombre: string;
  categoria_nombre: string;
  unidad_medida: string;
  salidas: SalidaDetalle[];
  total_salidas: number;
  total_unidades: number;
}

type GrupoResultado = GrupoCliente | GrupoCategoria | GrupoProducto;

// NOTE: tipos Salida/Partida no son usados en este archivo y fueron removidos para evitar warnings

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

export default function ReporteSalidasCliente() {
  // Estados para catálogos
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [busquedaCategoria, setBusquedaCategoria] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');

  // Estados para controlar visibilidad de dropdowns
  const [mostrarDropdownCliente, setMostrarDropdownCliente] = useState(false);
  const [mostrarDropdownCategoria, setMostrarDropdownCategoria] = useState(false);
  const [mostrarDropdownProducto, setMostrarDropdownProducto] = useState(false);

  // Estados para filtros
  const [filtros, setFiltros] = useState<Filtros>({
    fechaInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
    clienteId: null,
    categoriaId: null,
    productoId: null,
    agruparPor: 'cliente',
  });

  // Estados de datos
  const [datosConsolidados, setDatosConsolidados] = useState<GrupoResultado[]>([]);
  const [cargando, setCargando] = useState(false);

  // ========================================
  // CARGAR CATÁLOGOS
  // ========================================

  const cargarCatalogos = useCallback(async () => {
    try {
      const [resClientes, resCategorias, resProductos] = await Promise.all([
        apiFetch('/api/reportes/catalogos?tipo=clientes'),
        apiFetch('/api/reportes/catalogos?tipo=categorias'),
        // Usar endpoint específico de reportes que no requiere INVENTARIO.LEER
        apiFetch('/api/reportes/catalogos?tipo=productos&limit=10000', undefined, 45000), // Cargar todos los productos con timeout extendido
      ]);

      if (!resClientes.ok) throw new Error('Error al cargar clientes');
      if (!resCategorias.ok) throw new Error('Error al cargar categorías');
      if (!resProductos.ok) {
        // Log detallado para facilitar diagnóstico en roles con problemas de permisos
        try {
          const text = await resProductos.text();
          console.error('[CATALOGO] Detalle error resProductos:', resProductos.status, text);
          if (resProductos.status === 403) {
            toast.error('Sin permisos para leer inventario (403). Contacta al administrador.');
          } else if (resProductos.status === 401) {
            toast.error('No autorizado. Tu sesión puede haber expirado.');
          } else {
            toast.error(`Error al cargar productos (status ${resProductos.status})`);
          }
        } catch (e) {
          console.error('[CATALOGO] Error leyendo cuerpo de resProductos:', e);
          toast.error('Error al cargar productos');
        }
        throw new Error('Error al cargar productos');
      }

      const dataClientes = await resClientes.json();
      const dataCategorias = await resCategorias.json();
      const dataProductos = await resProductos.json();

      console.log('[CATALOGO] ✅ Productos cargados:', dataProductos.data?.length || 0);

      // Nuevo formato del endpoint /api/reportes/catalogos
      setClientes(dataClientes.data || []);
      setCategorias(dataCategorias.data || []);

      // Transformar productos al formato necesario
      // NOTA: El nuevo API /api/reportes/catalogos retorna {success: true, data: [...]}
      const productosTransformados = (dataProductos.data || []).map((p: any) => ({
        id: p.id,
        clave: p.clave || 'S/C',
        nombre: p.nombre || 'Producto sin nombre',
      }));

      console.log('[CATALOGO] ✅ Productos transformados:', productosTransformados.length);

      setProductos(productosTransformados);
    } catch (error) {
      console.error('[CATALOGO] ❌ ERROR en cargarCatalogos:', error);
      toast.error('Error al cargar catálogos');
    }
  }, []);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setMostrarDropdownCliente(false);
      setMostrarDropdownCategoria(false);
      setMostrarDropdownProducto(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ========================================
  // CARGAR DATOS CONSOLIDADOS
  // ========================================

  const cargarSalidas = useCallback(async () => {
    try {
      setCargando(true);

      const params = new URLSearchParams({
        fechaInicio: filtros.fechaInicio,
        fechaFin: filtros.fechaFin,
        agruparPor: filtros.agruparPor,
        ...(filtros.clienteId && { clienteId: filtros.clienteId }),
        ...(filtros.categoriaId && { categoriaId: filtros.categoriaId }),
        ...(filtros.productoId && { productoId: filtros.productoId }),
      });

      // Esta consulta puede ser pesada; usar timeout extendido (45s) y detectar timeouts
      const response = await apiFetch(
        `/api/reportes/salidas-cliente/consolidado?${params}`,
        undefined,
        45000
      );

      if (!response.ok) {
        throw new Error('Error al cargar salidas');
      }

      const data = await response.json();
      setDatosConsolidados(data.data || []);

      if (!data.data || data.data.length === 0) {
        toast.success('Consulta completada - Sin resultados', {
          duration: 2000,
          icon: 'ℹ️',
        });
      } else {
        const tipoGrupo =
          filtros.agruparPor === 'cliente'
            ? 'clientes'
            : filtros.agruparPor === 'categoria'
              ? 'categorías'
              : 'productos';
        toast.success(`${data.data.length} ${tipoGrupo} encontrados`, {
          duration: 2000,
        });
      }
    } catch (error: any) {
      console.error('Error al cargar salidas:', error);
      // Distinción para timeouts para dar feedback al usuario
      if (error?.name === 'TimeoutError') {
        toast.error(
          'La consulta tardó demasiado y fue cancelada. Intenta nuevamente o reduce el rango de fechas.',
          { duration: 4000 }
        );
      } else {
        toast.error('Error al cargar las salidas');
      }
      setDatosConsolidados([]);
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  // Resetear datos cuando cambian los filtros
  useEffect(() => {
    setDatosConsolidados([]);
  }, [
    filtros.fechaInicio,
    filtros.fechaFin,
    filtros.clienteId,
    filtros.categoriaId,
    filtros.productoId,
    filtros.agruparPor,
  ]);

  // ========================================
  // EXPORTACIÓN A EXCEL
  // ========================================

  const exportarExcel = useCallback(() => {
    try {
      // Validar que hay datos
      if (!datosConsolidados || datosConsolidados.length === 0) {
        toast.error('No hay datos para exportar');
        return;
      }

      const wb = XLSX.utils.book_new();
      const data: any[] = [];
      const celdasNegritas: string[] = [];

      // Título del reporte
      const tituloReporte =
        filtros.agruparPor === 'cliente'
          ? 'Salidas por Cliente'
          : filtros.agruparPor === 'categoria'
            ? 'Salidas por Categoría'
            : 'Salidas por Producto (Detallado)';

      data.push([tituloReporte]);
      celdasNegritas.push('A1');

      data.push([`Período: ${filtros.fechaInicio} a ${filtros.fechaFin}`]);
      celdasNegritas.push('A2');

      data.push([]);

      let filaActual = 4;

      // Iterar por cada grupo
      datosConsolidados.forEach((grupo, index) => {
        if (index > 0) {
          data.push([]);
          filaActual++;
        }

        // Identificar tipo de grupo
        const esCliente = 'cliente_id' in grupo;
        const esCategoria = 'categoria_id' in grupo;
        const esProducto = 'producto_id' in grupo;

        // Nombre del grupo
        let grupoLabel: string;
        let grupoNombre: string;

        if (esCliente) {
          grupoLabel = 'Cliente:';
          grupoNombre = grupo.cliente_nombre;
        } else if (esCategoria) {
          grupoLabel = 'Categoría:';
          grupoNombre = grupo.categoria_nombre;
        } else if (esProducto) {
          grupoLabel = 'Producto:';
          grupoNombre = `${grupo.producto_nombre} (${grupo.producto_clave})`;
        } else {
          grupoLabel = 'Grupo:';
          grupoNombre = 'Sin identificar';
        }

        data.push([`${grupoLabel} ${grupoNombre}`]);
        celdasNegritas.push(`A${filaActual}`);
        filaActual++;

        if (esProducto) {
          // Info adicional del producto
          data.push([`Categoría: ${grupo.categoria_nombre}`]);
          filaActual++;
        }

        data.push([]);
        filaActual++;

        if (esProducto) {
          // Para productos: mostrar detalle de salidas
          data.push(['Folio', 'Fecha', 'Cliente', 'Cantidad']);
          celdasNegritas.push(
            `A${filaActual}`,
            `B${filaActual}`,
            `C${filaActual}`,
            `D${filaActual}`
          );
          filaActual++;

          grupo.salidas.forEach((salida) => {
            data.push([
              salida.folio || '',
              new Date(salida.fecha).toLocaleDateString('es-MX'),
              salida.cliente_nombre || '',
              salida.cantidad || 0,
            ]);
            filaActual++;
          });

          // Totales para producto
          data.push([]);
          filaActual++;
          data.push(['Total salidas:', grupo.total_salidas || 0]);
          celdasNegritas.push(`A${filaActual}`);
          filaActual++;
          data.push(['Total unidades:', `${grupo.total_unidades || 0} ${grupo.unidad_medida}`]);
          celdasNegritas.push(`A${filaActual}`);
          filaActual++;
        } else {
          // Para cliente/categoría: mostrar productos consolidados
          data.push(['Clave', 'Producto', 'Unidad', 'Cantidad']);
          celdasNegritas.push(
            `A${filaActual}`,
            `B${filaActual}`,
            `C${filaActual}`,
            `D${filaActual}`
          );
          filaActual++;

          grupo.productos.forEach((p) => {
            data.push([
              p.clave || '',
              p.producto || '',
              p.unidad_medida || '',
              p.cantidad_total || 0,
            ]);
            filaActual++;
          });

          // Totales para cliente/categoría
          data.push([]);
          filaActual++;
          data.push(['Total productos:', grupo.total_productos || 0]);
          celdasNegritas.push(`A${filaActual}`);
          filaActual++;
          data.push(['Total unidades:', grupo.total_unidades || 0]);
          celdasNegritas.push(`A${filaActual}`);
          filaActual++;
        }
      });

      // Pie de página
      data.push([]);
      filaActual++;
      data.push([`Generado el ${new Date().toLocaleDateString()}`]);

      // Crear hoja
      const ws = XLSX.utils.aoa_to_sheet(data);

      // Aplicar negritas
      celdasNegritas.forEach((celda) => {
        if (!ws[celda]) {
          ws[celda] = { t: 's', v: '' };
        }
        ws[celda].s = {
          font: { bold: true },
        };
      });

      // Ajustar anchos de columna
      ws['!cols'] =
        filtros.agruparPor === 'producto'
          ? [
              { wch: 15 }, // Folio
              { wch: 20 }, // Fecha
              { wch: 40 }, // Cliente
              { wch: 12 }, // Cantidad
            ]
          : [
              { wch: 15 }, // Clave
              { wch: 50 }, // Producto
              { wch: 15 }, // Unidad
              { wch: 12 }, // Cantidad
            ];

      // Agregar hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte');

      // Guardar archivo
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo =
        filtros.agruparPor === 'cliente'
          ? `Salidas_por_Cliente_${fecha}.xlsx`
          : filtros.agruparPor === 'categoria'
            ? `Salidas_por_Categoria_${fecha}.xlsx`
            : `Salidas_por_Producto_${fecha}.xlsx`;
      XLSX.writeFile(wb, nombreArchivo);

      toast.success('Reporte exportado correctamente');
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      toast.error('Error al exportar el reporte');
    }
  }, [datosConsolidados, filtros.agruparPor, filtros.fechaInicio, filtros.fechaFin]);

  // ========================================
  // EXPORTACIÓN A PDF
  // ========================================

  const exportarPDF = useCallback(() => {
    try {
      // Validar que hay datos
      if (!datosConsolidados || datosConsolidados.length === 0) {
        toast.error('No hay datos para exportar');
        return;
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;

      const tituloReporte =
        filtros.agruparPor === 'cliente'
          ? 'Salidas por Cliente'
          : filtros.agruparPor === 'categoria'
            ? 'Salidas por Categoría'
            : 'Salidas por Producto (Detallado)';

      datosConsolidados.forEach((grupo, index) => {
        if (index > 0) {
          doc.addPage();
        }

        // Título
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(tituloReporte, pageWidth / 2, margin + 5, { align: 'center' });

        // Identificar tipo de grupo
        const esCliente = 'cliente_id' in grupo;
        const esCategoria = 'categoria_id' in grupo;
        const esProducto = 'producto_id' in grupo;

        // Encabezado del grupo
        doc.setFontSize(12);
        let grupoLabel: string;
        let grupoNombre: string;

        if (esCliente) {
          grupoLabel = 'Cliente:';
          grupoNombre = grupo.cliente_nombre;
        } else if (esCategoria) {
          grupoLabel = 'Categoría:';
          grupoNombre = grupo.categoria_nombre;
        } else if (esProducto) {
          grupoLabel = 'Producto:';
          grupoNombre = `${grupo.producto_nombre} (${grupo.producto_clave})`;
        } else {
          grupoLabel = 'Grupo:';
          grupoNombre = 'Sin identificar';
        }

        doc.text(`${grupoLabel} ${grupoNombre}`, margin, margin + 15);

        // Info adicional para productos
        if (esProducto) {
          doc.setFontSize(10);
          doc.text(`Categoría: ${grupo.categoria_nombre}`, margin, margin + 21);
        }

        // Período
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const periodoY = esProducto ? margin + 26 : margin + 22;
        doc.text(`Período: ${filtros.fechaInicio} a ${filtros.fechaFin}`, margin, periodoY);

        // Preparar datos para tabla
        let tableData: any[];
        let tableHeaders: string[];
        let columnStyles: any;
        const startY = esProducto ? margin + 32 : margin + 27;

        if (esProducto) {
          // Tabla de salidas para producto
          if (!grupo.salidas || grupo.salidas.length === 0) {
            doc.setFontSize(10);
            doc.text('No hay salidas registradas', margin, startY);
            return;
          }

          tableHeaders = ['Folio', 'Fecha', 'Cliente', 'Cantidad'];
          tableData = grupo.salidas.map((s) => [
            s.folio || '',
            new Date(s.fecha).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }),
            s.cliente_nombre || '',
            (s.cantidad || 0).toFixed(2),
          ]);
          columnStyles = {
            0: { cellWidth: 25 },
            1: { cellWidth: 30 },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 25, halign: 'right' },
          };
        } else {
          // Tabla de productos para cliente/categoría
          if (!grupo.productos || grupo.productos.length === 0) {
            doc.setFontSize(10);
            doc.text('No hay productos en este grupo', margin, startY);
            return;
          }

          tableHeaders = ['Clave', 'Producto', 'Unidad', 'Cantidad'];
          tableData = grupo.productos.map((p) => [
            p.clave || '',
            p.producto || '',
            p.unidad_medida || '',
            (p.cantidad_total || 0).toFixed(2),
          ]);
          columnStyles = {
            0: { cellWidth: 25 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 20 },
            3: { cellWidth: 25, halign: 'right' },
          };
        }

        // Generar tabla
        autoTable(doc, {
          head: [tableHeaders],
          body: tableData,
          startY,
          margin: { left: margin, right: margin },
          styles: { fontSize: 8 },
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          columnStyles,
        });

        // Totales
        const finalY = (doc as any).lastAutoTable?.finalY || startY + 10;
        doc.setFont('helvetica', 'bold');

        if (esProducto) {
          doc.text(`Total salidas: ${grupo.total_salidas || 0}`, margin, finalY + 5);
          doc.text(
            `Total unidades: ${(grupo.total_unidades || 0).toFixed(2)} ${grupo.unidad_medida}`,
            margin,
            finalY + 10
          );
        } else {
          doc.text(`Total productos: ${grupo.total_productos || 0}`, margin, finalY + 5);
          doc.text(
            `Total unidades: ${(grupo.total_unidades || 0).toFixed(2)}`,
            margin,
            finalY + 10
          );
        }

        // Pie de página
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generado el ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 5, {
          align: 'center',
        });
      });

      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo =
        filtros.agruparPor === 'cliente'
          ? `Salidas_por_Cliente_${fecha}.pdf`
          : filtros.agruparPor === 'categoria'
            ? `Salidas_por_Categoria_${fecha}.pdf`
            : `Salidas_por_Producto_${fecha}.pdf`;
      doc.save(nombreArchivo);

      toast.success('PDF generado correctamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error(
        `Error al generar el PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }, [datosConsolidados, filtros.agruparPor, filtros.fechaInicio, filtros.fechaFin]);

  // ========================================
  // MANEJADORES
  // ========================================

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0],
      fechaFin: new Date().toISOString().split('T')[0],
      clienteId: null,
      categoriaId: null,
      productoId: null,
      agruparPor: 'cliente',
    });
    setBusquedaCliente('');
    setBusquedaCategoria('');
    setBusquedaProducto('');
    setDatosConsolidados([]);
  };

  // ========================================
  // FILTRADO DE CLIENTES, CATEGORÍAS Y PRODUCTOS
  // ========================================

  const clientesFiltrados = useMemo(() => {
    if (!busquedaCliente) return clientes;
    return clientes.filter((c) => c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()));
  }, [clientes, busquedaCliente]);

  const categoriasFiltradas = useMemo(() => {
    if (!busquedaCategoria) return categorias;
    return categorias.filter((c) =>
      c.nombre.toLowerCase().includes(busquedaCategoria.toLowerCase())
    );
  }, [categorias, busquedaCategoria]);

  const productosFiltrados = useMemo(() => {
    if (!busquedaProducto) return productos;

    const busqueda = busquedaProducto.toLowerCase();
    const filtrados = productos.filter((p) => {
      const nombre = (p.nombre || '').toLowerCase();
      const clave = (p.clave || '').toLowerCase();
      return nombre.includes(busqueda) || clave.includes(busqueda);
    });

    console.log('[FILTRO] ✅ Búsqueda:', busquedaProducto, '→ Encontrados:', filtrados.length);
    return filtrados;
  }, [productos, busquedaProducto]);

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporte de Salidas</h1>
          <p className="text-sm text-gray-500">
            Productos consolidados por {filtros.agruparPor === 'cliente' ? 'cliente' : 'categoría'}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportarExcel}
            disabled={datosConsolidados.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <DocumentTextIcon className="w-4 h-4" />
            <span>Excel</span>
          </button>

          <button
            onClick={exportarPDF}
            disabled={datosConsolidados.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Fecha Inicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Fecha Fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Agrupar Por */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agrupar Por</label>
            <select
              value={filtros.agruparPor}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  agruparPor: e.target.value as TipoAgrupacion,
                  clienteId: null,
                  categoriaId: null,
                  productoId: null,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="cliente">Por Cliente</option>
              <option value="categoria">Por Categoría</option>
              <option value="producto">Por Producto (Detallado)</option>
            </select>
          </div>

          {/* Cliente - Solo visible cuando agruparPor === 'cliente' */}
          {filtros.agruparPor === 'cliente' && (
            <div onClick={(e) => e.stopPropagation()}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente (Opcional)
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={busquedaCliente}
                  onChange={(e) => {
                    setBusquedaCliente(e.target.value);
                    setFiltros({ ...filtros, clienteId: null });
                    setMostrarDropdownCliente(true);
                  }}
                  onFocus={() => setMostrarDropdownCliente(true)}
                  placeholder="Buscar cliente..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {mostrarDropdownCliente && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {clientesFiltrados.slice(0, 50).map((cliente) => (
                      <button
                        key={cliente.cliente_id}
                        onClick={() => {
                          setFiltros({ ...filtros, clienteId: cliente.cliente_id });
                          setBusquedaCliente(cliente.nombre);
                          setMostrarDropdownCliente(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 transition-colors"
                      >
                        {cliente.nombre}
                      </button>
                    ))}
                    {clientesFiltrados.length === 0 && (
                      <div className="px-4 py-2 text-gray-500 text-sm">
                        No se encontraron clientes
                      </div>
                    )}
                    {!busquedaCliente && clientesFiltrados.length > 50 && (
                      <div className="px-4 py-2 text-gray-500 text-sm italic">
                        Mostrando primeros 50 clientes. Usa el buscador para encontrar más.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Categoría - Solo visible cuando agruparPor === 'categoria' */}
          {filtros.agruparPor === 'categoria' && (
            <div onClick={(e) => e.stopPropagation()}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría (Opcional)
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={busquedaCategoria}
                  onChange={(e) => {
                    setBusquedaCategoria(e.target.value);
                    setFiltros({ ...filtros, categoriaId: null });
                    setMostrarDropdownCategoria(true);
                  }}
                  onFocus={() => setMostrarDropdownCategoria(true)}
                  placeholder="Buscar categoría..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {mostrarDropdownCategoria && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {categoriasFiltradas.slice(0, 50).map((categoria) => (
                      <button
                        key={categoria.id}
                        onClick={() => {
                          setFiltros({ ...filtros, categoriaId: categoria.id });
                          setBusquedaCategoria(categoria.nombre);
                          setMostrarDropdownCategoria(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 transition-colors"
                      >
                        {categoria.nombre}
                      </button>
                    ))}
                    {categoriasFiltradas.length === 0 && (
                      <div className="px-4 py-2 text-gray-500 text-sm">
                        No se encontraron categorías
                      </div>
                    )}
                    {!busquedaCategoria && categoriasFiltradas.length > 50 && (
                      <div className="px-4 py-2 text-gray-500 text-sm italic">
                        Mostrando primeras 50 categorías. Usa el buscador para encontrar más.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Producto - Solo visible cuando agruparPor === 'producto' */}
          {filtros.agruparPor === 'producto' && (
            <div onClick={(e) => e.stopPropagation()}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Producto (Opcional)
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={busquedaProducto}
                  onChange={(e) => {
                    setBusquedaProducto(e.target.value);
                    setFiltros({ ...filtros, productoId: null });
                    setMostrarDropdownProducto(true);
                  }}
                  onFocus={() => setMostrarDropdownProducto(true)}
                  placeholder="Buscar por nombre o clave..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {mostrarDropdownProducto && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {productosFiltrados.slice(0, 50).map((producto) => (
                      <button
                        key={producto.id}
                        onClick={() => {
                          setFiltros({ ...filtros, productoId: producto.id });
                          setBusquedaProducto(`${producto.clave} - ${producto.nombre}`);
                          setMostrarDropdownProducto(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{producto.clave}</div>
                        <div className="text-sm text-gray-600">{producto.nombre}</div>
                      </button>
                    ))}
                    {productosFiltrados.length === 0 && (
                      <div className="px-4 py-2 text-gray-500 text-sm">
                        No se encontraron productos
                      </div>
                    )}
                    {!busquedaProducto && productosFiltrados.length > 50 && (
                      <div className="px-4 py-2 text-gray-500 text-sm italic">
                        Mostrando primeros 50 productos. Usa el buscador para encontrar más.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2">
          <button
            onClick={cargarSalidas}
            disabled={cargando}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
            <span>{cargando ? 'Consultando...' : 'Consultar'}</span>
          </button>

          <button
            onClick={limpiarFiltros}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Resultados */}
      {cargando && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando datos...</p>
        </div>
      )}

      {!cargando && datosConsolidados.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay datos para mostrar</h3>
          <p className="text-gray-500">
            Selecciona un rango de fechas y presiona &quot;Consultar&quot; para ver las salidas
          </p>
        </div>
      )}

      {!cargando && datosConsolidados && datosConsolidados.length > 0 && (
        <div className="space-y-6">
          {datosConsolidados.map((grupo, groupIndex) => {
            // Determinar tipo de grupo
            const esCliente = 'cliente_id' in grupo && grupo.cliente_id != null;
            const esCategoria = 'categoria_id' in grupo && grupo.categoria_id != null;
            const esProducto = 'producto_id' in grupo && grupo.producto_id != null;

            // Obtener ID y nombre del grupo
            let grupoId: string;
            let grupoNombre: string;

            if (esCliente && 'cliente_nombre' in grupo) {
              grupoId = grupo.cliente_id || `cliente-${groupIndex}`;
              grupoNombre = grupo.cliente_nombre || 'Cliente sin nombre';
            } else if (esCategoria && 'categoria_nombre' in grupo) {
              grupoId = grupo.categoria_id || `categoria-${groupIndex}`;
              grupoNombre = grupo.categoria_nombre || 'Categoría sin nombre';
            } else if (esProducto && 'producto_nombre' in grupo && 'producto_clave' in grupo) {
              grupoId = grupo.producto_id || `producto-${groupIndex}`;
              grupoNombre = `${grupo.producto_nombre || 'Producto sin nombre'} (${grupo.producto_clave || 'S/C'})`;
            } else {
              grupoId = `grupo-${groupIndex}`;
              grupoNombre = 'Sin identificar';
            }

            return (
              <div key={grupoId} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Header del Grupo */}
                <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
                  <h3 className="text-lg font-semibold text-blue-900">{grupoNombre}</h3>
                  <div className="flex gap-4 mt-1 text-sm text-blue-700">
                    {esProducto &&
                      'categoria_nombre' in grupo &&
                      'total_salidas' in grupo &&
                      'total_unidades' in grupo &&
                      'unidad_medida' in grupo && (
                        <>
                          <span>Categoría: {grupo.categoria_nombre || 'Sin categoría'}</span>
                          <span>Salidas: {grupo.total_salidas || 0}</span>
                          <span>
                            Total Unidades: {(grupo.total_unidades || 0).toFixed(2)}{' '}
                            {grupo.unidad_medida || 'UND'}
                          </span>
                        </>
                      )}
                    {!esProducto && 'total_productos' in grupo && 'total_unidades' in grupo && (
                      <>
                        <span>Productos: {grupo.total_productos || 0}</span>
                        <span>Total Unidades: {(grupo.total_unidades || 0).toFixed(2)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Tabla de Productos o Salidas */}
                <div className="overflow-x-auto">
                  {esProducto && 'salidas' in grupo ? (
                    // Vista detallada para agrupación por producto
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Folio
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cliente
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cantidad
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {grupo.salidas && grupo.salidas.length > 0 ? (
                          grupo.salidas.map((salida, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {salida.folio || 'S/F'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(salida.fecha).toLocaleDateString('es-MX', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {salida.cliente_nombre || 'Sin cliente'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                                {(salida.cantidad || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                              No hay salidas registradas
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : 'productos' in grupo ? (
                    // Vista consolidada para cliente/categoría
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Clave
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unidad
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cantidad Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {grupo.productos && grupo.productos.length > 0 ? (
                          grupo.productos.map((producto, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {producto.clave || 'S/C'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {producto.producto || 'Sin nombre'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {producto.unidad_medida || 'UND'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                                {(producto.cantidad_total || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                              No hay productos en este grupo
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
