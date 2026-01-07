#!/usr/bin/env node
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function configurarSesionesUsuario888963() {
  try {
    console.log('\n🔧 CONFIGURANDO SESIONES CONCURRENTES PARA USUARIO 888963\n');
    
    // Buscar usuario con clave 888963
    const usuario = await prisma.user.findUnique({
      where: { clave: '888963' },
      select: {
        id: true,
        clave: true,
        name: true,
        email: true
      }
    });

    if (!usuario) {
      console.log('❌ No se encontró usuario con clave 888963');
      return;
    }

    console.log(`✅ Usuario encontrado:`);
    console.log(`   ID: ${usuario.id}`);
    console.log(`   Clave: ${usuario.clave}`);
    console.log(`   Nombre: ${usuario.name}`);
    console.log(`   Email: ${usuario.email}`);

    // Verificar si existe la tabla user_session_config
    const tablaExiste = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_session_config'
      );
    `;

    console.log(`\n📋 Tabla user_session_config existe: ${tablaExiste[0]?.exists ? 'SÍ' : 'NO'}`);

    if (!tablaExiste[0]?.exists) {
      console.log('\n🔨 Creando tabla user_session_config...');
      
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS user_session_config (
          user_id VARCHAR(255) PRIMARY KEY,
          max_concurrent_sessions INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE CASCADE
        );
      `;
      
      console.log('✅ Tabla creada exitosamente');
    }

    // Insertar o actualizar configuración para el usuario
    await prisma.$executeRaw`
      INSERT INTO user_session_config (user_id, max_concurrent_sessions, updated_at)
      VALUES (${usuario.id}, 3, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        max_concurrent_sessions = 3,
        updated_at = NOW();
    `;

    console.log('\n✅ Configuración aplicada exitosamente');
    console.log(`   Usuario 888963 puede tener hasta 3 sesiones concurrentes`);

    // Verificar la configuración
    const config = await prisma.$queryRaw`
      SELECT * FROM user_session_config WHERE user_id = ${usuario.id};
    `;

    console.log('\n📊 Configuración actual:');
    console.log(config[0]);

    console.log('\n✅ Proceso completado - El cambio es inmediato, no requiere reiniciar el servidor\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

configurarSesionesUsuario888963();
