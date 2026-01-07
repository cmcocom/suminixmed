# Script para eliminar la funcionalidad de eliminar productos
# Leer el archivo original
$archivo = "app/dashboard/productos/page.tsx"
$contenido = Get-Content $archivo

# Crear respaldo
$fecha = Get-Date -Format "yyyyMMdd-HHmmss"
$respaldo = "$archivo.backup-$fecha"
Copy-Item $archivo $respaldo
Write-Host "Respaldo creado: $respaldo"

# Mostrar líneas alrededor de la función handleDelete
Write-Host "Contenido actual alrededor de handleDelete:"
$contenido | Select-Object -Skip 455 -First 50 | ForEach-Object { Write-Host $_ }

# Buscar la función handleDelete y mostrar su ubicación
$lineaInicio = -1
$lineaFin = -1

for ($i = 0; $i -lt $contenido.Length; $i++) {
    if ($contenido[$i] -match "const handleDelete = async") {
        $lineaInicio = $i
        Write-Host "Función handleDelete encontrada en línea: $($i + 1)"
        break
    }
}

if ($lineaInicio -ge 0) {
    # Buscar el final de la función
    $nivel = 0
    $buscarFin = $false
    
    for ($i = $lineaInicio; $i -lt $contenido.Length; $i++) {
        $linea = $contenido[$i]
        
        if ($linea -match "const handleDelete = async") {
            $buscarFin = $true
        }
        
        if ($buscarFin) {
            # Contar llaves para encontrar el final de la función
            $nivel += ($linea -split '\{').Length - 1
            $nivel -= ($linea -split '\}').Length - 1
            
            if ($nivel -eq 0 -and $i -gt $lineaInicio) {
                $lineaFin = $i
                Write-Host "Final de función handleDelete en línea: $($i + 1)"
                break
            }
        }
    }
}

Write-Host "Inicio: $($lineaInicio + 1), Fin: $($lineaFin + 1)"