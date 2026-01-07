import { authOptions } from '@/lib/auth';
import { CACHE_KEYS, cacheManager } from '@/lib/cache-manager';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/proveedores - Obtener lista de proveedores
export async function GET(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const activo = searchParams.get('activo');

    // ✅ CACHÉ: Si no hay búsqueda y pide activos, usar caché
    if (!search && activo === 'true' && page === 1 && limit === 10) {
      const cached = cacheManager.get(CACHE_KEYS.PROVEEDORES_ACTIVOS);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    // Construir filtros
    const where: {
      activo?: boolean;
      OR?: Array<{
        nombre?: { contains: string; mode: 'insensitive' };
        email?: { contains: string; mode: 'insensitive' };
        rfc?: { contains: string; mode: 'insensitive' };
        razon_social?: { contains: string; mode: 'insensitive' };
        contacto?: { contains: string; mode: 'insensitive' };
      }>;
    } = {};

    // Filtro por estado activo/inactivo
    if (activo !== null && activo !== '') {
      where.activo = activo === 'true';
    }

    // Filtro de búsqueda por nombre, email, RFC o razón social
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { rfc: { contains: search, mode: 'insensitive' } },
        { razon_social: { contains: search, mode: 'insensitive' } },
        { contacto: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Calcular skip para paginación
    const skip = (page - 1) * limit;

    // Obtener proveedores con paginación
    const [proveedores, total] = await Promise.all([
      prisma.proveedores.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { activo: 'desc' }, // Activos primero
          { nombre: 'asc' }, // Luego por nombre
        ],
      }),
      prisma.proveedores.count({ where }),
    ]);

    const response = {
      success: true,
      data: proveedores,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    // ✅ CACHÉ: Guardar en caché si es la query común
    if (!search && activo === 'true' && page === 1 && limit === 10) {
      cacheManager.set(CACHE_KEYS.PROVEEDORES_ACTIVOS, response);
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/proveedores - Crear nuevo proveedor
export async function POST(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      nombre,
      razonSocial,
      email,
      telefono,
      direccion,
      rfc,
      contacto,
      sitioWeb,
      notas,
      imagen,
      condicionesPago,
      activo = true,
    } = body;

    // Validaciones básicas
    if (!nombre || nombre.trim().length === 0) {
      return NextResponse.json({ error: 'El nombre del proveedor es requerido' }, { status: 400 });
    }

    if (nombre.length > 150) {
      return NextResponse.json(
        { error: 'El nombre no puede exceder 150 caracteres' },
        { status: 400 }
      );
    }

    // Validar email si se proporciona
    if (email && email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'El formato del email no es válido' }, { status: 400 });
      }

      // Verificar que el email no esté en uso
      const existingEmail = await prisma.proveedores.findFirst({
        where: {
          email: email.trim(),
          activo: true,
        },
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Ya existe un proveedor activo con este email' },
          { status: 400 }
        );
      }
    }

    // Validar RFC si se proporciona
    if (rfc && rfc.trim().length > 0) {
      if (rfc.length > 20) {
        return NextResponse.json(
          { error: 'El RFC no puede exceder 20 caracteres' },
          { status: 400 }
        );
      }

      // Verificar que el RFC no esté en uso
      const existingRFC = await prisma.proveedores.findFirst({
        where: {
          rfc: rfc.trim().toUpperCase(),
          activo: true,
        },
      });

      if (existingRFC) {
        return NextResponse.json(
          { error: 'Ya existe un proveedor activo con este RFC' },
          { status: 400 }
        );
      }
    }

    // Crear proveedor
    const proveedor = await prisma.proveedores.create({
      data: {
        id: `prov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nombre: nombre.trim(),
        razon_social: razonSocial?.trim() || null,
        email: email?.trim() || null,
        telefono: telefono?.trim() || null,
        direccion: direccion?.trim() || null,
        rfc: rfc?.trim().toUpperCase() || null,
        contacto: contacto?.trim() || null,
        sitio_web: sitioWeb?.trim() || null,
        notas: notas?.trim() || null,
        imagen: imagen?.trim() || null,
        condiciones_pago: condicionesPago?.trim() || null,
        activo,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: proveedor,
        message: 'Proveedor creado exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
