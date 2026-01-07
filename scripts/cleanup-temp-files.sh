#!/bin/bash

# Script para ELIMINAR archivos temporales seguros
# Solo elimina archivos de debug/test que ya no son necesarios
# Creado: 8 de octubre de 2025

echo "🗑️  DEPURACIÓN DE ARCHIVOS TEMPORALES"
echo "======================================"
echo ""

# Contador
DELETED=0

echo "🔍 Buscando archivos temporales para eliminar..."
echo ""

# 1. Scripts de debug temporales (.mjs)
echo "📝 Scripts de debug .mjs:"
for file in debug-*.mjs test-*.mjs; do
  if [ -f "$file" ]; then
    echo "   🗑️  $file"
    rm "$file"
    ((DELETED++))
  fi
done

# 2. Scripts de debug JavaScript
echo ""
echo "📝 Scripts de debug .js:"
FILES_JS=(
  "debug-sessions-flow.js"
  "test-api-audit.js"
  "test-audit-simple.js"
)

for file in "${FILES_JS[@]}"; do
  if [ -f "$file" ]; then
    echo "   🗑️  $file"
    rm "$file"
    ((DELETED++))
  fi
done

# 3. Scripts de solución temporal (ya aplicados en código)
echo ""
echo "📝 Scripts de fix temporal .mjs:"
for file in solucion-*.mjs; do
  if [ -f "$file" ]; then
    echo "   🗑️  $file"
    rm "$file"
    ((DELETED++))
  fi
done

# 4. Scripts de fix temporal JavaScript
if [ -f "solucion-menu-ordenes-compra.js" ]; then
  echo "   🗑️  solucion-menu-ordenes-compra.js"
  rm "solucion-menu-ordenes-compra.js"
  ((DELETED++))
fi

# 5. Archivos de reporte temporal
if [ -f "reporte-final.js" ]; then
  echo ""
  echo "📝 Reportes temporales:"
  echo "   🗑️  reporte-final.js"
  rm "reporte-final.js"
  ((DELETED++))
fi

# 6. Scripts SQL de verificación temporal
echo ""
echo "📝 Scripts SQL temporales:"
for file in check-*.sql test-*.sql verify-*.sql; do
  if [ -f "$file" ]; then
    echo "   🗑️  $file"
    rm "$file"
    ((DELETED++))
  fi
done

# 7. Logs temporales y archivos de caché
echo ""
echo "📝 Archivos de log temporal:"
for file in *.log *.tmp; do
  if [ -f "$file" ]; then
    echo "   🗑️  $file"
    rm "$file"
    ((DELETED++))
  fi
done

echo ""
echo "======================================"
echo "✅ Depuración completada"
echo ""
echo "📊 Resumen:"
echo "   - $DELETED archivos eliminados"
echo ""
echo "💡 Estos archivos eran temporales y seguros de eliminar."
echo "   No afectan la funcionalidad del sistema."
echo ""
echo "🚀 Siguiente paso: Ejecutar organize-files.sh para organizar el resto"
