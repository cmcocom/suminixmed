'use client';

import React, { useState, useRef } from 'react';
import apiFetch from '@/lib/fetcher';
import {
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  UserGroupIcon,
  UsersIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface CatalogType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  sampleData: string[][];
}

interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  errors: string[];
}

const catalogTypes: CatalogType[] = [
  {
    id: 'clientes',
    name: 'Clientes',
    description: 'Gestionar catálogo de clientes',
    icon: UsersIcon,
    sampleData: [
      ['*nombre', '*email', 'telefono', 'direccion', 'rfc', 'empresa', 'contacto'],
      [
        'Juan Pérez',
        'juan@ejemplo.com',
        '555-0001',
        'Calle Principal 123',
        'XAXX010101000',
        'Empresa SA',
        'Juan Pérez',
      ],
      [
        'María García',
        'maria@ejemplo.com',
        '555-0002',
        'Av. Central 456',
        'XEXX020202000',
        'Comercial XYZ',
        'María García',
      ],
    ],
  },
  {
    id: 'usuarios',
    name: 'Usuarios',
    description: 'Gestionar catálogo de usuarios del sistema',
    icon: UserGroupIcon,
    sampleData: [
      ['nombre', 'apellido', 'email', 'rol', 'telefono'],
      ['Admin', 'Sistema', 'admin@sistema.com', 'ADMINISTRADOR', '555-0000'],
      ['Usuario', 'Test', 'usuario@test.com', 'OPERADOR', '555-0001'],
    ],
  },
  {
    id: 'productos',
    name: 'Productos',
    description: 'Gestionar catálogo de productos/inventario',
    icon: ArchiveBoxIcon,
    sampleData: [
      ['codigo', '*nombre', 'descripcion', 'precio', 'stock_minimo', 'categoria', 'proveedor'],
      [
        'PROD001',
        'Producto Ejemplo',
        'Descripción del producto',
        '100.00',
        '10',
        'Categoría 1',
        'Proveedor A',
      ],
      ['PROD002', 'Otro Producto', 'Otra descripción', '250.50', '5', 'Categoría 2', 'Proveedor B'],
    ],
  },
  {
    id: 'categorias',
    name: 'Categorías',
    description: 'Gestionar catálogo de categorías de productos',
    icon: ArchiveBoxIcon,
    sampleData: [
      ['*nombre', 'descripcion'],
      ['Medicamentos', 'Productos farmacéuticos y medicinas'],
      ['Material Quirúrgico', 'Instrumental y material para cirugías'],
      ['Equipo Médico', 'Equipos y aparatos médicos'],
    ],
  },
  {
    id: 'proveedores',
    name: 'Proveedores',
    description: 'Gestionar catálogo de proveedores',
    icon: UsersIcon,
    sampleData: [
      [
        '*nombre',
        'razon_social',
        'email',
        'telefono',
        'direccion',
        'rfc',
        'contacto',
        'sitio_web',
        'condiciones_pago',
        'notas',
      ],
      [
        'Farmacéutica ABC',
        'ABC Farmacéutica SA de CV',
        'ventas@abc.com',
        '555-1000',
        'Av. Industria 100',
        'ABC123456789',
        'Carlos Ruiz',
        'www.abc.com',
        '30 días',
        'Proveedor principal',
      ],
      [
        'Distribuidora XYZ',
        'XYZ Distribución SRL',
        'contacto@xyz.com',
        '555-2000',
        'Calle Comercio 200',
        'XYZ987654321',
        'Ana López',
        'www.xyz.com',
        '15 días',
        'Entregas rápidas',
      ],
    ],
  },
  {
    id: 'empleados',
    name: 'Empleados',
    description: 'Gestionar catálogo de empleados',
    icon: UserGroupIcon,
    sampleData: [
      ['*numero_empleado', '*nombre', '*cargo', 'servicio', '*turno', 'correo', 'celular'],
      [
        'EMP-001',
        'Dr. Juan Pérez García',
        'Médico General',
        'Consulta Externa',
        'Matutino',
        'juan.perez@hospital.com',
        '555-1234',
      ],
      [
        'EMP-002',
        'Enf. María López Hernández',
        'Enfermera',
        'Urgencias',
        'Nocturno',
        'maria.lopez@hospital.com',
        '555-5678',
      ],
      [
        'EMP-003',
        'Lic. Carlos Ramírez Torres',
        'Administrativo',
        'Recursos Humanos',
        'Matutino',
        'carlos.ramirez@hospital.com',
        '555-9012',
      ],
    ],
  },
];

export default function CatalogManager() {
  const [selectedCatalog, setSelectedCatalog] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [sampleCatalog, setSampleCatalog] = useState<CatalogType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCatalog) return;

    // Validar que sea un archivo CSV
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportResult({
        success: false,
        message: 'Por favor selecciona un archivo CSV válido',
        imported: 0,
        errors: ['Formato de archivo no soportado'],
      });
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('catalog', selectedCatalog);

      const response = await apiFetch(`/api/catalogs/import`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setImportResult(result);
    } catch (error: unknown) {
      setImportResult({
        success: false,
        message: 'Error al procesar el archivo',
        imported: 0,
        errors: ['Error de conexión con el servidor'],
      });
    } finally {
      setIsImporting(false);
      // Limpiar el input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async () => {
    if (!selectedCatalog) return;

    setIsExporting(true);

    try {
      const response = await apiFetch(`/api/catalogs/export?catalog=${selectedCatalog}`, {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedCatalog}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Intentar obtener el error como JSON
        try {
          const errorData = await response.json();
          alert(`Error al exportar: ${errorData.error || 'Error desconocido'}`);
        } catch {
          // Si no se puede parsear como JSON, obtener como texto
          const errorText = await response.text();
          alert(`Error al exportar: ${response.status} - ${response.statusText} - ${errorText}`);
        }
      }
    } catch (error) {
      alert(`Error al exportar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const showSampleData = (catalog: CatalogType) => {
    setSampleCatalog(catalog);
    setShowSampleModal(true);
  };

  const downloadSampleTemplate = (catalog: CatalogType) => {
    const csvContent = catalog.sampleData
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `plantilla-${catalog.id}-ejemplo.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadEmptyTemplate = (catalog: CatalogType) => {
    // Solo los encabezados, sin datos de ejemplo
    const headers = catalog.sampleData[0];
    const csvContent = headers.map((cell) => `"${cell}"`).join(',');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `plantilla-${catalog.id}-vacia.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedCatalogData = catalogTypes.find((cat) => cat.id === selectedCatalog);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Catálogos</h1>
        <p className="text-gray-600">
          Importa y exporta catálogos de clientes, usuarios y productos mediante archivos CSV
        </p>
      </div>

      {/* Selector de catálogo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Seleccionar Catálogo</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {catalogTypes.map((catalog) => (
            <div
              key={catalog.id}
              className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedCatalog === catalog.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedCatalog(catalog.id)}
            >
              <div className="flex items-center space-x-3">
                <catalog.icon className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">{catalog.name}</h3>
                  <p className="text-sm text-gray-600">{catalog.description}</p>
                </div>
              </div>

              {selectedCatalog === catalog.id && (
                <div className="absolute top-2 right-2">
                  <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Acciones de importación y exportación */}
      {selectedCatalog && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Acciones para {selectedCatalogData?.name}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Importación */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <DocumentArrowUpIcon className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-medium text-gray-900">Importar</h3>
              </div>

              <p className="text-gray-600 mb-4">
                Sube un archivo CSV para importar datos al catálogo de{' '}
                {selectedCatalogData?.name.toLowerCase()}
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => showSampleData(selectedCatalogData!)}
                  className="w-full px-4 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  📋 Ver formato requerido
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => downloadEmptyTemplate(selectedCatalogData!)}
                    className="px-3 py-2 text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                  >
                    📄 Plantilla vacía
                  </button>
                  <button
                    onClick={() => downloadSampleTemplate(selectedCatalogData!)}
                    className="px-3 py-2 text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    📝 Con ejemplos
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  className="hidden"
                  aria-label="Seleccionar archivo CSV para importar"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isImporting ? 'Importando...' : '⬆️ Seleccionar archivo CSV'}
                </button>
              </div>
            </div>

            {/* Exportación */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <DocumentArrowDownIcon className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Exportar</h3>
              </div>

              <p className="text-gray-600 mb-4">
                Descarga todos los datos del catálogo de {selectedCatalogData?.name.toLowerCase()}{' '}
                en formato CSV
              </p>

              <div className="space-y-2">
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isExporting ? 'Exportando...' : '⬇️ Exportar catálogo completo'}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Incluye todos los registros existentes
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resultado de importación */}
      {importResult && (
        <div
          className={`rounded-lg p-4 mb-6 ${
            importResult.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-start space-x-3">
            {importResult.success ? (
              <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            )}

            <div className="flex-1">
              <h3
                className={`font-medium ${
                  importResult.success ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {importResult.success ? 'Importación exitosa' : 'Error en la importación'}
              </h3>

              <p className={`mt-1 ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {importResult.message}
              </p>

              {importResult.success && importResult.imported > 0 && (
                <p className="mt-1 text-green-700">
                  Se importaron {importResult.imported} registros correctamente.
                </p>
              )}

              {importResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-red-700 font-medium">Errores encontrados:</p>
                  <ul className="mt-1 text-red-700 text-sm list-disc list-inside">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={() => setImportResult(null)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Cerrar mensaje de resultado"
              title="Cerrar mensaje"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de formato de datos */}
      {showSampleModal && sampleCatalog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <InformationCircleIcon className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Formato requerido para {sampleCatalog.name}
                </h3>
              </div>
              <button
                onClick={() => setShowSampleModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Cerrar modal"
                title="Cerrar modal"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-auto">
              <p className="text-gray-600 mb-4">
                El archivo CSV debe tener las siguientes columnas en el orden exacto:
              </p>

              <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr>
                      {sampleCatalog.sampleData[0].map((header, index) => (
                        <th
                          key={index}
                          className="border border-gray-300 px-3 py-2 bg-gray-100 text-left text-sm font-medium text-gray-700"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleCatalog.sampleData.slice(1).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="border border-gray-300 px-3 py-2 text-sm text-gray-600"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">📌 Campos obligatorios:</h4>
                <p className="text-blue-700 text-sm mb-2">
                  Los campos marcados con <span className="font-bold">*</span> son obligatorios y
                  deben contener un valor.
                </p>
                <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
                  {sampleCatalog.sampleData[0]
                    .filter((header) => header.startsWith('*'))
                    .map((header, index) => (
                      <li key={index}>
                        <span className="font-semibold">{header}</span> - Obligatorio
                      </li>
                    ))}
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Notas importantes:</h4>
                <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
                  <li>El archivo debe estar en formato CSV separado por comas</li>
                  <li>
                    La primera fila debe contener los nombres de las columnas (sin el asterisco *)
                  </li>
                  <li>Use codificación UTF-8 para caracteres especiales</li>
                  <li>Los campos de texto que contengan comas deben estar entre comillas</li>
                  <li>Los campos vacíos se interpretarán como NULL (excepto los obligatorios)</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-between items-center p-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  onClick={() => downloadEmptyTemplate(sampleCatalog)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  📄 Descargar plantilla vacía
                </button>
                <button
                  onClick={() => downloadSampleTemplate(sampleCatalog)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📝 Descargar con ejemplos
                </button>
              </div>
              <button
                onClick={() => setShowSampleModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
