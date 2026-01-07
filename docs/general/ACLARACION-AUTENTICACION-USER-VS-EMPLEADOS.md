# 🔐 ACLARACIÓN: Sistema de Autenticación - Tabla User vs Empleados

## ✅ CONFIRMACIÓN: El Login USA la Tabla CORRECTA

### 📍 **Tabla de Autenticación**
El sistema de login **SÍ está usando la tabla correcta**: **`User`**

```typescript
// lib/auth.ts - Línea 33-36
const user = await prisma.user.findUnique({
  where: { clave: credentials.clave },  // ✅ Busca en User.clave
  include: { empleado: true }
});
```

---

## 🔍 Análisis del Problema que Encontraste

### Usuario: `cmcocom@unidadc.com`

#### Estado en Base de Datos:

| Tabla | Campo Clave | Valor | Estado |
|-------|-------------|-------|--------|
| **User** | `clave` | `cve-888963` | ✅ CORRECTO - Se usa para login |
| **empleados** | `numero_empleado` | N/A | ❌ NO existe (es usuario no-empleado) |

### ✅ **Conclusión**: 
Este usuario **NO es empleado**, es un usuario administrativo. Por lo tanto:
- ✅ Solo existe en tabla `User`
- ✅ Su clave es `cve-888963` (formato para NO empleados)
- ✅ El login busca en `User.clave` (correcto)

---

## 📊 Diferencias: Usuario vs Empleado

### 1️⃣ **Usuarios NO Empleados**
```
Tabla:           User
Campo clave:     clave = "cve-XXXXXX"
Autenticación:   User.clave + User.password
Ejemplo:         cmcocom@unidadc.com
```

### 2️⃣ **Usuarios Empleados**  
```
Tabla principal: User
Tabla secundaria: empleados (vinculada por user_id)
Campo clave:      clave = numero_empleado (ej: "905887")
Autenticación:    User.clave + User.password
Ejemplo:          LUIS ENRIQUE ESCALANTE (clave: 905887)
```

---

## 🔑 Flujo de Autenticación

### Paso 1: Usuario ingresa credenciales
```
Input del formulario:
- Clave:    cve-888963 (o numero_empleado)
- Password: Issste2025!
```

### Paso 2: Sistema busca en tabla `User`
```sql
SELECT * FROM "User" 
WHERE clave = 'cve-888963'  -- ✅ Busca en User.clave
LIMIT 1;
```

### Paso 3: Valida contraseña
```typescript
bcrypt.compare(inputPassword, user.password)
```

### Paso 4: Incluye info de empleado (si existe)
```typescript
include: { empleado: true }  // Trae datos de empleados si está vinculado
```

---

## 📝 CREDENCIALES ACTUALIZADAS

### 🔐 Usuario Admin (NO empleado)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 Clave:     cve-888963
📧 Email:     cmcocom@unidadc.com  
🔒 Password:  Issste2025!
👤 Tipo:      Usuario Administrativo
✅ Estado:    Activo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 👥 Usuarios Empleados (ejemplo)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 Clave:     905887
📧 Email:     leeb.905887@gmail.com
🔒 Password:  Issste2025!
👤 Tipo:      Empleado (RADIOLOGIA)
✅ Estado:    Activo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ⚙️ Arquitectura de Tablas

### Tabla `User` (Principal - Autenticación)
```sql
CREATE TABLE "User" (
  id              TEXT PRIMARY KEY,
  clave           TEXT UNIQUE NOT NULL,  -- ✅ CAMPO DE LOGIN
  email           TEXT UNIQUE,
  password        TEXT,                  -- ✅ CONTRASEÑA HASHEADA
  name            TEXT,
  telefono        TEXT,
  activo          BOOLEAN DEFAULT TRUE,
  is_system_user  BOOLEAN DEFAULT FALSE
);
```

### Tabla `empleados` (Secundaria - Información)
```sql
CREATE TABLE empleados (
  id              TEXT PRIMARY KEY,
  numero_empleado TEXT UNIQUE NOT NULL,
  user_id         TEXT UNIQUE,           -- FK a User.id
  nombre          TEXT,
  cargo           TEXT,
  servicio        TEXT,
  turno           TEXT,
  correo          TEXT,
  celular         TEXT
);
```

### Relación: `User` ← → `empleados`
```
User.id ←──── empleados.user_id
   (1)           (0..1)

- Un User puede NO tener empleado (usuario admin)
- Un User puede tener UN empleado vinculado
- Un empleado DEBE tener un User para login
```

---

## 🎯 Casos de Uso

### Caso 1: Login de Usuario NO Empleado
```
1. Usuario ingresa: clave="cve-888963"
2. Sistema busca en User.clave
3. Encuentra: cmcocom@unidadc.com
4. Valida password
5. Login exitoso (empleado = null)
```

### Caso 2: Login de Usuario Empleado
```
1. Usuario ingresa: clave="905887"
2. Sistema busca en User.clave = "905887"
3. Encuentra usuario vinculado
4. Valida password
5. Login exitoso (incluye datos de empleado)
```

---

## 🚨 Errores Comunes

### ❌ Error 1: "Usuario no encontrado"
```
Mensaje: Usuario no encontrado o sin contraseña: xxx
Causa:   La clave no existe en User.clave
Solución: Verificar clave correcta
```

### ❌ Error 2: "Contraseña incorrecta"
```
Mensaje: Contraseña incorrecta para: cve-888963
Causa:   Password no coincide con User.password
Solución: Usar contraseña correcta o resetear
```

### ❌ Error 3: Confusión User vs empleados
```
Problema: Buscar en tabla empleados para login
Realidad: Login SIEMPRE usa tabla User
```

---

## 🔧 Scripts de Utilidad

### Verificar contraseña de admin
```bash
node scripts/verificar-y-actualizar-password-admin.mjs
```

### Resetear contraseña de admin
```bash
node scripts/verificar-y-actualizar-password-admin.mjs --reset
```

### Ver usuarios en BD
```sql
SELECT id, clave, email, name, activo 
FROM "User" 
WHERE email = 'cmcocom@unidadc.com';
```

---

## ✅ RESUMEN FINAL

| Aspecto | Valor |
|---------|-------|
| **Tabla de Login** | ✅ `User` (CORRECTO) |
| **Campo de Clave** | ✅ `User.clave` (CORRECTO) |
| **Campo de Password** | ✅ `User.password` (CORRECTO) |
| **Tabla empleados** | ℹ️ Solo información adicional |
| **Login Admin** | ✅ `cve-888963` / `Issste2025!` |

### 🎯 **NO hay error en el código**
El sistema está **correctamente configurado** para autenticar desde la tabla `User`.

---

*Actualizado: 8 de octubre de 2025*
*Sistema: SuminixMED - ISSSTE*
