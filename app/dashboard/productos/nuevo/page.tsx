'use client';

import { useState, useEffect } from 'react';
import apiFetch from '@/lib/fetcher';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

interface UnidadMedida {
  id: string;
  clave: string;
  nombre: string;
  descripcion?: string;
}

interface FormData {
  clave: string;
  clave2: string;
  descripcion: string;
  categoria_id: string;
  unidad_medida_id: string;
  cantidad_maxima: number;
  punto_reorden: number;
  dias_reabastecimiento: number;
  ubicacion_general: string;
  estado: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function NuevoProductoPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    clave: '',
    clave2: '',
    descripcion: '',
    categoria_id: '',
    unidad_medida_id: '',
    cantidad_maxima: 0,
    punto_reorden: 0,
    dias_reabastecimiento: 7,
    ubicacion_general: '',
    estado: 'disponible',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Cargar categorías y unidades de medida
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriasRes, unidadesRes] = await Promise.all([
          apiFetch('/api/categorias'),
          apiFetch('/api/unidades-medida'),
        ]);

        if (categoriasRes.ok) {
          const result = await categoriasRes.json();
          if (result.data) {
            setCategorias(result.data.filter((c: Categoria) => c.activo));
          }
        }

        if (unidadesRes.ok) {
          const unidades = await unidadesRes.json();
          setUnidadesMedida(unidades);

          // Establecer PIEZA como valor predeterminado
          const piezaUnidad = unidades.find((u: UnidadMedida) => u.clave === 'PIEZA');
          if (piezaUnidad) {
            setFormData((prev) => ({ ...prev, unidad_medida_id: piezaUnidad.id }));
          }
        }
      } catch (error) {
        toast.error('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchData();
    }
  }, [session]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria';
    }

    if (!formData.categoria_id) {
      newErrors.categoria_id = 'Debe seleccionar una categoría';
    }

    if (!formData.unidad_medida_id) {
      newErrors.unidad_medida_id = 'Debe seleccionar una unidad de medida';
    }

    if (formData.cantidad_maxima < 0) {
      newErrors.cantidad_maxima = 'La cantidad máxima no puede ser negativa';
    }

    if (formData.punto_reorden < 0) {
      newErrors.punto_reorden = 'El punto de reorden no puede ser negativo';
    }

    if (formData.dias_reabastecimiento < 1) {
      newErrors.dias_reabastecimiento = 'Los días de reabastecimiento deben ser al menos 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, corrija los errores en el formulario');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...formData,
        cantidad: 0, // Siempre inicia en 0
        precio: 0, // Siempre inicia en 0
        fechaIngreso: new Date().toISOString(),
      };

      const response = await apiFetch('/api/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await response.json();
        toast.success('Producto creado exitosamente');
        router.push('/dashboard/productos');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || errorData.message || 'Error al crear el producto');
      }
    } catch (error) {
      console.error('Error al crear producto:', error);
      toast.error('Error al crear el producto');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Volver
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Producto</h1>
          <p className="mt-2 text-sm text-gray-600">
            Complete la información del producto para agregarlo al catálogo.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información General */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Información General</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Clave */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clave <span className="text-gray-400">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={formData.clave}
                  onChange={(e) => setFormData({ ...formData, clave: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 12345"
                />
              </div>

              {/* Clave 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clave Alternativa <span className="text-gray-400">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={formData.clave2}
                  onChange={(e) => setFormData({ ...formData, clave2: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: ABC-123"
                />
              </div>

              {/* Descripción */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.descripcion ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Descripción detallada del producto"
                />
                {errors.descripcion && (
                  <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>
                )}
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.categoria_id}
                  onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.categoria_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccione una categoría</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
                {errors.categoria_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.categoria_id}</p>
                )}
              </div>

              {/* Unidad de Medida */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidad de Medida <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.unidad_medida_id}
                  onChange={(e) => setFormData({ ...formData, unidad_medida_id: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.unidad_medida_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Seleccione una unidad</option>
                  {unidadesMedida.map((unidad) => (
                    <option key={unidad.id} value={unidad.id}>
                      {unidad.clave} - {unidad.nombre}
                    </option>
                  ))}
                </select>
                {errors.unidad_medida_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.unidad_medida_id}</p>
                )}
              </div>
            </div>
          </div>

          {/* Control de Stock */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Control de Stock</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Punto de Reorden */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Punto de Reorden *
                  <span className="text-xs text-gray-500 ml-2">(Momento para hacer pedido)</span>
                </label>
                <input
                  type="number"
                  value={formData.punto_reorden}
                  onChange={(e) =>
                    setFormData({ ...formData, punto_reorden: parseInt(e.target.value) || 0 })
                  }
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.punto_reorden ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.punto_reorden && (
                  <p className="mt-1 text-sm text-red-600">{errors.punto_reorden}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Cantidad que activa una alerta de reabastecimiento
                </p>
              </div>

              {/* Días de Reabastecimiento */}
              <div>
                {/* Cantidad Máxima */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad Máxima
                    <span className="text-xs text-gray-500 ml-2">(Límite de stock)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.cantidad_maxima}
                    onChange={(e) =>
                      setFormData({ ...formData, cantidad_maxima: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.cantidad_maxima ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.cantidad_maxima && (
                    <p className="mt-1 text-sm text-red-600">{errors.cantidad_maxima}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Alerta cuando se excede este límite</p>
                </div>

                {/* Días de Reabastecimiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Días de Reabastecimiento
                  </label>
                  <input
                    type="number"
                    value={formData.dias_reabastecimiento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dias_reabastecimiento: parseInt(e.target.value) || 7,
                      })
                    }
                    min="1"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.dias_reabastecimiento ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.dias_reabastecimiento && (
                    <p className="mt-1 text-sm text-red-600">{errors.dias_reabastecimiento}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Tiempo estimado para recibir el pedido
                  </p>
                </div>
              </div>

              {/* Ubicación General */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación General <span className="text-gray-400">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={formData.ubicacion_general}
                  onChange={(e) => setFormData({ ...formData, ubicacion_general: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Almacén A, Pasillo 3, Estante 2"
                />
              </div>

              {/* Estado */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="disponible">Disponible</option>
                  <option value="agotado">Agotado</option>
                  <option value="descontinuado">Descontinuado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-between items-center bg-white rounded-lg shadow-md p-6">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={saving}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="h-5 w-5" />
                  <span>Crear Producto</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
