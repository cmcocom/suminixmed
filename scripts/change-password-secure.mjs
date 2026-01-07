#!/usr/bin/env node
/**
 * Script seguro para cambio de contraseñas de usuarios
 * 
 * USO:
 *   USER_CLAVE=clave_usuario NEW_PASSWORD=contraseña_segura node scripts/change-password-secure.mjs
 * 
 * O usando archivo .env:
 *   Agrega USER_CLAVE y NEW_PASSWORD a tu .env.local y ejecuta:
 *   node scripts/change-password-secure.mjs
 * 
 * VARIABLES DE ENTORNO REQUERIDAS:
 *   - USER_CLAVE: Clave del usuario a modificar
 *   - NEW_PASSWORD: Nueva contraseña (mínimo 8 caracteres)
 * 
 * OPCIONALES:
 *   - FORCE_CHANGE: Si es "true", omite verificación de rol
 */

import pkg from '@prisma/client';
import bcrypt from 'bcryptjs';
const { PrismaClient } = pkg;

// Cargar variables de entorno si existe .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  const userClave = process.env.USER_CLAVE;
  const newPassword = process.env.NEW_PASSWORD;
  const forceChange = process.env.FORCE_CHANGE === 'true';

  // Validaciones
  if (!userClave) {
    console.error('❌ ERROR: La variable USER_CLAVE es requerida');
    console.error('   Uso: USER_CLAVE=clave NEW_PASSWORD=contraseña node scripts/change-password-secure.mjs');
    process.exit(1);
  }

  if (!newPassword) {
    console.error('❌ ERROR: La variable NEW_PASSWORD es requerida');
    console.error('   Uso: USER_CLAVE=clave NEW_PASSWORD=contraseña node scripts/change-password-secure.mjs');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('❌ ERROR: La contraseña debe tener al menos 8 caracteres');
    process.exit(1);
  }

  console.log('🔐 Cambio seguro de contraseña');
  console.log('='.repeat(50));
  console.log(`👤 Usuario a modificar: ${userClave}`);

  try {
    // Buscar usuario
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { clave: userClave },
          { clave: `cve-${userClave}` }
        ]
      }
    });

    if (!user) {
      console.error(`❌ Usuario con clave "${userClave}" no encontrado`);
      process.exit(1);
    }

    console.log(`✅ Usuario encontrado: ${user.name} (id: ${user.id})`);

    // Verificar roles (opcional)
    if (!forceChange) {
      const roles = await prisma.rbac_user_roles.findMany({
        where: { user_id: user.id },
        include: { rbac_roles: true }
      });

      const roleNames = roles.map(r => r.rbac_roles?.name).filter(Boolean);
      console.log(`📋 Roles del usuario: ${roleNames.join(', ') || '(ninguno)'}`);

      if (roleNames.includes('UNIDADC') || roleNames.includes('ADMINISTRADOR')) {
        console.log('⚠️  Usuario con rol privilegiado. Confirma con FORCE_CHANGE=true');
        console.log('   Ejemplo: USER_CLAVE=xxx NEW_PASSWORD=xxx FORCE_CHANGE=true node scripts/change-password-secure.mjs');
        process.exit(1);
      }
    }

    // Hashear y actualizar
    const hashed = await bcrypt.hash(newPassword, 12);
    
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed }
    });

    // Verificar hash
    const verify = await bcrypt.compare(newPassword, updated.password);
    
    console.log('');
    console.log('✅ Contraseña actualizada exitosamente');
    console.log(`🔍 Verificación de hash: ${verify ? '✅ OK' : '❌ Falló'}`);
    console.log('');
    console.log('⚠️  IMPORTANTE: Comunica la nueva contraseña de forma segura');
    console.log('   Considera obligar al usuario a cambiarla en el primer inicio');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
