import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SSE-TEST] Iniciando prueba de SSE...');
    }

    // Verificar DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'DATABASE_URL no configurado',
          env: Object.keys(process.env).filter((k) => k.includes('DATABASE')),
        },
        { status: 500 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[SSE-TEST] DATABASE_URL encontrado');
    }

    // Intentar conectar a PostgreSQL
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: dbUrl });

    if (process.env.NODE_ENV === 'development') {
      console.log('[SSE-TEST] Pool creado, probando conexión...');
    }
    const client = await pool.connect();
    if (process.env.NODE_ENV === 'development') {
      console.log('[SSE-TEST] Cliente conectado');
    }

    // Probar LISTEN
    await client.query('LISTEN session_change');
    if (process.env.NODE_ENV === 'development') {
      console.log('[SSE-TEST] LISTEN configurado exitosamente');
    }

    // Probar que la función existe
    const funcCheck = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_name = 'notify_active_sessions_change'
    `);

    if (process.env.NODE_ENV === 'development') {
      console.log('[SSE-TEST] Función encontrada:', funcCheck.rows.length > 0);
    }

    // Probar triggers
    const triggerCheck = await client.query(`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE trigger_name LIKE 'trg_notify%'
    `);

    if (process.env.NODE_ENV === 'development') {
      console.log('[SSE-TEST] Triggers encontrados:', triggerCheck.rows.length);
    }

    // Cleanup
    await client.query('UNLISTEN session_change');
    client.release();
    await pool.end();

    if (process.env.NODE_ENV === 'development') {
      console.log('[SSE-TEST] Prueba completada exitosamente');
    }

    return NextResponse.json({
      success: true,
      message: 'SSE está configurado correctamente',
      details: {
        databaseConnected: true,
        listenConfigured: true,
        functionExists: funcCheck.rows.length > 0,
        triggersFound: triggerCheck.rows.length,
        triggers: triggerCheck.rows.map((r) => r.trigger_name),
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[SSE-TEST] Error:', error);
    }
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
