import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createProtectedAPI } from '@/lib/api-auth';

export const POST = createProtectedAPI('PERFIL_PROPIO', 'LEER', async ({ user, req }) => {
  try {
    const { email, password } = await req.json();

    // Validar que se proporcionen email y password
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el email coincida con el usuario autenticado
    if (email !== user.email) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
    }

    // Buscar el usuario en la base de datos
    const dbUser = await prisma.user.findUnique({
      where: { email },
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

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, dbUser.password);

    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: 'Contraseña incorrecta' }, { status: 401 });
    }

    // Log de auditoría para verificación de contraseña
    console.log(`Contraseña verificada para usuario ${user.email} en ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      message: 'Contraseña verificada correctamente',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});
