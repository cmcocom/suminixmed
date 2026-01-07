import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSessionModuleAccess } from '@/lib/rbac-simple';
// AuditSystem import removed (unused) to avoid lint warning
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { crearFiltroFechasMexico } from '@/lib/timezone-utils';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Verificar sesión
    // Cast a any para sortear incompatibilidades de tipos del helper en este entorno
    const session = await (getServerSession as any)(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos específicos para auditoría
    const hasPermission = await checkSessionModuleAccess(session.user, 'AUDITORIA');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a la auditoría' },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(request.url);

    // Parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Parámetros de filtros
    const tableName = searchParams.get('table_name');
    const action = searchParams.get('action');
    const level = searchParams.get('level');
    const userId = searchParams.get('user_id');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const recordId = searchParams.get('recordId');
    const search = searchParams.get('search');
    const exportFormat = searchParams.get('export');

    // Construir filtros WHERE
    const where: any = {};

    // Aplicar filtros
    if (tableName) where.table_name = tableName;
    if (action) where.action = action;
    if (level) where.level = level;
    if (userId) where.user_id = userId;
    if (recordId) where.record_id = recordId;

    // Filtros de fecha usando zona horaria México (CST, UTC-6)
    const filtroFecha = crearFiltroFechasMexico(dateFrom, dateTo);
    if (filtroFecha) {
      where.changed_at = filtroFecha;
    }

    // Filtro de búsqueda general
    if (search && search.trim()) {
      where.OR = [
        { table_name: { contains: search.trim(), mode: 'insensitive' } },
        { action: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { user_name: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Si es exportación, usar streaming para evitar sobrecarga de memoria
    if (exportFormat) {
      const CHUNK_SIZE = 5000; // Procesar en chunks de 5K registros
      const MAX_EXPORT = 50000; // Límite máximo de 50K registros

      // Contar total de registros a exportar
      const totalRecords = await prisma.audit_log.count({ where });

      if (totalRecords === 0) {
        return NextResponse.json({ error: 'No hay datos para exportar' }, { status: 404 });
      }

      // Limitar exportación
      const recordsToExport = Math.min(totalRecords, MAX_EXPORT);

      if (totalRecords > MAX_EXPORT) {
        logger.warn(
          `⚠️  Exportación limitada: ${totalRecords} registros disponibles, exportando ${MAX_EXPORT}`
        );
      }

      // Generar CSV headers
      const csvHeaders = [
        'Fecha',
        'Tabla',
        'ID Registro',
        'Acción',
        'Usuario',
        'Nivel',
        'Descripción',
        'IP',
        'Valores Anteriores',
        'Valores Nuevos',
      ];

      let csvContent = csvHeaders.join(',') + '\n';

      // Procesar en chunks para evitar sobrecarga de memoria
      for (let offset = 0; offset < recordsToExport; offset += CHUNK_SIZE) {
        const chunkRecords = await prisma.audit_log.findMany({
          where,
          select: {
            id: true,
            table_name: true,
            record_id: true,
            action: true,
            old_values: true,
            new_values: true,
            user_id: true,
            user_name: true,
            ip_address: true,
            user_agent: true,
            level: true,
            description: true,
            changed_at: true,
          },
          orderBy: {
            changed_at: 'desc',
          },
          skip: offset,
          take: CHUNK_SIZE,
        });

        // Convertir chunk a CSV
        const chunkCsv = chunkRecords
          .map((record) => {
            const row = [
              record.changed_at.toISOString(),
              record.table_name,
              record.record_id,
              record.action,
              record.user_name || record.user_id || 'Sistema',
              record.level || 'MEDIUM',
              record.description || '',
              record.ip_address || '',
              record.old_values ? JSON.stringify(record.old_values).replace(/"/g, '""') : '',
              record.new_values ? JSON.stringify(record.new_values).replace(/"/g, '""') : '',
            ];

            return row
              .map((field) =>
                typeof field === 'string' && field.includes(',') ? `"${field}"` : field
              )
              .join(',');
          })
          .join('\n');

        csvContent += chunkCsv + '\n';
      }

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="auditoria_${new Date().toISOString().split('T')[0]}.csv"`,
          'X-Total-Records': totalRecords.toString(),
          'X-Exported-Records': recordsToExport.toString(),
        },
      });
    }

    // Consulta paginada con SELECT optimizado
    const [logs, total] = await Promise.all([
      prisma.audit_log.findMany({
        where,
        select: {
          id: true,
          table_name: true,
          record_id: true,
          action: true,
          user_name: true,
          level: true,
          description: true,
          changed_at: true,
          // Solo incluir estos campos pesados si son necesarios
          old_values: search ? true : false,
          new_values: search ? true : false,
          metadata: false, // No se usa en la tabla
        },
        orderBy: {
          changed_at: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      prisma.audit_log.count({ where }),
    ]);

    // Calcular estadísticas adicionales para el dashboard
    const totalPages = Math.ceil(total / limit);

    // Obtener estadísticas solo si son necesarias (no en cada paginación)
    const includeStats = page === 1 && !search;
    let stats = null;

    if (includeStats) {
      try {
        const [
          totalRecords,
          recordsByAction,
          recordsByTable,
          recordsByLevel,
          recordsToday,
          recordsThisMonth,
        ] = await Promise.all([
          prisma.audit_log.count(),
          prisma.audit_log.groupBy({
            by: ['action'],
            _count: { action: true },
            orderBy: { _count: { action: 'desc' } },
            take: 10,
          }),
          prisma.audit_log.groupBy({
            by: ['table_name'],
            _count: { table_name: true },
            orderBy: { _count: { table_name: 'desc' } },
            take: 10,
          }),
          prisma.audit_log.groupBy({
            by: ['level'],
            _count: { level: true },
          }),
          prisma.audit_log.count({
            where: {
              changed_at: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
            },
          }),
          prisma.audit_log.count({
            where: {
              changed_at: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              },
            },
          }),
        ]);

        stats = {
          totalRegistros: totalRecords,
          totalTablas: recordsByTable.length,
          registrosHoy: recordsToday,
          registrosEsteMes: recordsThisMonth,
          recordsByAction: recordsByAction.map((r) => ({
            action: r.action,
            count: r._count.action,
          })),
          recordsByTable: recordsByTable.map((r) => ({
            table: r.table_name,
            count: r._count.table_name,
          })),
          recordsByLevel: recordsByLevel.map((r) => ({ level: r.level, count: r._count.level })),
        };
      } catch (statsError) {
        logger.error('Error al obtener estadísticas:', statsError);
        stats = null; // Continuar sin estadísticas si falla
      }
    }

    return NextResponse.json({
      success: true,
      logs,
      stats,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords: total,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        tableName,
        action,
        level,
        userId,
        dateFrom,
        dateTo,
        recordId,
        search,
      },
    });
  } catch (error) {
    logger.error('Error en /api/auditoria:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
