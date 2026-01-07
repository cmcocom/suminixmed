import { writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const folder: string = (data.get('folder') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generar un nombre único para el archivo
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9-.]/g, '')}`;
    const uploadDir = join(process.cwd(), 'public/uploads', folder);
    const path = join(uploadDir, filename);

    // Crear directorio si no existe
    const { mkdir } = await import('fs/promises');
    await mkdir(uploadDir, { recursive: true });

    await writeFile(path, buffer);

    const imageUrl = `/uploads/${folder}/${filename}`;

    return NextResponse.json({
      success: true,
      url: imageUrl, // ✅ Usar 'url' para consistencia
      path: imageUrl, // Mantener 'path' por compatibilidad
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al procesar el archivo' }, { status: 500 });
  }
}
