import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import DatabaseService from '@/lib/database.service';
import { createProtectedAPI, applyRoleBasedFilter, API_ERRORS } from '@/lib/api-auth';
// Removed unused generarClaveUsuario import to satisfy linter
// import { generarClaveUsuario } from "@/lib/generar-clave-usuario";
import { hasSystemRole, checkUserPermission } from '@/lib/rbac-dynamic';

// GET /api/users - Obtener todos los usuarios con roles RBAC
export const GET = createProtectedAPI('AJUSTES_USUARIOS', 'LEER', async ({ user, req }) => {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format');

  // ✅ SISTEMA: Verificar si el usuario actual tiene roles de sistema
  const userHasSystemRole = await hasSystemRole(user.id);

  // Aplicar filtro basado en rol
  const filter = applyRoleBasedFilter(user, {});
  // Limpiar posible marcador `__ownerFilter` para evitar pasarlo directamente a Prisma.
  const cleanedFilter = { ...filter } as Record<string, any>;
  if (cleanedFilter.__ownerFilter) delete cleanedFilter.__ownerFilter;

  // ✅ Obtener todos los usuarios
  const users = await prisma.user.findMany({
    where: {
      ...cleanedFilter,
      is_system_user: false, // Siempre ocultar superusuarios flag
    },
    select: {
      id: true,
      clave: true,
      name: true,
      email: true,
      image: true,
      activo: true,
      createdAt: true,
      updatedAt: true,
      rbac_user_roles: {
        select: {
          rbac_roles: {
            select: {
              id: true,
              name: true,
              description: true,
              is_system_role: true,
            },
          },
        },
      },
      empleados: {
        select: {
          id: true,
          numero_empleado: true,
          nombre: true,
          cargo: true,
          servicio: true,
          turno: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // ✅ FILTRAR usuarios con roles de sistema (solo si el usuario actual NO tiene rol de sistema)
  const filteredUsers = userHasSystemRole
    ? users // Usuario con rol de sistema ve TODOS los usuarios
    : users.filter((u) => {
        // Filtrar usuarios que NO tienen ningún rol de sistema
        const hasAnySystemRole = u.rbac_user_roles.some(
          (ur) => ur.rbac_roles.is_system_role === true
        );
        return !hasAnySystemRole;
      });

  // Formato legacy para compatibilidad con stock-fijo y otras páginas
  if (format === 'legacy') {
    return NextResponse.json({ users: filteredUsers });
  }

  // Formato estándar para la página de usuarios: {success: true, data: [...]}
  return NextResponse.json({ success: true, data: filteredUsers });
});

// POST /api/users - Crear nuevo usuario con rol RBAC
export const POST = createProtectedAPI('AJUSTES_USUARIOS', 'CREAR', async ({ user, req }) => {
  const data = await req.json();
  // Validar datos de entrada - actualizado para roleId y clave
  const validatedData = {
    clave: data.clave,
    email: data.email,
    password: data.password,
    name: data.name,
    image: data.image,
    activo: data.activo,
    roleId: data.roleId,
  };
  // Verificaciones basadas en RBAC dinámico
  const isSystemUser = await hasSystemRole(user.id);

  // Comprobar permisos específicos para asignación de roles
  const canAssignAdmin = await checkUserPermission(user.id, 'USUARIOS', 'ASIGNAR_ROL_ADMIN');
  const canAssignColaborador = await checkUserPermission(
    user.id,
    'USUARIOS',
    'ASIGNAR_ROL_COLABORADOR_OPERADOR'
  );

  // ✅ SISTEMA: Verificar que el rol existe y está activo
  // Usuarios sistema pueden asignar CUALQUIER rol
  const targetRole = await prisma.rbac_roles.findFirst({
    where: {
      id: validatedData.roleId,
      is_active: true,
      // Solo filtrar roles de sistema si el usuario NO es sistema
      ...(isSystemUser ? {} : { is_system_role: false }),
    },
  });

  if (!targetRole) {
    return NextResponse.json(
      {
        success: false,
        error: isSystemUser
          ? 'Rol especificado no válido o inactivo'
          : 'Rol especificado no válido, inactivo o es un rol de sistema',
      },
      { status: 400 }
    );
  }

  // ✅ SISTEMA: Verificar permisos para asignar roles
  // Usuarios sistema tienen permiso para TODO
  if (!isSystemUser) {
    if (targetRole.name === 'Administrador' && !canAssignAdmin) {
      return NextResponse.json(
        {
          ...API_ERRORS.FORBIDDEN,
          details: 'Permisos insuficientes: se requiere permiso para asignar Administrador',
        },
        { status: 403 }
      );
    }
    if (
      (targetRole.name === 'Colaborador' || targetRole.name === 'Operador') &&
      !canAssignColaborador
    ) {
      return NextResponse.json(
        {
          ...API_ERRORS.FORBIDDEN,
          details: 'Permisos insuficientes para crear usuarios con este rol',
        },
        { status: 403 }
      );
    }
  }

  // Verificar email único
  const existingUser = await prisma.user.findUnique({
    where: { email: validatedData.email },
  });

  if (existingUser) {
    return NextResponse.json(
      { success: false, error: 'El email ya está registrado' },
      { status: 409 }
    );
  }

  // Verificar clave única
  const existingClave = await prisma.user.findUnique({
    where: { clave: validatedData.clave },
  });

  if (existingClave) {
    return NextResponse.json(
      { success: false, error: 'La clave ya está registrada. Por favor usa una clave diferente.' },
      { status: 409 }
    );
  }

  // Hash de la contraseña
  const hashedPassword = await bcrypt.hash(validatedData.password, 12);

  // Preparar datos para crear usuario (sin rol estático)
  const createData = {
    id: crypto.randomUUID(),
    clave: validatedData.clave,
    email: validatedData.email,
    password: hashedPassword,
    name: validatedData.name,
    image: validatedData.image || null,
    activo: validatedData.activo !== undefined ? validatedData.activo : true,
  };
  // Crear usuario y asignar rol RBAC en transacción
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Crear usuario
      const newUser = await tx.user.create({
        data: createData,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          activo: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Asignar rol RBAC
      await tx.rbac_user_roles.create({
        data: {
          id: crypto.randomUUID(),
          user_id: newUser.id,
          role_id: validatedData.roleId,
          assigned_by: user.id,
        },
      });

      // Obtener usuario con rol asignado
      const userWithRole = await tx.user.findUnique({
        where: { id: newUser.id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          activo: true,
          createdAt: true,
          updatedAt: true,
          rbac_user_roles: {
            select: {
              rbac_roles: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      return userWithRole;
    });

    // Log de auditoría
    await DatabaseService.logAuditEvent(
      'User',
      result!.id,
      'CREATE_USER',
      { createdBy: user.id },
      {
        name: result!.name,
        email: result!.email,
        activo: result!.activo,
        role: targetRole.name,
      }
    );

    return NextResponse.json(
      { success: true, user: result, message: 'Usuario creado exitosamente' },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode =
      error && typeof error === 'object' && 'code' in error
        ? (error as { code: string }).code
        : undefined;

    // Manejar error de límite de usuarios concurrentes del trigger
    if (errorMessage.includes('límite máximo de usuarios concurrentes')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Límite de usuarios concurrentes alcanzado',
          details:
            'Se ha alcanzado el límite máximo de usuarios que pueden estar conectados simultáneamente. Espere a que expire alguna sesión o desconecte usuarios activos para crear un nuevo usuario.',
          type: 'CONCURRENT_USERS_LIMIT',
        },
        { status: 409 }
      );
    }

    // Manejar otros errores de base de datos
    if (errorCode === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Ya existe un usuario con este email' },
        { status: 409 }
      );
    }

    // Error genérico
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor al crear usuario',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
});
