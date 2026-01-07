/**
 * API Routes para Usuarios
 * POST /api/usuarios - Crear nuevo usuario (NO empleado)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { generarClaveUsuario } from '@/lib/generar-clave-usuario';
import { createProtectedAPI } from '@/lib/api-auth';

/**
 * POST /api/usuarios
 * Crea un nuevo usuario NO vinculado a empleado
 * Body: { name, email?, telefono?, password, roles? }
 */
export const POST = createProtectedAPI(
  'AJUSTES_USUARIOS',
  'CREAR',
  async ({ user: currentUser, req }) => {
    try {
      const body = await req.json();
      const { name, email, telefono, password, roles } = body;

      // Validaciones
      if (!name || !password) {
        return NextResponse.json(
          { error: 'Faltan campos requeridos: name, password' },
          { status: 400 }
        );
      }

      // Verificar email único si se proporciona
      if (email) {
        const existeEmail = await prisma.user.findUnique({
          where: { email },
        });

        if (existeEmail) {
          return NextResponse.json(
            { error: 'Ya existe un usuario con ese email' },
            { status: 400 }
          );
        }
      }

      // Generar clave automática con formato cve-XXXXXX
      const clave = await generarClaveUsuario();

      // Hash de contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const usuario = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          clave,
          name,
          email: email || null,
          telefono: telefono || null,
          password: hashedPassword,
          activo: true,
        },
      });

      // Si se proporcionan roles, asignarlos
      if (roles && Array.isArray(roles) && roles.length > 0) {
        const userRoles = roles.map((roleId: string) => ({
          id: crypto.randomUUID(),
          user_id: usuario.id,
          role_id: roleId,
          assigned_by: currentUser.id,
        }));

        await prisma.rbac_user_roles.createMany({
          data: userRoles,
        });
      }

      return NextResponse.json({
        success: true,
        usuario: {
          id: usuario.id,
          clave: usuario.clave,
          name: usuario.name,
          email: usuario.email,
          telefono: usuario.telefono,
        },
        message: `Usuario creado exitosamente. Clave: ${clave}`,
      });
    } catch (error) {
      return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
    }
  }
);
