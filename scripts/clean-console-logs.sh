#!/bin/bash

# Script para limpiar console.log de depuración innecesarios
# Mantiene solo console.error para errores críticos

echo "🧹 Limpiando console.log innecesarios..."

# Archivos a limpiar (excluyendo node_modules, .next, etc.)
FILES=$(find app -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.next/*" \
  ! -path "*/dist/*")

# Contador
TOTAL=0

for file in $FILES; do
  # Contar líneas con console.log/console.warn/console.debug que contienen emojis o marcadores de debug
  COUNT=$(grep -c "console\.\(log\|warn\|debug\)" "$file" 2>/dev/null || echo 0)
  
  if [ "$COUNT" -gt 0 ]; then
    echo "  📄 $file: $COUNT logs encontrados"
    TOTAL=$((TOTAL + COUNT))
  fi
done

echo ""
echo "📊 Total de console.log/warn/debug encontrados: $TOTAL"
echo ""
echo "⚠️  NOTA: Este script solo reporta. Para eliminar, se debe hacer manualmente"
echo "   o con un script más específico que preserve logs críticos."
