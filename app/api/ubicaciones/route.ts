import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createProtectedAPI } from '@/lib/api-auth';
import { AuditSystem, createAuditMiddleware } from '@/lib/audit-system';

// GET - Obtener ubicaciones de un almacén específico
export const GET = createProtectedAPI('ALMACENES', 'LEER', async ({ req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const almacenId = searchParams.get('almacenId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    if (!almacenId) {
      return NextResponse.json({ error: 'ID de almacén requerido' }, { status: 400 });
    }

    const where: { almacen_id: string; activo?: boolean } = { almacen_id: almacenId };
    if (!includeInactive) {
      where.activo = true;
    }

    const ubicaciones = await prisma.ubicaciones_almacen.findMany({
      where,
      include: {
        almacenes: {
          select: {
            id: true,
            descripcion: true,
          },
        },
        inventario_almacen: {
          select: {
            Inventario: {
              select: {
                id: true,
                descripcion: true,
              },
            },
            cantidad: true,
          },
        },
        _count: {
          select: {
            inventario_almacen: true,
          },
        },
      },
      orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      ubicaciones,
      total: ubicaciones.length,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
});

// POST - Crear nueva ubicación en un almacén
export const POST = createProtectedAPI('ALMACENES', 'CREAR', async ({ req, user }) => {
  try {
    const auditMiddleware = createAuditMiddleware<{
      id: string;
      nombre: string;
      almacen_id: string;
      tipo: string;
    }>('ubicaciones_almacen');

    const { almacen_id, nombre, descripcion, tipo = 'ESTANTE' } = await req.json();

    // Validaciones
    if (!almacen_id) {
      return NextResponse.json({ error: 'ID de almacén requerido' }, { status: 400 });
    }

    if (!nombre || nombre.trim().length < 1) {
      return NextResponse.json(
        { error: 'El nombre de la ubicación es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el almacén existe
    const almacen = await prisma.almacenes.findUnique({
      where: { id: almacen_id, activo: true },
    });

    if (!almacen) {
      return NextResponse.json(
        { error: 'El almacén especificado no existe o está inactivo' },
        { status: 404 }
      );
    }

    // Verificar que no exista una ubicación con el mismo nombre en el almacén
    const existingUbicacion = await prisma.ubicaciones_almacen.findUnique({
      where: {
        almacen_id_nombre: {
          almacen_id,
          nombre: nombre.trim(),
        },
      },
    });

    if (existingUbicacion) {
      return NextResponse.json(
        { error: 'Ya existe una ubicación con ese nombre en el almacén' },
        { status: 400 }
      );
    }

    // Establecer contexto de usuario para auditoría
    if (user?.id) {
      await AuditSystem.setDatabaseUserContext(user.id, user.name || user.email || undefined);
    }

    // Crear ubicación con auditoría
    const ubicacion = await auditMiddleware.onCreate(
      () =>
        prisma.ubicaciones_almacen.create({
          data: {
            id: `ubicacion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            almacen_id,
            nombre: nombre.trim().toUpperCase(),
            descripcion: descripcion?.trim() || null,
            tipo: tipo.toUpperCase(),
            activo: true,
            updatedAt: new Date(),
          },
          include: {
            almacenes: {
              select: {
                id: true,
                descripcion: true,
              },
            },
          },
        }),
      (result) => result.id,
      (result) => ({
        nombre: result.nombre,
        almacen_id: result.almacen_id,
        tipo: result.tipo,
      }),
      req
    );

    return NextResponse.json(
      {
        success: true,
        ubicacion,
        message: 'Ubicación creada exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
});
