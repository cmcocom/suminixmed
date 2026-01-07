import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const backupDir = path.join(process.cwd(), 'backups');

    await fs.mkdir(backupDir, { recursive: true });

    const filepath = path.join(backupDir, file.name);
    await fs.writeFile(filepath, buffer);

    const stats = await fs.stat(filepath);

    const metadata = {
      filename: file.name,
      createdBy: session.user.email,
      description: 'Respaldo importado',
      timestamp: new Date().toISOString(),
      size: stats.size,
      format: file.name.endsWith('.sql') ? 'plain' : 'custom',
      validationStatus: 'pending',
    };

    const metadataPath = filepath + '.meta.json';
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    return NextResponse.json({
      success: true,
      filename: file.name,
      size: stats.size,
    });
  } catch (error: any) {
    console.error('[Backup] Error subiendo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
