# Corrección: Error en Respaldo de Base de Datos

**Fecha:** 9 de octubre de 2025  
**Estado:** ✅ Completado

## Error Identificado

### Mensaje de Error Completo

```
Command failed: PGPASSWORD="***" pg_dump -h localhost -p 5432 -U postgres -d suminix?connection_limit=10&pool_timeout=20 -F p -f "/Users/cristian/www/suminixmed/backups/backup-2025-10-09T11-32-43-849Z.sql"
/bin/sh: -F: command not found
pg_dump: error: invalid connection option "suminix?connection_limit"
```

### Análisis del Error

**Problema 1: Nombre de Base de Datos Incorrecto**
```bash
-d suminix?connection_limit=10&pool_timeout=20
```
El comando `pg_dump` estaba recibiendo el nombre de la base de datos con los **parámetros de conexión incluidos** (`?connection_limit=10&pool_timeout=20`), lo cual es inválido.

**Problema 2: `/bin/sh: -F: command not found`**
Este error secundario ocurría porque el shell intentaba interpretar `-F` como un comando separado debido a que el nombre de la base de datos contenía caracteres especiales (`?`).

### Causa Raíz

La función `parseDatabaseUrl()` usaba un regex que **no excluía los parámetros de query** de la URL de conexión:

**Regex Incorrecto:**
```typescript
const regex = /postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
//                                                            ^^^^ Captura TODO después de /
```

**URL de ejemplo:**
```
postgres://usuario:password@localhost:5432/suminix?connection_limit=10&pool_timeout=20
                                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                            TODO esto se extraía como nombre de BD ❌
```

**Resultado:**
- `database = "suminix?connection_limit=10&pool_timeout=20"` ❌
- Comando generado: `pg_dump ... -d suminix?connection_limit=10&pool_timeout=20` ❌

## Solución Implementada

### Regex Corregido

```typescript
// ANTES ❌
const regex = /postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;

// DESPUÉS ✅
const regex = /postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
//                                                            ^^^^^^ Solo hasta el primer ?
```

**Explicación del cambio:**
- `(.+)` - Captura TODO hasta el final de la línea
- `([^?]+)` - Captura TODO **excepto** el signo `?` (detiene en el primer `?`)

### Comportamiento Corregido

**URL de entrada:**
```
postgres://usuario:password@localhost:5432/suminix?connection_limit=10&pool_timeout=20
```

**Extracción correcta:**
```typescript
{
  user: "usuario",
  password: "password",
  host: "localhost",
  port: "5432",
  database: "suminix"  // ✅ Solo el nombre, sin parámetros
}
```

**Comando generado correcto:**
```bash
pg_dump -h localhost -p 5432 -U usuario -d suminix -F p -f "backup.sql"
#                                          ^^^^^^^ Solo el nombre de BD ✅
```

## Archivos Modificados

### 1. `/lib/backup-utils.ts`

```typescript
function parseDatabaseUrl(): {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
} {
  const dbUrl = process.env.DATABASE_URL || '';
  
  // Formato: postgres://user:password@host:port/database?params
  // Necesitamos extraer solo el nombre de la base de datos sin los parámetros
  const regex = /postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
  //                                                           ^^^^^^ Cambio aquí
  const match = dbUrl.match(regex);

  if (match) {
    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5], // Solo el nombre, sin parámetros
    };
  }

  // Fallback a variables individuales
  return {
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || '5432',
    database: process.env.DATABASE_NAME || 'suminix',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
  };
}
```

### 2. `/lib/backup-utils-advanced.ts`

El mismo cambio se aplicó en este archivo para mantener consistencia.

## Validación de URLs

### URLs Soportadas

✅ **Básica:**
```
postgres://user:pass@localhost:5432/dbname
```

✅ **Con parámetros de conexión:**
```
postgres://user:pass@localhost:5432/dbname?connection_limit=10
```

✅ **Con múltiples parámetros:**
```
postgres://user:pass@localhost:5432/dbname?connection_limit=10&pool_timeout=20
```

✅ **Con host remoto:**
```
postgres://user:pass@db.example.com:5432/production?ssl=true
```

### Extracción Correcta

| URL Completa | Database Extraído |
|--------------|-------------------|
| `postgres://user:pass@host:5432/suminix` | `suminix` ✅ |
| `postgres://user:pass@host:5432/suminix?limit=10` | `suminix` ✅ |
| `postgres://user:pass@host:5432/my_db?ssl=true&timeout=30` | `my_db` ✅ |
| `postgres://user:pass@host:5432/prod?param1=a&param2=b` | `prod` ✅ |

## Testing

### Prueba 1: Comando pg_dump Generado ✅

**Antes:**
```bash
pg_dump -d suminix?connection_limit=10&pool_timeout=20 ...
# ❌ Error: invalid connection option
```

**Después:**
```bash
pg_dump -d suminix ...
# ✅ Correcto
```

### Prueba 2: Respaldo Manual ✅

1. Ir a Dashboard → Respaldos
2. Click en "Crear Respaldo Manual"
3. Verificar que el respaldo se crea sin errores
4. Revisar que el archivo `.sql` existe en `/backups/`

### Prueba 3: Variables de Entorno Alternativas ✅

Si `DATABASE_URL` no está definida, el código usa variables individuales:

```typescript
{
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || '5432',
  database: process.env.DATABASE_NAME || 'suminix',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
}
```

## Patrones Regex Explicados

### Regex Completo

```typescript
/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/
```

**Desglose:**
```
postgres:\/\/      Literal "postgres://"
([^:]+)            Grupo 1: Usuario (todo hasta el primer :)
:                  Literal ":"
([^@]+)            Grupo 2: Password (todo hasta el @)
@                  Literal "@"
([^:]+)            Grupo 3: Host (todo hasta el :)
:                  Literal ":"
(\d+)              Grupo 4: Puerto (solo dígitos)
\/                 Literal "/"
([^?]+)            Grupo 5: Database (todo hasta el ? o fin) ← CAMBIO CLAVE
```

### Comparación de Patrones

| Patrón | Captura | Descripción |
|--------|---------|-------------|
| `(.+)` | `suminix?limit=10&timeout=20` | TODO hasta el final ❌ |
| `([^?]+)` | `suminix` | Todo hasta el primer `?` ✅ |
| `([^\?&]+)` | `suminix` | Todo hasta `?` o `&` ✅ |
| `(\w+)` | `suminix` | Solo alfanuméricos ⚠️ (no soporta `-` o `_`) |

**Elegimos** `([^?]+)` porque:
- ✅ Detiene en el primer `?`
- ✅ Permite nombres con guiones y guiones bajos
- ✅ Simple y fácil de entender

## Impacto

### Funciones Afectadas

Todas las funciones que usan `pg_dump` o `psql` ahora funcionan correctamente:

✅ `createDatabaseBackup()` - Crear respaldos  
✅ `restoreDatabaseBackup()` - Restaurar respaldos  
✅ `getDatabaseInfo()` - Información de BD  
✅ Todas las funciones en `backup-utils-advanced.ts`  

### Sin Regresiones

- ✅ URLs básicas siguen funcionando
- ✅ Fallback a variables individuales intacto
- ✅ Compatibilidad con todas las configuraciones existentes

## Prevención de Errores Futuros

### Recomendaciones

1. **Validar DATABASE_URL en inicio:**
   ```typescript
   if (!dbConfig.database || dbConfig.database.includes('?')) {
     throw new Error('DATABASE_URL mal formada');
   }
   ```

2. **Logging de configuración (sin passwords):**
   ```typescript
   console.log('DB Config:', {
     host: DB_HOST,
     port: DB_PORT,
     database: DB_NAME,
     user: DB_USER,
     password: '***'
   });
   ```

3. **Tests unitarios para parseDatabaseUrl:**
   ```typescript
   describe('parseDatabaseUrl', () => {
     it('debe extraer solo el nombre sin parámetros', () => {
       process.env.DATABASE_URL = 'postgres://u:p@h:5432/db?param=val';
       expect(parseDatabaseUrl().database).toBe('db');
     });
   });
   ```

## Referencias

- **PostgreSQL Connection Strings:** https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING
- **pg_dump Documentation:** https://www.postgresql.org/docs/current/app-pgdump.html
- **Regex Pattern Matching:** https://regex101.com/

## Notas Adicionales

### Por qué los parámetros no deben ir en pg_dump

Los parámetros como `connection_limit` y `pool_timeout` son **parámetros de la aplicación** (usados por Prisma/ORMs), NO son parámetros de `pg_dump`.

**Para la aplicación (Prisma):**
```
postgres://user:pass@host:5432/suminix?connection_limit=10&pool_timeout=20
                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ OK
```

**Para pg_dump:**
```bash
pg_dump -d suminix  # Solo el nombre ✅
```

Si necesitas pasar parámetros a `pg_dump`, se usan flags diferentes:
```bash
pg_dump -d dbname --clean --if-exists --no-owner
```

---

**Resultado:** ✅ Respaldos ahora funcionan correctamente sin errores de parsing de URL
