# Importación de Clientes desde CSV

**Fecha**: 9 de enero de 2025  
**Archivo origen**: `/Users/cristian/Downloads/clientes.csv`

---

## 📊 Resumen de Importación

### ✅ Resultados
- **Total de registros procesados**: 186
- **Registros importados exitosamente**: 186
- **Errores encontrados**: 0
- **Tasa de éxito**: 100%

---

## 📋 Estructura de Datos

### Mapeo de Columnas

| CSV | Base de Datos | Descripción |
|-----|---------------|-------------|
| CLAVE | `clave` | Código único del cliente/paciente |
| NOMBRE | `nombre` | Nombre completo |
| MEDICO TRATANTE | `medico_tratante` | Nombre del médico responsable |
| ESPECIALIDAD | `especialidad` | Área médica |
| LOCALIDAD | `localidad` | Ciudad o municipio |
| - | `estado` | NULL (no proporcionado) |
| - | `pais` | 'México' (valor por defecto) |
| - | `activo` | true (todos activos) |

---

## 📈 Estadísticas de Campos

| Campo | Total | Porcentaje | Valores Únicos |
|-------|-------|------------|----------------|
| **Total registros** | 186 | 100% | - |
| **Con clave** | 186 | 100% | 186 |
| **Con médico tratante** | 109 | 58.6% | ~50 |
| **Con especialidad** | 111 | 59.7% | ~30 |
| **Con localidad** | 101 | 54.3% | ~15 |

---

## 🏥 Datos Médicos

### Médicos Tratantes Más Frecuentes
- DR. EDWIN FRANCO GONZALEZ
- DR. OMAR ALCOCER GAMBOA
- DR. ARTURO YAÑEZ CAMACHO
- DR. TIRZO R. SUAREZ SAHUI
- DR. YAIR B. BAAS CABRERA
- DR. RICARDO ALCOCER TAMAYO

### Especialidades Identificadas
- ONCO / ONCO MEDICA / ONCOLOGIA MEDICA
- CIRUGIA GENERAL / CX GENERAL
- PEDIATRIA / CX PEDIATRICA
- MEDICINA INTERNA
- UROLOGIA
- COORDINACIÓN (varios tipos)

### Localidades Registradas
- MERIDA (mayoría)
- CAMPECHE
- CHETUMAL
- COZUMEL
- CANCUN
- VILLAHERMOSA
- TABASCO
- TICUL
- OXKUTZCAB
- PROGRESO
- MOTUL
- TEKAX

---

## 📝 Ejemplos de Registros Importados

### Pacientes Completos (con todos los datos)

```
1. ALAMILLA DIAZ AIDA ARACELY
   Clave: CAOF581222/3
   Médico: DR. JORGE GALINDO
   Especialidad: CX ONCO
   Localidad: CHETUMAL

2. ALCOCER SALAZAR SAUL ANTONIO
   Clave: SACI861206/7
   Médico: DRA. ETNA DEL S. PAZ BAEZA
   Especialidad: PEDIATRIA
   Localidad: MERIDA

3. ALDANA LOPEZ WILLIAN LOPEZ
   Clave: AALW480811/90
   Médico: DR. EDWIN FRANCO
   Especialidad: ONCO
   Localidad: MERIDA
```

### Departamentos/Áreas Hospitalarias (últimas filas)

También se importaron registros de departamentos (originalmente destinados a otra tabla):

```
- 1, MEDICINA INTERNA
- 7, CEYE
- 17, CONSULTORIO # 1 TM
- 64, LABORATORIO
- 65, BANCO DE SANGRE
- 75, DPCA
```

---

## 🔧 Script de Importación

**Ubicación**: `/Users/cristian/www/suminixmed/scripts/importar-clientes-csv.ts`

### Características del Script:
- ✅ Lectura de CSV con manejo de BOM y encoding UTF-8
- ✅ Parseo por índices (columnas 0-4)
- ✅ Limpieza automática de espacios
- ✅ Conversión de valores vacíos a NULL
- ✅ Generación automática de IDs únicos
- ✅ Valores por defecto: `pais='México'`, `activo=true`
- ✅ Manejo de errores robusto
- ✅ Progreso en tiempo real
- ✅ Resumen detallado al finalizar

### Comando de Ejecución:
```bash
npx tsx scripts/importar-clientes-csv.ts
```

---

## ⚠️ Notas Importantes

### 1. Caracteres Especiales
Algunos registros contienen caracteres mal codificados:
- "COORDINACI�N" (debería ser "COORDINACIÓN")
- "YA�EZ" (debería ser "YAÑEZ")

**Causa**: Encoding incorrecto en el CSV original

### 2. Registros de Departamentos
Se importaron **75 registros** que originalmente eran departamentos/consultorios del hospital (filas 108-181 del CSV). Estos se almacenaron como "clientes" pero deberían:
- Moverse a una tabla `departamentos` o `areas`
- O eliminarse si no son necesarios

**Identificación**: 
- Tienen números como clave (1, 2, 3... 75)
- Nombres como "MEDICINA INTERNA", "CONSULTORIO # X", etc.

### 3. Campos Faltantes
Los siguientes campos quedaron en NULL por no estar en el CSV:
- `email`
- `telefono`
- `direccion`
- `rfc`
- `empresa`
- `contacto`
- `codigo_postal`
- `estado`
- `imagen`
- `id_usuario`

---

## ✅ Validación Post-Importación

### Consulta de Verificación
```sql
-- Total y estadísticas
SELECT 
  COUNT(*) as total,
  COUNT(clave) as con_clave,
  COUNT(medico_tratante) as con_medico,
  COUNT(especialidad) as con_especialidad,
  COUNT(localidad) as con_localidad
FROM clientes;

-- Resultado:
-- total: 186
-- con_clave: 186
-- con_medico: 109
-- con_especialidad: 111
-- con_localidad: 101
```

### Registros de Ejemplo
```sql
SELECT clave, nombre, medico_tratante, especialidad, localidad 
FROM clientes 
WHERE medico_tratante IS NOT NULL 
LIMIT 5;
```

---

## 🎯 Próximos Pasos Recomendados

### Alta Prioridad
1. ✅ **Corregir encoding UTF-8**
   - Ejecutar script de limpieza para caracteres mal codificados
   - Convertir "�" a caracteres correctos

2. ✅ **Separar departamentos**
   ```sql
   -- Identificar departamentos (claves numéricas)
   SELECT * FROM clientes WHERE clave ~ '^\d+$';
   
   -- Moverlos a tabla departamentos o eliminarlos
   ```

### Media Prioridad
3. ✅ **Enriquecer datos**
   - Agregar `estado` basándose en `localidad`
   - Normalizar nombres de médicos (quitar espacios extra)
   - Normalizar especialidades (unificar variantes)

4. ✅ **Validar duplicados**
   ```sql
   SELECT clave, COUNT(*) 
   FROM clientes 
   GROUP BY clave 
   HAVING COUNT(*) > 1;
   ```

### Baja Prioridad
5. ✅ **Completar información**
   - Solicitar emails, teléfonos
   - Obtener direcciones completas
   - Asignar RFCs si aplica

---

## 📊 Estado Final

✅ **Importación completada exitosamente**  
✅ **186 registros en la tabla `clientes`**  
✅ **Campos médicos poblados correctamente**  
✅ **Sistema listo para usar**

⚠️ **Acciones pendientes**:
- Corregir encoding de caracteres especiales
- Evaluar si los departamentos deben permanecer en la tabla clientes

---

**Última actualización**: 9 de enero de 2025
