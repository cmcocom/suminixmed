import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { randomUUID } from 'crypto';

// GET - Obtener todas las entidades
export async function GET() {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const entidades = await prisma.entidades.findMany({
      orderBy: {
        fecha_registro: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: entidades,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nueva entidad
export async function POST(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const requestBody = await request.json();
    const {
      nombre,
      rfc,
      logo,
      correo,
      telefono,
      contacto,
      licencia,
      tiempo_sesion_minutos,
      estatus,
      capturar_lotes_entradas,
    } = requestBody;

    // Validaciones básicas
    if (!nombre || !rfc) {
      return NextResponse.json({ error: 'Nombre y RFC son campos requeridos' }, { status: 400 });
    }

    // Validar formato de RFC (básico)
    const rfcRegex = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
    if (!rfcRegex.test(rfc.toUpperCase())) {
      return NextResponse.json({ error: 'Formato de RFC inválido' }, { status: 400 });
    }

    // Verificar que el RFC no exista
    const existingEntity = await prisma.entidades.findUnique({
      where: { rfc: rfc.toUpperCase() },
    });

    if (existingEntity) {
      return NextResponse.json({ error: 'Ya existe una entidad con este RFC' }, { status: 400 });
    }

    console.log(
      '🔍 Datos recibidos para licencia:',
      licencia,
      'tipo:',
      typeof licencia,
      'válida:',
      !isNaN(parseInt(licencia))
    );

    const entidad = await prisma.entidades.create({
      data: {
        id_empresa: randomUUID(),
        nombre,
        rfc: rfc.toUpperCase(),
        logo,
        correo,
        telefono,
        contacto,
        licencia_usuarios_max: parseInt(licencia) || 5,
        tiempo_sesion_minutos: tiempo_sesion_minutos || 30,
        estatus: estatus || 'activo',
        capturar_lotes_entradas: capturar_lotes_entradas || false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: entidad,
      message: 'Entidad creada exitosamente',
    });
  } catch (error) {
    console.error('💥 Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
