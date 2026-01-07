# 🧪 Guía de Pruebas - Página de Usuarios Actualizada

## 📅 Fecha: 8 de octubre de 2025

---

## 🎯 Objetivo de las Pruebas

Verificar que la página de usuarios actualizada muestra correctamente:
- Badges de empleados vinculados
- Información de empleados
- Funcionalidad de vincular usuarios a empleados
- Estadísticas actualizadas

---

## 🚀 Preparación

### 1. Verificar Servidor
```bash
# El servidor debe estar ejecutándose en:
http://localhost:3000
# o
http://localhost:3001
```

### 2. Acceder al Sistema
```
URL: http://localhost:3000/dashboard/usuarios
Usuario: admin@example.com (o tu usuario con permisos)
```

---

## ✅ Casos de Prueba

### Caso 1: Verificar Estadísticas Actualizadas

**Objetivo:** Confirmar que las 5 tarjetas de estadísticas se muestran

**Pasos:**
1. Acceder a `/dashboard/usuarios`
2. Observar el panel de estadísticas superior

**Resultado Esperado:**
```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│   Total     │   Activos   │  Inactivos  │  Empleados  │Solo Usuarios│
│  Usuarios   │             │             │    💼       │     👤      │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

**Validar:**
- ✅ Tarjeta "Total Usuarios" (icono gris)
- ✅ Tarjeta "Usuarios Activos" (icono verde)
- ✅ Tarjeta "Usuarios Inactivos" (icono rojo)
- ✅ Tarjeta "Empleados" (icono azul 💼)
- ✅ Tarjeta "Solo Usuarios" (icono morado 👤)

---

### Caso 2: Identificar Usuarios con Empleado Vinculado

**Objetivo:** Verificar que los usuarios-empleados muestran el badge

**Pasos:**
1. Buscar en la lista usuarios que tengan `numero_empleado` como clave
2. Observar la tarjeta del usuario

**Resultado Esperado:**
```
┌─────────────────────────────────────┐
│ 👤 [Nombre del Usuario]             │
│ ✉️ [email]                          │
│ 🔑 clave: [numero_empleado]         │
│                                     │
│ ┌─────────┐                         │
│ │EMPLEADO │ 💼                      │  ← Badge azul
│ └─────────┘                         │
│ No. Empleado: XXXXX • [Cargo]       │  ← Info empleado
│                                     │
│ [Editar] [Eliminar]                 │
└─────────────────────────────────────┘
```

**Validar:**
- ✅ Badge azul "EMPLEADO" visible
- ✅ Icono de maletín (💼) presente
- ✅ Texto "No. Empleado: XXXXX • [Cargo]"
- ✅ NO debe mostrar botón "Vincular Empleado"

**Usuarios de ejemplo a verificar:**
- Cualquier usuario con clave numérica (ejemplo: 12345, 67890)
- Deben ser aprox. 110 usuarios con badge

---

### Caso 3: Identificar Usuarios sin Empleado

**Objetivo:** Verificar que usuarios sin empleado muestran el botón vincular

**Pasos:**
1. Buscar usuarios con clave formato "cve-XXXX"
2. Observar la tarjeta del usuario

**Resultado Esperado:**
```
┌─────────────────────────────────────┐
│ 👤 [Nombre del Usuario]             │
│ ✉️ [email]                          │
│ 🔑 clave: cve-XXXX                  │
│                                     │
│ ┌─────────────────────┐             │
│ │🔗 Vincular Empleado │             │  ← Botón azul
│ └─────────────────────┘             │
│                                     │
│ [Editar] [Eliminar]                 │
└─────────────────────────────────────┘
```

**Validar:**
- ✅ NO muestra badge "EMPLEADO"
- ✅ Muestra botón "Vincular Empleado" con icono de enlace (🔗)
- ✅ Botón es de color azul
- ✅ Botón es clickeable

**Usuarios de ejemplo:**
- Usuario administrador (clave: cve-0001 o similar)
- Cualquier usuario creado sin empleado

---

### Caso 4: Vincular Usuario a Empleado

**Objetivo:** Verificar el flujo completo de vinculación

**Pre-requisitos:**
- Tener al menos 1 empleado SIN usuario vinculado
- Tener al menos 1 usuario SIN empleado vinculado

**Pasos:**

#### 1. Verificar empleados disponibles
```bash
# Consulta SQL para ver empleados sin usuario
SELECT e.id, e.numero_empleado, e.nombre, e.cargo
FROM empleados e
WHERE e.usuario_id IS NULL;
```

#### 2. Abrir modal de vinculación
1. Localizar un usuario SIN badge "EMPLEADO"
2. Click en botón "🔗 Vincular Empleado"

**Resultado:**
- ✅ Modal se abre
- ✅ Header azul muestra: "Vincular Empleado"
- ✅ Muestra nombre y email del usuario seleccionado
- ✅ Loading spinner aparece brevemente

#### 3. Buscar empleado
1. Escribir en campo de búsqueda
   - Probar buscar por nombre
   - Probar buscar por número de empleado
   - Probar buscar por cargo

**Resultado:**
- ✅ Lista se filtra en tiempo real
- ✅ Búsqueda es case-insensitive
- ✅ Muestra mensaje si no hay resultados

#### 4. Seleccionar empleado
1. Click en un empleado de la lista
   - Observar el radio button

**Resultado:**
- ✅ Radio button se selecciona
- ✅ Tarjeta del empleado se resalta (borde azul)
- ✅ Fondo cambia a azul claro
- ✅ Botón "Vincular Empleado" se habilita

#### 5. Confirmar vinculación
1. Click en botón "Vincular Empleado" (footer del modal)

**Resultado:**
- ✅ Botón muestra "Vinculando..." con spinner
- ✅ Modal se cierra automáticamente
- ✅ Toast de éxito aparece: "Empleado vinculado exitosamente"
- ✅ Lista de usuarios se actualiza

#### 6. Verificar vinculación exitosa
1. Buscar el usuario recién vinculado en la lista

**Resultado:**
- ✅ Badge azul "EMPLEADO" ahora visible
- ✅ Muestra info: "No. Empleado: XXX • Cargo"
- ✅ Botón "Vincular Empleado" ya NO aparece
- ✅ Estadística "Empleados" incrementó en 1
- ✅ Estadística "Solo Usuarios" decrementó en 1

---

### Caso 5: Sin Empleados Disponibles

**Objetivo:** Verificar comportamiento cuando no hay empleados disponibles

**Pre-requisitos:**
- Todos los empleados ya tienen usuario vinculado

**Pasos:**
1. Click en "Vincular Empleado" de cualquier usuario sin empleado
2. Observar el modal

**Resultado Esperado:**
- ✅ Modal se abre
- ✅ Muestra mensaje: "No hay empleados disponibles para vincular"
- ✅ Lista de empleados está vacía
- ✅ Botón "Vincular Empleado" deshabilitado
- ✅ Puede cerrar modal con "Cancelar" o X

---

### Caso 6: Manejo de Errores

**Objetivo:** Verificar que errores se manejan correctamente

**Escenario A: Error de red**
1. Desconectar internet (o detener servidor)
2. Intentar vincular empleado

**Resultado:**
- ✅ Toast de error aparece
- ✅ Mensaje descriptivo del error
- ✅ Modal permanece abierto
- ✅ Puede reintentar o cancelar

**Escenario B: Empleado ya vinculado**
1. Dos usuarios intentan vincular el mismo empleado simultáneamente

**Resultado:**
- ✅ Segundo usuario recibe error
- ✅ Toast: "El empleado ya tiene un usuario vinculado"
- ✅ Lista se actualiza mostrando empleados disponibles

---

## 📊 Checklist de Verificación

### Estadísticas
- [ ] Total Usuarios muestra número correcto
- [ ] Usuarios Activos suma correcta
- [ ] Usuarios Inactivos suma correcta
- [ ] Empleados muestra usuarios vinculados
- [ ] Solo Usuarios muestra usuarios sin vínculo
- [ ] Total = Empleados + Solo Usuarios

### Visualización de Usuarios
- [ ] Badge "EMPLEADO" solo en usuarios vinculados
- [ ] Info de empleado (No. XXX • Cargo) visible
- [ ] Botón "Vincular" solo en usuarios SIN empleado
- [ ] Iconos correctos (💼 empleados, 🔗 vincular)
- [ ] Colores correctos (azul, morado)

### Modal de Vinculación
- [ ] Abre correctamente al click
- [ ] Muestra usuario seleccionado en header
- [ ] Lista de empleados carga
- [ ] Búsqueda filtra correctamente
- [ ] Selección con radio button funciona
- [ ] Botón habilita/deshabilita según selección
- [ ] Vinculación ejecuta correctamente
- [ ] Feedback con toast notifications
- [ ] Lista se actualiza post-vinculación
- [ ] Modal se cierra automáticamente

### Interacción
- [ ] Botón "Vincular" clickeable
- [ ] Modal responsive en mobile
- [ ] Scroll funciona en lista larga de empleados
- [ ] Cerrar modal con X funciona
- [ ] Cancelar funciona
- [ ] Loading spinners aparecen

---

## 🐛 Problemas Conocidos

### A verificar:
- [ ] Paginación funciona con vinculación
- [ ] Búsqueda mantiene vinculaciones visibles
- [ ] Filtro "Mostrar todos" incluye empleados
- [ ] Permisos RBAC respetados

---

## 📸 Capturas de Pantalla Esperadas

### 1. Estadísticas (5 tarjetas)
```
[Captura mostrando las 5 tarjetas de estadísticas]
```

### 2. Usuario con Empleado
```
[Captura de tarjeta con badge azul "EMPLEADO" e info]
```

### 3. Usuario sin Empleado
```
[Captura de tarjeta con botón "Vincular Empleado"]
```

### 4. Modal de Vinculación
```
[Captura del modal abierto con lista de empleados]
```

### 5. Modal con Búsqueda
```
[Captura del modal con campo de búsqueda usado]
```

### 6. Toast de Éxito
```
[Captura del toast "Empleado vinculado exitosamente"]
```

---

## 📝 Reporte de Pruebas

### Información de Ambiente
```
Fecha de prueba: _______________
Navegador: _______________
Versión: _______________
URL: http://localhost:____
Usuario de prueba: _______________
```

### Resultados

| Caso | Descripción | ✅ Pass | ❌ Fail | Notas |
|------|-------------|---------|---------|-------|
| 1 | Estadísticas 5 tarjetas | [ ] | [ ] | |
| 2 | Badge empleado visible | [ ] | [ ] | |
| 3 | Botón vincular visible | [ ] | [ ] | |
| 4 | Flujo vincular completo | [ ] | [ ] | |
| 5 | Sin empleados disponibles | [ ] | [ ] | |
| 6 | Manejo de errores | [ ] | [ ] | |

### Bugs Encontrados
```
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________
```

### Observaciones
```
_______________________________________________
_______________________________________________
_______________________________________________
```

---

## 🔧 Comandos Útiles para Debugging

### Ver usuarios y empleados
```sql
-- Usuarios con empleado
SELECT u.id, u.name, u.email, u.clave, 
       e.numero_empleado, e.nombre as empleado_nombre, e.cargo
FROM "User" u
LEFT JOIN empleados e ON u."empleadoId" = e.id
WHERE u."empleadoId" IS NOT NULL;

-- Usuarios sin empleado
SELECT u.id, u.name, u.email, u.clave
FROM "User" u
WHERE u."empleadoId" IS NULL;

-- Empleados sin usuario
SELECT e.id, e.numero_empleado, e.nombre, e.cargo
FROM empleados e
WHERE e.usuario_id IS NULL;
```

### Verificar API
```bash
# Listar empleados
curl http://localhost:3000/api/empleados

# Vincular usuario a empleado
curl -X POST http://localhost:3000/api/usuarios/[USER_ID]/vincular-empleado \
  -H "Content-Type: application/json" \
  -d '{"empleadoId": "[EMPLEADO_ID]"}'
```

### Logs del servidor
```bash
# Ver logs en tiempo real
tail -f .next/trace

# Ver errores de compilación
npm run build
```

---

## ✅ Criterios de Aceptación

Para considerar la funcionalidad como **APROBADA**, debe cumplir:

### Funcional
- ✅ Todas las estadísticas muestran datos correctos
- ✅ Badge "EMPLEADO" aparece solo en usuarios vinculados
- ✅ Botón "Vincular" aparece solo en usuarios sin vínculo
- ✅ Modal de vinculación funciona completamente
- ✅ Búsqueda de empleados filtra correctamente
- ✅ Vinculación actualiza la BD y UI

### UX
- ✅ Feedback visual claro (badges, iconos, colores)
- ✅ Toast notifications informativas
- ✅ Loading states durante operaciones
- ✅ Modal responsive y accesible

### Técnico
- ✅ Sin errores de compilación
- ✅ Sin errores en consola del navegador
- ✅ APIs responden correctamente
- ✅ Datos persistentes en BD

### Seguridad
- ✅ Validaciones en cliente y servidor
- ✅ Solo empleados disponibles se muestran
- ✅ No se puede vincular empleado ya vinculado
- ✅ Permisos RBAC respetados

---

## 🎯 Próximo Paso

Una vez completadas las pruebas:

1. **Si todo funciona:** ✅
   - Marcar como completado
   - Actualizar documentación si es necesario
   - Preparar para deploy

2. **Si hay bugs:** 🐛
   - Documentar en "Bugs Encontrados"
   - Crear issues para corrección
   - Re-probar después de fixes

---

**¡Listo para probar!** 🚀

Accede a: **http://localhost:3000/dashboard/usuarios**

---

*Documento de pruebas generado el 8 de octubre de 2025*
