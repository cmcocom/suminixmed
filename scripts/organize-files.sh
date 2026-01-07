#!/bin/bash

# Script para organizar archivos y mejorar velocidad de compilación
# Creado: 8 de octubre de 2025

echo "🚀 Organizando archivos del proyecto..."
echo ""

# Crear carpetas principales
echo "📁 Creando estructura de carpetas..."
mkdir -p scripts/{migrations,analysis,sql}
mkdir -p docs/{analysis,migrations,fixes,general}

# Contar archivos antes
BEFORE_MJS=$(ls -1 *.mjs 2>/dev/null | wc -l | tr -d ' ')
BEFORE_SQL=$(ls -1 *.sql 2>/dev/null | wc -l | tr -d ' ')
BEFORE_MD=$(ls -1 *.md 2>/dev/null | wc -l | tr -d ' ')

echo "📊 Archivos encontrados:"
echo "   - $BEFORE_MJS archivos .mjs"
echo "   - $BEFORE_SQL archivos .sql"
echo "   - $BEFORE_MD archivos .md"
echo ""

# Mover scripts .mjs (todos a migrations primero)
echo "🔄 Moviendo scripts .mjs..."
mv *.mjs scripts/migrations/ 2>/dev/null || true

# Mover scripts de análisis a carpeta correcta
mv scripts/migrations/RESUMEN-*.mjs scripts/analysis/ 2>/dev/null || true
mv scripts/migrations/analisis-*.mjs scripts/analysis/ 2>/dev/null || true
mv scripts/migrations/check-*.mjs scripts/analysis/ 2>/dev/null || true
mv scripts/migrations/debug-*.mjs scripts/analysis/ 2>/dev/null || true
mv scripts/migrations/test-*.mjs scripts/analysis/ 2>/dev/null || true

# Mover scripts .sql
echo "🔄 Moviendo scripts .sql..."
mv *.sql scripts/sql/ 2>/dev/null || true

# Mover documentación .md
echo "🔄 Moviendo documentación .md..."
mv ANALISIS-*.md docs/analysis/ 2>/dev/null || true
mv CORRECCION-*.md docs/fixes/ 2>/dev/null || true
mv ACTUALIZACION-*.md docs/migrations/ 2>/dev/null || true
mv ASIGNACION-*.md docs/migrations/ 2>/dev/null || true
mv AUDITORIA-*.md docs/migrations/ 2>/dev/null || true
mv BUSQUEDA-*.md docs/fixes/ 2>/dev/null || true
mv ACLARACION-*.md docs/general/ 2>/dev/null || true
mv OPTIMIZACION-*.md docs/general/ 2>/dev/null || true

# Mover resto de .md a general
mv *.md docs/general/ 2>/dev/null || true

# Restaurar archivos importantes a la raíz
echo "📌 Restaurando archivos esenciales..."
mv docs/general/README.md . 2>/dev/null || true
mv docs/general/CHANGELOG.md . 2>/dev/null || true
mv docs/general/LICENSE.md . 2>/dev/null || true

# Limpiar carpetas vacías
echo "🧹 Limpiando carpetas vacías..."
find scripts -type d -empty -delete 2>/dev/null || true
find docs -type d -empty -delete 2>/dev/null || true

# Contar archivos después
AFTER_ROOT=$(ls -1 *.{mjs,sql,md} 2>/dev/null | wc -l | tr -d ' ')

echo ""
echo "✅ Organización completada!"
echo ""
echo "📊 Resultados:"
echo "   Antes: $((BEFORE_MJS + BEFORE_SQL + BEFORE_MD)) archivos en raíz"
echo "   Después: $AFTER_ROOT archivos en raíz"
echo ""
echo "📂 Archivos organizados en:"
echo "   - scripts/migrations/ - Scripts de migración"
echo "   - scripts/analysis/ - Scripts de análisis"
echo "   - scripts/sql/ - Scripts SQL"
echo "   - docs/analysis/ - Análisis del sistema"
echo "   - docs/migrations/ - Documentación de migraciones"
echo "   - docs/fixes/ - Documentación de correcciones"
echo "   - docs/general/ - Documentación general"
echo ""
echo "🚀 Ahora puedes limpiar el cache y reiniciar:"
echo "   rm -rf .next"
echo "   npm run dev"
echo ""
echo "⚡ Velocidad de compilación debería mejorar ~50%"
