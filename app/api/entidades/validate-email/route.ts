import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// POST - Validar si un email es único para entidades
export async function POST(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const requestBody = await request.json();
    const { email, entidadId } = requestBody;

    // Validar que se proporcione el email
    if (!email) {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 });
    }

    // Validar formato del email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Formato de email inválido' }, { status: 400 });
    }
    // Construir la consulta donde excluyendo la entidad actual (si se está editando)
    const whereClause: {
      correo: string;
      id_empresa?: {
        not: string;
      };
    } = {
      correo: email,
    };

    // Si estamos editando (entidadId proporcionado), excluir esa entidad
    if (entidadId) {
      whereClause.id_empresa = {
        not: entidadId,
      };
    }

    const existingEntity = await prisma.entidades.findFirst({
      where: whereClause,
      select: {
        id_empresa: true,
        nombre: true,
        correo: true,
      },
    });

    const isUnique = !existingEntity;
    return NextResponse.json({
      success: true,
      isUnique,
      email,
      existingEntity: existingEntity
        ? {
            id: existingEntity.id_empresa,
            nombre: existingEntity.nombre,
          }
        : null,
    });
  } catch (error) {
    console.error('💥 Stack trace:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
