import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkSessionPermission } from '@/lib/rbac-dynamic';
// TipoRol import removed (unused)
import { randomUUID } from 'crypto';

interface GeneratedReportData {
  name: string;
  description?: string;
  slug: string;
  tables: Array<{
    name: string;
    alias?: string;
    joins?: Array<{
      type: 'INNER' | 'LEFT' | 'RIGHT';
      table: string;
      on: string;
    }>;
  }>;
  columns: Array<{
    table: string;
    column: string;
    alias?: string;
    label: string;
    type: string;
    format?: string;
    sortable?: boolean;
    filterable?: boolean;
  }>;
  filters: Array<{
    column: string;
    type: 'text' | 'number' | 'date' | 'select' | 'boolean';
    label: string;
    required?: boolean;
    defaultValue?: string | number | boolean;
    options?: Array<{ value: string; label: string }>;
  }>;
  allowedRoles: string[];
  showFilters?: boolean;
  showExport?: boolean;
  pageSize?: number;
}

// GET /api/generated-reports - Obtener todos los reportes generados
async function getGeneratedReports() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const userRoles =
      session.user.roles && session.user.roles.length > 0
        ? session.user.roles
        : session.user.primaryRole
          ? [session.user.primaryRole]
          : [];
    const reports = await prisma.generated_reports.findMany({
      where: {
        is_active: true,
        allowed_roles: { hasSome: userRoles },
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/generated-reports - Crear nuevo reporte generado
async function createGeneratedReport(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Verificar permiso dinámico para crear reportes (GESTION_REPORTES.CREAR o REPORTES.CREAR)
  const canCreateReports =
    (await checkSessionPermission(session.user, 'GESTION_REPORTES', 'CREAR')) ||
    (await checkSessionPermission(session.user, 'REPORTES', 'CREAR'));

  if (!canCreateReports) {
    return NextResponse.json({ error: 'No tienes permisos para crear reportes' }, { status: 403 });
  }

  try {
    const data: GeneratedReportData = await request.json();

    // Validar datos requeridos
    if (!data.name || !data.slug || !data.tables || !data.columns) {
      return NextResponse.json(
        {
          error: 'Faltan datos requeridos (name, slug, tables, columns)',
        },
        { status: 400 }
      );
    }

    // Validar que el slug sea único
    const existingReport = await prisma.generated_reports.findUnique({
      where: { slug: data.slug },
    });

    if (existingReport) {
      return NextResponse.json(
        {
          error: 'Ya existe un reporte con ese slug',
        },
        { status: 400 }
      );
    }

    // Validar roles permitidos: solo validar que sea un array de strings
    if (
      !Array.isArray(data.allowedRoles) ||
      !data.allowedRoles.every((r) => typeof r === 'string')
    ) {
      return NextResponse.json(
        { error: 'allowedRoles debe ser un arreglo de strings' },
        { status: 400 }
      );
    }

    // Crear el reporte
    const newReport = await prisma.generated_reports.create({
      data: {
        id: randomUUID(),
        name: data.name,
        description: data.description,
        slug: data.slug,
        tables: data.tables,
        columns: data.columns,
        filters: data.filters || [],
        allowed_roles: data.allowedRoles,
        show_filters: data.showFilters ?? true,
        show_export: data.showExport ?? true,
        page_size: data.pageSize ?? 50,
        created_by: session.user.id,
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: newReport,
        message: 'Reporte creado exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export { getGeneratedReports as GET, createGeneratedReport as POST };
