// Usage:
//   node scripts/update-password.mjs <email> [newPassword]
// If newPassword is omitted, a strong random password will be generated and printed.

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function generateStrongPassword(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-={}[];:,.?/'
  let pwd = ''
  for (let i = 0; i < length; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)]
  }
  // Ensure basic complexity: at least one lower, upper, digit, symbol
  if (!/[a-z]/.test(pwd)) pwd += 'a'
  if (!/[A-Z]/.test(pwd)) pwd += 'A'
  if (!/[0-9]/.test(pwd)) pwd += '1'
  if (!/[!@#$%^&*()_+\-={}\[\];:,.?/]/.test(pwd)) pwd += '!'
  return pwd
}

async function main() {
  const [email, providedPassword] = process.argv.slice(2)
  if (!email) {
    console.error('Uso: node scripts/update-password.mjs <email> [newPassword]')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } })
  if (!user) {
    console.error(`Usuario no encontrado: ${email}`)
    process.exit(1)
  }

  const passwordPlain = providedPassword || generateStrongPassword()
  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash(passwordPlain, salt)

  const updated = await prisma.user.update({
    where: { email },
    data: { password: passwordHash },
    select: { id: true, email: true, activo: true, rol: true },
  })

  console.log('Contraseña actualizada correctamente para:')
  console.log(JSON.stringify(updated, null, 2))
  if (!providedPassword) {
    console.log('Nueva contraseña temporal (guárdala de forma segura):')
    console.log(passwordPlain)
  }
}

main()
  .catch((err) => {
    console.error('Error actualizando contraseña:', err?.message ?? err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
