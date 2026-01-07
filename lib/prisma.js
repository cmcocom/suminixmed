// Wrapper ESM para reexportar prisma desde TypeScript
// Cargar TypeScript directamente si se ejecuta en entorno que soporta ts-node/register opcional
// Intento 1: importar el archivo .ts directamente (Node >=20 puede resolver con loaders experimentales si configurado)
let mod;
try {
  mod = await import('./prisma.ts');
} catch (e) {
  // Fallback: usar compilación runtime muy básica (no implementada aquí)
  throw new Error('No se pudo cargar prisma.ts: ' + e.message);
}
export const prisma = mod.prisma;
