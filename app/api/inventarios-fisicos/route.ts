/**
 * @fileoverview API de Inventarios Físicos
 * @description Endpoints para gestión de inventarios físicos
 * @date 2025-10-07
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Obtener todos los inventarios físicos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const almacen_id = searchParams.get('almacen_id');

    const where: {
      estado?: string;
      almacen_id?: string;
    } = {};

    if (estado) where.estado = estado;
    if (almacen_id) where.almacen_id = almacen_id;

    const inventarios = await prisma.inventarios_fisicos.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        almacenes: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: inventarios,
    });
  } catch (error) {
    console.error('Error en GET /api/inventarios-fisicos:', error);
    return NextResponse.json(
      {
        error: 'Error al obtener inventarios físicos',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo inventario físico
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, nombre, descripcion, almacen_id, total_productos } = body;

    // Validaciones
    if (!id || !nombre) {
      return NextResponse.json({ error: 'ID y nombre son requeridos' }, { status: 400 });
    }

    // Crear inventario físico
    const inventario = await prisma.inventarios_fisicos.create({
      data: {
        id,
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        almacen_id: almacen_id || null,
        usuario_creador_id: session.user.id,
        total_productos: total_productos || 0,
        estado: 'EN_PROCESO',
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        almacenes: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: inventario,
        message: 'Inventario físico creado exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en POST /api/inventarios-fisicos:', error);
    return NextResponse.json(
      {
        error: 'Error al crear inventario físico',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
