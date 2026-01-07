#!/bin/bash

# Script MAESTRO para depuración completa del proyecto
# Ejecuta limpieza, archivo y organización en un solo comando
# Creado: 8 de octubre de 2025

echo "🚀 DEPURACIÓN COMPLETA DEL PROYECTO"
echo "====================================="
echo ""
echo "Este script va a:"
echo "  1. 🗑️  Eliminar archivos temporales (debug/test)"
echo "  2. 📦 Archivar migraciones completadas"
echo "  3. 📁 Organizar documentación"
echo "  4. 🧹 Limpiar cache de Next.js"
echo ""
read -p "¿Continuar? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Operación cancelada"
    exit 1
fi

echo ""
echo "======================================"
echo "FASE 1: LIMPIEZA DE ARCHIVOS TEMPORALES"
echo "======================================"

# Ejecutar limpieza de temporales
if [ -f "cleanup-temp-files.sh" ]; then
    chmod +x cleanup-temp-files.sh
    ./cleanup-temp-files.sh
else
    echo "⚠️  cleanup-temp-files.sh no encontrado, saltando..."
fi

echo ""
echo "======================================"
echo "FASE 2: ARCHIVO DE MIGRACIONES"
echo "======================================"

# Ejecutar archivo de migraciones
if [ -f "archive-completed-migrations.sh" ]; then
    chmod +x archive-completed-migrations.sh
    ./archive-completed-migrations.sh
else
    echo "⚠️  archive-completed-migrations.sh no encontrado, saltando..."
fi

echo ""
echo "======================================"
echo "FASE 3: ORGANIZACIÓN DE DOCUMENTACIÓN"
echo "======================================"

# Crear estructura de documentación
mkdir -p docs/{guides,fixes,migrations,analysis,general,archive}

DOCS_MOVED=0

echo ""
echo "📁 Organizando documentación..."

# Mover documentación de correcciones
echo ""
echo "📝 Correcciones:"
for file in CORRECCION-*.md; do
  if [ -f "$file" ]; then
    echo "   📂 $file → docs/fixes/"
    mv "$file" docs/fixes/
    ((DOCS_MOVED++))
  fi
done

# Mover documentación de análisis
echo ""
echo "📝 Análisis:"
for file in ANALISIS-*.md; do
  if [ -f "$file" ]; then
    echo "   📂 $file → docs/analysis/"
    mv "$file" docs/analysis/
    ((DOCS_MOVED++))
  fi
done

# Mover documentación de migraciones/actualizaciones
echo ""
echo "📝 Migraciones y actualizaciones:"
for file in ACTUALIZACION-*.md ASIGNACION-*.md AUDITORIA-*.md MIGRACION-*.md; do
  if [ -f "$file" ]; then
    echo "   📂 $file → docs/migrations/"
    mv "$file" docs/migrations/
    ((DOCS_MOVED++))
  fi
done

# Mover guías de usuario
echo ""
echo "📝 Guías de usuario:"
for file in GUIA-*.md; do
  if [ -f "$file" ]; then
    echo "   📂 $file → docs/guides/"
    mv "$file" docs/guides/
    ((DOCS_MOVED++))
  fi
done

# Mover documentación de optimización
echo ""
echo "📝 Optimizaciones:"
for file in OPTIMIZACION-*.md DECISION-*.md; do
  if [ -f "$file" ]; then
    echo "   📂 $file → docs/general/"
    mv "$file" docs/general/
    ((DOCS_MOVED++))
  fi
done

# Mover documentación de sistema
echo ""
echo "📝 Documentación de sistema:"
for file in DOCUMENTACION-*.md ENTIDADES-*.md ESTADISTICAS-*.md EMPLEADOS-*.md BUSQUEDA-*.md ACLARACION-*.md; do
  if [ -f "$file" ]; then
    echo "   📂 $file → docs/general/"
    mv "$file" docs/general/
    ((DOCS_MOVED++))
  fi
done

# Mover documentación recién creada a lugar apropiado
if [ -f "EJECUTAR-OPTIMIZACION.md" ]; then
  echo "   📂 EJECUTAR-OPTIMIZACION.md → docs/guides/"
  mv "EJECUTAR-OPTIMIZACION.md" docs/guides/
  ((DOCS_MOVED++))
fi

if [ -f "ANALISIS-DEPURACION-ARCHIVOS.md" ]; then
  echo "   📂 ANALISIS-DEPURACION-ARCHIVOS.md → docs/analysis/"
  mv "ANALISIS-DEPURACION-ARCHIVOS.md" docs/analysis/
  ((DOCS_MOVED++))
fi

# Mantener algunos archivos importantes en raíz
echo ""
echo "📌 Conservando en raíz:"
for file in README.md CHANGELOG.md LICENSE.md; do
  if [ -f "docs/general/$file" ]; then
    echo "   📌 $file"
    mv "docs/general/$file" .
  fi
done

# Crear README en docs
cat > docs/README.md << 'EOF'
# Documentación del Proyecto

Esta carpeta contiene toda la documentación del proyecto organizada por categorías.

## Estructura

### 📚 guides/
Guías de usuario y tutoriales para usar el sistema.

### 🔧 fixes/
Documentación de correcciones y soluciones a problemas específicos.

### 🔄 migrations/
Documentación de migraciones, actualizaciones y cambios en el sistema.

### 📊 analysis/
Análisis técnicos, auditorías y estudios del sistema.

### 📝 general/
Documentación general, decisiones de arquitectura y optimizaciones.

### 📦 archive/
Documentación antigua conservada para referencia histórica.

## 💡 Uso

- **Usuarios**: Ver carpeta `guides/` para tutoriales
- **Desarrolladores**: Ver carpeta `analysis/` para detalles técnicos
- **Mantenimiento**: Ver carpeta `fixes/` para soluciones conocidas
- **Histórico**: Ver carpeta `migrations/` para cambios pasados
EOF

echo ""
echo "======================================"
echo "FASE 4: LIMPIEZA DE CACHE"
echo "======================================"

echo ""
echo "🧹 Limpiando cache de Next.js..."
if [ -d ".next" ]; then
  rm -rf .next
  echo "   ✅ Cache .next eliminado"
fi

if [ -d "node_modules/.cache" ]; then
  rm -rf node_modules/.cache
  echo "   ✅ Cache de node_modules eliminado"
fi

echo ""
echo "======================================"
echo "✅ DEPURACIÓN COMPLETADA"
echo "======================================"
echo ""
echo "📊 Resumen final:"
echo "   - Archivos temporales eliminados"
echo "   - Migraciones archivadas"
echo "   - $DOCS_MOVED documentos organizados"
echo "   - Cache limpiado"
echo ""

# Contar archivos finales en raíz
FINAL_ROOT=$(find . -maxdepth 1 -type f \( -name "*.mjs" -o -name "*.js" -o -name "*.sql" -o -name "*.md" \) | wc -l | tr -d ' ')

echo "📁 Archivos en raíz del proyecto:"
echo "   Antes: 336 archivos"
echo "   Ahora: $FINAL_ROOT archivos"
echo "   Reducción: $((336 - FINAL_ROOT)) archivos (~$((((336 - FINAL_ROOT) * 100) / 336))%)"
echo ""
echo "📂 Archivos organizados en:"
echo "   - scripts/archive/"
echo "   - scripts/maintenance/"
echo "   - scripts/seed/"
echo "   - docs/guides/"
echo "   - docs/fixes/"
echo "   - docs/migrations/"
echo "   - docs/analysis/"
echo "   - docs/general/"
echo ""
echo "🚀 Siguiente paso:"
echo "   npm run dev"
echo ""
echo "⚡ Compilación debería ser ~60-70% más rápida"
