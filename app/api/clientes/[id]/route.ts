import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/clientes/[id] - Obtener cliente por ID
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const cliente = await prisma.clientes.findUnique({
      where: { id: id },
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: cliente,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener cliente' }, { status: 500 });
  }
}

// PUT /api/clientes/[id] - Actualizar cliente
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const {
      nombre,
      email,
      telefono,
      direccion,
      rfc,
      empresa,
      contacto,
      activo,
      codigo_postal,
      imagen,
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

    // Validar formato de email solo si se proporciona
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: 'El formato del email no es válido' },
          { status: 400 }
        );
      }

      // Verificar que el email no esté en uso por otro cliente
      const existingClient = await prisma.clientes.findFirst({
        where: {
          email,
          id: { not: id },
        },
      });

      if (existingClient) {
        return NextResponse.json(
          { success: false, error: 'Este email ya está registrado por otro cliente' },
          { status: 400 }
        );
      }
    }

    const cliente = await prisma.clientes.update({
      where: { id: id },
      data: {
        nombre,
        email: email || null,
        telefono: telefono || null,
        direccion: direccion || null,
        rfc: rfc || null,
        empresa: empresa || null,
        contacto: contacto || null,
        codigo_postal: codigo_postal || null,
        imagen: imagen || null,
        activo: activo !== undefined ? activo : true,
        // Campos médicos
        clave: clave || null,
        medico_tratante: medico_tratante || null,
        especialidad: especialidad || null,
        localidad: localidad || null,
        estado: estado || null,
        pais: pais || 'México',
      },
    });

    return NextResponse.json({
      success: true,
      data: cliente,
      message: 'Cliente actualizado exitosamente',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al actualizar cliente' },
      { status: 500 }
    );
  }
}

// DELETE /api/clientes/[id] - Eliminar cliente
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que el cliente existe
    const cliente = await prisma.clientes.findUnique({
      where: { id: id },
    });

    if (!cliente) {
      return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Eliminar el cliente
    await prisma.clientes.delete({
      where: { id: id },
    });

    return NextResponse.json({
      success: true,
      message: 'Cliente eliminado exitosamente',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al eliminar cliente' },
      { status: 500 }
    );
  }
}
