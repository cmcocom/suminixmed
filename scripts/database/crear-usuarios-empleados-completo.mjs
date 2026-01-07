import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

/**
 * Script para crear usuarios para todos los empleados del CSV
 * - Importa empleados faltantes
 * - Crea usuarios para cada empleado con su numero_empleado como clave
 * - Contraseña por defecto: "Issste2025!"
 */

async function main() {
  console.log('🚀 Iniciando creación de usuarios para empleados...\n');

  // 1. Leer el archivo CSV
  const csvPath = '/Users/cristian/www/suminixmed/LISTA DE ENFERMEROS .csv';
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`📄 Empleados en CSV: ${records.length}\n`);

  // 2. Estadísticas
  let empleadosCreados = 0;
  let empleadosExistentes = 0;
  let usuariosCreados = 0;
  let usuariosExistentes = 0;
  const errores = [];
  const passwordPorDefecto = await bcrypt.hash('Issste2025!', 10);

  // 3. Procesar cada registro
  for (const record of records) {
    const numeroEmpleado = record['NUM. EMPLEADO']?.trim();
    const nombre = record['NOMBRE']?.trim();
    const cargo = record['CARGO']?.trim();
    const servicio = record['SERVICIO']?.trim();
    const turno = record['TURNO']?.trim();
    const correo = record['CORREO']?.trim()?.toLowerCase();
    const celular = record['CELULAR']?.trim();

    // Validar que tenga número de empleado
    if (!numeroEmpleado) {
      errores.push({
        nombre,
        razon: 'Sin número de empleado',
      });
      continue;
    }

    try {
      // A. Verificar/crear empleado
      let empleado = await prisma.empleados.findUnique({
        where: { numero_empleado: numeroEmpleado },
        include: { user: true },
      });

      if (!empleado) {
        // Crear empleado
        empleado = await prisma.empleados.create({
          data: {
            numero_empleado: numeroEmpleado,
            nombre,
            cargo,
            servicio,
            turno,
            correo,
            celular,
          },
        });
        empleadosCreados++;
        console.log(`✅ Empleado creado: ${nombre} (${numeroEmpleado})`);
      } else {
        empleadosExistentes++;
      }

      // B. Verificar/crear usuario
      if (!empleado.user_id) {
        // Verificar si ya existe un usuario con esta clave
        const usuarioExistente = await prisma.user.findUnique({
          where: { clave: numeroEmpleado },
        });

        if (usuarioExistente) {
          // Vincular empleado a usuario existente
          await prisma.empleados.update({
            where: { id: empleado.id },
            data: { user_id: usuarioExistente.id },
          });
          usuariosExistentes++;
          console.log(`🔗 Empleado vinculado a usuario existente: ${nombre || numeroEmpleado}`);
        } else {
          // Crear nuevo usuario
          const nuevoUsuario = await prisma.user.create({
            data: {
              id: randomUUID(), // Generar UUID manualmente
              clave: numeroEmpleado,
              email: correo || `${numeroEmpleado}@issste.gob.mx`,
              name: nombre || `Empleado ${numeroEmpleado}`, // Nombre por defecto si está vacío
              telefono: celular,
              password: passwordPorDefecto,
              activo: true,
              is_system_user: false,
            },
          });

          // Vincular empleado al usuario
          await prisma.empleados.update({
            where: { id: empleado.id },
            data: { user_id: nuevoUsuario.id },
          });

          // Asignar rol básico de empleado
          const rolEmpleado = await prisma.rbac_roles.findFirst({
            where: { name: 'Empleado' },
          });

          if (rolEmpleado) {
            await prisma.rbac_user_roles.create({
              data: {
                user_id: nuevoUsuario.id,
                role_id: rolEmpleado.id,
              },
            });
          }

          usuariosCreados++;
          console.log(`✨ Usuario creado: ${nombre || numeroEmpleado} (clave: ${numeroEmpleado})`);
        }
      } else {
        usuariosExistentes++;
      }
    } catch (error) {
      errores.push({
        nombre,
        numeroEmpleado,
        razon: error.message,
      });
      console.error(`❌ Error procesando ${nombre} (${numeroEmpleado}): ${error.message}`);
    }
  }

  // 4. Resumen
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESUMEN DE IMPORTACIÓN');
  console.log('═'.repeat(60));
  console.log(`📄 Total en CSV:              ${records.length}`);
  console.log(`✅ Empleados creados:         ${empleadosCreados}`);
  console.log(`📋 Empleados ya existentes:   ${empleadosExistentes}`);
  console.log(`✨ Usuarios creados:          ${usuariosCreados}`);
  console.log(`🔗 Usuarios ya existentes:    ${usuariosExistentes}`);
  console.log(`❌ Errores:                   ${errores.length}`);
  console.log('═'.repeat(60));

  if (errores.length > 0) {
    console.log('\n⚠️  ERRORES ENCONTRADOS:');
    errores.forEach((error, index) => {
      console.log(`${index + 1}. ${error.nombre || 'Sin nombre'} (${error.numeroEmpleado || 'sin número'})`);
      console.log(`   Razón: ${error.razon}\n`);
    });
  }

  // 5. Verificación final
  const totalEmpleados = await prisma.empleados.count();
  const empleadosConUsuario = await prisma.empleados.count({
    where: { user_id: { not: null } },
  });
  const totalUsuarios = await prisma.user.count();

  console.log('\n📈 ESTADO FINAL DEL SISTEMA:');
  console.log('═'.repeat(60));
  console.log(`👥 Total empleados:           ${totalEmpleados}`);
  console.log(`🔗 Empleados con usuario:     ${empleadosConUsuario}`);
  console.log(`👤 Total usuarios:            ${totalUsuarios}`);
  console.log('═'.repeat(60));

  console.log('\n🔑 CREDENCIALES PARA PRUEBAS:');
  console.log('═'.repeat(60));
  console.log('Contraseña por defecto para todos los empleados: Issste2025!');
  console.log('\nEjemplos de login:');
  console.log('  Clave: 905887  (LUIS ENRIQUE ESCALANTE BRICEÑO)');
  console.log('  Clave: 358087  (FELICIA GENOVES GOMEZ)');
  console.log('  Clave: 904839  (GRISEL XOOL NIEVES)');
  console.log('  Password: Issste2025!');
  console.log('═'.repeat(60));
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('\n✅ Proceso completado exitosamente');
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Error fatal:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
