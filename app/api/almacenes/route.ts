import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createProtectedAPI } from '@/lib/api-auth';
import { AuditSystem, createAuditMiddleware } from '@/lib/audit-system';

// GET - Obtener todos los almacenes
export const GET = createProtectedAPI('ALMACENES', 'LEER', async ({ req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const search = searchParams.get('search');

    const where: {
      activo?: boolean;
      OR?: Array<
        | { nombre: { contains: string; mode: 'insensitive' } }
        | { descripcion: { contains: string; mode: 'insensitive' } }
      >;
    } = {};

    if (!includeInactive) {
      where.activo = true;
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { nombre: { contains: searchTerm, mode: 'insensitive' } },
        { descripcion: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const almacenes = await prisma.almacenes.findMany({
      where,
      include: {
        ubicaciones_almacen: {
          where: { activo: true },
        },
        inventario_almacen: {
          select: {
            id: true,
            cantidad: true,
            Inventario: {
              select: {
                id: true,
                descripcion: true,
              },
            },
          },
        },
        _count: {
          select: {
            ubicaciones_almacen: true,
            inventario_almacen: true,
          },
        },
      },
      orderBy: [{ es_principal: 'desc' }, { nombre: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      almacenes,
      total: almacenes.length,
    });
  } catch (error) {
    console.error('Error en GET /api/almacenes:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
});

// POST - Crear nuevo almacén
export const POST = createProtectedAPI('ALMACENES', 'CREAR', async ({ req, user }) => {
  try {
    const auditMiddleware = createAuditMiddleware<{
      id: string;
      nombre: string;
      activo: boolean;
      es_principal: boolean;
    }>('almacenes');

    const {
      nombre,
      descripcion,
      direccion,
      responsable,
      telefono,
      email,
      es_principal = false,
    } = await req.json();

    // Validaciones
    if (!nombre || nombre.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre del almacén debe tener al menos 2 caracteres' },
        { status: 400 }
      );
    }

    // Verificar si ya existe un almacén con ese nombre
    const existingAlmacen = await prisma.almacenes.findFirst({
      where: {
        nombre: nombre.trim(),
        activo: true,
      },
    });

    if (existingAlmacen) {
      return NextResponse.json(
        { error: 'Ya existe un almacén activo con ese nombre' },
        { status: 400 }
      );
    }

    // Si se está marcando como principal, desmarcar otros
    if (es_principal) {
      await prisma.almacenes.updateMany({
        where: { es_principal: true },
        data: { es_principal: false },
      });
    }

    // Establecer contexto de usuario para auditoría
    if (user?.id) {
      await AuditSystem.setDatabaseUserContext(user.id, user.name || user.email || undefined);
    }

    // Crear almacén con auditoría
    const almacen = await auditMiddleware.onCreate(
      () =>
        prisma.almacenes.create({
          data: {
            id: `almacen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            nombre: nombre.trim(),
            descripcion: descripcion?.trim() || null,
            direccion: direccion?.trim() || null,
            responsable: responsable?.trim() || null,
            telefono: telefono?.trim() || null,
            email: email?.trim() || null,
            es_principal,
            activo: true,
            updatedAt: new Date(),
          },
          include: {
            _count: {
              select: {
                ubicaciones_almacen: true,
                inventario_almacen: true,
              },
            },
          },
        }),
      (result) => result.id,
      (result) => ({
        nombre: result.nombre,
        activo: result.activo,
        es_principal: result.es_principal,
      }),
      req
    );

    return NextResponse.json(
      {
        success: true,
        almacen,
        message: 'Almacén creado exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
});
