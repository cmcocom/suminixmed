const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('[DEBUG] Consultando tablas públicas en esquema public...');
    const rows = await prisma.$queryRawUnsafe("SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
    console.log('[RESULT] tablas public (count=' + (rows.length || 0) + '):');
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error('[ERROR]', e && e.message ? e.message : e);
    if (e && e.code) console.error('[ERROR_CODE]', e.code);
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
