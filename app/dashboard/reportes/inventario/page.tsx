'use client';

import { api } from '@/lib/fetcher';
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  PrinterIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface Producto {
  id: string;
  clave: string | null;
  clave2: string | null;
  descripcion: string;
  categoria: string;
  categoria_id: string | null;
  cantidad: number;
  precio: number;
  estado: string;
  punto_reorden: number;
  cantidad_minima: number;
  categorias?: {
    id: string;
    nombre: string;
  } | null;
}

interface Categoria {
  id: string;
  nombre: string;
  activo: boolean;
}

interface Filtros {
  categoria_id: string;
  estado: string;
  busqueda: string;
}

interface Paginacion {
  paginaActual: number;
  productosPorPagina: number;
}

export default function ReporteCategoriasStock() {
  const { data: _session } = useSession();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFiltros, setMostrarFiltros] = useState(true);

  const [filtros, setFiltros] = useState<Filtros>({
    categoria_id: '',
    estado: '',
    busqueda: '',
  });

  const [paginacion, setPaginacion] = useState<Paginacion>({
    paginaActual: 1,
    productosPorPagina: 10,
  });

  // Cargar datos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);

        // Cargar productos
        const resProductos = await api.get('/api/inventario?limit=10000');
        if (resProductos.ok) {
          const data = await resProductos.json();
          setProductos(data.inventarios || []);
        }

        // Cargar categorías
        const resCategorias = await api.get('/api/categorias');
        if (resCategorias.ok) {
          const data = await resCategorias.json();
          setCategorias(data.data || []);
        }
      } catch (error) {
        toast.error('Error al cargar los datos');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Filtrar productos
  const productosFiltrados = useMemo(() => {
    return productos.filter((producto) => {
      // 🔧 Excluir productos desactivados (DESCONTINUADO)
      if (
        producto.estado === 'DESCONTINUADO' ||
        producto.estado === 'descontinuado'
      ) {
        return false;
      }

      // Filtro por categoría
      if (filtros.categoria_id && producto.categoria_id !== filtros.categoria_id) {
        return false;
      }

      // Filtro por estado de stock
      if (filtros.estado) {
        if (filtros.estado === 'agotado' && producto.cantidad > 0) {
          return false;
        }
        if (filtros.estado === 'por_agotar') {
          const porAgotar =
            producto.cantidad > 0 &&
            producto.cantidad <= (producto.punto_reorden || producto.cantidad_minima || 0);
          if (!porAgotar) return false;
        }
        if (filtros.estado === 'disponible' && producto.cantidad <= 0) {
          return false;
        }
      }

      // Filtro por búsqueda
      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        return (
          producto.descripcion?.toLowerCase().includes(busqueda) ||
          producto.clave?.toLowerCase().includes(busqueda) ||
          producto.clave2?.toLowerCase().includes(busqueda) ||
          producto.categoria?.toLowerCase().includes(busqueda)
        );
      }

      return true;
    });
  }, [productos, filtros]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const total = productosFiltrados.length;
    const agotados = productosFiltrados.filter((p) => p.cantidad <= 0).length;
    const porAgotar = productosFiltrados.filter(
      (p) => p.cantidad > 0 && p.cantidad <= (p.punto_reorden || p.cantidad_minima || 0)
    ).length;
    const disponibles = total - agotados - porAgotar;

    return { total, agotados, porAgotar, disponibles };
  }, [productosFiltrados]);

  // Exportar a Excel
  const exportarExcel = () => {
    try {
      const datos = productosFiltrados.map((p) => ({
        Clave: p.clave || p.clave2 || 'S/C',
        Descripción: p.descripcion,
        Categoría: p.categorias?.nombre || p.categoria,
        Cantidad: p.cantidad,
        Estado:
          p.cantidad <= 0
            ? 'Agotado'
            : p.cantidad <= (p.punto_reorden || p.cantidad_minima || 0)
              ? 'Por Agotar'
              : 'Disponible',
      }));

      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 12 }, // Clave
        { wch: 50 }, // Descripción
        { wch: 20 }, // Categoría
        { wch: 10 }, // Cantidad
        { wch: 12 }, // Estado
      ];
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `Reporte_Inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Reporte exportado exitosamente');
    } catch (error) {
      toast.error('Error al exportar el reporte');
      console.error(error);
    }
  };

  // Exportar a PDF
  const exportarPDF = () => {
    try {
      const doc = new jsPDF('landscape');

      // Título
      doc.setFontSize(16);
      doc.text('Reporte de Inventario', 14, 15);

      // Fecha
      doc.setFontSize(10);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 14, 22);

      // Estadísticas
      doc.text(
        `Total productos: ${estadisticas.total} | Disponibles: ${estadisticas.disponibles} | Por agotar: ${estadisticas.porAgotar} | Agotados: ${estadisticas.agotados}`,
        14,
        28
      );

      // Tabla
      const datos = productosFiltrados.map((p) => [
        p.clave || p.clave2 || 'S/C',
        p.descripcion.substring(0, 40) + (p.descripcion.length > 40 ? '...' : ''),
        (p.categorias?.nombre || p.categoria || '').substring(0, 20),
        p.cantidad,
        p.cantidad <= 0
          ? '🔴 Agotado'
          : p.cantidad <= (p.punto_reorden || p.cantidad_minima || 0)
            ? '🟡 Por Agotar'
            : '🟢 Disponible',
      ]);

      autoTable(doc, {
        head: [['Clave', 'Descripción', 'Categoría', 'Cant.', 'Estado']],
        body: datos,
        startY: 32,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          3: { halign: 'right' },
        },
      });

      doc.save(`Reporte_Inventario_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF generado exitosamente');
    } catch (error) {
      toast.error('Error al generar PDF');
      console.error(error);
    }
  };

  // Imprimir
  const imprimir = () => {
    window.print();
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      categoria_id: '',
      estado: '',
      busqueda: '',
    });
    setPaginacion({ ...paginacion, paginaActual: 1 });
  };

  // Cambiar página
  const cambiarPagina = (nuevaPagina: number) => {
    console.log('📄 Cambiando a página:', nuevaPagina);
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginacion({ ...paginacion, paginaActual: nuevaPagina });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Cambiar productos por página
  const cambiarProductosPorPagina = (cantidad: number) => {
    console.log('📊 Cambiando productos por página:', cantidad);
    setPaginacion({ paginaActual: 1, productosPorPagina: cantidad });
  };

  // Calcular paginación
  const totalProductos = productosFiltrados.length;
  const totalPaginas = Math.ceil(totalProductos / paginacion.productosPorPagina);
  const indiceInicio = (paginacion.paginaActual - 1) * paginacion.productosPorPagina;
  const indiceFin = indiceInicio + paginacion.productosPorPagina;
  const productosPaginados = productosFiltrados.slice(indiceInicio, indiceFin);

  // Debug log
  useEffect(() => {
    console.log('🔍 Estado de paginación:', {
      totalProductos,
      totalPaginas,
      paginaActual: paginacion.paginaActual,
      productosPorPagina: paginacion.productosPorPagina,
      indiceInicio,
      indiceFin,
      productosMostrados: productosPaginados.length,
    });
  }, [
    totalProductos,
    totalPaginas,
    paginacion.paginaActual,
    paginacion.productosPorPagina,
    indiceInicio,
    indiceFin,
    productosPaginados.length,
  ]);

  // Resetear a página 1 cuando cambien los filtros
  useEffect(() => {
    setPaginacion((prev) => ({ ...prev, paginaActual: 1 }));
  }, [filtros]);

  const hayFiltrosActivos = filtros.categoria_id || filtros.estado || filtros.busqueda;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ChartBarIcon className="w-7 h-7 text-blue-600" />
              Reporte de Categorías y Stock
            </h1>
            <p className="text-gray-600 mt-1">
              Productos filtrados por categoría (FCB/DCB) y estado de inventario
            </p>
            {hayFiltrosActivos && (
              <p className="text-sm text-blue-600 mt-1">
                📋 Filtros activos - Mostrando {productosFiltrados.length} de {productos.length}{' '}
                productos
                {totalPaginas > 1 && ` (Página ${paginacion.paginaActual} de ${totalPaginas})`}
              </p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <FunnelIcon className="w-5 h-5" />
              {mostrarFiltros ? 'Ocultar' : 'Mostrar'} Filtros
            </button>

            <button
              onClick={exportarExcel}
              disabled={productosFiltrados.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              Excel
            </button>

            <button
              onClick={exportarPDF}
              disabled={productosFiltrados.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              PDF
            </button>

            <button
              onClick={imprimir}
              disabled={productosFiltrados.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
            >
              <PrinterIcon className="w-5 h-5" />
              Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* Panel de Filtros */}
      {mostrarFiltros && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
            {hayFiltrosActivos && (
              <button
                onClick={limpiarFiltros}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
              >
                <XMarkIcon className="w-4 h-4" />
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por Categoría */}
            <div>
              <label
                htmlFor="filtro-categoria"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Categoría
              </label>
              <select
                id="filtro-categoria"
                name="filtro-categoria"
                value={filtros.categoria_id}
                onChange={(e) => setFiltros({ ...filtros, categoria_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las categorías</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Estado */}
            <div>
              <label
                htmlFor="filtro-estado"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Estado de Stock
              </label>
              <select
                id="filtro-estado"
                name="filtro-estado"
                value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="agotado">🔴 Agotados</option>
                <option value="por_agotar">🟡 Por Agotarse</option>
                <option value="disponible">🟢 Disponibles</option>
              </select>
            </div>

            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Búsqueda</label>
              <input
                type="text"
                value={filtros.busqueda}
                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                placeholder="Clave, descripción..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium">Total Productos</div>
          <div className="text-2xl font-bold text-blue-900">{estadisticas.total}</div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium">Disponibles</div>
          <div className="text-2xl font-bold text-green-900">{estadisticas.disponibles}</div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-600 font-medium">Por Agotarse</div>
          <div className="text-2xl font-bold text-yellow-900">{estadisticas.porAgotar}</div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-600 font-medium">Agotados</div>
          <div className="text-2xl font-bold text-red-900">{estadisticas.agotados}</div>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Controles de paginación superior */}
        <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <label htmlFor="productos-por-pagina" className="text-sm text-gray-700">
              Mostrar:
            </label>
            <select
              id="productos-por-pagina"
              name="productos-por-pagina"
              value={paginacion.productosPorPagina}
              onChange={(e) => cambiarProductosPorPagina(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-700">productos por página</span>
          </div>

          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{indiceInicio + 1}</span> a{' '}
            <span className="font-medium">{Math.min(indiceFin, totalProductos)}</span> de{' '}
            <span className="font-medium">{totalProductos}</span> productos
          </div>
        </div>

        {productosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No se encontraron productos</p>
            <p className="text-sm mt-1">Intenta ajustar los filtros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Clave
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {productosPaginados.map((producto) => {
                  const estaAgotado = producto.cantidad <= 0;
                  const porAgotar =
                    producto.cantidad > 0 &&
                    producto.cantidad <= (producto.punto_reorden || producto.cantidad_minima || 0);

                  return (
                    <tr key={producto.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {producto.clave || producto.clave2 || 'S/C'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{producto.descripcion}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            producto.categoria === 'FCB'
                              ? 'bg-blue-100 text-blue-800'
                              : producto.categoria === 'DCB'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {producto.categorias?.nombre || producto.categoria}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-medium ${
                          estaAgotado
                            ? 'text-red-600'
                            : porAgotar
                              ? 'text-yellow-600'
                              : 'text-gray-900'
                        }`}
                      >
                        {producto.cantidad}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            estaAgotado
                              ? 'bg-red-100 text-red-800'
                              : porAgotar
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {estaAgotado
                            ? '🔴 Agotado'
                            : porAgotar
                              ? '🟡 Por Agotar'
                              : '🟢 Disponible'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación inferior */}
        {totalPaginas > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-50">
            <div className="text-sm text-gray-700">
              Página <span className="font-medium">{paginacion.paginaActual}</span> de{' '}
              <span className="font-medium">{totalPaginas}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => cambiarPagina(1)}
                disabled={paginacion.paginaActual === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Primera página"
              >
                «
              </button>
              <button
                type="button"
                onClick={() => cambiarPagina(paginacion.paginaActual - 1)}
                disabled={paginacion.paginaActual === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Página anterior"
              >
                ‹ Anterior
              </button>

              {/* Números de página */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let numeroPagina: number;

                  if (totalPaginas <= 5) {
                    numeroPagina = i + 1;
                  } else if (paginacion.paginaActual <= 3) {
                    numeroPagina = i + 1;
                  } else if (paginacion.paginaActual >= totalPaginas - 2) {
                    numeroPagina = totalPaginas - 4 + i;
                  } else {
                    numeroPagina = paginacion.paginaActual - 2 + i;
                  }

                  return (
                    <button
                      key={numeroPagina}
                      type="button"
                      onClick={() => cambiarPagina(numeroPagina)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        paginacion.paginaActual === numeroPagina
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                      aria-label={`Página ${numeroPagina}`}
                      aria-current={paginacion.paginaActual === numeroPagina ? 'page' : undefined}
                    >
                      {numeroPagina}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => cambiarPagina(paginacion.paginaActual + 1)}
                disabled={paginacion.paginaActual === totalPaginas}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Página siguiente"
              >
                Siguiente ›
              </button>
              <button
                type="button"
                onClick={() => cambiarPagina(totalPaginas)}
                disabled={paginacion.paginaActual === totalPaginas}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Última página"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Estilos para impresión */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .p-6,
          .p-6 * {
            visibility: visible;
          }
          .p-6 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          button {
            display: none !important;
          }
          .bg-gray-50 {
            background-color: #f9fafb !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
