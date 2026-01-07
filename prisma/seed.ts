import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  // SEGURIDAD: Usar variable de entorno para la contraseña
  const seedPassword = process.env.SEED_PASSWORD
  if (!seedPassword) {
    throw new Error(
      'ERROR: Variable de entorno SEED_PASSWORD no definida.\n' +
      'Definir con: export SEED_PASSWORD="tu-contraseña-segura"'
    )
  }
  
  const hashedPassword = await bcrypt.hash(seedPassword, 10)
  
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      clave: 'cve-888963',
      email: 'cmcocom@unidadc.com',
      password: hashedPassword,
      name: 'Usuario Sistema'
    },
  })
  
  console.log('Usuario creado:', user)
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
