import { authOptions } from '@/lib/auth';
import { deleteImageFile, isValidImagePath } from '@/lib/fileUtils';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener entidad por ID
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const entidad = await prisma.entidades.findUnique({
      where: { id_empresa: id },
    });

    if (!entidad) {
      return NextResponse.json({ error: 'Entidad no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: entidad,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Actualizar entidad
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const {
      nombre,
      rfc,
      correo,
      telefono,
      contacto,
      licencia,
      logo,
      tiempo_sesion_minutos,
      estatus,
      capturar_lotes_entradas,
    } = data;

    // Validaciones básicas
    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    // Verificar que la entidad existe
    const entidadExistente = await prisma.entidades.findUnique({
      where: { id_empresa: id },
    });

    if (!entidadExistente) {
      return NextResponse.json({ error: 'Entidad no encontrada' }, { status: 404 });
    }

    // Procesar eliminación de imagen si es necesario
    const imageChanged = entidadExistente.logo !== logo;

    if (imageChanged && isValidImagePath(entidadExistente.logo)) {
      try {
        await deleteImageFile(entidadExistente.logo!); // ! porque isValidImagePath ya verificó que no es null
      } catch (error) {
        // No fallar la operación por no poder eliminar la imagen anterior
      }
    }

    // Preparar datos para actualizar (solo campos válidos)
    const updateData: {
      nombre: string;
      rfc: string;
      correo?: string | null;
      telefono?: string | null;
      contacto?: string | null;
      estatus?: 'activo' | 'inactivo';
      logo?: string | null;
      licencia_usuarios_max?: number;
      tiempo_sesion_minutos?: number;
      capturar_lotes_entradas?: boolean;
    } = {
      nombre,
      rfc: rfc || entidadExistente.rfc,
      correo: correo || null,
      telefono: telefono || null,
      contacto: contacto || null,
      estatus: (estatus as 'activo' | 'inactivo') || 'activo',
    };

    // Actualizar logo (incluso si es null para eliminarlo)
    if (logo !== undefined) {
      updateData.logo = logo || null;
    }

    // Solo actualizar licencia_usuarios_max si se proporciona
    if (licencia !== undefined && licencia !== '') {
      const licenciaNum = parseInt(licencia);
      if (!isNaN(licenciaNum) && licenciaNum > 0) {
        updateData.licencia_usuarios_max = licenciaNum;
      }
    }

    // Solo actualizar tiempo_sesion_minutos si se proporciona
    if (tiempo_sesion_minutos !== undefined) {
      updateData.tiempo_sesion_minutos = tiempo_sesion_minutos;
    }

    // Solo actualizar capturar_lotes_entradas si se proporciona
    if (capturar_lotes_entradas !== undefined) {
      updateData.capturar_lotes_entradas = capturar_lotes_entradas;
    }

    // Actualizar entidad
    const entidadActualizada = await prisma.entidades.update({
      where: { id_empresa: id },
      data: updateData,
    });
    return NextResponse.json({
      success: true,
      data: entidadActualizada,
      message: 'Entidad actualizada correctamente',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar entidad
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que la entidad existe
    const entidad = await prisma.entidades.findUnique({
      where: { id_empresa: id },
    });

    if (!entidad) {
      return NextResponse.json({ error: 'Entidad no encontrada' }, { status: 404 });
    }

    // Eliminar imagen si existe
    if (isValidImagePath(entidad.logo)) {
      try {
        await deleteImageFile(entidad.logo!); // ! porque isValidImagePath ya verificó que no es null
      } catch (error) {
        // Continuar con la eliminación de la entidad aunque la imagen no se pueda eliminar
      }
    }

    // Eliminar entidad
    await prisma.entidades.delete({
      where: { id_empresa: id },
    });
    return NextResponse.json({
      success: true,
      message: 'Entidad eliminada correctamente',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
