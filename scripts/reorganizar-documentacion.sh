#!/bin/bash

# Script Maestro de Reorganización de Documentación
# Ejecuta todo el proceso de análisis, consolidación y creación

set -e

echo "🎯 REORGANIZACIÓN COMPLETA DE DOCUMENTACIÓN"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Confirmar ejecución
echo -e "${YELLOW}Este script realizará los siguientes cambios:${NC}"
echo ""
echo "1. ✅ Crear documentación faltante (4 guías nuevas)"
echo "2. 📦 Consolidar 56 archivos .md de la raíz a docs/"
echo "3. 🗂️  Organizar archivos en categorías apropiadas"
echo "4. 📂 Actualizar estructura de docs/"
echo "5. 📄 Actualizar README.md principal"
echo "6. 🧹 Archivar documentación temporal"
echo ""
echo -e "${RED}¿Deseas continuar? (s/n)${NC} "
read -r respuesta

if [[ ! "$respuesta" =~ ^[Ss]$ ]]; then
    echo "Operación cancelada."
    exit 0
fi

echo ""
echo -e "${GREEN}Iniciando reorganización...${NC}"
echo ""

# Paso 1: Crear documentación faltante
echo -e "${BLUE}════ PASO 1/3: Creando documentación faltante ════${NC}"
echo ""
chmod +x crear-documentacion-faltante.sh
./crear-documentacion-faltante.sh

echo ""
echo -e "${GREEN}✓ Documentación faltante creada${NC}"
echo ""

# Esperar confirmación para continuar
echo -e "${YELLOW}Presiona Enter para continuar con la consolidación...${NC}"
read -r

# Paso 2: Consolidar documentación
echo ""
echo -e "${BLUE}════ PASO 2/3: Consolidando documentación ════${NC}"
echo ""
chmod +x consolidar-documentacion.sh
./consolidar-documentacion.sh

echo ""
echo -e "${GREEN}✓ Documentación consolidada${NC}"
echo ""

# Paso 3: Actualizar .gitignore
echo ""
echo -e "${BLUE}════ PASO 3/3: Actualizando .gitignore ════${NC}"
echo ""

# Verificar si ya existe la sección de documentación en .gitignore
if ! grep -q "# Documentación temporal" .gitignore; then
    cat >> .gitignore << 'EOF'

# Documentación temporal y archivos de análisis
/*.md
!README.md
analizar-documentacion.mjs
consolidar-documentacion.sh
crear-documentacion-faltante.sh
reorganizar-documentacion.sh
EOF
    echo "  ✓ .gitignore actualizado"
else
    echo "  ℹ️  .gitignore ya contiene las exclusiones necesarias"
fi

echo ""
echo -e "${GREEN}✓ .gitignore actualizado${NC}"
echo ""

# Reporte final
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ REORGANIZACIÓN COMPLETADA EXITOSAMENTE${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""

echo "📊 RESUMEN DE CAMBIOS:"
echo ""

# Contar archivos
ARCHIVOS_RAIZ=$(ls -1 *.md 2>/dev/null | wc -l | tr -d ' ')
ARCHIVOS_GUIDES=$(ls -1 docs/guides/*.md 2>/dev/null | wc -l | tr -d ' ')
ARCHIVOS_FIXES=$(ls -1 docs/fixes/*.md 2>/dev/null | wc -l | tr -d ' ')
ARCHIVOS_MIGRATIONS=$(ls -1 docs/migrations/*.md 2>/dev/null | wc -l | tr -d ' ')
ARCHIVOS_ANALYSIS=$(ls -1 docs/analysis/*.md 2>/dev/null | wc -l | tr -d ' ')
ARCHIVOS_GENERAL=$(ls -1 docs/general/*.md 2>/dev/null | wc -l | tr -d ' ')
ARCHIVOS_ARCHIVE=$(ls -1 docs/archive/temporal/*.md 2>/dev/null | wc -l | tr -d ' ')

echo "📂 Estructura final:"
echo ""
echo "   Raíz del proyecto:"
echo "      📄 Archivos .md: $ARCHIVOS_RAIZ (solo README.md)"
echo ""
echo "   Directorio docs/:"
echo "      📚 guides/: $ARCHIVOS_GUIDES archivos"
echo "      🔧 fixes/: $ARCHIVOS_FIXES archivos"
echo "      🔄 migrations/: $ARCHIVOS_MIGRATIONS archivos"
echo "      📊 analysis/: $ARCHIVOS_ANALYSIS archivos"
echo "      📝 general/: $ARCHIVOS_GENERAL archivos"
echo "      📦 archive/temporal/: $ARCHIVOS_ARCHIVE archivos"
echo ""

echo "📝 Documentación nueva creada:"
echo "   ✓ docs/guides/CATALOGOS-COMPLETO.md"
echo "   ✓ docs/guides/ALMACENES-COMPLETO.md"
echo "   ✓ docs/guides/INVENTARIOS-FISICOS-COMPLETO.md"
echo "   ✓ docs/guides/FONDO-FIJO-STOCK-FIJO.md"
echo "   ✓ README.md (actualizado)"
echo ""

echo "🎯 Próximos pasos recomendados:"
echo ""
echo "1. Revisar la documentación creada y ajustar según necesidades"
echo "2. Validar que todos los enlaces funcionen correctamente"
echo "3. Actualizar docs/README.md con nueva estructura"
echo "4. Crear documentación de API en docs/api/"
echo "5. Agregar diagramas y esquemas en docs/architecture/"
echo "6. Generar índice centralizado de toda la documentación"
echo ""

echo "📦 Para commit git:"
echo ""
echo "   git add docs/"
echo "   git add README.md"
echo "   git add .gitignore"
echo "   git commit -m \"docs: reorganizar y completar documentación del proyecto\""
echo ""

echo -e "${GREEN}¡Documentación reorganizada exitosamente!${NC}"
echo ""
