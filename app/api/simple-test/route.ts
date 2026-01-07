import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test 1: Verificar que prisma existe
    if (!prisma) {
      throw new Error('Prisma client is undefined');
    }

    // Test 2: Verificar que ffijo existe en el client
    if (!prisma.ffijo) {
      throw new Error('prisma.ffijo is undefined');
    }

    // Test 3: Hacer una query simple
    const count = await prisma.ffijo.count();

    return NextResponse.json({
      success: true,
      message: 'Todo funciona correctamente',
      count,
      tests: {
        prismaExists: !!prisma,
        ffijoExists: !!prisma.ffijo,
        ffijoMethods: {
          count: typeof prisma.ffijo.count === 'function',
          findMany: typeof prisma.ffijo.findMany === 'function',
          create: typeof prisma.ffijo.create === 'function',
        },
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        stack: err.stack,
      },
      { status: 500 }
    );
  }
}
