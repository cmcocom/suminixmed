import { prisma } from './prisma';

/**
 * Genera una clave única para un usuario
 * Formato: cve-XXXXXX (6 dígitos aleatorios)
 */
export async function generarClaveUsuario(): Promise<string> {
  let clave: string;
  let existe: boolean;

  do {
    // Generar 6 dígitos aleatorios
    const numeros = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');

    clave = `cve-${numeros}`;

    // Verificar si ya existe
    const usuario = await prisma.user.findUnique({
      where: { clave },
    });

    existe = !!usuario;
  } while (existe);

  return clave;
}

/**
 * Valida que una clave no esté en uso
 */
export async function validarClaveDisponible(clave: string): Promise<boolean> {
  const usuario = await prisma.user.findUnique({
    where: { clave },
  });

  return !usuario;
}

/**
 * Valida que un número de empleado no esté usado como clave en otro usuario
 * (útil al convertir usuario a empleado)
 */
export async function validarNumeroEmpleadoDisponible(
  numeroEmpleado: string,
  excludeUserId?: string
): Promise<boolean> {
  const where: { clave: string; id?: { not: string } } = { clave: numeroEmpleado };

  if (excludeUserId) {
    where.id = { not: excludeUserId };
  }

  const usuario = await prisma.user.findFirst({ where });

  return !usuario;
}
