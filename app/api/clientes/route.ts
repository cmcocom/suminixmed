import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createAuditMiddleware } from '@/lib/audit-system';

// GET /api/clientes - Obtener clientes con paginación
export async function GET(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500); // Aumentado: 200 por defecto, máximo 500
    const search = searchParams.get('search') || '';
    const activo = searchParams.get('activo');

    // Construir filtros
    const where: any = {};

    if (activo !== null && activo !== undefined && activo !== '') {
      where.activo = activo === 'true';
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { clave: { contains: search, mode: 'insensitive' as const } },
        { empresa: { contains: search, mode: 'insensitive' as const } },
        { rfc: { contains: search, mode: 'insensitive' as const } },
        { telefono: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const skip = (page - 1) * limit;

    // Query paginada con count en paralelo
    const [clientes, total] = await Promise.all([
      prisma.clientes.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.clientes.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: clientes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

// POST /api/clientes - Crear nuevo cliente
export async function POST(request: Request) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const auditMiddleware = createAuditMiddleware<{
      id: string;
      nombre: string;
      email: string | null;
      activo: boolean;
    }>('clientes');

    const data = await request.json();
    const {
      nombre,
      email,
      telefono,
      direccion,
      rfc,
      empresa,
      contacto,
      codigo_postal,
      activo,
      // Campos médicos
      clave,
      medico_tratante,
      especialidad,
      localidad,
      estado,
      pais,
    } = data;

    if (!nombre) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Validar formato de email si se proporciona
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: 'El formato del email no es válido' },
          { status: 400 }
        );
      }

      // Verificar si el email ya existe
      const existingCliente = await prisma.clientes.findUnique({
        where: { email },
      });

      if (existingCliente) {
        return NextResponse.json(
          { success: false, error: 'El email ya está registrado' },
          { status: 400 }
        );
      }
    }

    // Crear cliente con auditoría
    const cliente = await auditMiddleware.onCreate(
      () =>
        prisma.clientes.create({
          data: {
            id: `cliente_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            nombre,
            email: email || null,
            telefono: telefono || null,
            direccion: direccion || null,
            rfc: rfc || null,
            empresa: empresa || null,
            contacto: contacto || null,
            codigo_postal: codigo_postal || null,
            activo: activo !== undefined ? activo : true,
            // Campos médicos
            clave: clave || null,
            medico_tratante: medico_tratante || null,
            especialidad: especialidad || null,
            localidad: localidad || null,
            estado: estado || null,
            pais: pais || 'México',
            updatedAt: new Date(),
          },
        }),
      (result) => result.id,
      (result) => ({
        nombre: result.nombre,
        email: result.email,
        activo: result.activo,
      }),
      request
    );

    return NextResponse.json({
      success: true,
      data: cliente,
      message: 'Cliente creado exitosamente',
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);

    // Capturar mensaje de error específico si está disponible
    const errorMessage = error instanceof Error ? error.message : 'Error al crear cliente';

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
