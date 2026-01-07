import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  isAllowedTable,
  isAllowedColumn,
  isAllowedOperator,
  type AllowedTable,
} from '@/lib/reports-whitelist';

interface FilterValue {
  column: string;
  operator: string;
  value: string | number;
}

interface ExportConfig {
  mainTable: string;
  columns: string[];
  filters: FilterValue[];
  sort?: string;
  order?: 'asc' | 'desc';
  format: 'csv' | 'excel';
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  where?: any;
  select?: any;
}

function validateAndSanitizeFilters(table: string, filters: FilterValue[]): ValidationResult {
  if (!isAllowedTable(table)) {
    return { valid: false, error: `Tabla no permitida: ${table}` };
  }

  const allowedTable = table as AllowedTable;
  const where: any = {};

  for (const filter of filters) {
    if (!isAllowedColumn(allowedTable, filter.column)) {
      return { valid: false, error: `Columna no permitida: ${filter.column}` };
    }

    if (!isAllowedOperator(filter.operator)) {
      return { valid: false, error: `Operador no permitido: ${filter.operator}` };
    }

    switch (filter.operator) {
      case 'equals':
        where[filter.column] = filter.value;
        break;
      case 'contains':
        where[filter.column] = { contains: filter.value, mode: 'insensitive' };
        break;
      case 'starts_with':
        where[filter.column] = { startsWith: filter.value, mode: 'insensitive' };
        break;
      case 'ends_with':
        where[filter.column] = { endsWith: filter.value, mode: 'insensitive' };
        break;
      case 'gt':
        where[filter.column] = { gt: filter.value };
        break;
      case 'gte':
        where[filter.column] = { gte: filter.value };
        break;
      case 'lt':
        where[filter.column] = { lt: filter.value };
        break;
      case 'lte':
        where[filter.column] = { lte: filter.value };
        break;
    }
  }

  return {
    valid: true,
    where: Object.keys(where).length > 0 ? where : undefined,
  };
}

function validateColumns(table: AllowedTable, columns: string[]): ValidationResult {
  const invalidColumns = columns.filter((col) => !isAllowedColumn(table, col));

  if (invalidColumns.length > 0) {
    return {
      valid: false,
      error: `Columnas no permitidas: ${invalidColumns.join(', ')}`,
    };
  }

  const select: any = {};
  columns.forEach((col) => {
    select[col] = true;
  });

  return { valid: true, select };
}

function generateCSV(data: any[], columns: string[]): string {
  const header = columns.join(',');
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col] ?? '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',')
  );
  return [header, ...rows].join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const config: ExportConfig = await request.json();
    const {
      mainTable,
      columns,
      filters = [],
      sort = 'createdAt',
      order = 'desc',
      format = 'csv',
    } = config;

    if (!mainTable || !isAllowedTable(mainTable)) {
      return NextResponse.json({ error: `Tabla no permitida: ${mainTable}` }, { status: 400 });
    }

    const allowedTable = mainTable as AllowedTable;

    if (!columns || columns.length === 0) {
      return NextResponse.json({ error: 'Debe especificar al menos una columna' }, { status: 400 });
    }

    const columnsValidation = validateColumns(allowedTable, columns);
    if (!columnsValidation.valid) {
      return NextResponse.json({ error: columnsValidation.error }, { status: 400 });
    }

    const filtersValidation = validateAndSanitizeFilters(allowedTable, filters);
    if (!filtersValidation.valid) {
      return NextResponse.json({ error: filtersValidation.error }, { status: 400 });
    }

    if (!isAllowedColumn(allowedTable, sort)) {
      return NextResponse.json(
        { error: `Columna de ordenamiento no permitida: ${sort}` },
        { status: 400 }
      );
    }

    // Límite de exportación: máximo 50,000 registros
    const EXPORT_LIMIT = 50000;

    const [rows, totalCount] = await Promise.all([
      (prisma as any)[mainTable].findMany({
        where: filtersValidation.where,
        select: columnsValidation.select,
        orderBy: { [sort]: order },
        take: EXPORT_LIMIT,
      }),
      (prisma as any)[mainTable].count({ where: filtersValidation.where }),
    ]);

    if (totalCount > EXPORT_LIMIT) {
      return NextResponse.json(
        {
          error: `Demasiados registros para exportar. Total: ${totalCount}, Límite: ${EXPORT_LIMIT}`,
          suggestion: 'Aplique filtros adicionales para reducir el número de registros',
        },
        { status: 400 }
      );
    }

    if (format === 'csv') {
      const csv = generateCSV(rows, columns);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${mainTable}-export-${Date.now()}.csv"`,
        },
      });
    }

    // Excel no implementado aún
    return NextResponse.json({ error: 'Formato Excel no implementado aún' }, { status: 501 });
  } catch (error) {
    console.error('[GENERATED-REPORTS-EXPORT] Error:', error);
    return NextResponse.json(
      {
        error: 'Error exportando reporte',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
