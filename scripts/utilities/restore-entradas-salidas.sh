#!/bin/bash

# Script para restaurar tablas de entradas y salidas desde backup
# Fecha: 17 de octubre de 2025

set -e  # Detener en caso de error

BACKUP_FILE="./backups/suminixmed_backup_20251017_032045.sql.gz"
TEMP_SQL="/tmp/restore_entradas_salidas.sql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=========================================="
echo "RESTAURACIÓN DE ENTRADAS Y SALIDAS"
echo "=========================================="
echo ""
echo "📁 Archivo de backup: $BACKUP_FILE"
echo "🕐 Timestamp: $TIMESTAMP"
echo ""

# Verificar que existe el archivo
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: No se encontró el archivo de backup"
    exit 1
fi

# Verificar que tenemos la variable DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: Variable DATABASE_URL no está definida"
    exit 1
fi

echo "📦 Descomprimiendo backup..."
gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"
echo "✅ Backup descomprimido"
echo ""

# Crear backup de seguridad de las tablas actuales
echo "💾 Creando backup de seguridad de tablas actuales..."
SAFETY_BACKUP="./backups/entradas_salidas_before_restore_${TIMESTAMP}.sql.gz"

psql "$DATABASE_URL" <<EOF | gzip > "$SAFETY_BACKUP"
-- Backup de tablas antes de restaurar
\echo 'Respaldando entradas_inventario...'
COPY (SELECT * FROM entradas_inventario) TO STDOUT WITH (FORMAT CSV, HEADER);

\echo 'Respaldando partidas_entrada_inventario...'
COPY (SELECT * FROM partidas_entrada_inventario) TO STDOUT WITH (FORMAT CSV, HEADER);

\echo 'Respaldando salidas_inventario...'
COPY (SELECT * FROM salidas_inventario) TO STDOUT WITH (FORMAT CSV, HEADER);

\echo 'Respaldando partidas_salida_inventario...'
COPY (SELECT * FROM partidas_salida_inventario) TO STDOUT WITH (FORMAT CSV, HEADER);
EOF

echo "✅ Backup de seguridad creado: $SAFETY_BACKUP"
echo ""

# Extraer solo las tablas que necesitamos del backup
echo "📋 Extrayendo datos de entradas y salidas del backup..."

# Crear script SQL temporal con solo las tablas necesarias
cat > /tmp/restore_script.sql <<'EOSQL'
-- ==========================================
-- RESTAURACIÓN DE ENTRADAS Y SALIDAS
-- ==========================================

BEGIN;

-- 1. Eliminar datos actuales (en orden correcto por dependencias)
\echo 'Eliminando datos actuales...'

TRUNCATE TABLE partidas_entrada_inventario CASCADE;
TRUNCATE TABLE entradas_inventario CASCADE;
TRUNCATE TABLE partidas_salida_inventario CASCADE;
TRUNCATE TABLE salidas_inventario CASCADE;

\echo 'Datos actuales eliminados'

-- 2. Restaurar datos desde el backup
\echo 'Restaurando datos del backup...'

EOSQL

# Extraer los datos de las tablas del backup y agregarlos al script
echo "Extrayendo entradas_inventario..."
grep -A 100000 "COPY public.entradas_inventario" "$TEMP_SQL" | sed '/^\\\.$/q' >> /tmp/restore_script.sql

echo "Extrayendo partidas_entrada_inventario..."
grep -A 100000 "COPY public.partidas_entrada_inventario" "$TEMP_SQL" | sed '/^\\\.$/q' >> /tmp/restore_script.sql

echo "Extrayendo salidas_inventario..."
grep -A 100000 "COPY public.salidas_inventario" "$TEMP_SQL" | sed '/^\\\.$/q' >> /tmp/restore_script.sql

echo "Extrayendo partidas_salida_inventario..."
grep -A 100000 "COPY public.partidas_salida_inventario" "$TEMP_SQL" | sed '/^\\\.$/q' >> /tmp/restore_script.sql

# Agregar commit al final
cat >> /tmp/restore_script.sql <<'EOSQL'

COMMIT;

\echo ''
\echo '=========================================='
\echo 'RESTAURACIÓN COMPLETADA'
\echo '=========================================='
\echo ''

-- Mostrar estadísticas
SELECT 'entradas_inventario' as tabla, COUNT(*) as registros FROM entradas_inventario
UNION ALL
SELECT 'partidas_entrada_inventario', COUNT(*) FROM partidas_entrada_inventario
UNION ALL
SELECT 'salidas_inventario', COUNT(*) FROM salidas_inventario
UNION ALL
SELECT 'partidas_salida_inventario', COUNT(*) FROM partidas_salida_inventario;

EOSQL

echo "✅ Script de restauración preparado"
echo ""

# Mostrar preview de lo que se va a hacer
echo "📊 PREVIEW DE LA RESTAURACIÓN:"
echo "--------------------------------------"
echo "Se eliminarán TODAS las entradas y salidas actuales"
echo "Se restaurarán desde el backup del 17/10/2025 03:20 AM"
echo ""
echo "Tablas afectadas:"
echo "  - entradas_inventario"
echo "  - partidas_entrada_inventario"
echo "  - salidas_inventario"
echo "  - partidas_salida_inventario"
echo ""

read -p "¿Deseas continuar con la restauración? (escribe 'SI' para continuar): " confirmacion

if [ "$confirmacion" != "SI" ]; then
    echo "❌ Restauración cancelada"
    rm -f "$TEMP_SQL" /tmp/restore_script.sql
    exit 0
fi

echo ""
echo "🔄 Ejecutando restauración..."
echo ""

# Ejecutar la restauración
psql "$DATABASE_URL" -f /tmp/restore_script.sql

echo ""
echo "✅ RESTAURACIÓN COMPLETADA"
echo ""
echo "📋 Archivos creados:"
echo "  - Backup de seguridad: $SAFETY_BACKUP"
echo ""
echo "⚠️  IMPORTANTE:"
echo "  - Verifica que los datos sean correctos en la interfaz"
echo "  - Si algo salió mal, puedes restaurar desde: $SAFETY_BACKUP"
echo ""

# Limpiar archivos temporales
rm -f "$TEMP_SQL" /tmp/restore_script.sql

echo "🎉 Proceso completado"
