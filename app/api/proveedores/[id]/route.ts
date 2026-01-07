import { authOptions } from '@/lib/auth';
import { deleteImageFile, isValidImagePath } from '@/lib/fileUtils';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/proveedores/[id] - Obtener un proveedor específico
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const proveedor = await prisma.proveedores.findUnique({
      where: { id },
    });

    if (!proveedor) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: proveedor,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT /api/proveedores/[id] - Actualizar proveedor
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
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
      condicionesPago,
      imagen,
      activo,
    } = body;

    // Verificar que el proveedor existe
    const proveedorExistente = await prisma.proveedores.findUnique({
      where: { id },
    });

    if (!proveedorExistente) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

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

      // Verificar que el email no esté en uso por otro proveedor
      const existingEmail = await prisma.proveedores.findFirst({
        where: {
          email: email.trim(),
          id: { not: id },
          activo: true,
        },
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Ya existe otro proveedor activo con este email' },
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

      // Verificar que el RFC no esté en uso por otro proveedor
      const existingRFC = await prisma.proveedores.findFirst({
        where: {
          rfc: rfc.trim().toUpperCase(),
          id: { not: id },
          activo: true,
        },
      });

      if (existingRFC) {
        return NextResponse.json(
          { error: 'Ya existe otro proveedor activo con este RFC' },
          { status: 400 }
        );
      }
    }

    // Si la imagen cambió, eliminar la imagen anterior
    const imageChanged = proveedorExistente.imagen !== (imagen?.trim() || null);
    if (imageChanged && isValidImagePath(proveedorExistente.imagen)) {
      try {
        await deleteImageFile(proveedorExistente.imagen!); // ! porque isValidImagePath ya verificó que no es null
      } catch (error) {
        // No fallar la operación por no poder eliminar la imagen anterior
      }
    }

    // Actualizar proveedor
    const proveedorActualizado = await prisma.proveedores.update({
      where: { id },
      data: {
        nombre: nombre.trim(),
        razon_social: razonSocial?.trim() || null,
        email: email?.trim() || null,
        telefono: telefono?.trim() || null,
        direccion: direccion?.trim() || null,
        rfc: rfc?.trim().toUpperCase() || null,
        contacto: contacto?.trim() || null,
        sitio_web: sitioWeb?.trim() || null,
        notas: notas?.trim() || null,
        condiciones_pago: condicionesPago?.trim() || null,
        imagen: imagen?.trim() || null,
        activo: activo !== undefined ? activo : proveedorExistente.activo,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: proveedorActualizado,
      message: 'Proveedor actualizado exitosamente',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE /api/proveedores/[id] - Eliminar (desactivar) proveedor
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que el proveedor existe
    const proveedor = await prisma.proveedores.findUnique({
      where: { id },
    });

    if (!proveedor) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    // Eliminar la imagen del proveedor si existe, antes de desactivarlo
    if (isValidImagePath(proveedor.imagen)) {
      try {
        await deleteImageFile(proveedor.imagen!); // ! porque isValidImagePath ya verificó que no es null
      } catch (error) {
        // Continuar con la desactivación del proveedor aunque la imagen no se pueda eliminar
      }
    }

    // En lugar de eliminar, desactivamos el proveedor
    const proveedorDesactivado = await prisma.proveedores.update({
      where: { id },
      data: {
        activo: false,
        imagen: null, // Limpiar la imagen al desactivar
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: proveedorDesactivado,
      message: 'Proveedor desactivado exitosamente',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
