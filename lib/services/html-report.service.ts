/**
 * Servicio para generación de reportes HTML
 * Extraído de: app/dashboard/reportes/inventario/page.tsx
 * Centraliza la lógica de generación HTML con mejor estructura y CSS
 */

import {
  Inventario,
  ColumnConfig,
  Categoria,
  ReportFilters,
  calculateInventoryStats,
  formatPriceMX,
} from '@/lib/report-utils';

interface HtmlReportOptions {
  data: Inventario[];
  columns: ColumnConfig[];
  categorias: Categoria[];
  filters: ReportFilters;
  userInfo?: {
    name?: string;
    email?: string;
  };
  title?: string;
}

export class HtmlReportService {
  /**
   * Genera HTML completo del reporte
   * EXTRAÍDO y mejorado de generateReportHTML() en página original
   */
  static generateReport({
    data,
    columns,
    categorias,
    filters,
    userInfo,
    title = 'Reporte de Inventario',
  }: HtmlReportOptions): string {
    const enabledColumns = columns.filter((col) => col.enabled);
    const stats = calculateInventoryStats(data);

    const reportDate = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - ${reportDate}</title>
    <style>
        ${this.getReportStyles()}
    </style>
</head>
<body>
    ${this.generateHeader(title, reportDate, userInfo)}
    ${this.generateSummarySection(stats)}
    ${this.generateColumnsInfo(enabledColumns, columns)}
    ${this.generateFiltersSection(filters, categorias)}
    ${this.generateTable(data, enabledColumns)}
    ${this.generateFooter(enabledColumns)}
</body>
</html>`;
  }

  /**
   * Genera estilos CSS para el reporte - EXTRAÍDO del original
   */
  private static getReportStyles(): string {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .header h1 {
            color: #1e40af;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #6b7280;
            font-size: 1.1em;
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .summary-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        
        .summary-card h3 {
            color: #475569;
            font-size: 0.9em;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        
        .summary-card .value {
            color: #1e40af;
            font-size: 2em;
            font-weight: bold;
        }
        
        .filters-applied, .columns-info {
            background: #eff6ff;
            border: 1px solid #dbeafe;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 30px;
        }
        
        .filters-applied h3, .columns-info h3 {
            color: #1e40af;
            margin-bottom: 10px;
        }
        
        .filter-item, .column-item {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            margin: 2px;
            font-size: 0.85em;
        }
        
        .table-container {
            overflow-x: auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th {
            background: #f1f5f9;
            color: #475569;
            font-weight: 600;
            padding: 15px 12px;
            text-align: left;
            border-bottom: 2px solid #e2e8f0;
            font-size: 0.85em;
            text-transform: uppercase;
        }
        
        td {
            padding: 12px;
            border-bottom: 1px solid #f1f5f9;
        }
        
        tr:hover {
            background: #f8fafc;
        }
        
        .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: 500;
        }
        
        .status.disponible { background: #dcfce7; color: #166534; }
        .status.agotado { background: #fee2e2; color: #991b1b; }
        .status.reservado { background: #fef3c7; color: #92400e; }
        .status.dañado { background: #fecaca; color: #7f1d1d; }
        .status.vencido { background: #f3e8ff; color: #6b21a8; }
        
        .quantity {
            text-align: center;
            font-weight: 600;
        }
        
        .quantity.low { color: #dc2626; }
        .quantity.normal { color: #059669; }
        
        .price {
            text-align: right;
            font-weight: 600;
            color: #059669;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #6b7280;
            font-size: 0.9em;
        }
        
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
        }`;
  }

  /**
   * Genera sección de encabezado
   */
  private static generateHeader(
    title: string,
    reportDate: string,
    userInfo?: { name?: string }
  ): string {
    return `
    <div class="header">
        <h1>📦 ${title}</h1>
        <p>Generado el ${reportDate} por ${userInfo?.name || 'Usuario'}</p>
    </div>`;
  }

  /**
   * Genera sección de resumen estadístico
   */
  private static generateSummarySection(stats: ReturnType<typeof calculateInventoryStats>): string {
    return `
    <div class="summary">
        <div class="summary-card">
            <h3>Total de Productos</h3>
            <div class="value">${stats.totalItems}</div>
        </div>
        <div class="summary-card">
            <h3>Valor Total</h3>
            <div class="value">${formatPriceMX(stats.totalValue)}</div>
        </div>
        <div class="summary-card">
            <h3>Stock Bajo</h3>
            <div class="value">${stats.lowStockCount}</div>
        </div>
        <div class="summary-card">
            <h3>Productos Vencidos</h3>
            <div class="value">${stats.expiredCount}</div>
        </div>
    </div>`;
  }

  /**
   * Genera información de columnas incluidas
   */
  private static generateColumnsInfo(
    enabledColumns: ColumnConfig[],
    allColumns: ColumnConfig[]
  ): string {
    if (enabledColumns.length >= allColumns.length) return '';

    return `
    <div class="columns-info">
        <h3>📋 Columnas Incluidas en el Reporte</h3>
        ${enabledColumns.map((col) => `<span class="column-item">${col.label}</span>`).join('')}
    </div>`;
  }

  /**
   * Genera sección de filtros aplicados
   */
  private static generateFiltersSection(filters: ReportFilters, categorias: Categoria[]): string {
    const hasActiveFilters = Object.values(filters).some((value) => value !== '' && value !== 0);

    if (!hasActiveFilters) return '';

    const filterItems = [];

    if (filters.categoria) {
      const categoria = categorias.find((c) => c.id === filters.categoria);
      filterItems.push(
        `<span class="filter-item">Categoría: ${categoria?.nombre || filters.categoria}</span>`
      );
    }
    if (filters.estado)
      filterItems.push(`<span class="filter-item">Estado: ${filters.estado}</span>`);
    if (filters.proveedor)
      filterItems.push(`<span class="filter-item">Proveedor: ${filters.proveedor}</span>`);
    if (filters.fechaIngresoDesde)
      filterItems.push(
        `<span class="filter-item">Ingreso desde: ${filters.fechaIngresoDesde}</span>`
      );
    if (filters.fechaIngresoHasta)
      filterItems.push(
        `<span class="filter-item">Ingreso hasta: ${filters.fechaIngresoHasta}</span>`
      );
    if (filters.fechaVencimientoDesde)
      filterItems.push(
        `<span class="filter-item">Vencimiento desde: ${filters.fechaVencimientoDesde}</span>`
      );
    if (filters.fechaVencimientoHasta)
      filterItems.push(
        `<span class="filter-item">Vencimiento hasta: ${filters.fechaVencimientoHasta}</span>`
      );
    if (filters.cantidadMinima !== '')
      filterItems.push(`<span class="filter-item">Cantidad mín: ${filters.cantidadMinima}</span>`);
    if (filters.cantidadMaxima !== '')
      filterItems.push(`<span class="filter-item">Cantidad máx: ${filters.cantidadMaxima}</span>`);
    if (filters.precioMinimo !== '')
      filterItems.push(
        `<span class="filter-item">Precio mín: ${formatPriceMX(Number(filters.precioMinimo))}</span>`
      );
    if (filters.precioMaximo !== '')
      filterItems.push(
        `<span class="filter-item">Precio máx: ${formatPriceMX(Number(filters.precioMaximo))}</span>`
      );

    return `
    <div class="filters-applied">
        <h3>🔍 Filtros Aplicados</h3>
        ${filterItems.join('')}
    </div>`;
  }

  /**
   * Genera tabla de datos
   */
  private static generateTable(data: Inventario[], enabledColumns: ColumnConfig[]): string {
    const tableHeaders = enabledColumns.map((col) => `<th>${col.label}</th>`).join('');

    const tableRows = data
      .map((item) => {
        const cells = enabledColumns
          .map((col) => {
            let cellContent = '';
            switch (col.key) {
              case 'nombre':
                cellContent = `<strong>${item.descripcion}</strong>${item.descripcion ? `<br><small style="color: #6b7280;">${item.descripcion}</small>` : ''}`;
                break;
              case 'categoria':
                cellContent = item.categoriaRelacion?.nombre || item.categoria;
                break;
              case 'cantidad':
                cellContent = `<span class="quantity ${item.cantidad <= 10 ? 'low' : 'normal'}">${item.cantidad}</span>`;
                break;
              case 'precio':
                cellContent = formatPriceMX(item.precio);
                break;
              case 'valorTotal':
                cellContent = formatPriceMX(item.cantidad * item.precio);
                break;
              case 'proveedor':
                cellContent = item.proveedor || '-';
                break;
              case 'estado':
                cellContent = `<span class="status ${item.estado}">${item.estado}</span>`;
                break;
              case 'fechaIngreso':
                cellContent = new Date(item.fechaIngreso).toLocaleDateString('es-MX');
                break;
              case 'fechaVencimiento':
                cellContent = item.fechaVencimiento
                  ? new Date(item.fechaVencimiento).toLocaleDateString('es-MX')
                  : '-';
                break;
              case 'descripcion':
                cellContent = item.descripcion || '-';
                break;
              default:
                cellContent = '-';
            }
            return `<td>${cellContent}</td>`;
          })
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    return `
    <div class="table-container">
        <table>
            <thead>
                <tr>${tableHeaders}</tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    </div>`;
  }

  /**
   * Genera pie de página
   */
  private static generateFooter(enabledColumns: ColumnConfig[]): string {
    return `
    <div class="footer">
        <p>Este reporte fue generado automáticamente por el Sistema de Inventario SuminixMED</p>
        <p>Columnas incluidas: ${enabledColumns.map((col) => col.label).join(', ')}</p>
        <p>© ${new Date().getFullYear()} - Todos los derechos reservados</p>
    </div>`;
  }

  /**
   * Abre el reporte en una nueva ventana para impresión
   */
  static printReport(htmlContent: string): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  }
}

export default HtmlReportService;

// SUGERENCIAS DE OPTIMIZACIÓN:
// 1. Implementar templates personalizables por empresa
// 2. Agregar gráficos SVG automáticos para estadísticas
// 3. Incluir código QR con link al reporte online
// 4. Implementar firma digital y marca de agua
