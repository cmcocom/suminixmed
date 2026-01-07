#!/bin/sh

# Pre-commit hook para verificar código antes de commit
# Instalar con: cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

echo "🔍 Ejecutando verificaciones pre-commit..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar errores
show_error() {
    echo "${RED}❌ $1${NC}"
}

# Función para mostrar éxito
show_success() {
    echo "${GREEN}✅ $1${NC}"
}

# Función para mostrar advertencias
show_warning() {
    echo "${YELLOW}⚠️  $1${NC}"
}

# 1. Verificar que Next.js puede compilar
echo "\n📦 Verificando compilación de Next.js..."
if ! npm run build > /dev/null 2>&1; then
    show_error "La compilación de Next.js falló"
    echo "Ejecuta 'npm run build' para ver los errores detallados"
    exit 1
fi
show_success "Compilación de Next.js exitosa"

# 2. Ejecutar ESLint con max-warnings 0
echo "\n🔍 Ejecutando ESLint (sin warnings permitidos)..."
if ! npm run lint:eslint; then
    show_error "ESLint encontró errores o warnings"
    echo "Ejecuta 'npm run lint:fix' para corregir automáticamente o revisa los errores manualmente"
    exit 1
fi
show_success "ESLint pasó sin errores ni warnings"

# 3. Verificar tipos de TypeScript
echo "\n📘 Verificando tipos de TypeScript..."
if ! npm run lint:types; then
    show_error "TypeScript encontró errores de tipos"
    echo "Revisa y corrige los errores de tipos antes de hacer commit"
    exit 1
fi
show_success "Verificación de tipos exitosa"

# 4. Verificar archivos grandes (> 1MB)
echo "\n📏 Verificando tamaño de archivos..."
large_files=$(find . -type f -size +1M -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./dist/*" -not -path "./out/*" -not -path "./.git/*")
if [ -n "$large_files" ]; then
    show_warning "Archivos grandes detectados (>1MB):"
    echo "$large_files"
    echo "Considera si estos archivos deben estar en el repositorio"
fi

# 5. Verificar secrets accidentales (patrones básicos)
echo "\n🔐 Verificando posibles secrets..."
secrets_found=$(git diff --cached --name-only | xargs grep -l -E "(password|secret|key|token|api_key)" 2>/dev/null || true)
if [ -n "$secrets_found" ]; then
    show_warning "Posibles secrets detectados en:"
    echo "$secrets_found"
    echo "Revisa que no haya credenciales hardcodeadas"
fi

# 6. Verificar que no hay console.log en producción
echo "\n🖥️  Verificando console.log en código de producción..."
production_console=$(git diff --cached --name-only | grep -E "\.(ts|tsx|js|jsx)$" | xargs grep -l "console\.log" 2>/dev/null || true)
if [ -n "$production_console" ]; then
    show_warning "console.log encontrado en archivos que van a commit:"
    echo "$production_console"
    echo "Considera usar console.info, console.warn o console.error según corresponda"
fi

echo "\n${GREEN}🎉 Todas las verificaciones pasaron exitosamente${NC}"
echo "Procediendo con el commit..."

exit 0