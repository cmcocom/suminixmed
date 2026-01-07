import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  // Protección: Solo permitir en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Endpoint de debugging no disponible en producción' },
      { status: 403 }
    );
  }

  try {
    // Probar si los modelos están disponibles
    const models = {
      ffijo: typeof prisma.ffijo !== 'undefined',
      user: typeof prisma.user !== 'undefined',
      inventario: typeof prisma.inventario !== 'undefined',
      User: typeof (prisma as any).User !== 'undefined',
      Inventario: typeof (prisma as any).Inventario !== 'undefined',
    };

    // Intentar una consulta básica para cada modelo
    const counts = {
      user: await prisma.user.count().catch((e) => `Error: ${e.message}`),
      inventario: await prisma.inventario.count().catch((e) => `Error: ${e.message}`),
      ffijo: await prisma.ffijo.count().catch((e) => `Error: ${e.message}`),
    };

    return NextResponse.json({
      success: true,
      models,
      counts,
      prismaInfo: {
        version: '6.15.0',
        modelsAvailable: Object.keys(prisma).filter(
          (k) => typeof (prisma as any)[k] === 'object' && (prisma as any)[k].findMany
        ),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
