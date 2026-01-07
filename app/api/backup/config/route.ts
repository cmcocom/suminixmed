import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkSessionModuleAccess } from '@/lib/rbac-simple';

// GET - Obtener configuración de respaldos automáticos
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const hasAccess = await checkSessionModuleAccess(session.user, 'RESPALDOS');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    // Obtener o crear configuración por defecto
    let config = await prisma.backup_config.findFirst();

    if (!config) {
      // Crear configuración por defecto
      const nextRun = calculateNextRun('daily', null, null, 3, 0);
      config = await prisma.backup_config.create({
        data: {
          enabled: false,
          frequency: 'daily',
          hour: 3, // 3 AM por defecto
          minute: 0,
          retentionDays: 30,
          nextRun: nextRun,
          updatedAt: new Date(),
        },
      });
    } else if (config.enabled && !config.nextRun) {
      // Si está habilitado pero no tiene nextRun, calcularlo
      const nextRun = calculateNextRun(
        config.frequency,
        config.dayOfWeek,
        config.dayOfMonth,
        config.hour,
        config.minute
      );

      config = await prisma.backup_config.update({
        where: { id: config.id },
        data: {
          nextRun: nextRun,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error obteniendo configuración de backup:', error);
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
  }
}

// PUT - Actualizar configuración de respaldos automáticos
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const hasAccess = await checkSessionModuleAccess(session.user, 'RESPALDOS');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const body = await request.json();
    const {
      enabled,
      frequency,
      dayOfWeek,
      dayOfMonth,
      hour,
      minute,
      retentionDays,
      retentionCount,
    } = body;

    // Validaciones
    if (hour < 0 || hour > 23) {
      return NextResponse.json({ error: 'Hora inválida (0-23)' }, { status: 400 });
    }

    if (minute < 0 || minute > 59) {
      return NextResponse.json({ error: 'Minuto inválido (0-59)' }, { status: 400 });
    }

    if (frequency === 'weekly' && (dayOfWeek < 0 || dayOfWeek > 6)) {
      return NextResponse.json({ error: 'Día de la semana inválido (0-6)' }, { status: 400 });
    }

    if (frequency === 'monthly' && (dayOfMonth < 1 || dayOfMonth > 31)) {
      return NextResponse.json({ error: 'Día del mes inválido (1-31)' }, { status: 400 });
    }

    if (retentionDays < 1) {
      return NextResponse.json({ error: 'Días de retención debe ser al menos 1' }, { status: 400 });
    }

    // Calcular próxima ejecución
    const nextRun = calculateNextRun(frequency, dayOfWeek, dayOfMonth, hour, minute);

    // Actualizar o crear configuración
    const existingConfig = await prisma.backup_config.findFirst();

    let config;
    if (existingConfig) {
      config = await prisma.backup_config.update({
        where: { id: existingConfig.id },
        data: {
          enabled,
          frequency,
          dayOfWeek: frequency === 'weekly' ? dayOfWeek : null,
          dayOfMonth: frequency === 'monthly' ? dayOfMonth : null,
          hour,
          minute,
          retentionDays,
          retentionCount: retentionCount || null,
          nextRun: enabled ? nextRun : null,
          updatedAt: new Date(),
        },
      });
    } else {
      config = await prisma.backup_config.create({
        data: {
          enabled,
          frequency,
          dayOfWeek: frequency === 'weekly' ? dayOfWeek : null,
          dayOfMonth: frequency === 'monthly' ? dayOfMonth : null,
          hour,
          minute,
          retentionDays,
          retentionCount: retentionCount || null,
          nextRun: enabled ? nextRun : null,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada correctamente',
      config,
    });
  } catch (error) {
    console.error('Error actualizando configuración de backup:', error);
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
  }
}

// Función auxiliar para calcular la próxima ejecución
function calculateNextRun(
  frequency: string,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null,
  hour?: number,
  minute?: number
): Date {
  const now = new Date();
  const next = new Date();

  next.setHours(hour || 0, minute || 0, 0, 0);

  switch (frequency) {
    case 'daily':
      // Si ya pasó la hora de hoy, programar para mañana
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      break;

    case 'weekly':
      // Encontrar el próximo día de la semana especificado
      const targetDay = dayOfWeek || 1;
      const currentDay = next.getDay();
      let daysToAdd = targetDay - currentDay;

      if (daysToAdd < 0 || (daysToAdd === 0 && next <= now)) {
        daysToAdd += 7;
      }

      next.setDate(next.getDate() + daysToAdd);
      break;

    case 'monthly':
      // Programar para el día específico del mes
      const targetDayOfMonth = dayOfMonth || 1;
      next.setDate(targetDayOfMonth);

      // Si ya pasó este mes, programar para el próximo
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }

      // Manejar meses con menos días (ej: 31 en febrero se ajusta a 28/29)
      if (next.getDate() !== targetDayOfMonth) {
        // Se ajustó al último día del mes anterior
        next.setDate(0); // Último día del mes anterior
      }
      break;
  }

  return next;
}
