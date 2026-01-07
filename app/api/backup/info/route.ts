import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PgBackupManager } from '@/lib/database/pg-backup-manager';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const manager = new PgBackupManager();
    const info = await manager.getDatabaseInfo();

    return NextResponse.json(info);
  } catch (error: any) {
    console.error('[Backup] Error obteniendo info:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
