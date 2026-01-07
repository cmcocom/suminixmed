# Implementación de Validación de Rol Único por Usuario

**Fecha:** 2025-01-10  
**Autor:** GitHub Copilot  
**Estado:** ✅ COMPLETADO

---

## 1. Problema Identificado

### Situación Original
El sistema RBAC permitía asignar **múltiples roles** a un mismo usuario debido a:

1. **Esquema de base de datos:** La restricción `@@unique([user_id, role_id])` en `rbac_user_roles` solo previene duplicar el **mismo rol**, no limita la cantidad total de roles.

2. **Validación insuficiente en API:** El endpoint `POST /api/rbac/users/[id]/roles` solo verificaba si el usuario ya tenía **ese rol específico**, no si tenía **algún rol**.

### Caso Reportado
- **Usuario:** Cristian Cocom - UNIDADC (cmcocom@unidadc.com)
- **Problema:** Tenía 2 roles asignados: `ADMINISTRADOR` y `UNIDADC`
- **Esperado:** Solo debería tener el rol `UNIDADC`

---

## 2. Solución Implementada

### 2.1 Validación en API Endpoint

**Archivo:** `/app/api/rbac/users/[id]/roles/route.ts`

**Cambios realizados:**
```typescript
// ✅ ANTES (Validación insuficiente):
const existingUserRole = await prisma.rbac_user_roles.findFirst({
  where: {
    user_id: userId,
    role_id: roleId  // Solo verifica SI ESTE rol ya está asignado
  }
});

// ✅ DESPUÉS (Validación completa):
const existingRoles = await prisma.rbac_user_roles.findMany({
  where: {
    user_id: userId  // Verifica SI CUALQUIER rol está asignado
  },
  include: {
    rbac_roles: {
      select: { id: true, name: true }
    }
  }
});

if (existingRoles.length > 0) {
  // Caso 1: Si ya tiene el mismo rol
  const sameRole = existingRoles.find(ur => ur.role_id === roleId);
  if (sameRole) {
    return NextResponse.json(
      { error: 'El usuario ya tiene este rol asignado' },
      { status: 409 }
    );
  }

  // Caso 2: Si tiene un rol diferente (NUEVO)
  const currentRoleNames = existingRoles.map(ur => ur.rbac_roles.name).join(', ');
  return NextResponse.json(
    { 
      error: 'El usuario ya tiene un rol asignado. Cada usuario solo puede tener un rol a la vez.',
      details: `Rol(es) actual(es): ${currentRoleNames}`,
      suggestion: 'Primero debe remover el rol actual antes de asignar uno nuevo.',
      currentRoles: existingRoles.map(ur => ({
        id: ur.id,
        roleId: ur.role_id,
        roleName: ur.rbac_roles.name
      }))
    },
    { status: 409 }
  );
}
```

**Beneficios:**
- ✅ Previene asignación de múltiples roles
- ✅ Mensaje de error descriptivo con el rol actual
- ✅ Guía al usuario para remover el rol antes de asignar otro
- ✅ Incluye información detallada del rol actual en la respuesta

---

### 2.2 Corrección de Datos Existentes

**Script creado:** `/scripts/fix-cristian-cocom-roles.cjs`

**Acciones realizadas:**
1. ✅ Identificado 1 usuario con múltiples roles: Cristian Cocom
2. ✅ Roles antes de corrección:
   - UNIDADC (asignado: 2025-10-07)
   - ADMINISTRADOR (asignado: 2025-10-08)
3. ✅ Acción ejecutada: Eliminado rol ADMINISTRADOR
4. ✅ Estado final: Usuario con solo 1 rol (UNIDADC)

**Evidencia de corrección:**
```
=== CORRECCIÓN COMPLETADA ===

Estado ANTES:
1. Rol: UNIDADC
2. Rol: ADMINISTRADOR

Estado DESPUÉS:
✅ El usuario ahora tiene SOLO 1 rol asignado:
   - UNIDADC
```

---

### 2.3 Scripts de Diagnóstico

Se crearon 3 scripts para facilitar el mantenimiento:

#### Script 1: Verificación de Multi-Roles
**Archivo:** `/scripts/check-multi-role-users.sql`

**Funcionalidad:**
- Lista usuarios con más de un rol asignado
- Muestra detalles de cada asignación
- Genera estadísticas generales

**Uso:**
```sql
-- Ejecutar cualquiera de las 3 consultas incluidas en el archivo
```

#### Script 2: Corrección de Roles
**Archivo:** `/scripts/fix-cristian-cocom-roles.cjs`

**Funcionalidad:**
- Muestra estado antes de corrección
- Elimina rol no deseado
- Verifica estado final
- Genera reporte detallado

**Uso:**
```bash
node scripts/fix-cristian-cocom-roles.cjs
```

#### Script 3: Test de Validación
**Archivo:** `/scripts/test-single-role-validation.cjs`

**Funcionalidad:**
- Verifica que la validación funcione correctamente
- Simula intento de asignar segundo rol
- Valida mensaje de error
- Confirma bloqueo de asignación múltiple

**Uso:**
```bash
node scripts/test-single-role-validation.cjs
```

**Resultado del test:**
```
✅ VALIDACIÓN CORRECTA: Bloqueó asignación de rol adicional
   Error: El usuario ya tiene un rol asignado
   Detalles: Rol(es) actual(es): UNIDADC
   Código de error: 409

=== TEST EXITOSO ===
```

---

## 3. Verificación de Implementación

### 3.1 Test de Validación
- ✅ Ejecutado script de test
- ✅ Confirmado bloqueo de asignación múltiple
- ✅ Mensaje de error correcto y descriptivo
- ✅ Código HTTP 409 (Conflict)

### 3.2 Consulta Final de Usuarios
```javascript
// Resultado de verificación final:
⚠️  Encontrados 1 usuarios con múltiples roles: (ANTES)
✅ No se encontraron usuarios con múltiples roles (DESPUÉS)
```

---

## 4. Flujo de Validación Actual

```
Usuario intenta asignar rol
         ↓
¿El rol existe y está activo?
    NO → Error 404
    SÍ → Continuar
         ↓
¿Usuario tiene algún rol?
    NO → Permitir asignación
    SÍ → ¿Es el mismo rol?
           SÍ → Error 409: "Ya tiene este rol"
           NO → Error 409: "Ya tiene un rol. Debe remover el actual primero"
```

---

## 5. Impacto en el Sistema

### Archivos Modificados
1. `/app/api/rbac/users/[id]/roles/route.ts` - Endpoint de asignación de roles

### Archivos Creados
1. `/scripts/check-multi-role-users.sql` - Script SQL de diagnóstico
2. `/scripts/fix-cristian-cocom-roles.cjs` - Script de corrección
3. `/scripts/test-single-role-validation.cjs` - Script de test

### Base de Datos
- ✅ Eliminada 1 asignación incorrecta (Cristian Cocom - ADMINISTRADOR)
- ✅ Integridad de datos restaurada
- ✅ Restricción de negocio implementada

### Funcionalidad Afectada
- ✅ Asignación de roles ahora restringida a 1 por usuario
- ✅ Mensajes de error más descriptivos
- ✅ Mejor experiencia de usuario con sugerencias claras

---

## 6. Recomendaciones Futuras

### 6.1 Mejora de UI
Considerar implementar en la interfaz de usuario:
- Mostrar rol actual del usuario antes de asignar
- Deshabilitar botón "Asignar Rol" si ya tiene uno
- Agregar botón "Cambiar Rol" que haga remove + assign en transacción

### 6.2 Migración de Esquema (Opcional)
Si se desea forzar a nivel de base de datos:
```sql
-- Agregar restricción única a nivel de usuario
ALTER TABLE rbac_user_roles 
ADD CONSTRAINT one_role_per_user 
EXCLUDE (user_id WITH =);
```

**Nota:** No implementado porque la validación a nivel de aplicación es suficiente y más flexible.

### 6.3 Auditoría
Implementar log de intentos de asignación múltiple para:
- Detectar usuarios que intentan asignar múltiples roles
- Identificar patrones de uso incorrectos
- Mejorar documentación y capacitación

---

## 7. Comandos de Verificación

### Verificar estado actual de roles por usuario
```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const multiRoleUsers = await prisma.\$queryRaw\`
    SELECT u.name, COUNT(ur.role_id) as roles_count
    FROM \"User\" u
    INNER JOIN rbac_user_roles ur ON u.id = ur.user_id
    GROUP BY u.id, u.name
    HAVING COUNT(ur.role_id) > 1
  \`;
  console.log(multiRoleUsers.length ? multiRoleUsers : '✅ Ningún usuario con múltiples roles');
  await prisma.\$disconnect();
})();
"
```

### Test de validación
```bash
node scripts/test-single-role-validation.cjs
```

---

## 8. Conclusión

✅ **Problema resuelto completamente:**
1. Validación implementada en API
2. Datos existentes corregidos
3. Scripts de mantenimiento creados
4. Funcionalidad verificada

✅ **Resultado:**
- Los usuarios ahora solo pueden tener **1 rol a la vez**
- Mensajes de error claros y descriptivos
- Caso de Cristian Cocom corregido (solo UNIDADC)
- Sistema robusto contra asignaciones múltiples futuras

---

**Documentado por:** GitHub Copilot  
**Fecha de implementación:** 2025-01-10  
**Estado final:** ✅ PRODUCCIÓN
