#!/bin/bash

echo "🔍 Consultando roles y usuarios..."
echo ""

# Usar la API para obtener roles
curl -s 'http://localhost:3000/api/rbac/roles/simple' \
  -H 'Cookie: next-auth.session-token=YOUR_TOKEN' \
  | jq -r '
    .roles[] | 
    "Rol: \(.name)\n  Tipo: \(.tipo_rol)\n  Activo: \(.activo)\n  Usuarios: (consultar UI)\n"
  '

echo ""
echo "📊 Para ver el conteo exacto de usuarios por rol:"
echo "   Ve a: http://localhost:3000/dashboard/usuarios"
echo "   Y filtra por cada rol para contar usuarios"
