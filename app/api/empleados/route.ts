/**
 * API Routes para Empleados
 * Gestión CRUD de empleados con vinculación opcional de usuarios
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createProtectedAPI } from '@/lib/api-auth';
import { randomUUID } from 'crypto';

/**
 * GET /api/empleados
 * Lista todos los empleados con información del usuario vinculado si existe
 */
export const GET = createProtectedAPI('EMPLEADOS', 'LEER', async ({ req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const search = searchParams.get('search') || '';

    // ✅ OPTIMIZACIÓN: Agregar paginación (evita cargar miles en memoria)
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '150'), 500); // Aumentado: 150 por defecto, máximo 500
    const skip = (page - 1) * limit;

    const where: {
      activo?: boolean;
      OR?: Array<{
        nombre?: { contains: string; mode: 'insensitive' };
        numero_empleado?: { contains: string; mode: 'insensitive' };
        correo?: { contains: string; mode: 'insensitive' };
        cargo?: { contains: string; mode: 'insensitive' };
        servicio?: { contains: string; mode: 'insensitive' };
      }>;
    } = {};

    if (!includeInactive) {
      where.activo = true;
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { numero_empleado: { contains: search, mode: 'insensitive' } },
        { correo: { contains: search, mode: 'insensitive' } },
        { cargo: { contains: search, mode: 'insensitive' } },
        { servicio: { contains: search, mode: 'insensitive' } },
      ];
    }

    // ✅ Ejecutar query paginada y count en paralelo
    const [empleados, total] = await Promise.all([
      prisma.empleados.findMany({
        where,
        select: {
          id: true,
          numero_empleado: true,
          nombre: true,
          cargo: true,
          servicio: true,
          turno: true,
          correo: true,
          celular: true,
          activo: true,
          createdAt: true,
          updatedAt: true,
          user_id: true,
          User: {
            select: {
              id: true,
              clave: true,
              email: true,
              name: true,
              activo: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          nombre: 'asc',
        },
        skip,
        take: limit,
      }),
      prisma.empleados.count({ where }),
    ]);

    return NextResponse.json({
      empleados,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener empleados' }, { status: 500 });
  }
});

/**
 * POST /api/empleados
 * Crea un nuevo empleado
 * Body: { numero_empleado, nombre, cargo, servicio?, turno, correo?, celular?, activo?, createUser?: boolean }
 */
export const POST = createProtectedAPI(
  'EMPLEADOS',
  'CREAR',
  async ({ user: _currentUser, req }) => {
    try {
      const body = await req.json();
      const {
        numero_empleado,
        nombre,
        cargo,
        servicio,
        turno,
        correo,
        celular,
        activo = true,
        createUser = false, // Opción para crear usuario al crear empleado
      } = body;

      // Validaciones
      if (!numero_empleado || !nombre || !cargo || !turno) {
        return NextResponse.json(
          { error: 'Faltan campos requeridos: numero_empleado, nombre, cargo, turno' },
          { status: 400 }
        );
      }

      // Verificar que no exista el número de empleado
      const existeEmpleado = await prisma.empleados.findUnique({
        where: { numero_empleado },
      });

      if (existeEmpleado) {
        return NextResponse.json(
          { error: 'Ya existe un empleado con ese número de empleado' },
          { status: 400 }
        );
      }

      // Si tiene correo, verificar que no exista en empleados
      if (correo) {
        const existeCorreo = await prisma.empleados.findUnique({
          where: { correo },
        });

        if (existeCorreo) {
          return NextResponse.json(
            { error: 'Ya existe un empleado con ese correo' },
            { status: 400 }
          );
        }
      }

      let userId: string | null = null;

      // Si se solicita crear usuario, crearlo
      if (createUser) {
        // Verificar que el numero_empleado no esté usado como clave
        const existeClave = await prisma.user.findUnique({
          where: { clave: numero_empleado },
        });

        if (existeClave) {
          return NextResponse.json(
            { error: 'El número de empleado ya está siendo usado como clave de usuario' },
            { status: 400 }
          );
        }

        // Crear usuario vinculado
        const hashedPassword = await bcrypt.hash('Issste2025!', 10);

        const nuevoUsuario = await prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            clave: numero_empleado, // Empleados usan numero_empleado como clave
            name: nombre,
            email: correo || null,
            telefono: celular || null,
            password: hashedPassword,
            activo: true,
          },
        });

        userId = nuevoUsuario.id;
      }

      // Crear empleado
      const empleado = await prisma.empleados.create({
        data: {
          id: randomUUID(),
          numero_empleado,
          nombre,
          cargo,
          servicio,
          turno,
          correo,
          celular,
          activo,
          user_id: userId || null,
          updatedAt: new Date(),
        },
        include: {
          User: {
            select: {
              id: true,
              clave: true,
              email: true,
              name: true,
              activo: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        empleado,
        message: createUser
          ? 'Empleado y usuario creados exitosamente. Contraseña inicial: Issste2025!'
          : 'Empleado creado exitosamente',
      });
    } catch (error) {
      return NextResponse.json({ error: 'Error al crear empleado' }, { status: 500 });
    }
  }
);
