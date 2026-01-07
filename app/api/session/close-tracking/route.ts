/**
 * 🔧 MEJORA: API para registrar tracking de cierres de sesión desde el cliente
 *
 * Esta API recibe requests del cliente y utiliza SessionCloseTracker del servidor
 * para evitar que Prisma se importe en el lado del cliente.
 */

import { logger } from '@/lib/logger';
import { SessionCloseTracker } from '@/lib/session-close-tracking';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { type, userId, sessionId, tabId, reason, subReason, context, userAgent } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 });
    }

    // Manejar diferentes tipos de registro
    switch (type) {
      case 'manual-logout':
        await SessionCloseTracker.recordManualLogout(userId, tabId);
        break;

      case 'other-device-logout':
        await SessionCloseTracker.recordOtherDeviceLogout(userId, sessionId, tabId);
        break;

      case 'inactivity-logout':
        const inactivityMinutes = context?.inactivityMinutes || 45;
        await SessionCloseTracker.recordInactivityLogout(userId, inactivityMinutes, sessionId);
        break;

      default:
        // Registro genérico
        await SessionCloseTracker.recordSessionClose({
          sessionId,
          userId,
          tabId,
          reason,
          subReason,
          context,
          userAgent,
        });
    }

    logger.debug('[SESSION-CLOSE-API] Registro exitoso', { type, userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[SESSION-CLOSE-API] Error registrando cierre', error);

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
