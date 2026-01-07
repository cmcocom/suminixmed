# Campos Médicos en la Tabla de Clientes

## 📋 Resumen

Se han agregado **6 nuevos campos** a la tabla `clientes` para soportar información médica y geográfica de los clientes/pacientes.

---

## 🗃️ Campos Agregados

### 1. **clave** (VARCHAR 50)
- **Propósito**: Código o clave única del cliente/paciente
- **Uso**: Identificador interno o código de referencia
- **Índice**: ✅ `idx_clientes_clave`
- **Ejemplo**: `PAC-001`, `CLI-2025-001`

### 2. **medico_tratante** (VARCHAR 200)
- **Propósito**: Nombre del médico tratante del paciente
- **Uso**: Registro del médico responsable del tratamiento
- **Índice**: ✅ `idx_clientes_medico_tratante`
- **Ejemplo**: `Dr. Juan Pérez García`, `Dra. María López`

### 3. **especialidad** (VARCHAR 150)
- **Propósito**: Especialidad médica del paciente o del médico tratante
- **Uso**: Clasificación por área médica
- **Índice**: ✅ `idx_clientes_especialidad`
- **Ejemplo**: `Cardiología`, `Pediatría`, `Oncología`

### 4. **localidad** (VARCHAR 150)
- **Propósito**: Ciudad, localidad o municipio del cliente
- **Uso**: Ubicación geográfica a nivel de ciudad
- **Índice**: ✅ `idx_clientes_localidad`
- **Ejemplo**: `Ciudad de México`, `Guadalajara`, `Monterrey`

### 5. **estado** (VARCHAR 100)
- **Propósito**: Estado o provincia del cliente
- **Uso**: Ubicación geográfica a nivel estatal
- **Índice**: ✅ `idx_clientes_localidad_estado` (compuesto)
- **Ejemplo**: `CDMX`, `Jalisco`, `Nuevo León`

### 6. **pais** (VARCHAR 100)
- **Propósito**: País del cliente
- **Uso**: Ubicación geográfica a nivel nacional
- **Default**: `'México'`
- **Ejemplo**: `México`, `Estados Unidos`, `Guatemala`

---

## 📊 Estructura en la Base de Datos

```sql
-- Campos agregados a la tabla clientes
ALTER TABLE "clientes" ADD COLUMN "clave" VARCHAR(50);
ALTER TABLE "clientes" ADD COLUMN "medico_tratante" VARCHAR(200);
ALTER TABLE "clientes" ADD COLUMN "especialidad" VARCHAR(150);
ALTER TABLE "clientes" ADD COLUMN "localidad" VARCHAR(150);
ALTER TABLE "clientes" ADD COLUMN "estado" VARCHAR(100);
ALTER TABLE "clientes" ADD COLUMN "pais" VARCHAR(100) DEFAULT 'México';

-- Índices para optimización de consultas
CREATE INDEX "idx_clientes_clave" ON "clientes"("clave");
CREATE INDEX "idx_clientes_medico_tratante" ON "clientes"("medico_tratante");
CREATE INDEX "idx_clientes_especialidad" ON "clientes"("especialidad");
CREATE INDEX "idx_clientes_localidad" ON "clientes"("localidad");
CREATE INDEX "idx_clientes_localidad_estado" ON "clientes"("localidad", "estado");
```

---

## 🔍 Búsqueda Mejorada

El formulario de búsqueda ahora incluye estos campos:

```typescript
// Campos incluidos en la búsqueda
- nombre
- email
- rfc
- empresa
- contacto
- clave            // ✨ NUEVO
- medico_tratante  // ✨ NUEVO
- especialidad     // ✨ NUEVO
- localidad        // ✨ NUEVO
```

---

## 🎨 Interfaz de Usuario

### Nueva Sección en el Formulario

Se agregó una sección visual destacada con fondo gradiente teal/cyan:

**"Información Médica y Ubicación"**

Contiene 6 campos organizados en un grid de 2 columnas:
- Clave del Cliente
- Médico Tratante
- Especialidad
- Localidad / Ciudad
- Estado / Provincia
- País

---

## 🔌 API Endpoints Actualizados

### POST `/api/clientes`
```typescript
// Campos aceptados en el body
{
  // ... campos existentes
  clave?: string,
  medico_tratante?: string,
  especialidad?: string,
  localidad?: string,
  estado?: string,
  pais?: string  // default: 'México'
}
```

### PUT `/api/clientes/[id]`
```typescript
// Campos aceptados en el body (todos opcionales)
{
  // ... campos existentes
  clave?: string,
  medico_tratante?: string,
  especialidad?: string,
  localidad?: string,
  estado?: string,
  pais?: string
}
```

---

## ✅ Archivos Modificados

1. **Prisma Schema** (`/prisma/schema.prisma`)
   - Agregados 6 campos al modelo `clientes`
   - Agregados 5 índices para optimización

2. **Migración SQL** (`/prisma/migrations/20251009_add_campos_medicos_clientes/migration.sql`)
   - ALTER TABLE con 6 columnas nuevas
   - CREATE INDEX para 5 índices
   - COMMENT statements para documentación

3. **Frontend** (`/app/dashboard/clientes/page.tsx`)
   - Actualizada interface `Cliente`
   - Actualizada interface `FormData`
   - Nueva sección "Información Médica y Ubicación"
   - Búsqueda mejorada con nuevos campos

4. **API Backend**
   - `/app/api/clientes/route.ts` (POST)
   - `/app/api/clientes/[id]/route.ts` (PUT)

---

## 🚀 Estado Actual

✅ **Campos creados en base de datos**
✅ **Índices creados**
✅ **Prisma Client regenerado**
✅ **Formulario actualizado**
✅ **API endpoints actualizados**
✅ **Búsqueda mejorada**
✅ **Sin errores de compilación**

---

## 📝 Uso Recomendado

### Caso de Uso: Servicios Médicos

Cuando un cliente es un **paciente** que recibe servicios médicos:

1. **Clave**: Número de expediente o ID del paciente
2. **Médico Tratante**: Doctor responsable del tratamiento
3. **Especialidad**: Área médica del tratamiento
4. **Localidad**: Ciudad donde reside el paciente
5. **Estado**: Estado de residencia
6. **País**: Por defecto México, ajustable si es necesario

### Ejemplo de Registro

```json
{
  "nombre": "Juan Pérez García",
  "clave": "EXP-2025-001",
  "medico_tratante": "Dr. Carlos Rodríguez",
  "especialidad": "Cardiología",
  "localidad": "Guadalajara",
  "estado": "Jalisco",
  "pais": "México"
}
```

---

## 🎯 Beneficios

1. **Trazabilidad Médica**: Registro completo de información médica
2. **Búsqueda Eficiente**: Índices optimizados para consultas rápidas
3. **Localización**: Análisis geográfico de clientes
4. **Flexibilidad**: Campos opcionales que no afectan registros existentes
5. **Compatibilidad**: Los clientes existentes siguen funcionando (campos nullable)

---

## ⚠️ Notas Importantes

- **Todos los campos son opcionales** (nullable en la base de datos)
- El campo `pais` tiene valor por defecto: `'México'`
- Los campos están **indexados** para búsquedas rápidas
- La **búsqueda del formulario** incluye automáticamente estos campos
- Compatible con **clientes existentes** (no requiere migración de datos)

---

## 📅 Información de Migración

- **Fecha**: 9 de enero de 2025
- **Migración**: `20251009_add_campos_medicos_clientes`
- **Versión Prisma**: 6.15.0
- **Estado**: ✅ Completada y verificada

---

**Última actualización**: 9 de enero de 2025
