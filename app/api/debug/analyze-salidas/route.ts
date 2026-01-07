import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(_request: NextRequest) {
  try {
    logger.debug('🔍 Analizando datos de salidas...');

    // Obtener todas las salidas con sus relaciones
    const salidas = await prisma.salidas_inventario.findMany({
      include: {
        tipos_salida: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          },
        },
        clientes: {
          select: {
            id: true,
            nombre: true,
            empresa: true,
          },
        },
      },
      orderBy: {
        fecha_creacion: 'desc',
      },
      take: 10, // Solo las últimas 10
    });

    logger.debug(`📊 Salidas encontradas: ${salidas.length}`);

    const analysis = {
      total: salidas.length,
      conMotivoProblematico: 0,
      sinTipoSalida: 0,
      sinCliente: 0,
      ejemplos: [] as any[],
    };

    salidas.forEach((salida) => {
      const ejemplo = {
        id: salida.id,
        motivo: salida.motivo,
        tipoSalidaId: salida.tipo_salida_id,
        tipoSalidaNombre: salida.tipos_salida?.nombre || 'Sin tipo',
        clienteId: salida.cliente_id,
        clienteNombre: salida.clientes?.nombre || 'Sin cliente',
        fecha: salida.fecha_creacion,
      };

      analysis.ejemplos.push(ejemplo);

      // Detectar problemas
      if (salida.motivo && salida.motivo.includes('-') && salida.motivo.includes('Cliente:')) {
        analysis.conMotivoProblematico++;
      }

      if (!salida.tipo_salida_id) {
        analysis.sinTipoSalida++;
      }

      if (!salida.cliente_id) {
        analysis.sinCliente++;
      }
    });

    logger.debug('📋 Análisis completado:', analysis);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    logger.error('❌ Error en análisis:', error);
    return NextResponse.json({ error: 'Error en análisis' }, { status: 500 });
  }
}
