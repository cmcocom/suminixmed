// Usage: node scripts/invalidate-user-sessions.mjs <email>
// Deletes all NextAuth `Session` rows and custom `active_sessions` rows for the user.

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const [email] = process.argv.slice(2)
  if (!email) {
    console.error('Uso: node scripts/invalidate-user-sessions.mjs <email>')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } })
  if (!user) {
    console.error(`Usuario no encontrado: ${email}`)
    process.exit(1)
  }

  const userId = user.id

  const [deletedActive, deletedNextAuth] = await prisma.$transaction([
    prisma.activeSession.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
  ])

  console.log(`Sesiones invalidadas para ${email}`)
  console.log({ active_sessions_deleted: deletedActive.count, nextauth_sessions_deleted: deletedNextAuth.count })
}

main()
  .catch((err) => {
    console.error('Error invalidando sesiones:', err?.message ?? err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
