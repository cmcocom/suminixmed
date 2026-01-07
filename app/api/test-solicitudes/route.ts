import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [TEST-SOLICITUDES] Iniciando diagnóstico...');
    }

    const session = await getServerSession(authOptions);
    if (process.env.NODE_ENV === 'development') {
      console.log('👤 [TEST-SOLICITUDES] Sesión:', session ? 'OK' : 'NO EXISTE');
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: 'No autorizado',
          session: null,
        },
        { status: 401 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 [TEST-SOLICITUDES] Probando query básica...');
    }

    // Test 1: Query más simple posible
    const count = await prisma.salidas_inventario.count();
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [TEST-SOLICITUDES] Count exitoso:', count);
    }

    // Test 2: Query con User solamente
    const conUser = await prisma.salidas_inventario.findFirst({
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [TEST-SOLICITUDES] Query con User exitosa');
    }

    // Test 3: Query con partidas
    const conPartidas = await prisma.salidas_inventario.findFirst({
      include: {
        partidas_salida_inventario: {
          take: 1,
        },
      },
    });
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [TEST-SOLICITUDES] Query con partidas exitosa');
    }

    // Test 4: Query con Inventario en partidas
    const completa = await prisma.salidas_inventario.findFirst({
      include: {
        partidas_salida_inventario: {
          include: {
            Inventario: {
              select: {
                descripcion: true,
              },
            },
          },
          take: 1,
        },
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [TEST-SOLICITUDES] Query completa exitosa');
    }

    return NextResponse.json({
      success: true,
      message: 'Todas las queries funcionaron correctamente',
      diagnostico: {
        totalSolicitudes: count,
        queryConUser: !!conUser,
        queryConPartidas: !!conPartidas,
        queryCompleta: !!completa,
        muestraCompleta: completa,
      },
    });
  } catch (error) {
    console.error('❌ [TEST-SOLICITUDES] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
