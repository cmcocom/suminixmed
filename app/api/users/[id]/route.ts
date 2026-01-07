import { authOptions } from '@/lib/auth';
import { deleteImageFile, isValidImagePath } from '@/lib/fileUtils';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// PUT /api/users/[id] - Actualizar usuario con roles RBAC (v2)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Obtener los parámetros
    const { id } = await params;

    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { clave, name, email, password, image, activo, roleId } = await request.json();
    // Verificar si el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        rbac_user_roles: {
          include: { rbac_roles: true },
        },
      },
    });

    if (!existingUser) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    // ✅ PROTECCIÓN: No permitir modificar usuarios de sistema
    if (existingUser.is_system_user) {
      return NextResponse.json(
        { success: false, error: 'No se pueden modificar usuarios del sistema' },
        { status: 403 }
      );
    }

    // Verificar si el nuevo email ya está en uso por otro usuario
    const emailInUse = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id,
        },
      },
    });

    if (emailInUse) {
      return NextResponse.json(
        { success: false, error: 'El email ya está en uso' },
        { status: 400 }
      );
    }

    // Verificar si la nueva clave ya está en uso por otro usuario
    if (clave && clave !== existingUser.clave) {
      const claveInUse = await prisma.user.findFirst({
        where: {
          clave,
          NOT: {
            id,
          },
        },
      });

      if (claveInUse) {
        return NextResponse.json(
          { success: false, error: 'La clave ya está en uso. Por favor usa una clave diferente.' },
          { status: 400 }
        );
      }
    }

    // Preparar datos de actualización (sin rol estático)
    const updateData = {
      clave: clave || existingUser.clave,
      email,
      name,
      image: image || null,
      activo: activo !== undefined ? activo : existingUser.activo,
    } as {
      clave: string;
      email: string;
      name: string;
      image: string | null;
      activo: boolean;
      password?: string;
    };
    // Si se proporciona una nueva contraseña, hashearla
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Si la imagen cambió, eliminar la imagen anterior
    const imageChanged = existingUser.image !== updateData.image;
    if (imageChanged && isValidImagePath(existingUser.image)) {
      try {
        await deleteImageFile(existingUser.image!);
      } catch (error) {}
    }

    // Actualizar usuario y rol en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar datos del usuario
      await tx.user.update({
        where: { id },
        data: updateData,
      });

      // Si se proporciona un nuevo roleId, actualizar el rol
      if (roleId) {
        // ✅ SISTEMA: Verificar si el usuario actual es usuario sistema
        const currentUserRoles = await tx.rbac_user_roles.findMany({
          where: { user_id: session.user!.id! },
          include: { rbac_roles: true },
        });
        const isSystemUser = currentUserRoles.some((ur) => ur.rbac_roles.is_system_role === true);

        // Verificar que el rol existe y está activo
        // Usuarios sistema pueden asignar CUALQUIER rol
        const targetRole = await tx.rbac_roles.findFirst({
          where: {
            id: roleId,
            is_active: true,
            // Solo filtrar roles de sistema si el usuario NO es sistema
            ...(isSystemUser ? {} : { is_system_role: false }),
          },
        });

        if (!targetRole) {
          throw new Error(
            isSystemUser
              ? 'Rol especificado no válido o inactivo'
              : 'Rol especificado no válido, inactivo o es un rol de sistema'
          );
        }

        // Eliminar roles existentes del usuario
        await tx.rbac_user_roles.deleteMany({
          where: { user_id: id },
        });

        // Asignar nuevo rol
        await tx.rbac_user_roles.create({
          data: {
            id: `${id}_${roleId}_${Date.now()}`,
            user_id: id,
            role_id: roleId,
            assigned_by: session.user!.id!,
          },
        });
      }

      // Obtener usuario actualizado con rol
      return await tx.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          activo: true,
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
    });
    return NextResponse.json({
      success: true,
      user: result,
      message: 'Usuario actualizado exitosamente',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Eliminar usuario
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Obtener los parámetros
    const { id } = await params;

    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // ✅ PROTECCIÓN: No permitir eliminar usuarios de sistema
    if (user.is_system_user) {
      return NextResponse.json(
        { error: 'No se pueden eliminar usuarios del sistema' },
        { status: 403 }
      );
    }

    // No permitir eliminar el usuario actual
    if (session.user?.id === id) {
      return NextResponse.json({ error: 'No puedes eliminar tu propio usuario' }, { status: 400 });
    }

    // Eliminar la imagen del usuario si existe, antes de eliminar el usuario
    if (isValidImagePath(user.image)) {
      try {
        await deleteImageFile(user.image!); // ! porque isValidImagePath ya verificó que no es null
      } catch (error) {
        // Continuar con la eliminación del usuario aunque la imagen no se pueda eliminar
      }
    }

    // Eliminar usuario
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
