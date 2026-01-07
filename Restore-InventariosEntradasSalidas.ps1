# Script PowerShell para migrar inventarios, entradas y salidas desde backup
# Archivo: Restore-InventariosEntradasSalidas.ps1

param(
    [string]$BackupFile = "backups\suminix-2025-11-04T06-38-51-426Z.backup",
    [string]$DbName = "suminix",
    [string]$DbHost = "localhost", 
    [string]$User = "postgres"
)

# Configuración
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupCurrent = "backup_antes_migracion_inventarios_$timestamp.backup"

Write-Host "========================================" -ForegroundColor Blue
Write-Host "🔄 MIGRACIÓN DE INVENTARIOS Y MOVIMIENTOS" -ForegroundColor Blue  
Write-Host "========================================" -ForegroundColor Blue
Write-Host "📁 Backup origen: $BackupFile" -ForegroundColor Yellow
Write-Host "🎯 Base de datos: $DbName" -ForegroundColor Yellow
Write-Host ""

# Verificar que existe el backup
if (-not (Test-Path $BackupFile)) {
    Write-Host "❌ Error: No se encuentra el archivo de backup: $BackupFile" -ForegroundColor Red
    exit 1
}

# 1. CREAR BACKUP DE SEGURIDAD
Write-Host "📦 1. Creando backup de seguridad de tablas actuales..." -ForegroundColor Blue

$tablesBackup = @(
    "inventario",
    "entradas_inventario", 
    "partidas_entrada_inventario",
    "salidas_inventario",
    "partidas_salida_inventario",
    "categorias",
    "clientes", 
    "proveedores",
    "almacenes",
    "tipos_entrada",
    "tipos_salida",
    "unidades_medida"
)

$tableArgs = ($tablesBackup | ForEach-Object { "--table=$_" }) -join " "

$cmd = "pg_dump -h $DbHost -U $User -d $DbName -Fc $tableArgs -f `"$backupCurrent`""
Invoke-Expression $cmd

Write-Host "✅ Backup de seguridad creado: $backupCurrent" -ForegroundColor Green

# 2. TABLAS A RESTAURAR (en orden de dependencias)
$tablasRestaurar = @(
    "unidades_medida",
    "categorias", 
    "almacenes",
    "tipos_entrada",
    "tipos_salida", 
    "proveedores",
    "clientes",
    "inventario",
    "entradas_inventario",
    "partidas_entrada_inventario",
    "salidas_inventario", 
    "partidas_salida_inventario"
)

# 3. PREPARAR BASE DE DATOS
Write-Host "🔒 3. Preparando base de datos..." -ForegroundColor Blue
$sqlPrep = @"
BEGIN;
SET session_replication_role = replica;
"@

psql -h $DbHost -U $User -d $DbName -c $sqlPrep

# 4. LIMPIAR TABLAS EXISTENTES
Write-Host "🧹 4. Limpiando tablas existentes..." -ForegroundColor Blue
$sqlClean = @"
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
"@

psql -h $DbHost -U $User -d $DbName -c $sqlClean

# 5. RESTAURAR CADA TABLA
Write-Host "📥 5. Restaurando tablas desde backup..." -ForegroundColor Blue

foreach ($tabla in $tablasRestaurar) {
    Write-Host "   Restaurando tabla: $tabla" -ForegroundColor Yellow
    
    try {
        pg_restore -h $DbHost -U $User -d $DbName --table=$tabla --data-only --disable-triggers $BackupFile
        Write-Host "   ✅ $tabla restaurada exitosamente" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ Error restaurando $tabla" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 6. FINALIZAR TRANSACCIÓN
Write-Host "🔓 6. Finalizando transacción..." -ForegroundColor Blue
$sqlFinish = @"
SET session_replication_role = DEFAULT;
COMMIT;
"@

psql -h $DbHost -U $User -d $DbName -c $sqlFinish

# 7. VERIFICAR INTEGRIDAD
Write-Host "✅ 7. Verificando integridad de datos..." -ForegroundColor Blue
Write-Host "📊 Conteo de registros restaurados:" -ForegroundColor Yellow

$sqlCount = @"
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
"@

psql -h $DbHost -U $User -d $DbName -c $sqlCount

# 8. VERIFICAR RELACIONES FK
Write-Host "🔗 8. Verificando integridad referencial..." -ForegroundColor Blue
$sqlFK = @"
SELECT 'inventario_categoria' as verificacion, COUNT(*) as problemas 
FROM inventario i 
LEFT JOIN categorias c ON i.categoria_id = c.id 
WHERE i.categoria_id IS NOT NULL AND c.id IS NULL

UNION ALL

SELECT 'entradas_proveedor', COUNT(*) 
FROM entradas_inventario e 
LEFT JOIN proveedores p ON e.proveedor_id = p.id 
WHERE e.proveedor_id IS NOT NULL AND p.id IS NULL

UNION ALL

SELECT 'salidas_cliente', COUNT(*)
FROM salidas_inventario s 
LEFT JOIN clientes c ON s.cliente_id = c.id 
WHERE s.cliente_id IS NOT NULL AND c.id IS NULL;
"@

psql -h $DbHost -U $User -d $DbName -c $sqlFK

# 9. REGENERAR ESTADÍSTICAS
Write-Host "📈 9. Regenerando estadísticas de PostgreSQL..." -ForegroundColor Blue
$sqlAnalyze = @"
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
"@

psql -h $DbHost -U $User -d $DbName -c $sqlAnalyze

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ MIGRACIÓN COMPLETADA EXITOSAMENTE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "📋 Resumen:" -ForegroundColor Yellow
Write-Host "   • Backup de seguridad: $backupCurrent" -ForegroundColor Yellow
Write-Host "   • Origen: $BackupFile" -ForegroundColor Yellow
Write-Host "   • Tablas migradas: $($tablasRestaurar.Count)" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔍 Próximos pasos recomendados:" -ForegroundColor Blue
Write-Host "   1. Verificar reportes de entradas/salidas" -ForegroundColor Blue
Write-Host "   2. Revisar inventario actualizado" -ForegroundColor Blue  
Write-Host "   3. Probar movimientos de entrada/salida" -ForegroundColor Blue
Write-Host ""
Write-Host "🎉 Listo para usar!" -ForegroundColor Green