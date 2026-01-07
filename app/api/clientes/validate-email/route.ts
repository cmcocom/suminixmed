import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/clientes/validate-email - Validar disponibilidad de email
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const clienteId = searchParams.get('clienteId');

    if (!email) {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 });
    }

    // Buscar cliente con ese email, excluyendo el cliente actual si se está editando
    const whereClause = clienteId ? { email, id: { not: clienteId } } : { email };

    const existingCliente = await prisma.clientes.findFirst({
      where: whereClause,
    });

    return NextResponse.json({
      isAvailable: !existingCliente,
      email,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al validar email' }, { status: 500 });
  }
}

// POST /api/clientes/validate-email - Validar disponibilidad de email (método POST)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { email, clienteId } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 });
    }

    // Buscar cliente con ese email, excluyendo el cliente actual si se está editando
    const whereClause = clienteId ? { email, id: { not: clienteId } } : { email };

    const existingCliente = await prisma.clientes.findFirst({
      where: whereClause,
    });

    return NextResponse.json({
      isUnique: !existingCliente,
      email,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al validar email' }, { status: 500 });
  }
}
