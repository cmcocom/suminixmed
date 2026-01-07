import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Filename requerido' }, { status: 400 });
    }

    const backupDir = path.join(process.cwd(), 'backups');
    const filepath = path.join(backupDir, filename);

    const fileBuffer = await fs.readFile(filepath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('[Backup] Error descargando:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
