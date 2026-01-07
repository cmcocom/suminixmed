import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PgBackupManager } from '@/lib/database/pg-backup-manager';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { filename } = body;

    if (!filename) {
      return NextResponse.json({ error: 'Filename requerido' }, { status: 400 });
    }

    const manager = new PgBackupManager();
    await manager.deleteBackup(filename);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Backup] Error eliminando:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
