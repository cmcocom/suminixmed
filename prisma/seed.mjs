import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ⚠️ SEGURIDAD: La contraseña debe ser proporcionada por variable de entorno
// Usar: SEED_PASSWORD=tu_contraseña_segura npm run seed
const SEED_PASSWORD = process.env.SEED_PASSWORD
if (!SEED_PASSWORD) {
  console.error('❌ ERROR: La variable de entorno SEED_PASSWORD es requerida')
  console.error('   Uso: SEED_PASSWORD=tu_contraseña npm run seed')
  console.error('   O agrega SEED_PASSWORD a tu archivo .env.local')
  process.exit(1)
}

async function main() {
  const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10)
  
  try {
    // Intentar crear el usuario
    const user = await prisma.user.create({
      data: {
        email: 'cmcocom@unidadc.com',
        password: hashedPassword,
        name: 'Cristian Cocom'
      },
    })
    
    console.log('✅ Usuario creado:', user)
  } catch (error) {
    if (error.code === 'P2002') {
      // Usuario ya existe, actualizarlo
      console.log('⚠️ Usuario ya existe, actualizando...')
      const user = await prisma.user.update({
        where: {
          email: 'cmcocom@unidadc.com'
        },
        data: {
          password: hashedPassword,
          name: 'Cristian Cocom'
        }
      })
      
      console.log('✅ Usuario actualizado:', user)
    } else {
      throw error
    }
  }

  // Crear entidad para el sistema
  try {
    const entidad = await prisma.entidad.create({
      data: {
        nombre: 'SuminixMed Sistema',
        rfc: 'SMD123456789',
        correo: 'admin@suminixmed.com',
        telefono: '555-0123',
        contacto: 'Administrador Sistema',
        licencia_usuarios_max: 5,
        tiempo_sesion_minutos: 10, // 10 minutos para testing
        estatus: 'activo'
      },
    })
    
    console.log('✅ Entidad creada:', entidad)
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️ Entidad ya existe, omitiendo...')
      const entidad = await prisma.entidad.findUnique({
        where: { rfc: 'SMD123456789' }
      })
      console.log('📋 Entidad existente:', entidad)
    } else {
      throw error
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
