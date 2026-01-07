# Script para eliminar el botón de eliminar del JSX
$archivo = "app/dashboard/productos/page.tsx"
$contenido = Get-Content $archivo

# Buscar las líneas que contienen el botón de eliminar
$lineaInicio = -1
$lineaFin = -1

for ($i = 0; $i -lt $contenido.Length; $i++) {
    if ($contenido[$i] -match "producto\.activo &&") {
        $lineaInicio = $i
        Write-Host "Inicio del bloque del botón en línea: $($i + 1)"
        break
    }
}

if ($lineaInicio -ge 0) {
    # Buscar el final del bloque condicional
    $nivel = 0
    $encontradoInicio = $false
    
    for ($i = $lineaInicio; $i -lt $contenido.Length; $i++) {
        $linea = $contenido[$i]
        
        if ($linea -match "producto\.activo &&") {
            $encontradoInicio = $true
        }
        
        if ($encontradoInicio) {
            # Contar paréntesis para encontrar el final del bloque condicional
            $nivel += ($linea -split '\(').Length - 1
            $nivel -= ($linea -split '\)').Length - 1
            
            if ($nivel -eq 0 -and $i -gt $lineaInicio) {
                $lineaFin = $i
                Write-Host "Final del bloque del botón en línea: $($i + 1)"
                break
            }
        }
    }
}

if ($lineaInicio -ge 0 -and $lineaFin -ge 0) {
    Write-Host "Eliminando bloque del botón (líneas $($lineaInicio + 1) a $($lineaFin + 1))"
    
    # Mostrar el contenido que se va a eliminar
    Write-Host "Contenido a eliminar:"
    $contenido[$lineaInicio..$lineaFin] | ForEach-Object { Write-Host "  $_" }
    
    # Crear nuevo contenido sin las líneas del botón
    $nuevoContenido = @()
    $nuevoContenido += $contenido[0..($lineaInicio - 1)]  # Líneas antes del botón
    $nuevoContenido += $contenido[($lineaFin + 1)..($contenido.Length - 1)]  # Líneas después del botón
    
    # Escribir el nuevo archivo
    $nuevoContenido | Set-Content $archivo -Encoding UTF8
    
    Write-Host "Botón de eliminar eliminado exitosamente"
    Write-Host "Líneas originales: $($contenido.Length), Líneas nuevas: $($nuevoContenido.Length)"
} else {
    Write-Host "No se pudo encontrar el bloque del botón de eliminar"
}