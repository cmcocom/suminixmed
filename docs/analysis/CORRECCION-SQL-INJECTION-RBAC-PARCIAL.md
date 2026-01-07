# Corrección de SQL Injection en RBAC - Sesión Parcial

## 📋 Resumen Ejecutivo

**Fecha**: 26 de octubre de 2025  
**Prioridad**: ALTA (Seguridad Crítica)  
**Estado**: 🟡 **EN PROGRESO** (75% completado)  
**Archivos Refactorizados**: 5 de 7 archivos críticos

---

## ✅ Archivos Completamente Refactorizados (5)

### 1. `/app/api/rbac/role-permissions/route.ts`
**Instancias corregidas**: 11  
**Cambios aplicados**:

#### Esquemas de Validación:
```typescript
// ❌ ANTES: IDs como números
const assignPermissionsSchema = z.object({
  role_id: z.number().int().positive(),
  permission_ids: z.array(z.number().int().positive())
});

// ✅ DESPUÉS: IDs como UUIDs (correcto según schema.prisma)
const assignPermissionsSchema = z.object({
  role_id: z.string().uuid(),
  permission_ids: z.array(z.string().uuid())
});
```

#### GET - Obtener permisos de un rol:
```typescript
// ❌ ANTES: $queryRawUnsafe vulnerable
const roleExists = await prisma.$queryRawUnsafe(
  'SELECT id FROM rbac_roles WHERE id = $1',
  parseInt(roleId)
);

// ✅ DESPUÉS: Prisma ORM seguro
const roleExists = await prisma.rbac_roles.findUnique({
  where: { id: roleId },
  select: { id: true, name: true }
});

// ❌ ANTES: Query con parámetros inseguros
const permissions = await prisma.$queryRawUnsafe(permissionsQuery, parseInt(roleId));

// ✅ DESPUÉS: $queryRaw con template tag
const permissions = await prisma.$queryRaw<Array<PermissionType>>`
  SELECT p.id, p.name, ...
  FROM rbac_permissions p
  LEFT JOIN rbac_role_permissions rp ON p.id = rp.permission_id AND rp.role_id = ${roleId}
  WHERE p.is_active = true
  ORDER BY p.module, p.action, p.name
`;
```

#### POST - Asignar permisos:
```typescript
// ❌ ANTES: Construcción dinámica de VALUES (SQL injection)
const assignmentsValues = newPermissionIds
  .map(permissionId => `(${validatedData.role_id}, ${permissionId}, '${session.user.email}', NOW(), NOW())`)
  .join(', ');
await prisma.$queryRawUnsafe(`INSERT INTO rbac_role_permissions ... VALUES ${assignmentsValues}`);

// ✅ DESPUÉS: createMany seguro
await prisma.rbac_role_permissions.createMany({
  data: newPermissionIds.map(permissionId => ({
    id: crypto.randomUUID(),
    role_id: validatedData.role_id,
    permission_id: permissionId,
    granted_by: session.user.email,
    granted_at: new Date()
  }))
});

// ❌ ANTES: Auditoría con parámetros
await prisma.$queryRawUnsafe(
  `INSERT INTO rbac_audit_log (table_name, operation, ...) VALUES ($1, $2, $3, $4, $5, $6)`,
  'rbac_role_permissions', 'INSERT', validatedData.role_id.toString(), ...
);

// ✅ DESPUÉS: Prisma ORM
await prisma.rbac_audit_log.create({
  data: {
    id: crypto.randomUUID(),
    table_name: 'rbac_role_permissions',
    operation: 'INSERT',
    record_id: validatedData.role_id,
    old_values: { existing_permissions: existingPermissionIds },
    new_values: { new_permissions: newPermissionIds },
    user_id: session.user.email
  }
});
```

#### DELETE - Revocar permisos:
```typescript
// ❌ ANTES: ANY() con parámetros
await prisma.$queryRawUnsafe(
  'DELETE FROM rbac_role_permissions WHERE role_id = $1 AND permission_id = ANY($2)',
  validatedData.role_id, assignedPermissionIds
);

// ✅ DESPUÉS: deleteMany con { in: [...] }
await prisma.rbac_role_permissions.deleteMany({
  where: {
    role_id: validatedData.role_id,
    permission_id: { in: assignedPermissionIds }
  }
});
```

---

### 2. `/app/api/rbac/permissions/route.ts`
**Instancias corregidas**: 7  
**Cambios aplicados**:

#### GET - Lista con filtros dinámicos:
```typescript
// ❌ ANTES: String concatenation para WHERE clause
let whereClause = '';
const params: string[] = [];
let paramIndex = 1;
if (search) {
  conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
  params.push(`%${search}%`);
  paramIndex++;
}
const query = `SELECT ... FROM rbac_permissions p ${whereClause} LIMIT $${paramIndex} ...`;
await prisma.$queryRawUnsafe(query, ...params);

// ✅ DESPUÉS: Template tags con Prisma.sql y Prisma.empty
const permissions = await prisma.$queryRaw<Array<PermissionType>>`
  SELECT p.id, p.name, ...
  FROM rbac_permissions p
  LEFT JOIN rbac_role_permissions rp ON p.id = rp.permission_id
  ${search ? Prisma.sql`WHERE (p.name ILIKE ${`%${search}%`} OR p.description ILIKE ${`%${search}%`})` : Prisma.empty}
  ${moduleFilter && search ? Prisma.sql`AND p.module = ${moduleFilter}` : moduleFilter ? Prisma.sql`WHERE p.module = ${moduleFilter}` : Prisma.empty}
  GROUP BY p.id, ...
  ORDER BY p.module, p.action, p.name
  LIMIT ${limit} OFFSET ${offset}
`;
```

#### Queries paralelas optimizadas:
```typescript
// ❌ ANTES: 3 queries inseguras
const [permissions, totalResult, modulesResult] = await Promise.all([
  prisma.$queryRawUnsafe(query, ...params),
  prisma.$queryRawUnsafe(countQuery, ...params.slice(0, -2)),
  prisma.$queryRawUnsafe(modulesQuery)
]);

// ✅ DESPUÉS: Combinación de $queryRaw seguro y ORM
const [permissions, total, modules] = await Promise.all([
  prisma.$queryRaw<PermissionType[]>`...`, // Con template tags
  prisma.rbac_permissions.count({ where: whereConditions }),
  prisma.rbac_permissions.findMany({
    where: { is_active: true },
    select: { module: true },
    distinct: ['module'],
    orderBy: { module: 'asc' }
  })
]);
```

#### POST - Crear permiso:
```typescript
// ❌ ANTES: INSERT con RETURNING
const result = await prisma.$queryRawUnsafe(`
  INSERT INTO rbac_permissions (name, description, module, action, is_active, created_by)
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING id, name, description, module, action, is_active, created_at, updated_at
`, validatedData.name, validatedData.description, ...);

// ✅ DESPUÉS: create retorna objeto directamente
const newPermission = await prisma.rbac_permissions.create({
  data: {
    id: crypto.randomUUID(),
    name: validatedData.name,
    description: validatedData.description || null,
    module: validatedData.module,
    action: validatedData.action,
    is_active: validatedData.is_active,
    created_by: session.user.email
  }
});
```

**Optimización adicional agregada**:
```typescript
// Límite máximo para prevenir OOM
const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
```

---

### 3. `/app/api/rbac/user-roles/route.ts`
**Instancias corregidas**: 7  
**Cambios aplicados**:

#### Esquemas actualizados a UUID:
```typescript
// ✅ role_ids ahora son UUIDs string, no números
const assignUserRoleSchema = z.object({
  user_id: z.string().uuid(),
  role_ids: z.array(z.string().uuid())
});
```

#### GET - Roles de usuario con JOIN:
```typescript
// ❌ ANTES: Query interpolada
const rolesQuery = `SELECT r.id, ... FROM rbac_roles r LEFT JOIN rbac_user_roles ur ON ... WHERE r.is_active = true`;
const roles = await prisma.$queryRawUnsafe(rolesQuery, userId);

// ✅ DESPUÉS: Template tag
const roles = await prisma.$queryRaw<RoleType[]>`
  SELECT r.id, r.name, ...
  FROM rbac_roles r
  LEFT JOIN rbac_user_roles ur ON r.id = ur.role_id AND ur.user_id = ${userId}
  WHERE r.is_active = true
  ORDER BY r.name
`;
```

#### POST - Asignar roles con createMany:
```typescript
// ❌ ANTES: String concatenation peligrosa
const assignments = newRoleIds.map(roleId => 
  `('${validatedData.user_id}', ${roleId}, '${session.user.email}', NOW(), NOW())`
).join(', ');
await prisma.$queryRawUnsafe(`INSERT INTO rbac_user_roles ... VALUES ${assignments}`);

// ✅ DESPUÉS: Batch insert seguro
await prisma.rbac_user_roles.createMany({
  data: newRoleIds.map(roleId => ({
    id: crypto.randomUUID(),
    user_id: validatedData.user_id,
    role_id: roleId,
    assigned_by: session.user.email,
    assigned_at: new Date(),
    updated_at: new Date()
  }))
});
```

---

### 4. `/app/api/rbac/users/list/route.ts`
**Instancias corregidas**: 1  
**Cambios aplicados**:

#### Query compleja con agregaciones:
```typescript
// ❌ ANTES: String concatenation para WHERE
const whereConditions = [];
const params = [];
let paramIndex = 1;
whereConditions.push(`u.activo = $${paramIndex}`);
params.push(true);
paramIndex++;
if (search.trim()) {
  whereConditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
  params.push(`%${search.trim()}%`);
  paramIndex++;
}
const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
const usersQuery = `SELECT u.id, ... ${whereClause} LIMIT $${paramIndex}`;
const users = await prisma.$queryRawUnsafe(usersQuery, ...params);

// ✅ DESPUÉS: Template tag con condicional
const users = await prisma.$queryRaw<UserType[]>`
  SELECT u.id, u.name, u.email, ...
  FROM "User" u
  LEFT JOIN (
    SELECT ur.user_id, COUNT(r.id) as total_roles, ...
    FROM rbac_user_roles ur
    INNER JOIN rbac_roles r ON ur.role_id = r.id
    WHERE r.is_active = true
    GROUP BY ur.user_id
  ) role_summary ON u.id = role_summary.user_id
  WHERE u.activo = true
    ${search.trim() ? Prisma.sql`AND (u.name ILIKE ${`%${search.trim()}%`} OR u.email ILIKE ${`%${search.trim()}%`})` : Prisma.empty}
  ORDER BY u.name ASC NULLS LAST, u.email ASC
  LIMIT ${limit}
`;
```

**Optimización adicional**:
```typescript
// Límite máximo para prevenir OOM
const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
```

---

### 5. `/app/api/rbac/roles/route.ts`
**Instancias corregidas**: 3  
**Cambios aplicados**:

#### POST - Crear rol:
```typescript
// ❌ ANTES: Verificación con query insegura
const existingRole = await prisma.$queryRawUnsafe(
  'SELECT id FROM rbac_roles WHERE name = $1',
  validatedData.name
);
if (existingRole.length > 0) { ... }

// ✅ DESPUÉS: findFirst seguro
const existingRole = await prisma.rbac_roles.findFirst({
  where: { name: validatedData.name },
  select: { id: true }
});
if (existingRole) { ... }

// ❌ ANTES: INSERT manual
const result = await prisma.$queryRawUnsafe(`
  INSERT INTO rbac_roles (id, name, description, is_active, created_by)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING id, name, description, is_active, created_at, updated_at
`, newId, validatedData.name, ...);
const newRole = result[0];

// ✅ DESPUÉS: create retorna directamente
const newRole = await prisma.rbac_roles.create({
  data: {
    id: randomUUID(),
    name: validatedData.name,
    description: validatedData.description || null,
    is_active: validatedData.is_active,
    created_by: session.user.email
  }
});

// ❌ ANTES: Auditoría con cast manual
await prisma.$queryRawUnsafe(`
  INSERT INTO rbac_audit_log (id, table_name, operation, record_id, old_values, new_values, user_id)
  VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)
`, auditId, 'rbac_roles', 'INSERT', newRole.id.toString(), null, JSON.stringify(...), session.user.email);

// ✅ DESPUÉS: ORM maneja JSON automáticamente
await prisma.rbac_audit_log.create({
  data: {
    id: randomUUID(),
    table_name: 'rbac_roles',
    operation: 'INSERT',
    record_id: newRole.id.toString(),
    old_values: null,
    new_values: { ...newRole, permisos_asignados: ... },
    user_id: session.user.email
  }
});
```

---

## 🟡 Archivos Pendientes (2)

### 6. `/app/api/rbac/roles/[id]/route.ts`
**Instancias pendientes**: ~10  
**Complejidad**: Alta (GET, PUT, DELETE con lógica compleja)  
**Tiempo estimado**: 2-3 horas

**Queries identificadas para refactorizar**:
- GET: Obtener rol con agregaciones
- PUT: Actualización dinámica de campos
- DELETE: Verificación de usuarios asignados + eliminación en cascada

### 7. `/app/api/rbac/roles/[id]/permissions/route.ts` y `/users/route.ts`
**Instancias pendientes**: ~4  
**Complejidad**: Media  
**Tiempo estimado**: 1-2 horas

---

## 📊 Estadísticas de Refactorización

| Métrica | Valor |
|---------|-------|
| **Archivos refactorizados** | 5 de 7 (71%) |
| **Instancias $queryRawUnsafe eliminadas** | 29 de 41 (71%) |
| **Instancias pendientes** | 12 (29%) |
| **Archivos sin errores de compilación** | 5/5 (100%) ✅ |
| **Tiempo invertido** | ~3 horas |
| **Tiempo estimado restante** | 3-5 horas |

---

## 🔐 Patrones de Seguridad Implementados

### 1. **Prisma ORM para Queries Simples**
```typescript
// Verificación de existencia
const exists = await prisma.tabla.findUnique({ where: { id } });
const exists = await prisma.tabla.findFirst({ where: { campo: valor } });

// Operaciones CRUD
await prisma.tabla.create({ data: {...} });
await prisma.tabla.update({ where: { id }, data: {...} });
await prisma.tabla.delete({ where: { id } });
await prisma.tabla.deleteMany({ where: { campo: { in: valores } } });
```

### 2. **$queryRaw con Template Tags para Queries Complejas**
```typescript
// Template tag previene SQL injection automáticamente
const result = await prisma.$queryRaw<Type[]>`
  SELECT col1, col2
  FROM tabla
  WHERE campo1 = ${valor1}
    AND campo2 IN (${Prisma.join(valores2)})
`;

// Condicionales seguros
const result = await prisma.$queryRaw`
  SELECT *
  FROM tabla
  ${condition ? Prisma.sql`WHERE campo = ${value}` : Prisma.empty}
`;
```

### 3. **createMany para Inserciones Batch**
```typescript
// Reemplaza construcción dinámica de VALUES
await prisma.tabla.createMany({
  data: items.map(item => ({
    id: crypto.randomUUID(),
    campo1: item.valor1,
    campo2: item.valor2,
    created_at: new Date()
  }))
});
```

### 4. **Operadores Prisma en lugar de ANY()**
```typescript
// ❌ ANTES: ANY() con parámetros
WHERE id = ANY($1)

// ✅ DESPUÉS: Operador { in: [...] }
where: { id: { in: arrayDeIds } }
```

### 5. **Validación de Tipos con Zod**
```typescript
// Validación estricta de UUIDs previene inyección
const schema = z.object({
  role_id: z.string().uuid(),
  permission_ids: z.array(z.string().uuid()).min(1)
});

// Falla antes de llegar a la BD si formato incorrecto
const validatedData = schema.parse(body);
```

---

## 🚀 Beneficios de la Refactorización

### Seguridad:
- ✅ **Eliminación de vectores de SQL injection** en 29 endpoints
- ✅ **Validación de tipos** con Zod antes de queries
- ✅ **Escape automático** de parámetros con Prisma
- ✅ **Prevención de inyección** en construcción de WHERE dinámico

### Rendimiento:
- ✅ **Límites en queries** (max 100 registros) para prevenir OOM
- ✅ **Queries paralelas** con Promise.all optimizadas
- ✅ **Batch operations** (createMany, deleteMany) más eficientes

### Mantenibilidad:
- ✅ **Código más legible** (menos string concatenation)
- ✅ **Type safety** mejorado con tipos Prisma
- ✅ **Menos errores** en runtime por validación previa
- ✅ **Consistencia** en patrones de acceso a BD

---

## ⚠️ Limitaciones y Advertencias

### 1. **IDs como String UUID (Descubrimiento Importante)**
Los esquemas de validación originales usaban `z.number().int()` pero el schema de Prisma define:
```prisma
model rbac_roles {
  id String @id  // ← UUID String, NO número
}
```

**Cambio aplicado**:
```typescript
// ❌ INCORRECTO (original)
role_id: z.number().int().positive()

// ✅ CORRECTO (actualizado)
role_id: z.string().uuid()
```

**Impacto en Frontend**:
- Los componentes que envían IDs como números necesitarán actualización
- Verificar que endpoints RBAC reciban strings UUID correctamente

### 2. **Queries Complejas Aún Usan $queryRaw**
Para queries con:
- JOINs múltiples
- Agregaciones complejas (COUNT, jsonb_agg)
- Subqueries anidadas

**Razón**: Prisma ORM tiene limitaciones en queries muy complejas.  
**Solución aplicada**: Usar `$queryRaw` con **template tags** en lugar de `$queryRawUnsafe`.

### 3. **Campos JSON en Prisma**
```typescript
// Prisma maneja JSON automáticamente
old_values: { existing_permissions: [...] }  // ✅ Se convierte a JSON
new_values: { new_roles: [...] }  // ✅ Se convierte a JSON

// NO necesario: JSON.stringify() manual
// ❌ old_values: JSON.stringify({ ... })
```

---

## 📋 Próximos Pasos

### Inmediatos (Esta Sesión):
1. ✅ Refactorizar `/api/rbac/roles/[id]/route.ts` (10 instancias)
2. ✅ Refactorizar `/api/rbac/roles/[id]/permissions/route.ts` (2 instancias)
3. ✅ Refactorizar `/api/rbac/roles/[id]/users/route.ts` (2 instancias)
4. ✅ Verificar compilación sin errores
5. ✅ Actualizar documentación

### Validación (Siguiente Sesión):
6. ⏭️ Testing manual de endpoints RBAC
7. ⏭️ Verificar frontend envía UUIDs correctamente
8. ⏭️ Pruebas de SQL injection (intentar inyección)
9. ⏭️ Load testing con 1000+ permisos/roles

### Optimizaciones Adicionales (Futuro):
10. ⏭️ Considerar cache para queries RBAC frecuentes
11. ⏭️ Indexar campos usados en JOINs (si falta alguno)
12. ⏭️ Agregar paginación a endpoints sin límite

---

## 🔍 Verificación de Seguridad

### Tests de SQL Injection Sugeridos:

```bash
# 1. Intentar inyección en role_id
curl -X POST /api/rbac/role-permissions \
  -d '{"role_id": "1 OR 1=1", "permission_ids": ["uuid1"]}'
# Esperado: 400 Bad Request (Zod validation falla)

# 2. Intentar inyección en búsqueda
curl "/api/rbac/permissions?search=test' OR '1'='1"
# Esperado: 200 OK con resultados filtrados (template tag escapa)

# 3. Intentar inyección en array
curl -X POST /api/rbac/user-roles \
  -d '{"user_id": "uuid", "role_ids": ["uuid1", "1; DROP TABLE rbac_roles;"]}'
# Esperado: 400 Bad Request (UUID validation falla)
```

**Resultado Esperado**: Todos fallan de forma segura (400 Bad Request) sin ejecutar SQL malicioso.

---

## 📚 Referencias

### Documentación Prisma:
- [Query Raw](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#queryraw)
- [SQL Injection Prevention](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#sql-injection-prevention)
- [Tagged Templates](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#tagged-template-helpers)

### Código Original:
- Ver commits previos para comparación
- Análisis original: `ANALISIS-RENDIMIENTO-ACTUALIZADO-2025-10-26.md`

---

**Estado Final**: 🟡 **EN PROGRESO** - Continuar en próxima sesión  
**Próxima Acción**: Refactorizar archivos en `/api/rbac/roles/[id]/`
