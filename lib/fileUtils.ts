import { unlink } from 'fs/promises';
import { join } from 'path';

/**
 * Elimina un archivo de imagen del sistema de archivos
 * @param imagePath - La ruta de la imagen (ej: "/uploads/123456789-imagen.jpg")
 * @returns Promise<boolean> - true si se eliminó exitosamente, false en caso contrario
 */
export async function deleteImageFile(imagePath: string): Promise<boolean> {
  try {
    // Verificar que la ruta sea válida y esté en la carpeta uploads
    if (!imagePath || !imagePath.startsWith('/uploads/')) {
      return false;
    }

    // Construir la ruta absoluta del archivo
    const fullPath = join(process.cwd(), 'public', imagePath);

    // Intentar eliminar el archivo
    await unlink(fullPath);
    return true;
  } catch (error: unknown) {
    // Si el archivo no existe, no es un error crítico
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return true; // Consideramos esto como éxito porque el objetivo se cumplió
    }
    return false;
  }
}

/**
 * Valida si una ruta de imagen es válida para eliminar
 * @param imagePath - La ruta de la imagen
 * @returns boolean - true si es válida para eliminar
 */
export function isValidImagePath(imagePath: string | null): boolean {
  return !!(imagePath && imagePath.startsWith('/uploads/') && imagePath.length > 9);
}
