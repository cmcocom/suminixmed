# Guía Rápida: Gestión de Empleados y Usuarios

## 🚀 Inicio Rápido

### Acceder a la Página de Empleados

1. Inicia sesión en el sistema
2. Navega a: **Dashboard → Empleados**
3. URL: `http://localhost:3000/dashboard/empleados`

---

## 📝 Casos de Uso Comunes

### 1. Crear Empleado SIN acceso al sistema

```
1. Click "Nuevo Empleado"
2. Completar formulario:
   - No. Empleado: 123456
   - Nombre: Juan Pérez
   - Cargo: Enfermero
   - Turno: Matutino
3. NO marcar "Crear usuario de acceso"
4. Click "Guardar"

✅ Resultado: Empleado creado, no puede iniciar sesión
```

### 2. Crear Empleado CON acceso al sistema

```
1. Click "Nuevo Empleado"
2. Completar formulario
3. ✓ Marcar "Crear usuario de acceso al crear el empleado"
4. Click "Guardar"

✅ Resultado: 
   - Empleado creado
   - Usuario creado automáticamente
   - Clave de usuario: 123456 (número de empleado)
   - Contraseña: Issste2025!
```

### 3. Dar acceso al sistema a empleado existente

```
1. Buscar empleado en la tabla
2. Identificar empleados SIN usuario (badge naranja)
3. Click botón verde "Crear Usuario" (icono +👤)
4. Confirmar en el diálogo

✅ Resultado:
   - Usuario creado y vinculado
   - Clave: número de empleado
   - Contraseña: Issste2025!
```

### 4. Crear usuario administrativo (NO empleado)

```
API: POST /api/usuarios
{
  "name": "María López",
  "email": "maria@admin.com",
  "password": "password123"
}

✅ Resultado:
   - Usuario creado
   - Clave automática: cve-XXXXXX (ej: cve-123456)
   - NO vinculado a empleado
```

---

## 🔍 Búsqueda y Filtros

### Buscar Empleados

- **Campo de búsqueda**: Escribe nombre, número, cargo, servicio o correo
- **Checkbox "Mostrar inactivos"**: Ver empleados desactivados

### Indicadores Visuales

| Icono/Color | Significado |
|-------------|-------------|
| ✅ Badge verde + clave | Empleado CON usuario |
| Badge naranja | Empleado SIN usuario |
| Badge gris | Empleado inactivo |

---

## 🔐 Información de Acceso

### Formato de Claves

- **Empleados**: Usan su número de empleado (ej: `905887`)
- **Usuarios NO empleados**: Formato automático `cve-XXXXXX`

### Contraseñas Predeterminadas

- **Empleados nuevos**: `Issste2025!`
- **Admin del sistema**: Ver con administrador

### Login de Empleados

```
URL: http://localhost:3000/login

Clave: [numero_empleado]
Contraseña: Issste2025!

Ejemplo:
Clave: 905887
Contraseña: Issste2025!
```

---

## 📊 Dashboard de Estadísticas

La página muestra 4 métricas principales:

1. **Total Empleados**: Cantidad total en el sistema
2. **Con Usuario**: Empleados que pueden iniciar sesión
3. **Sin Usuario**: Empleados sin acceso al sistema
4. **Activos**: Empleados actualmente activos

---

## ⚙️ Operaciones Disponibles

### Editar Empleado

```
1. Click botón "Editar" (icono lápiz)
2. Modificar campos necesarios
3. Click "Guardar"

⚠️ Si el empleado tiene usuario:
   - Se sincronizan: nombre, email, teléfono
```

### Desactivar Empleado

```
1. Click botón "Desactivar" (icono basura)
2. Confirmar en el diálogo

⚠️ Si el empleado tiene usuario:
   - El usuario también se desactiva
   - No podrá iniciar sesión
```

### Reactivar Empleado

```
1. Marcar checkbox "Mostrar inactivos"
2. Buscar empleado desactivado
3. Click "Editar"
4. Marcar checkbox "Empleado activo"
5. Guardar
```

---

## 🔄 Flujos de Vinculación

### Empleado → Usuario

```
Empleado existe, usuario NO
↓
Click "Crear Usuario"
↓
Usuario creado con:
- Clave = numero_empleado
- Password = Issste2025!
- Datos sincronizados
```

### Usuario → Empleado

```
Usuario existe, empleado NO
↓
API: POST /api/usuarios/{userId}/vincular-empleado
{
  "empleado_id": "empleado-id"
}
↓
Usuario vinculado a empleado
Mantiene su clave original (cve-XXXXXX)
```

---

## 📋 Campos del Formulario

### Campos Requeridos (*)

- **No. Empleado**: Identificador único
- **Nombre Completo**: Nombre del empleado
- **Cargo**: Puesto de trabajo
- **Turno**: Matutino/Vespertino/Nocturno/Mixto

### Campos Opcionales

- **Servicio**: Área de trabajo
- **Correo Electrónico**: Email de contacto
- **Teléfono/Celular**: Número de contacto

### Opciones

- **Crear usuario de acceso**: Solo disponible al crear
- **Empleado activo**: Marcar/desmarcar para activar/desactivar

---

## 🆘 Solución de Problemas

### "El número de empleado ya existe"

- ✅ Usar número único para cada empleado
- ✅ Verificar en la tabla si ya existe

### "El correo ya está registrado"

- ✅ Usar correo único
- ✅ Verificar si otro empleado usa ese correo

### "El empleado ya tiene un usuario vinculado"

- ✅ No se puede crear usuario duplicado
- ✅ Editar el usuario existente

### No aparece botón "Crear Usuario"

- ✅ Solo visible para empleados SIN usuario
- ✅ Solo visible para empleados ACTIVOS
- ✅ Verificar permisos de usuario actual

---

## 🔗 Endpoints de API

### Empleados

```
GET    /api/empleados                    # Listar
POST   /api/empleados                    # Crear
PATCH  /api/empleados/{id}              # Actualizar
DELETE /api/empleados/{id}              # Desactivar
POST   /api/empleados/{id}/crear-usuario # Crear usuario
```

### Usuarios

```
POST   /api/usuarios                           # Crear usuario NO empleado
POST   /api/usuarios/{id}/vincular-empleado   # Vincular a empleado
```

---

## 📞 Contacto y Soporte

Para dudas o problemas:
- Revisar documentación completa en: `IMPLEMENTACION-EMPLEADOS-USUARIOS-COMPLETADA.md`
- Contactar al administrador del sistema
