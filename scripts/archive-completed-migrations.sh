#!/bin/bash

# Script para ARCHIVAR migraciones completadas
# Mueve scripts de migración ya ejecutados a carpeta de archivo
# Creado: 8 de octubre de 2025

echo "📦 ARCHIVO DE MIGRACIONES COMPLETADAS"
echo "======================================"
echo ""

# Crear estructura de archivo
echo "📁 Creando estructura de archivo..."
mkdir -p scripts/archive/migrations/{rbac,data,sql}
mkdir -p scripts/archive/analysis
mkdir -p scripts/archive/debug

# Contador
ARCHIVED=0

echo ""
echo "🔄 Moviendo scripts de migración RBAC completadas..."

# Scripts RBAC completados (ya aplicados en el sistema)
RBAC_SCRIPTS=(
  "actualizar-"
  "agregar-"
  "ajustar-"
  "aplicar-"
  "asegurar-"
  "asignar-"
  "completar-"
  "configurar-"
  "corregir-"
  "migrar-"
  "modificar-"
  "normalizar-"
  "preparar-"
  "reactivar-"
  "registrar-"
  "restablecer-"
  "restaurar-"
  "sincronizar-"
)

for prefix in "${RBAC_SCRIPTS[@]}"; do
  for file in ${prefix}*.mjs; do
    if [ -f "$file" ]; then
      echo "   📦 $file"
      mv "$file" scripts/archive/migrations/rbac/
      ((ARCHIVED++))
    fi
  done
done

echo ""
echo "🔄 Moviendo scripts de análisis completados..."

# Scripts de análisis
ANALYSIS_PREFIXES=(
  "analisis-"
  "analyze-"
  "consultar-"
  "inspeccionar-"
  "listar-"
  "mostrar-"
  "query-"
)

for prefix in "${ANALYSIS_PREFIXES[@]}"; do
  for file in ${prefix}*.mjs; do
    if [ -f "$file" ]; then
      echo "   📦 $file"
      mv "$file" scripts/archive/analysis/
      ((ARCHIVED++))
    fi
  done
done

echo ""
echo "🔄 Moviendo scripts de verificación completados..."

# Scripts de verificación
for file in check-*.mjs verificar-*.mjs validar-*.mjs; do
  if [ -f "$file" ]; then
    echo "   📦 $file"
    mv "$file" scripts/archive/analysis/
    ((ARCHIVED++))
  fi
done

echo ""
echo "🔄 Moviendo scripts SQL de migración..."

# Scripts SQL de migración
SQL_MIGRATION_PREFIXES=(
  "agregar-"
  "admin-"
  "clear-"
  "fix-"
  "restore-"
  "update-"
)

for prefix in "${SQL_MIGRATION_PREFIXES[@]}"; do
  for file in ${prefix}*.sql; do
    if [ -f "$file" ]; then
      echo "   📦 $file"
      mv "$file" scripts/archive/migrations/sql/
      ((ARCHIVED++))
    fi
  done
done

echo ""
echo "🔄 Moviendo scripts de auditoría completados..."

# Scripts de auditoría
for file in auditoria-*.mjs RESUMEN-*.mjs; do
  if [ -f "$file" ]; then
    echo "   📦 $file"
    mv "$file" scripts/archive/migrations/rbac/
    ((ARCHIVED++))
  fi
done

# Mover scripts útiles de mantenimiento a su carpeta correcta
echo ""
echo "📂 Organizando scripts de mantenimiento activos..."

mkdir -p scripts/maintenance
mkdir -p scripts/seed

KEEP_ACTIVE=0

if [ -f "cleanup-sessions.js" ]; then
  echo "   📂 cleanup-sessions.js → scripts/maintenance/"
  mv "cleanup-sessions.js" scripts/maintenance/
  ((KEEP_ACTIVE++))
fi

if [ -f "create-demo-data.js" ]; then
  echo "   📂 create-demo-data.js → scripts/seed/"
  mv "create-demo-data.js" scripts/seed/
  ((KEEP_ACTIVE++))
fi

# Crear README en carpeta de archivo
cat > scripts/archive/README.md << 'EOF'
# Archivo de Scripts Completados

Esta carpeta contiene scripts de migración, análisis y verificación que ya fueron ejecutados y completados.

## Estructura

- `migrations/rbac/` - Scripts de migración RBAC aplicados
- `migrations/data/` - Scripts de migración de datos aplicados
- `migrations/sql/` - Scripts SQL de migración aplicados
- `analysis/` - Scripts de análisis una vez ejecutados
- `debug/` - Scripts de debug/verificación completados

## ⚠️ Importante

Estos scripts están archivados para referencia histórica pero NO deben ejecutarse nuevamente ya que:
- Los cambios ya están aplicados en el sistema
- Podrían causar duplicados o conflictos
- Sirven como documentación de decisiones pasadas

## 💡 Uso

Consultar estos scripts solo para:
- Entender cómo se hizo una migración específica
- Referencia para crear nuevas migraciones similares
- Auditoría de cambios históricos
EOF

echo ""
echo "======================================"
echo "✅ Archivo completado"
echo ""
echo "📊 Resumen:"
echo "   - $ARCHIVED scripts archivados"
echo "   - $KEEP_ACTIVE scripts movidos a carpetas activas"
echo ""
echo "📁 Scripts archivados en:"
echo "   - scripts/archive/migrations/rbac/"
echo "   - scripts/archive/migrations/sql/"
echo "   - scripts/archive/analysis/"
echo ""
echo "📁 Scripts activos en:"
echo "   - scripts/maintenance/"
echo "   - scripts/seed/"
echo ""
echo "💡 Los scripts archivados se conservan para referencia"
echo "   pero no afectan el rendimiento de compilación."
