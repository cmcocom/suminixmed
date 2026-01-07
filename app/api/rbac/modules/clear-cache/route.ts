import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    // Este endpoint no hace nada en el backend, solo responde OK
    // Su propósito es que el frontend limpie su localStorage cuando se llame

    return NextResponse.json({
      success: true,
      message: 'Caché limpiada - recargue la página',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
