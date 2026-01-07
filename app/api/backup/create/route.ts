import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PgBackupManager } from '@/lib/database/pg-backup-manager';
// prisma import removed (unused) - historial de backups está comentado
import fs from 'fs/promises';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { description, format = 'custom', compress = 9 } = body;

    const manager = new PgBackupManager();
    const result = await manager.createBackup({ format, compress, description });

    const metadataPath = result.filepath + '.meta.json';
    const metadata = {
      filename: result.filename,
      createdBy: session.user.email,
      description: description || 'Respaldo manual',
      timestamp: result.timestamp,
      size: result.size,
      checksum: result.checksum,
      tables: result.tables,
      format: result.format,
      validationStatus: 'valid',
      validationDate: new Date().toISOString(),
    };

    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    // TODO: Agregar modelo backup_history al schema de Prisma
    // try {
    //   await prisma.backup_history.create({
    //     data: {
    //       filename: result.filename,
    //       status: 'success',
    //       size_bytes: BigInt(result.size),
    //       tables_backed_up: result.tables || 0,
    //       backup_type: 'manual',
    //       created_by: session.user.email,
    //       description: description || 'Respaldo manual',
    //       backup_method: 'pg_dump',
    //       format: result.format,
    //       checksum_sha256: result.checksum
    //     }
    //   });
    // } catch (error) {
    //   console.error('[Backup] Error en historial:', error);
    // }

    return NextResponse.json({
      success: true,
      filename: result.filename,
      size: result.size,
      sizeFormatted: result.sizeFormatted,
      tables: result.tables,
    });
  } catch (error: any) {
    logger.error('[Backup] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
