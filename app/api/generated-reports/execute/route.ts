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

interface ReportConfig {
  mainTable: string;
  columns: string[];
  filters: FilterValue[];
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const config: ReportConfig = await request.json();
    const {
      mainTable,
      columns,
      filters = [],
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 50,
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

    const safeLimit = Math.min(limit, 500);
    const skip = (page - 1) * safeLimit;

    const [rows, totalCount] = await Promise.all([
      (prisma as any)[mainTable].findMany({
        where: filtersValidation.where,
        select: columnsValidation.select,
        orderBy: { [sort]: order },
        skip,
        take: safeLimit,
      }),
      (prisma as any)[mainTable].count({ where: filtersValidation.where }),
    ]);

    return NextResponse.json({
      success: true,
      data: rows,
      meta: {
        table: mainTable,
        columns,
        filters: filters.length,
        total: totalCount,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(totalCount / safeLimit),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[GENERATED-REPORTS] Error:', error);
    return NextResponse.json(
      {
        error: 'Error ejecutando reporte',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
