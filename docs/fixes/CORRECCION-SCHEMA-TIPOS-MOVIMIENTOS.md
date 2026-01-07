# Corrección del Schema de Tipos de Movimientos

**Fecha**: 9 de octubre de 2025  
**Tipo**: Corrección de Schema  
**Módulos afectados**: `tipos_entrada`, `tipos_salida`, Prisma Schema  
**Estado**: ✅ Completado

## Problema Identificado

El schema de Prisma estaba desincronizado con la estructura de la base de datos real:

### Error Original
```
Error [PrismaClientKnownRequestError]: 
Invalid `prisma.tipos_entrada.findMany()` invocation
Inconsistent column data: Could not convert value "tipo_entrada_transferencia" of the field `id` to type `Int`.
```

### Causa Raíz
- **Schema de Prisma**: Definía `id Int @id @default(autoincrement())`
- **Base de Datos Real**: Tenía `id TEXT PRIMARY KEY`
- La migración SQL creó las tablas con IDs de tipo TEXT (ej: `'tipo_entrada_transferencia'`)
- El schema no se actualizó para reflejar esta estructura

## Solución Implementada

### 1. Actualización del Schema de Prisma

**Archivo**: `/prisma/schema.prisma`

#### Antes:
```prisma
model tipos_entrada {
  id          Int      @id @default(autoincrement())
  codigo      String   @unique @db.VarChar(50)
  nombre      String   @db.VarChar(100)
  descripcion String?
  activo      Boolean  @default(true)
  orden       Int      @default(0)
  created_at  DateTime @default(now())
  updated_at  DateTime @default(now())

  @@index([activo])
  @@index([orden])
}
```

#### Después:
```prisma
model tipos_entrada {
  id                  String                @id
  codigo              String                @unique @db.VarChar(50)
  nombre              String                @db.VarChar(100)
  descripcion         String?
  color               String?               @db.VarChar(20)
  icono               String?               @db.VarChar(50)
  requiere_proveedor  Boolean               @default(false)
  requiere_referencia Boolean               @default(false)
  activo              Boolean               @default(true)
  orden               Int                   @default(0)
  created_at          DateTime              @default(now())
  updated_at          DateTime              @default(now())
  entradas            entradas_inventario[]

  @@index([activo])
  @@index([orden])
}

model tipos_salida {
  id                  String              @id
  codigo              String              @unique @db.VarChar(50)
  nombre              String              @db.VarChar(100)
  descripcion         String?
  color               String?             @db.VarChar(20)
  icono               String?             @db.VarChar(50)
  requiere_destino    Boolean             @default(false)
  requiere_referencia Boolean             @default(false)
  activo              Boolean             @default(true)
  orden               Int                 @default(0)
  created_at          DateTime            @default(now())
  updated_at          DateTime            @default(now())
  salidas             salidas_inventario[]

  @@index([activo])
  @@index([orden])
}
```

### 2. Actualización de Relaciones

#### `entradas_inventario`
```prisma
model entradas_inventario {
  id                          String                        @id
  // ... otros campos ...
  tipo_entrada_id             String?
  tipo_entrada                tipos_entrada?                @relation(fields: [tipo_entrada_id], references: [id], onDelete: SetNull)
  // ... resto del modelo ...
  
  @@index([tipo_entrada_id])
}
```

#### `salidas_inventario`
```prisma
model salidas_inventario {
  id                         String                       @id
  // ... otros campos ...
  tipo_salida_id             String?
  tipo_salida_rel            tipos_salida?                @relation(fields: [tipo_salida_id], references: [id], onDelete: SetNull)
  // ... resto del modelo ...
  
  @@index([tipo_salida_id])
}
```

### 3. Regeneración del Cliente de Prisma

```bash
# Se detuvo el servidor
pkill -f "next dev"

# Se regeneró el cliente de Prisma
./node_modules/.bin/prisma generate

# Se reinició el servidor
npm run dev
```

## Verificación

### 1. Datos en Base de Datos

**Tipos de Entrada** (4 registros):
```json
[
  {
    "id": "tipo_entrada_transferencia",
    "codigo": "TRANSFERENCIA",
    "nombre": "Transferencia",
    "descripcion": "Transferencia entre almacenes o ubicaciones",
    "color": "blue",
    "icono": "arrow-path",
    "orden": 1
  },
  {
    "id": "tipo_entrada_compra",
    "codigo": "COMPRA_PROVEEDOR",
    "nombre": "Compra proveedor",
    "descripcion": "Compra de productos a proveedor",
    "color": "green",
    "icono": "shopping-cart",
    "orden": 2
  },
  {
    "id": "tipo_entrada_donacion",
    "codigo": "DONACION",
    "nombre": "Donación",
    "descripcion": "Donación recibida",
    "color": "purple",
    "icono": "gift",
    "orden": 3
  },
  {
    "id": "tipo_entrada_ajuste",
    "codigo": "AJUSTE",
    "nombre": "Ajuste",
    "descripcion": "Ajuste de inventario (corrección)",
    "color": "orange",
    "icono": "adjustments-horizontal",
    "orden": 4
  }
]
```

**Tipos de Salida** (2 registros):
```json
[
  {
    "id": "tipo_salida_servicios",
    "codigo": "SERVICIOS_MEDICOS",
    "nombre": "Servicios médicos",
    "descripcion": "Salida para servicios médicos prestados",
    "color": "blue",
    "icono": "heart",
    "orden": 1
  },
  {
    "id": "tipo_salida_ajuste",
    "codigo": "AJUSTE",
    "nombre": "Ajuste",
    "descripcion": "Ajuste de inventario (corrección)",
    "color": "orange",
    "icono": "adjustments-horizontal",
    "orden": 2
  }
]
```

### 2. Páginas de Gestión

Las páginas de gestión están disponibles en:
- `/dashboard/catalogos/tipos-entrada` ✅
- `/dashboard/catalogos/tipos-salida` ✅

Y están incluidas en el menú del sidebar bajo "Catálogos".

## Cambios Realizados

### Archivos Modificados
1. `/prisma/schema.prisma` - Actualización de modelos `tipos_entrada` y `tipos_salida`
2. `/prisma/schema.prisma` - Actualización de relaciones en `entradas_inventario` y `salidas_inventario`

### Comandos Ejecutados
```bash
# Regenerar cliente de Prisma
./node_modules/.bin/prisma generate

# Verificar datos
node -e "prisma.tipos_entrada.findMany()"
node -e "prisma.tipos_salida.findMany()"
```

## Resultado

✅ **Schema sincronizado con base de datos**  
✅ **Cliente de Prisma regenerado correctamente**  
✅ **APIs funcionando sin errores**  
✅ **Páginas de gestión accesibles**  
✅ **Datos de prueba verificados**

## Notas Importantes

1. **Tipo de ID**: El campo `id` es de tipo `String` (TEXT en PostgreSQL), no `Int`
2. **IDs Predefinidos**: Los IDs son descriptivos (ej: `tipo_entrada_transferencia`) en lugar de numéricos
3. **Relaciones**: Las relaciones con `entradas_inventario` y `salidas_inventario` están configuradas con `onDelete: SetNull`
4. **Campos Adicionales**: Se agregaron campos `color`, `icono`, `requiere_proveedor`, `requiere_referencia`, `requiere_destino` que estaban en la migración pero faltaban en el schema

## Referencias

- Migración original: `/prisma/migrations/20251009_create_tipos_movimientos/migration.sql`
- APIs: `/app/api/tipos-entrada/route.ts`, `/app/api/tipos-salida/route.ts`
- Páginas: `/app/dashboard/catalogos/tipos-entrada/page.tsx`, `/app/dashboard/catalogos/tipos-salida/page.tsx`
