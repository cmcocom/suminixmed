import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PgBackupManager } from '@/lib/database/pg-backup-manager';
// prisma import removed (unused) - historial de backups está comentado
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { filename, createNew = false, targetDb } = body;

    if (!filename) {
      return NextResponse.json({ error: 'Filename requerido' }, { status: 400 });
    }

    const manager = new PgBackupManager();
    const result = await manager.restoreBackup(filename, {
      createNew,
      targetDb,
    });

    // TODO: Agregar modelo backup_history al schema de Prisma
    // try {
    //   await prisma.backup_history.create({
    //     data: {
    //       filename: `restore_${filename}`,
    //       status: 'success',
    //       size_bytes: BigInt(0),
    //       tables_backed_up: result.tablesRestored || 0,
    //       backup_type: 'restore',
    //       created_by: session.user.email,
    //       description: `Restauración desde ${filename}`,
    //       backup_method: 'pg_restore'
    //     }
    //   });
    // } catch (error) {
    //   console.error('[Backup] Error en historial:', error);
    // }

    return NextResponse.json({
      success: true,
      tablesRestored: result.tablesRestored,
      preBackupFile: result.preBackupFile,
    });
  } catch (error: any) {
    logger.error('[Backup] Error restaurando:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
