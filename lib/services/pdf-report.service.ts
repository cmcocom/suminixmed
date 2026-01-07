/**
 * Servicio para generación de reportes PDF
 * Extraído de: app/dashboard/reportes/inventario/page.tsx
 * Centraliza la lógica de exportación PDF con mejor estructura
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';
import {
  Inventario,
  ColumnConfig,
  formatDateMX,
  calculateInventoryStats,
} from '@/lib/report-utils';

interface PdfExportOptions {
  data: Inventario[];
  columns: ColumnConfig[];
  fileName?: string;
  title?: string;
  includeStats?: boolean;
  userInfo?: {
    name?: string;
    email?: string;
  };
}

export class PdfReportService {
  /**
   * Genera y descarga un archivo PDF con los datos filtrados
   * EXTRAÍDO y mejorado de downloadPDF() en página original
   */
  static async generatePDF({
    data,
    columns,
    fileName,
    title = 'Reporte de Inventario',
    includeStats = true,
    userInfo,
  }: PdfExportOptions): Promise<void> {
    try {
      const enabledColumns = columns.filter((col) => col.enabled);

      if (enabledColumns.length === 0) {
        toast.error('Debe seleccionar al menos una columna para exportar');
        return;
      }

      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape para más espacio
      let currentY = 20;

      // Título del documento - MEJORADO del original
      doc.setFontSize(16);
      doc.text(title, 20, currentY);
      currentY += 10;

      // Información de generación - PRESERVADA del original
      const reportDate = new Date().toLocaleDateString('es-MX');
      doc.setFontSize(10);
      doc.text(`Fecha: ${reportDate}`, 20, currentY);

      if (userInfo?.name) {
        doc.text(`Generado por: ${userInfo.name}`, 120, currentY);
      }
      currentY += 15;

      // Estadísticas básicas - EXTRAÍDA y optimizada del original
      if (includeStats) {
        const stats = calculateInventoryStats(data);

        doc.setFontSize(9);
        doc.text(`Total de Productos: ${stats.totalItems}`, 20, currentY);
        doc.text(
          `Valor Total: $${stats.totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
          120,
          currentY
        );
        currentY += 10;

        doc.text(`Stock Bajo: ${stats.lowStockCount}`, 20, currentY);
        doc.text(`Productos Vencidos: ${stats.expiredCount}`, 120, currentY);
        currentY += 15;
      }

      // Preparar datos de tabla - LÓGICA PRESERVADA del original
      const headers = enabledColumns.map((col) => col.label);
      const tableData = data.map((item) => {
        return enabledColumns.map((col) => {
          switch (col.key) {
            case 'nombre':
              return item.descripcion;
            case 'categoria':
              return item.categoriaRelacion?.nombre || item.categoria;
            case 'cantidad':
              return item.cantidad.toString();
            case 'precio':
              return `$${item.precio.toFixed(2)}`;
            case 'valorTotal':
              return `$${(item.cantidad * item.precio).toFixed(2)}`;
            case 'proveedor':
              return item.proveedor || '-';
            case 'estado':
              return item.estado;
            case 'fechaIngreso':
              return formatDateMX(item.fechaIngreso);
            case 'fechaVencimiento':
              return item.fechaVencimiento ? formatDateMX(item.fechaVencimiento) : '-';
            case 'descripcion':
              return item.descripcion || '-';
            default:
              return '-';
          }
        });
      });

      // Generar tabla - CONFIGURACIÓN PRESERVADA del original
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: currentY,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: 255,
          fontSize: 8,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: 20, right: 20 },
        columnStyles: this.getColumnStyles(enabledColumns),
      });

      // Pie de página
      const finalY =
        (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ||
        currentY + 50;
      doc.setFontSize(8);
      doc.text(
        'Este reporte fue generado automáticamente por el Sistema de Inventario SuminixMED',
        20,
        finalY + 10
      );
      doc.text(`© ${new Date().getFullYear()} - Todos los derechos reservados`, 20, finalY + 15);

      // Generar nombre de archivo si no se proporciona
      const finalFileName =
        fileName || `reporte-inventario-${new Date().toISOString().split('T')[0]}.pdf`;

      // Descargar archivo
      doc.save(finalFileName);
      toast.success('Reporte PDF descargado exitosamente');
    } catch (error) {
      toast.error('Error al generar el archivo PDF');
      throw error;
    }
  }

  /**
   * Obtiene estilos de columna para autoTable
   */
  private static getColumnStyles(
    columns: ColumnConfig[]
  ): Record<string, { halign: 'left' | 'center' | 'right' }> {
    const styles: Record<string, { halign: 'left' | 'center' | 'right' }> = {};

    columns.forEach((col, index) => {
      switch (col.key) {
        case 'cantidad':
          styles[index.toString()] = { halign: 'center' };
          break;
        case 'precio':
        case 'valorTotal':
          styles[index.toString()] = { halign: 'right' };
          break;
        case 'fechaIngreso':
        case 'fechaVencimiento':
          styles[index.toString()] = { halign: 'center' };
          break;
        default:
          styles[index.toString()] = { halign: 'left' };
      }
    });

    return styles;
  }

  /**
   * Valida los datos antes de la exportación
   */
  static validateExportData(
    data: Inventario[],
    columns: ColumnConfig[]
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data || data.length === 0) {
      errors.push('No hay datos para exportar');
    }

    const enabledColumns = columns.filter((col) => col.enabled);
    if (enabledColumns.length === 0) {
      errors.push('Debe seleccionar al menos una columna');
    }

    // Límite práctico para PDFs
    if (data.length > 10000) {
      errors.push(
        'Demasiados registros para PDF (máximo 10,000). Use Excel para datasets grandes.'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default PdfReportService;

// SUGERENCIAS DE OPTIMIZACIÓN:
// 1. Implementar paginación automática para reportes grandes
// 2. Agregar gráficos estadísticos automáticos
// 3. Permitir templates personalizados de empresa
// 4. Implementar marca de agua y firmas digitales
