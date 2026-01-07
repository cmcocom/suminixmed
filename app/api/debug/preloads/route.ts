import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Sólo aceptar en desarrollo para evitar log noise en producción
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: false, reason: 'disabled' }, { status: 403 });
  }

  try {
    const body = await request.json();
    console.log('[DEBUG/PRELOADS] reporte recibido:', JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DEBUG/PRELOADS] error procesando reporte:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
