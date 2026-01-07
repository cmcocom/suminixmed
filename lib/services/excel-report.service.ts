/**
 * Servicio para generación de reportes Excel
 * Extraído de: app/dashboard/reportes/inventario/page.tsx
 * Centraliza la lógica de exportación Excel con mejor manejo de errores
 */

import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { Inventario, ColumnConfig, formatDateMX } from '@/lib/report-utils';

interface ExcelExportOptions {
  data: Inventario[];
  columns: ColumnConfig[];
  fileName?: string;
  sheetName?: string;
}

export class ExcelReportService {
  /**
   * Genera y descarga un archivo Excel con los datos filtrados
   * EXTRAÍDO de downloadExcel() en página original
   */
  static async generateExcel({
    data,
    columns,
    fileName,
    sheetName = 'Inventario',
  }: ExcelExportOptions): Promise<void> {
    try {
      const enabledColumns = columns.filter((col) => col.enabled);

      if (enabledColumns.length === 0) {
        toast.error('Debe seleccionar al menos una columna para exportar');
        return;
      }

      // Crear datos para Excel - LÓGICA PRESERVADA del original
      const excelData = data.map((item) => {
        const row: Record<string, string | number> = {};
        enabledColumns.forEach((col) => {
          switch (col.key) {
            case 'nombre':
              row[col.label] = item.descripcion || '';
              break;
            case 'categoria':
              row[col.label] = item.categoriaRelacion?.nombre || item.categoria;
              break;
            case 'cantidad':
              row[col.label] = item.cantidad;
              break;
            case 'precio':
              row[col.label] = item.precio;
              break;
            case 'valorTotal':
              row[col.label] = item.cantidad * item.precio;
              break;
            case 'proveedor':
              row[col.label] = item.proveedor || '';
              break;
            case 'estado':
              row[col.label] = item.estado;
              break;
            case 'fechaIngreso':
              row[col.label] = formatDateMX(item.fechaIngreso);
              break;
            case 'fechaVencimiento':
              row[col.label] = item.fechaVencimiento ? formatDateMX(item.fechaVencimiento) : '';
              break;
            case 'descripcion':
              row[col.label] = item.descripcion || '';
              break;
            default:
              row[col.label] = '';
          }
        });
        return row;
      });

      // Crear hoja de cálculo
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      // Configurar anchos de columna - PRESERVADO del original
      const colWidths = enabledColumns.map((col) => {
        switch (col.key) {
          case 'nombre':
            return { wch: 25 };
          case 'descripcion':
            return { wch: 30 };
          case 'categoria':
            return { wch: 15 };
          case 'proveedor':
            return { wch: 20 };
          case 'estado':
            return { wch: 12 };
          case 'fechaIngreso':
          case 'fechaVencimiento':
            return { wch: 12 };
          default:
            return { wch: 10 };
        }
      });
      ws['!cols'] = colWidths;

      // Generar nombre de archivo si no se proporciona
      const finalFileName =
        fileName || `reporte-inventario-${new Date().toISOString().split('T')[0]}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, finalFileName);
      toast.success('Reporte Excel descargado exitosamente');
    } catch (error) {
      toast.error('Error al generar el archivo Excel');
      throw error; // Re-throw para manejo superior si es necesario
    }
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

    // Verificar límites prácticos
    if (data.length > 50000) {
      errors.push('Demasiados registros para exportar (máximo 50,000)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Obtiene metadatos del reporte para incluir en el Excel
   */
  static getReportMetadata(data: Inventario[]): Record<string, string | number> {
    return {
      fechaGeneracion: new Date().toISOString(),
      totalRegistros: data.length,
      valorTotal: data.reduce((sum, item) => sum + item.cantidad * item.precio, 0),
      stockBajo: data.filter((item) => item.cantidad <= 10).length,
      productosVencidos: data.filter(
        (item) => item.fechaVencimiento && new Date(item.fechaVencimiento) < new Date()
      ).length,
    };
  }
}

export default ExcelReportService;

// SUGERENCIAS DE OPTIMIZACIÓN:
// 1. Implementar streaming para archivos muy grandes
// 2. Agregar compresión para reducir tamaño del archivo
// 3. Incluir gráficos y tablas dinámicas automáticas
// 4. Implementar templates predefinidos de Excel
