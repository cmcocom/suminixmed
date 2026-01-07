#!/bin/bash

# Script para migrar tablas de inventarios, entradas y salidas desde backup del 4 de noviembre
# Archivo: restore-inventarios-entradas-salidas.sh

set -e  # Terminar en caso de error

# Configuración
BACKUP_FILE="backups/suminix-2025-11-04T06-38-51-426Z.backup"
DB_NAME="suminix"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_CURRENT="backup_antes_migracion_inventarios_${TIMESTAMP}.backup"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔄 MIGRACIÓN DE INVENTARIOS Y MOVIMIENTOS${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}📁 Backup origen: ${BACKUP_FILE}${NC}"
echo -e "${YELLOW}🎯 Base de datos: ${DB_NAME}${NC}"
echo ""

# Verificar que existe el backup
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: No se encuentra el archivo de backup: $BACKUP_FILE${NC}"
    exit 1
fi

# 1. CREAR BACKUP DE SEGURIDAD DE LAS TABLAS ACTUALES
echo -e "${BLUE}📦 1. Creando backup de seguridad de tablas actuales...${NC}"
pg_dump -h localhost -U postgres -d $DB_NAME -Fc \
    --table=inventario \
    --table=entradas_inventario \
    --table=partidas_entrada_inventario \
    --table=salidas_inventario \
    --table=partidas_salida_inventario \
    --table=categorias \
    --table=clientes \
    --table=proveedores \
    --table=almacenes \
    --table=tipos_entrada \
    --table=tipos_salida \
    --table=unidades_medida > $BACKUP_CURRENT

echo -e "${GREEN}✅ Backup de seguridad creado: $BACKUP_CURRENT${NC}"

# 2. EXTRAER TABLAS ESPECÍFICAS DEL BACKUP DEL 4 DE NOVIEMBRE
echo -e "${BLUE}🔍 2. Extrayendo tablas del backup del 4 de noviembre...${NC}"

# Lista de tablas a restaurar en orden de dependencias
TABLAS_RESTAURAR=(
    "unidades_medida"
    "categorias" 
    "almacenes"
    "tipos_entrada"
    "tipos_salida"
    "proveedores"
    "clientes"
    "inventario"
    "entradas_inventario"
    "partidas_entrada_inventario" 
    "salidas_inventario"
    "partidas_salida_inventario"
)

# 3. DESACTIVAR FOREIGN KEY CHECKS TEMPORALMENTE
echo -e "${BLUE}🔒 3. Preparando base de datos...${NC}"
psql -h localhost -U postgres -d $DB_NAME -c "
BEGIN;
-- Desactivar checks temporalmente
SET session_replication_role = replica;
"

# 4. LIMPIAR TABLAS EXISTENTES (en orden inverso para evitar FK conflicts)
echo -e "${BLUE}🧹 4. Limpiando tablas existentes...${NC}"
psql -h localhost -U postgres -d $DB_NAME -c "
-- Limpiar en orden inverso para evitar FK conflicts
TRUNCATE TABLE partidas_salida_inventario CASCADE;
TRUNCATE TABLE partidas_entrada_inventario CASCADE;
TRUNCATE TABLE salidas_inventario CASCADE;
TRUNCATE TABLE entradas_inventario CASCADE;
TRUNCATE TABLE inventario CASCADE;
TRUNCATE TABLE clientes CASCADE;
TRUNCATE TABLE proveedores CASCADE;
TRUNCATE TABLE tipos_salida CASCADE;
TRUNCATE TABLE tipos_entrada CASCADE;
TRUNCATE TABLE almacenes CASCADE;
TRUNCATE TABLE categorias CASCADE;
TRUNCATE TABLE unidades_medida CASCADE;
"

# 5. RESTAURAR CADA TABLA DESDE EL BACKUP
echo -e "${BLUE}📥 5. Restaurando tablas desde backup...${NC}"

for tabla in "${TABLAS_RESTAURAR[@]}"; do
    echo -e "${YELLOW}   Restaurando tabla: $tabla${NC}"
    
    # Restaurar solo esta tabla específica
    pg_restore -h localhost -U postgres -d $DB_NAME \
        --table=$tabla \
        --data-only \
        --disable-triggers \
        $BACKUP_FILE
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✅ $tabla restaurada exitosamente${NC}"
    else
        echo -e "${RED}   ❌ Error restaurando $tabla${NC}"
    fi
done

# 6. REACTIVAR FOREIGN KEY CHECKS Y HACER COMMIT
echo -e "${BLUE}🔓 6. Finalizando transacción...${NC}"
psql -h localhost -U postgres -d $DB_NAME -c "
-- Reactivar checks
SET session_replication_role = DEFAULT;
COMMIT;
"

# 7. VERIFICAR INTEGRIDAD DE DATOS
echo -e "${BLUE}✅ 7. Verificando integridad de datos...${NC}"

# Contar registros en cada tabla
echo -e "${YELLOW}📊 Conteo de registros restaurados:${NC}"
psql -h localhost -U postgres -d $DB_NAME -c "
SELECT 'inventario' as tabla, COUNT(*) as registros FROM inventario
UNION ALL
SELECT 'entradas_inventario', COUNT(*) FROM entradas_inventario  
UNION ALL
SELECT 'partidas_entrada_inventario', COUNT(*) FROM partidas_entrada_inventario
UNION ALL
SELECT 'salidas_inventario', COUNT(*) FROM salidas_inventario
UNION ALL 
SELECT 'partidas_salida_inventario', COUNT(*) FROM partidas_salida_inventario
UNION ALL
SELECT 'categorias', COUNT(*) FROM categorias
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'proveedores', COUNT(*) FROM proveedores
UNION ALL
SELECT 'almacenes', COUNT(*) FROM almacenes
UNION ALL
SELECT 'tipos_entrada', COUNT(*) FROM tipos_entrada
UNION ALL
SELECT 'tipos_salida', COUNT(*) FROM tipos_salida
UNION ALL
SELECT 'unidades_medida', COUNT(*) FROM unidades_medida;
"

# 8. VERIFICAR RELACIONES FK
echo -e "${BLUE}🔗 8. Verificando integridad referencial...${NC}"
psql -h localhost -U postgres -d $DB_NAME -c "
-- Verificar que no hay FK rotas en inventario
SELECT 'inventario_categoria' as verificacion, COUNT(*) as problemas 
FROM inventario i 
LEFT JOIN categorias c ON i.categoria_id = c.id 
WHERE i.categoria_id IS NOT NULL AND c.id IS NULL

UNION ALL

-- Verificar entradas con proveedores
SELECT 'entradas_proveedor', COUNT(*) 
FROM entradas_inventario e 
LEFT JOIN proveedores p ON e.proveedor_id = p.id 
WHERE e.proveedor_id IS NOT NULL AND p.id IS NULL

UNION ALL

-- Verificar salidas con clientes  
SELECT 'salidas_cliente', COUNT(*)
FROM salidas_inventario s 
LEFT JOIN clientes c ON s.cliente_id = c.id 
WHERE s.cliente_id IS NOT NULL AND c.id IS NULL;
"

# 9. REGENERAR ESTADÍSTICAS DE TABLAS
echo -e "${BLUE}📈 9. Regenerando estadísticas de PostgreSQL...${NC}"
psql -h localhost -U postgres -d $DB_NAME -c "
ANALYZE inventario;
ANALYZE entradas_inventario;
ANALYZE partidas_entrada_inventario; 
ANALYZE salidas_inventario;
ANALYZE partidas_salida_inventario;
ANALYZE categorias;
ANALYZE clientes;
ANALYZE proveedores;
ANALYZE almacenes;
ANALYZE tipos_entrada;
ANALYZE tipos_salida;
ANALYZE unidades_medida;
"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ MIGRACIÓN COMPLETADA EXITOSAMENTE${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}📋 Resumen:${NC}"
echo -e "${YELLOW}   • Backup de seguridad: $BACKUP_CURRENT${NC}"
echo -e "${YELLOW}   • Origen: $BACKUP_FILE${NC}"
echo -e "${YELLOW}   • Tablas migradas: ${#TABLAS_RESTAURAR[@]}${NC}"
echo ""
echo -e "${BLUE}🔍 Próximos pasos recomendados:${NC}"
echo -e "${BLUE}   1. Verificar reportes de entradas/salidas${NC}"
echo -e "${BLUE}   2. Revisar inventario actualizado${NC}"
echo -e "${BLUE}   3. Probar movimientos de entrada/salida${NC}"
echo ""
echo -e "${GREEN}🎉 Listo para usar!${NC}"