import { NextRequest, NextResponse } from 'next/server';
import { FondoFijoResetService } from '@/lib/services/fondo-fijo-reset-service';

export async function POST(_request: NextRequest) {
  try {
    // Verificar clave de API para ejecución automática
    const authHeader = _request.headers.get('Authorization');
    const expectedApiKey = process.env.CRON_API_KEY || 'default-dev-key';

    if (!authHeader || authHeader !== `Bearer ${expectedApiKey}`) {
      return NextResponse.json({ error: 'Clave de API inválida' }, { status: 401 });
    }

    // Ejecutar reset automático
    const resultado = await FondoFijoResetService.ejecutarResetAutomatico();

    return NextResponse.json({
      success: true,
      data: resultado,
      timestamp: new Date().toISOString(),
      tipo: 'ejecucion_automatica',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
