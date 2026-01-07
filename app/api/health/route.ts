import { NextRequest, NextResponse } from 'next/server';

/**
 * Health check endpoint para Docker y monitoreo
 */
export async function GET(_request: NextRequest) {
  try {
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
