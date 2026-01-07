#!/bin/bash

# Script para restaurar entradas y salidas usando pg_restore completo
# y luego limpiar solo lo que necesitamos

set -e

DATABASE_URL=${DATABASE_URL:-$(grep DATABASE_URL .env | cut -d '=' -f2)}

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: Variable DATABASE_URL no está definida"
  exit 1
fi

BACKUP_FILE="./backups/suminixmed_backup_20251017_032045.sql.gz"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "=========================================="
echo "RESTAURACIÓN COMPLETA DESDE BACKUP"
echo "=========================================="
echo ""
echo "📁 Archivo de backup: $BACKUP_FILE"
echo "🕐 Timestamp: $TIMESTAMP"
echo ""

# Verificar que existe el backup
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Error: No se encontró el archivo de backup: $BACKUP_FILE"
  exit 1
fi

# Crear backup de seguridad primero
echo "💾 Creando backup de seguridad COMPLETO de la base actual..."
pg_dump "$DATABASE_URL" | gzip > "./backups/complete_backup_before_restore_${TIMESTAMP}.sql.gz"
echo "✅ Backup de seguridad creado: ./backups/complete_backup_before_restore_${TIMESTAMP}.sql.gz"
echo ""

# Confirmar
read -p "⚠️  ADVERTENCIA: Esto restaurará la BASE DE DATOS COMPLETA al estado de las 03:20 AM. ¿Continuar? (escribe 'SI'): " confirm

if [ "$confirm" != "SI" ]; then
  echo "❌ Restauración cancelada"
  exit 0
fi

echo ""
echo "🔄 Restaurando base de datos completa..."
echo ""

# Descomprimir y restaurar
gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"

echo ""
echo "✅ RESTAURACIÓN COMPLETADA"
echo ""
echo "📋 Archivos creados:"
echo "  - Backup de seguridad: ./backups/complete_backup_before_restore_${TIMESTAMP}.sql.gz"
echo ""
echo "⚠️  IMPORTANTE:"
echo "  - La base de datos ha sido restaurada al estado de las 03:20 AM del 17/10/2025"
echo "  - Verifica que los datos sean correctos en la interfaz"
echo "  - Si algo salió mal, puedes restaurar desde: ./backups/complete_backup_before_restore_${TIMESTAMP}.sql.gz"
echo ""
echo "🎉 Proceso completado"
