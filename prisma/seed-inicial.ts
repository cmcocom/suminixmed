/**
 * Script de Seed Inicial - SIMPLIFICADO
 * Crea usuario UNIDADC con acceso total
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...\n');

  // 1. Crear usuario UNIDADC
  console.log('👤 Creando usuario UNIDADC...');
  const hashedPassword = await bcrypt.hash('cmcocom.', 10);
  
  const usuario = await prisma.user.upsert({
    where: { email: 'cmcocom@unidadc.com' },
    update: {},
    create: {
      id: randomUUID(),
      clave: 'cve-888963',
      email: 'cmcocom@unidadc.com',
      password: hashedPassword,
      name: 'Cristian Cocom - UNIDADC',
      activo: true,
      emailVerified: new Date()
    }
  });
  console.log('✅ Usuario creado:', usuario.email);

  // 2. Crear rol UNIDADC
  console.log('\n📋 Creando rol UNIDADC...');
  
  const rolUNIDADC = await prisma.rbac_roles.upsert({
    where: { name: 'UNIDADC' },
    update: {},
    create: {
      id: 'rol-unidadc',
      name: 'UNIDADC',
      description: 'Supervisor con acceso completo - 100%',
      is_active: true,
      created_by: usuario.id
    }
  });
  console.log('✅ Rol UNIDADC creado');

  // 3. Asignar rol al usuario
  console.log('\n🔗 Asignando rol al usuario...');
  
  await prisma.rbac_user_roles.deleteMany({
    where: { user_id: usuario.id }
  });

  await prisma.rbac_user_roles.create({
    data: {
      id: randomUUID(),
      user_id: usuario.id,
      role_id: rolUNIDADC.id,
      assigned_by: usuario.id
    }
  });
  console.log('✅ Rol asignado');

  console.log('\n✨ Seed completado exitosamente!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email:    cmcocom@unidadc.com');
  console.log('🔑 Password: cmcocom.');
  console.log('👤 Rol:      UNIDADC (Acceso Total 100%)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('ℹ️  El rol UNIDADC tiene acceso completo mediante');
  console.log('   el sistema RBAC legacy (lib/auth-roles.ts)\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error en seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
