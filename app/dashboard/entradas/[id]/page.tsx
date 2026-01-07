'use client';

import { use, useEffect, useState } from 'react';
import { api } from '@/lib/fetcher';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface PartidaDetalle {
  id: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  orden: number;
  Inventario: {
    id: string;
    clave: string | null;
    clave2: string | null;
    descripcion: string;
    precio: number;
  };
}

interface EntradaDetalle {
  id: string;
  motivo: string;
  observaciones: string;
  total: number;
  estado: string;
  fecha_creacion: string;
  referencia_externa: string | null;
  serie: string;
  folio: number | null;
  User: {
    id: string;
    name: string;
    email: string;
  };
  tipo_entrada_rel: {
    id: string;
    codigo: string;
    nombre: string;
    descripcion: string | null;
    color: string | null;
    icono: string | null;
  } | null;
  proveedor: {
    id: string;
    nombre: string;
    razon_social: string | null;
    rfc: string | null;
    telefono: string | null;
    email: string | null;
    direccion: string | null;
  } | null;
  partidas_entrada_inventario: PartidaDetalle[];
}

// Función para generar PDF de la entrada
const generateEntradaPDF = (entrada: EntradaDetalle) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    let currentY = 20;

    // Encabezado del documento
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('VALE DE ENTRADA DE INVENTARIO', 105, currentY, { align: 'center' });
    currentY += 15;

    // Información principal en dos columnas
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    // Columna izquierda
    doc.text('FOLIO:', 20, currentY);
    doc.setFont(undefined, 'bold');
    doc.text(`${entrada.serie || ''}-${entrada.folio || 'N/A'}`, 40, currentY);

    doc.setFont(undefined, 'normal');
    doc.text('FECHA:', 20, currentY + 6);
    doc.setFont(undefined, 'bold');
    doc.text(
      format(new Date(entrada.fecha_creacion), 'dd/MM/yyyy HH:mm', { locale: es }),
      40,
      currentY + 6
    );

    // Columna derecha
    doc.setFont(undefined, 'normal');
    doc.text('TIPO DE ENTRADA:', 110, currentY);
    doc.setFont(undefined, 'bold');
    doc.text(entrada.tipo_entrada_rel?.nombre || 'N/A', 145, currentY);

    doc.setFont(undefined, 'normal');
    doc.text('REGISTRADO POR:', 110, currentY + 6);
    doc.setFont(undefined, 'bold');
    doc.text(entrada.User?.name || 'N/A', 145, currentY + 6);

    currentY += 20;

    // Proveedor (si existe)
    if (entrada.proveedor) {
      doc.setFont(undefined, 'normal');
      doc.text('PROVEEDOR:', 20, currentY);
      doc.setFont(undefined, 'bold');
      const proveedorNombre =
        entrada.proveedor.nombre || entrada.proveedor.razon_social || 'Sin nombre';
      doc.text(proveedorNombre, 45, currentY);
      currentY += 8;
    }

    // Observaciones (si existen)
    if (entrada.observaciones) {
      doc.setFont(undefined, 'normal');
      doc.text('OBSERVACIONES:', 20, currentY);
      doc.setFont(undefined, 'bold');

      const observacionesLines = doc.splitTextToSize(entrada.observaciones, 150);
      doc.text(observacionesLines, 20, currentY + 6);
      currentY += 6 + observacionesLines.length * 4;
    }

    currentY += 10;

    // Tabla de productos
    const tableHeaders = ['Código Principal', 'Código Alt.', 'Descripción', 'Cantidad', 'Precio'];
    const tableData = entrada.partidas_entrada_inventario.map((partida) => [
      partida.Inventario.clave || 'N/A',
      partida.Inventario.clave2 || 'N/A',
      partida.Inventario.descripcion,
      partida.cantidad.toString(),
      `$${Number(partida.precio).toFixed(2)}`,
    ]);

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: currentY,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 30 },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'left', cellWidth: 70 },
        3: { halign: 'center', cellWidth: 25 },
        4: { halign: 'right', cellWidth: 30 },
      },
    });

    // Resumen final
    const finalY =
      (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || currentY + 50;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Total de productos: ${entrada.partidas_entrada_inventario.length}`, 20, finalY + 15);
    doc.text(`Total: $${Number(entrada.total).toFixed(2)}`, 20, finalY + 22);
    doc.text(`Estado: ${entrada.estado}`, 20, finalY + 29);

    // Firmas
    currentY = finalY + 45;
    doc.line(20, currentY, 80, currentY);
    doc.line(120, currentY, 180, currentY);

    doc.text('RECIBIÓ', 45, currentY + 8, { align: 'center' });
    doc.text('ENTREGÓ', 150, currentY + 8, { align: 'center' });

    // Pie de página
    doc.setFontSize(8);
    doc.text('Este documento fue generado automáticamente por SuminixMED', 105, 280, {
      align: 'center',
    });
    doc.text(`Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, 105, 285, {
      align: 'center',
    });

    const fileName = `entrada-${entrada.serie || ''}-${entrada.folio || entrada.id}-${format(new Date(), 'yyyyMMdd', { locale: es })}.pdf`;

    doc.save(fileName);
    toast.success('PDF generado exitosamente');
  } catch (error) {
    console.error('Error al generar PDF:', error);
    toast.error('Error al generar el PDF');
  }
};

// Función para exportar a Excel
const exportarExcel = (entrada: EntradaDetalle) => {
  try {
    const datos = entrada.partidas_entrada_inventario.map((p, index) => ({
      '#': index + 1,
      'Código Principal': p.Inventario.clave || 'N/A',
      'Código Alternativo': p.Inventario.clave2 || 'N/A',
      Descripción: p.Inventario.descripcion,
      Cantidad: p.cantidad,
      Precio: Number(p.precio).toFixed(2),
    }));

    // Agregar información del encabezado
    const encabezado = [
      { A: 'VALE DE ENTRADA DE INVENTARIO' },
      {},
      { A: 'Folio:', B: `${entrada.serie || ''}-${entrada.folio || 'N/A'}` },
      {
        A: 'Fecha:',
        B: format(new Date(entrada.fecha_creacion), 'dd/MM/yyyy HH:mm', { locale: es }),
      },
      { A: 'Tipo de Entrada:', B: entrada.tipo_entrada_rel?.nombre || 'N/A' },
      { A: 'Registrado por:', B: entrada.User?.name || 'N/A' },
    ];

    if (entrada.proveedor) {
      encabezado.push({
        A: 'Proveedor:',
        B: entrada.proveedor.nombre || entrada.proveedor.razon_social || 'Sin nombre',
      });
    }

    if (entrada.observaciones) {
      encabezado.push({ A: 'Observaciones:', B: entrada.observaciones });
    }

    encabezado.push({});

    const ws = XLSX.utils.json_to_sheet(encabezado, { skipHeader: true });
    XLSX.utils.sheet_add_json(ws, datos, { origin: -1 });

    // Agregar totales
    const lastRow = XLSX.utils.decode_range(ws['!ref'] || 'A1').e.r + 2;
    XLSX.utils.sheet_add_json(
      ws,
      [
        {
          '#': '',
          'Código Principal': '',
          'Código Alternativo': '',
          Descripción: 'TOTAL PRODUCTOS:',
          Cantidad: entrada.partidas_entrada_inventario.length,
          Precio: '',
        },
        {
          '#': '',
          'Código Principal': '',
          'Código Alternativo': '',
          Descripción: 'TOTAL GENERAL:',
          Cantidad: '',
          Precio: `$${Number(entrada.total).toFixed(2)}`,
        },
      ],
      { origin: lastRow, skipHeader: true }
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Entrada');

    // Ajustar ancho de columnas
    ws['!cols'] = [
      { wch: 5 }, // #
      { wch: 15 }, // Código Principal
      { wch: 15 }, // Código Alternativo
      { wch: 50 }, // Descripción
      { wch: 10 }, // Cantidad
      { wch: 12 }, // Precio
    ];

    XLSX.writeFile(
      wb,
      `Entrada_${entrada.serie || ''}-${entrada.folio || entrada.id}_${format(new Date(), 'yyyyMMdd', { locale: es })}.xlsx`
    );
    toast.success('Excel generado exitosamente');
  } catch (error) {
    toast.error('Error al generar el Excel');
    console.error(error);
  }
};

export default function DetalleEntradaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [entrada, setEntrada] = useState<EntradaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntrada = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/entradas/${resolvedParams.id}`);

        if (!response.ok) {
          throw new Error('Error al cargar la entrada');
        }

        const data = await response.json();
        setEntrada(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchEntrada();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !entrada) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 mb-4">{error || 'Entrada no encontrada'}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header con botón de regreso */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="font-medium">Volver a entradas</span>
        </button>

        {/* Encabezado compacto con información esencial */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Información principal */}
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                </div>

                <div className="flex-1 space-y-3">
                  {/* Primera fila: Folio y Estado */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Folio</p>
                      <p className="text-2xl font-bold text-green-600">
                        {entrada.serie && entrada.folio
                          ? `${entrada.serie}-${entrada.folio}`
                          : entrada.folio || 'Sin folio'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          entrada.estado === 'COMPLETADA'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {entrada.estado}
                      </span>
                    </div>
                  </div>

                  {/* Segunda fila: Proveedor y Tipo de Entrada */}
                  <div className="flex items-center gap-6 flex-wrap">
                    {entrada.proveedor && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Proveedor</p>
                        <p className="font-semibold text-gray-900">
                          {entrada.proveedor.nombre ||
                            entrada.proveedor.razon_social ||
                            'Sin nombre'}
                        </p>
                        {entrada.proveedor.razon_social && entrada.proveedor.nombre && (
                          <p className="text-sm text-gray-600">{entrada.proveedor.razon_social}</p>
                        )}
                      </div>
                    )}

                    {entrada.tipo_entrada_rel && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Tipo</p>
                        <p className="font-semibold text-gray-900">
                          {entrada.tipo_entrada_rel.nombre}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Tercera fila: Fecha y Usuario */}
                  <div className="flex items-center gap-6 flex-wrap text-sm">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Fecha</p>
                      <p className="text-gray-700">
                        {format(new Date(entrada.fecha_creacion), 'dd/MM/yyyy HH:mm', {
                          locale: es,
                        })}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Registrado por</p>
                      <p className="text-gray-700">{entrada.User.name}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Artículos</p>
                      <p className="font-semibold text-gray-900">
                        {entrada.partidas_entrada_inventario.reduce(
                          (sum, p) => sum + p.cantidad,
                          0
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={() => entrada && exportarExcel(entrada)}
                disabled={!entrada}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
                Excel
              </button>

              <button
                onClick={() => entrada && generateEntradaPDF(entrada)}
                disabled={!entrada}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
                PDF
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
              >
                <PrinterIcon className="h-5 w-5" />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Observaciones (si existen) */}
      {entrada.observaciones && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                Observaciones
              </p>
              <p className="text-amber-800 text-sm">{entrada.observaciones}</p>
            </div>
          </div>
        </div>
      )}

      {/* Información adicional del proveedor (si existe) */}
      {entrada.proveedor &&
        (entrada.proveedor.rfc ||
          entrada.proveedor.telefono ||
          entrada.proveedor.email ||
          entrada.proveedor.direccion) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-800 mb-3">Información del Proveedor</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {entrada.proveedor.rfc && (
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase">RFC</p>
                  <p className="text-blue-800 font-mono">{entrada.proveedor.rfc}</p>
                </div>
              )}
              {entrada.proveedor.telefono && (
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase">Teléfono</p>
                  <p className="text-blue-800">{entrada.proveedor.telefono}</p>
                </div>
              )}
              {entrada.proveedor.email && (
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase">Email</p>
                  <p className="text-blue-800 break-words">{entrada.proveedor.email}</p>
                </div>
              )}
              {entrada.proveedor.direccion && (
                <div className="col-span-2 md:col-span-4">
                  <p className="text-xs font-medium text-blue-600 uppercase">Dirección</p>
                  <p className="text-blue-800">{entrada.proveedor.direccion}</p>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Referencia Externa (si existe) */}
      {entrada.referencia_externa && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div>
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                Referencia Externa
              </p>
              <p className="text-purple-800 font-semibold">{entrada.referencia_externa}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de productos */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Productos ({entrada.partidas_entrada_inventario.length})
            </h2>
            <div className="text-sm text-gray-600">
              Total: {entrada.partidas_entrada_inventario.reduce((sum, p) => sum + p.cantidad, 0)}{' '}
              artículos
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clave
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entrada.partidas_entrada_inventario.map((partida, index) => (
                <tr key={partida.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-4 py-4">
                    <span className="inline-block bg-gray-100 text-gray-800 text-xs font-mono font-semibold px-2 py-1 rounded">
                      {partida.Inventario.clave || partida.Inventario.clave2 || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {partida.Inventario.descripcion}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                      {partida.cantidad}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      ${Number(partida.precio).toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
