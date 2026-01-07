import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { PoolClient } from 'pg';

export async function GET() {
  logger.debug('[SSE] Cliente conectándose...');

  // Importar Pool dinámicamente
  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  let client: PoolClient | null = null;

  // Crear stream SSE
  const stream = new ReadableStream({
    async start(controller) {
      let isControllerActive = true;
      let heartbeatInterval: NodeJS.Timeout | null = null;

      // Helper seguro para enqueue (evita lanzar si el controller ya está cerrado)
      const safeEnqueue = (data: Uint8Array) => {
        try {
          controller.enqueue(data);
          return true;
        } catch (err: unknown) {
          const errorCode = (err as Error & { code?: string })?.code;
          // Si el controller ya está cerrado, marcar inactivo y retornar false
          if (errorCode === 'ERR_INVALID_STATE' || (err as Error).message?.includes('already closed')) {
            isControllerActive = false;
          }
          logger.debug('[SSE] safeEnqueue fallo', { err });
          return false;
        }
      };

      try {
        logger.debug('[SSE] Conectando a base de datos...');
        client = await pool.connect();
        logger.debug('[SSE] Conectado a BD, configurando LISTEN...');
        await client.query('LISTEN session_change');
        logger.debug('[SSE] LISTEN configurado exitosamente');

        // Enviar mensaje de conexión inicial (usar safeEnqueue y no retornar prematuramente)
        try {
          const encoder = new TextEncoder();
          const initialMsg = encoder.encode(
            `data: {"type":"connected","timestamp":${Date.now()}}\n\n`
          );
          const ok = safeEnqueue(initialMsg);
          if (!ok) {
            logger.debug('[SSE] Cliente desconectado antes de enviar mensaje inicial');
            // No retornamos aquí para asegurarnos de que el cleanup se registre y ejecute si es necesario
          } else {
            logger.debug('[SSE] Mensaje inicial enviado');
          }
        } catch (error) {
          logger.error('[SSE] Error preparando mensaje inicial:', error);
          // Continuar para registrar cleanup
        }

        // Handler para eventos NOTIFY con verificación de estado
        const onNotify = (msg: { payload: string }) => {
          // Verificar si el controller sigue activo antes de enviar datos
          if (!isControllerActive) {
            return;
          }

          try {
            const encoder = new TextEncoder();
            const data = encoder.encode(`data: ${msg.payload}\n\n`);
            const ok = safeEnqueue(data);
            if (!ok) {
              // Si falla al encolar, remover listener y limpiar
              isControllerActive = false;
              if (client) {
                (client as any).removeListener('notification', onNotify);
              }
              if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
                heartbeatInterval = null;
              }
            }
          } catch (error: unknown) {
            // Si hay error al enviar (controller cerrado), marcar como inactivo y limpiar silenciosamente
            const errorCode = (error as Error & { code?: string })?.code;

            if (errorCode === 'ERR_INVALID_STATE') {
              isControllerActive = false;
              // Remover listener para evitar más intentos
              if (client) {
                (client as any).removeListener('notification', onNotify);
              }
              // Limpiar heartbeat
              if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
                heartbeatInterval = null;
              }
            }
          }
        };

        // Usar el event emitter correcto para pg

        (client as any).on('notification', onNotify);
        logger.debug('[SSE] Listener de notificaciones configurado');

        // Heartbeat cada 30 segundos para mantener conexión
        heartbeatInterval = setInterval(() => {
          if (!isControllerActive) {
            if (heartbeatInterval) {
              clearInterval(heartbeatInterval);
              heartbeatInterval = null;
            }
            return;
          }

          try {
            const encoder = new TextEncoder();
            const data = encoder.encode(`data: {"type":"heartbeat","timestamp":${Date.now()}}\n\n`);
            const ok = safeEnqueue(data);
            if (!ok) {
              if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
                heartbeatInterval = null;
              }
            }
          } catch (error) {
            const errorCode = (error as Error & { code?: string })?.code;
            if (errorCode === 'ERR_INVALID_STATE') {
              isControllerActive = false;
              if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
                heartbeatInterval = null;
              }
            }
          }
        }, 30000);

        logger.debug('[SSE] Heartbeat configurado (30s)');

        // Cleanup function
        const cleanup = () => {
          logger.debug('[SSE] Ejecutando cleanup...');
          isControllerActive = false;

          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }

          if (client) {
            try {
              (client as any).removeListener('notification', onNotify);
              client.query('UNLISTEN session_change').catch((err) => {
                logger.error('[SSE] Error en UNLISTEN:', err);
              });
              client.release();
              logger.debug('[SSE] Cliente de BD liberado');
            } catch (error) {
              logger.error('[SSE] Error en cleanup:', error);
            }
          }
        };

        // Manejar cierre del stream
        return cleanup;
      } catch (error) {
        logger.error('[SSE] Error en start:', error);
        isControllerActive = false;

        // Enviar error al cliente
        try {
          const encoder = new TextEncoder();
          const errorMsg = encoder.encode(
            `data: {"type":"error","message":"${error instanceof Error ? error.message : 'Error desconocido'}"}\n\n`
          );
          // Usar safeEnqueue para evitar excepciones si el controller ya está cerrado
          safeEnqueue(errorMsg);
        } catch (e) {
          logger.error('[SSE] Error enviando mensaje de error:', e);
        }

        // No llamar a controller.error ya que puede propagar un estado inválido si el controller está cerrado
        return;
      }
    },

    cancel() {
      logger.debug('[SSE] Cliente desconectado (cancel)');
      if (client) {
        try {
          client.query('UNLISTEN session_change').catch(() => {});
          client.release();
        } catch (error: unknown) {
          logger.error('[SSE] Error en cancel:', error);
        }
      }
    },
  });

  return new NextResponse(stream, { headers });
}
