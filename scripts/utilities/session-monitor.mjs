// Live monitor for session changes using Postgres LISTEN/NOTIFY and Prisma queries.
// Usage: node scripts/session-monitor.mjs

import pg from 'pg'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getStats() {
  const now = new Date().toISOString()
  const activeCount = await prisma.activeSession.count()
  const concurrentUsers = await prisma.activeSession.groupBy({ by: ['userId'] })
  const concurrentCount = concurrentUsers.length
  // get_license_stats() may be defined in DB; fetch via raw
  let license = null
  try {
    const res = await prisma.$queryRawUnsafe(
      'SELECT * FROM get_license_stats() LIMIT 1'
    )
    license = Array.isArray(res) && res.length ? res[0] : null
  } catch {}
  console.log(`[${now}] active_sessions=${activeCount}, concurrent_users=${concurrentCount}, license=`, license)
}

async function main() {
  await getStats()

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  client.on('notification', async (msg) => {
    console.log('NOTIFY:', msg.channel, msg.payload)
    await getStats()
  })
  await client.query('LISTEN session_change')
  console.log('Listening on channel session_change...')

  // Periodic stats
  setInterval(getStats, 15000)
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
