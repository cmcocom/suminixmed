import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/dashboard/cleanup-all-sessions - Limpiar completamente la tabla de sesiones
export async function POST(_request: NextRequest) {
  try {
    // Verificar sesión de administrador
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Opcional: Verificar si el usuario es administrador
    // Puedes agregar una verificación de rol aquí si tienes roles de usuario

    // Contar sesiones antes de limpiar
    const countBefore = await prisma.active_sessions.count();

    // Eliminar todas las sesiones activas
    const deleteResult = await prisma.active_sessions.deleteMany({});

    // Contar sesiones después de limpiar
    const countAfter = await prisma.active_sessions.count();

    return NextResponse.json({
      success: true,
      message: 'Tabla de usuarios concurrentes limpiada exitosamente',
      sessionsRemoved: deleteResult.count,
      sessionsBefore: countBefore,
      sessionsAfter: countAfter,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
