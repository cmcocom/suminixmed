#!/bin/bash

echo "🔍 Consultando rol OPERADOR vía API..."
echo ""

curl -s http://localhost:3000/api/rbac/roles/simple \
  -H "Cookie: $(node -e "console.log(process.env.SESSION_COOKIE || 'next-auth.session-token=valor_de_cookie')")" \
  | jq '.roles[] | select(.name == "OPERADOR")'

echo ""
echo "📋 Listando todos los roles que devuelve la API:"
echo ""

curl -s http://localhost:3000/api/rbac/roles/simple \
  -H "Cookie: $(node -e "console.log(process.env.SESSION_COOKIE || 'next-auth.session-token=valor_de_cookie')")" \
  | jq '.roles[] | {name: .name, is_system_role: .is_system_role, users_count: .users_count}'
