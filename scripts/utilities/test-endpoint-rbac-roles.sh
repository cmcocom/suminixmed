#!/bin/bash

echo "🔍 Verificando datos del endpoint /api/rbac/roles/simple"
echo ""
echo "⚠️  NOTA: Este script requiere estar autenticado."
echo "Abre http://localhost:3000 en tu navegador y copia las cookies de sesión."
echo ""

# Verificar si el servidor está corriendo
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "❌ El servidor no está corriendo en localhost:3000"
  echo "Por favor inicia el servidor con: npm run dev"
  exit 1
fi

echo "📡 Llamando al endpoint..."
echo ""

# Hacer la llamada sin cookies (veremos el error de autenticación)
RESPONSE=$(curl -s http://localhost:3000/api/rbac/roles/simple)

echo "📄 Respuesta:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "📊 Roles encontrados:"
echo "$RESPONSE" | jq '.roles[]? | {name: .name, is_active: .is_active, is_system_role: .is_system_role, permissions_count: .permissions_count, users_count: .users_count}' 2>/dev/null

echo ""
echo "🔎 Buscando rol OPERADOR específicamente:"
echo "$RESPONSE" | jq '.roles[]? | select(.name == "OPERADOR")' 2>/dev/null

