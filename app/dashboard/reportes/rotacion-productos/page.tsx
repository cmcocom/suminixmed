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

interface Categoria {
  id: string;
  nombre: string;
}

interface Producto {
  id: string;
  clave: string;
  nombre: string;
}

interface Filtros {
  fechaInicio: string;
  fechaFin: string;
  categoriaId: string | null;
  productoId: string | null;
}

interface ProductoRotacion {
  id: string;
  clave: string;
  descripcion: string;
  entradas: number;
  salidas: number;
  existencias: number;
  rotacion: string;
}

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

export default function ReporteRotacionProductos() {
  // Estados para catálogos
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busquedaCategoria, setBusquedaCategoria] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');

  // Estados para controlar visibilidad de dropdowns
  const [mostrarDropdownCategoria, setMostrarDropdownCategoria] = useState(false);
  const [mostrarDropdownProducto, setMostrarDropdownProducto] = useState(false);

  // Estados para filtros
  const [filtros, setFiltros] = useState<Filtros>({
    fechaInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
    categoriaId: null,
    productoId: null,
  });

  // Estados de datos
  const [datosRotacion, setDatosRotacion] = useState<ProductoRotacion[]>([]);
  const [cargando, setCargando] = useState(false);

  // ========================================
  // CARGAR CATÁLOGOS
  // ========================================

  const cargarCatalogos = useCallback(async () => {
    try {
      const [resCategorias, resProductos] = await Promise.all([
        apiFetch('/api/reportes/catalogos?tipo=categorias'),
        apiFetch('/api/reportes/catalogos?tipo=productos&limit=10000', undefined, 45000),
      ]);

      if (!resCategorias.ok) throw new Error('Error al cargar categorías');
      if (!resProductos.ok) throw new Error('Error al cargar productos');

      const dataCategorias = await resCategorias.json();
      const dataProductos = await resProductos.json();

      setCategorias(dataCategorias.data || []);

      const productosTransformados = (dataProductos.data || []).map((p: any) => ({
        id: p.id,
        clave: p.clave || 'S/C',
        nombre: p.nombre || 'Producto sin nombre',
      }));

      setProductos(productosTransformados);
    } catch (error) {
      console.error('[ROTACION] Error al cargar catálogos:', error);
      toast.error('Error al cargar catálogos');
    }
  }, []);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setMostrarDropdownCategoria(false);
      setMostrarDropdownProducto(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ========================================
  // FILTRADO DE DROPDOWNS
  // ========================================

  const categoriasFiltradas = useMemo(() => {
    if (!busquedaCategoria) return categorias.slice(0, 50);
    return categorias
      .filter((cat) => cat.nombre.toLowerCase().includes(busquedaCategoria.toLowerCase()))
      .slice(0, 50);
  }, [categorias, busquedaCategoria]);

  // ========================================
  // FILTRADO DE DROPDOWNS
  // ========================================

  const productosFiltrados = useMemo(() => {
    if (!busquedaProducto) return productos.slice(0, 50);
    return productos
      .filter(
        (prod) =>
          prod.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
          prod.clave.toLowerCase().includes(busquedaProducto.toLowerCase())
      )
      .slice(0, 50);
  }, [productos, busquedaProducto]);

  // ========================================
  // CARGAR DATOS DEL REPORTE
  // ========================================

  const cargarDatos = useCallback(async () => {
    if (!filtros.fechaInicio || !filtros.fechaFin) {
      toast.error('Debes seleccionar fechas de inicio y fin');
      return;
    }

    setCargando(true);
    try {
      const params = new URLSearchParams({
        fechaInicio: filtros.fechaInicio,
        fechaFin: filtros.fechaFin,
      });

      if (filtros.categoriaId) params.append('categoriaId', filtros.categoriaId);
      if (filtros.productoId) params.append('productoId', filtros.productoId);

      const response = await apiFetch(`/api/reportes/rotacion-productos?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar datos');
      }

      const data = await response.json();
      setDatosRotacion(data.data || []);

      toast.success(`${data.data?.length || 0} productos cargados`);
    } catch (error: any) {
      console.error('[ROTACION] Error al cargar datos:', error);
      toast.error(error.message || 'Error al cargar datos del reporte');
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  // ========================================
  // EXPORTAR A EXCEL
  // ========================================

  const exportarExcel = useCallback(() => {
    try {
      if (datosRotacion.length === 0) {
        toast.error('No hay datos para exportar');
        return;
      }

      // Calcular totales
      const totalEntradas = datosRotacion.reduce((sum, prod) => sum + prod.entradas, 0);
      const totalSalidas = datosRotacion.reduce((sum, prod) => sum + prod.salidas, 0);
      const totalExistencias = datosRotacion.reduce((sum, prod) => sum + prod.existencias, 0);

      const wb = XLSX.utils.book_new();
      const data: any[] = [];
      const celdasNegritas: string[] = [];

      // Título del reporte
      data.push(['Reporte de Rotación de Productos']);
      celdasNegritas.push('A1');

      data.push([`Período: ${filtros.fechaInicio} a ${filtros.fechaFin}`]);
      celdasNegritas.push('A2');

      data.push([]);
      data.push([]); // Espacio adicional

      // Encabezados de columna
      data.push(['Clave', 'Descripción', 'Entradas', 'Salidas', 'Existencias']);
      celdasNegritas.push('A5', 'B5', 'C5', 'D5', 'E5');

      // Datos de productos
      datosRotacion.forEach((prod) => {
        data.push([prod.clave, prod.descripcion, prod.entradas, prod.salidas, prod.existencias]);
      });

      // Fila de totales
      const filaTotal = 6 + datosRotacion.length;
      data.push([]);
      data.push(['TOTALES', '', totalEntradas, totalSalidas, totalExistencias]);
      celdasNegritas.push(`A${filaTotal}`);

      // Pie de página
      data.push([]);
      data.push([
        `Generado el ${new Date().toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
      ]);

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

      // Merge del título
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Título
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Período
      ];

      // Ancho de columnas
      ws['!cols'] = [
        { wch: 15 }, // Clave
        { wch: 50 }, // Descripción
        { wch: 15 }, // Entradas
        { wch: 15 }, // Salidas
        { wch: 15 }, // Existencias
      ];

      // Agregar hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Rotación de Productos');

      // Guardar archivo
      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Rotacion_Productos_${fecha}.xlsx`);

      toast.success('Archivo Excel generado exitosamente');
    } catch (error) {
      console.error('[ROTACION] Error al exportar Excel:', error);
      toast.error('Error al generar archivo Excel');
    }
  }, [datosRotacion, filtros]);

  // ========================================
  // EXPORTAR A PDF
  // ========================================

  const exportarPDF = useCallback(() => {
    try {
      if (datosRotacion.length === 0) {
        toast.error('No hay datos para exportar');
        return;
      }

      // Calcular totales
      const totalEntradas = datosRotacion.reduce((sum, prod) => sum + prod.entradas, 0);
      const totalSalidas = datosRotacion.reduce((sum, prod) => sum + prod.salidas, 0);
      const totalExistencias = datosRotacion.reduce((sum, prod) => sum + prod.existencias, 0);

      const doc = new jsPDF('landscape');

      // Título
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Reporte de Rotación de Productos', 14, 20);

      // Subtítulo con fechas
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Período: ${filtros.fechaInicio} a ${filtros.fechaFin}`, 14, 28);

      // Preparar datos para la tabla
      const tableData = datosRotacion.map((prod) => [
        prod.clave,
        prod.descripcion,
        prod.entradas.toLocaleString(),
        prod.salidas.toLocaleString(),
        prod.existencias.toLocaleString(),
      ]);

      // Generar tabla principal
      autoTable(doc, {
        startY: 35,
        head: [['Clave', 'Descripción', 'Entradas', 'Salidas', 'Existencias']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [68, 114, 196],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 10,
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 25 }, // Clave
          1: { halign: 'left', cellWidth: 80 }, // Descripción
          2: { halign: 'right', cellWidth: 25 }, // Entradas
          3: { halign: 'right', cellWidth: 25 }, // Salidas
          4: { halign: 'right', cellWidth: 25 }, // Existencias
        },
      });

      // Obtener posición Y final de la tabla
      const finalY = (doc as any).lastAutoTable.finalY || 35;

      // Agregar tabla de totales
      autoTable(doc, {
        startY: finalY,
        head: [
          [
            '',
            'TOTALES',
            totalEntradas.toLocaleString(),
            totalSalidas.toLocaleString(),
            totalExistencias.toLocaleString(),
          ],
        ],
        body: [],
        theme: 'grid',
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: 0,
          fontStyle: 'bold',
          fontSize: 10,
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { halign: 'left', cellWidth: 80 },
          2: { halign: 'right', cellWidth: 25 },
          3: { halign: 'right', cellWidth: 25 },
          4: { halign: 'right', cellWidth: 25 },
        },
        margin: { left: 14 },
      });

      // Pie de página
      const finalYTotal = (doc as any).lastAutoTable.finalY || finalY;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        14,
        finalYTotal + 10
      );

      // Guardar PDF
      const fecha = new Date().toISOString().split('T')[0];
      doc.save(`Rotacion_Productos_${fecha}.pdf`);
      toast.success('Archivo PDF generado exitosamente');
    } catch (error) {
      console.error('[ROTACION] Error al exportar PDF:', error);
      toast.error('Error al generar archivo PDF');
    }
  }, [datosRotacion, filtros]);

  // ========================================
  // CALCULAR TOTALES
  // ========================================

  const totales = useMemo(() => {
    return datosRotacion.reduce(
      (acc, prod) => ({
        entradas: acc.entradas + prod.entradas,
        salidas: acc.salidas + prod.salidas,
        existencias: acc.existencias + prod.existencias,
      }),
      { entradas: 0, salidas: 0, existencias: 0 }
    );
  }, [datosRotacion]);

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rotación de Productos</h1>
          <p className="text-sm text-gray-500">
            Análisis de entradas, salidas y existencias por producto
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportarExcel}
            disabled={datosRotacion.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <DocumentTextIcon className="w-4 h-4" />
            <span>Excel</span>
          </button>

          <button
            onClick={exportarPDF}
            disabled={datosRotacion.length === 0}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por Categoría */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría (Opcional)
            </label>
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={busquedaCategoria}
                  onChange={(e) => {
                    setBusquedaCategoria(e.target.value);
                    setMostrarDropdownCategoria(true);
                  }}
                  onFocus={() => setMostrarDropdownCategoria(true)}
                  placeholder="Buscar categoría..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {filtros.categoriaId && (
                  <button
                    onClick={() => {
                      setFiltros({ ...filtros, categoriaId: null });
                      setBusquedaCategoria('');
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {/* Dropdown Categorías */}
              {mostrarDropdownCategoria && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {categoriasFiltradas.map((categoria) => (
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
                </div>
              )}
            </div>
          </div>

          {/* Filtro por Producto */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Producto (Opcional)
            </label>
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={busquedaProducto}
                  onChange={(e) => {
                    setBusquedaProducto(e.target.value);
                    setMostrarDropdownProducto(true);
                  }}
                  onFocus={() => setMostrarDropdownProducto(true)}
                  placeholder="Buscar producto..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {filtros.productoId && (
                  <button
                    onClick={() => {
                      setFiltros({ ...filtros, productoId: null });
                      setBusquedaProducto('');
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {/* Dropdown Productos */}
              {mostrarDropdownProducto && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {productosFiltrados.map((producto) => (
                    <button
                      key={producto.id}
                      onClick={() => {
                        setFiltros({ ...filtros, productoId: producto.id });
                        setBusquedaProducto(`${producto.clave} - ${producto.nombre}`);
                        setMostrarDropdownProducto(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 transition-colors"
                    >
                      <div className="font-medium">{producto.clave}</div>
                      <div className="text-sm text-gray-600">{producto.nombre}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botón de acción */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={cargarDatos}
            disabled={cargando}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            {cargando ? 'Cargando...' : 'Consultar'}
          </button>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clave
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entradas
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salidas
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Existencias
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cargando ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      Cargando datos...
                    </div>
                  </td>
                </tr>
              ) : datosRotacion.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No hay datos disponibles. Ajusta los filtros y presiona Consultar.
                  </td>
                </tr>
              ) : (
                <>
                  {datosRotacion.map((producto, index) => (
                    <tr key={`${producto.id}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {producto.clave}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{producto.descripcion}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {producto.entradas.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {producto.salidas.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {producto.existencias.toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {/* Fila de Totales */}
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan={2} className="px-6 py-4 text-sm text-gray-900">
                      TOTALES
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {totales.entradas.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {totales.salidas.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {totales.existencias.toLocaleString()}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer con información */}
        {datosRotacion.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Total de productos: <span className="font-semibold">{datosRotacion.length}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
