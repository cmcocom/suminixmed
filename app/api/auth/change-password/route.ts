import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * API para cambiar contraseña - Disponible para TODOS los usuarios autenticados
 * No requiere permisos RBAC especiales, solo sesión activa
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar sesión (solo requiere estar autenticado, sin permisos RBAC)
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    // Validar que se proporcionen las contraseñas
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'La contraseña actual y nueva son requeridas' },
        { status: 400 }
      );
    }

    // Validar longitud de la nueva contraseña
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Buscar el usuario en la base de datos
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        password: true,
        activo: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (!dbUser.activo) {
      return NextResponse.json({ success: false, error: 'Usuario inactivo' }, { status: 403 });
    }

    // Verificar que el usuario tenga contraseña
    if (!dbUser.password) {
      return NextResponse.json(
        { success: false, error: 'Usuario sin contraseña configurada' },
        { status: 400 }
      );
    }

    // Verificar la contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, dbUser.password);

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'La contraseña actual es incorrecta' },
        { status: 401 }
      );
    }

    // Verificar que la nueva contraseña sea diferente a la actual
    const isSamePassword = await bcrypt.compare(newPassword, dbUser.password);
    if (isSamePassword) {
      return NextResponse.json(
        { success: false, error: 'La nueva contraseña debe ser diferente a la actual' },
        { status: 400 }
      );
    }

    // Hashear la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar la contraseña en la base de datos
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
    });

    // Log de auditoría para cambio de contraseña
    console.log(
      `Contraseña cambiada para usuario ${session.user.email} en ${new Date().toISOString()}`
    );

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada correctamente',
    });
  } catch (error) {
    console.error('[CHANGE_PASSWORD] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
