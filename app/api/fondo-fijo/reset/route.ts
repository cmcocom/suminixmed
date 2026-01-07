import { NextRequest, NextResponse } from 'next/server';
import { FondoFijoResetService } from '@/lib/services/fondo-fijo-reset-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkSessionModuleAccess } from '@/lib/rbac-simple';

export async function POST(_request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // ✅ Verificar acceso al módulo STOCK_FIJO
    const hasAccess = await checkSessionModuleAccess(session.user, 'STOCK_FIJO');
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes acceso al módulo de stock fijo' },
        { status: 403 }
      );
    }
    // Ejecutar reset automático
    const resultado = await FondoFijoResetService.ejecutarResetAutomatico();

    return NextResponse.json({
      success: true,
      data: resultado,
      timestamp: new Date().toISOString(),
      ejecutadoPor: session.user.email,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // ✅ Verificar acceso al módulo STOCK_FIJO
    const hasAccess = await checkSessionModuleAccess(session.user, 'STOCK_FIJO');
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes acceso al módulo de stock fijo' },
        { status: 403 }
      );
    }

    // Obtener análisis de fondos que necesitan reset
    const analisis = await FondoFijoResetService.verificarFondosParaReset();

    return NextResponse.json({
      success: true,
      data: analisis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
