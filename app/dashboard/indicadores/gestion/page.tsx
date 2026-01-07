'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import ProtectedPage from '@/app/components/ProtectedPage';
import apiFetch from '@/lib/fetcher';

// Interfaces
interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  activo: boolean;
}

interface DashboardIndicator {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: string;
  icon?: string;
  color: string;
  is_active: boolean;
}

interface IndicatorPermission {
  id: string;
  user_id?: string;
  role_id?: string;
  indicator_id: string;
  can_view: boolean;
  can_edit: boolean;
}

interface IndicatorsByCategory {
  [category: string]: DashboardIndicator[];
}

export default function GestionIndicadoresPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [indicatorsByCategory, setIndicatorsByCategory] = useState<IndicatorsByCategory>({});
  const [userPermissions, setUserPermissions] = useState<Map<string, Set<string>>>(new Map());
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cargar datos iniciales
  const loadUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      // Usar la API de usuarios existente con formato legacy para compatibilidad
      const response = await apiFetch('/api/users?format=legacy');
      if (!response.ok) throw new Error('Error cargando usuarios');

      const data = await response.json();
      const activeUsers = (data.users || []).filter((user: User) => user.activo);
      setUsers(activeUsers);

      if (activeUsers.length > 0 && !selectedUser) {
        setSelectedUser(activeUsers[0]);
      }
    } catch (error) {
      void error;
      toast.error('Error al cargar la lista de usuarios');
    } finally {
      setLoadingUsers(false);
    }
  }, [selectedUser]);

  const loadIndicators = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/dashboard/indicators?include_inactive=false');
      if (!response.ok) throw new Error('Error cargando indicadores');

      const data = await response.json();
      const activeIndicators = data.indicators || [];

      // Agrupar indicadores por categoría
      const grouped = activeIndicators.reduce(
        (acc: IndicatorsByCategory, indicator: DashboardIndicator) => {
          const category = indicator.category || 'Sin Categoría';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(indicator);
          return acc;
        },
        {}
      );

      setIndicatorsByCategory(grouped);

      // Seleccionar primera categoría si no hay una seleccionada
      const categories = Object.keys(grouped);
      if (categories.length > 0 && !selectedCategory) {
        setSelectedCategory(categories[0]);
      }
    } catch (error) {
      void error;
      toast.error('Error al cargar los indicadores');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadUsers();
    loadIndicators();
  }, [loadUsers, loadIndicators]);

  const loadUserPermissions = useCallback(async (userId: string) => {
    try {
      const response = await apiFetch(`/api/dashboard/indicators/permissions/user/${userId}`);
      if (!response.ok) return;

      const data = await response.json();
      const permissions = data.data?.permissions || [];

      // Crear un Set con los IDs de indicadores que el usuario puede ver
      const userIndicatorIds = new Set<string>(
        permissions
          .filter((p: IndicatorPermission) => p.can_view)
          .map((p: IndicatorPermission) => p.indicator_id)
      );

      setUserPermissions((prev) => new Map(prev.set(userId, userIndicatorIds)));
    } catch (error) {
      void error;
    }
  }, []);

  // Cargar permisos cuando cambia el usuario seleccionado
  useEffect(() => {
    if (selectedUser) {
      loadUserPermissions(selectedUser.id);
    }
  }, [selectedUser, loadUserPermissions]);

  const handleUserChange = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setSelectedUser(user);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleIndicatorToggle = (indicatorId: string, checked: boolean) => {
    if (!selectedUser) return;

    setUserPermissions((prev) => {
      const newMap = new Map(prev);
      const userIndicators = new Set(newMap.get(selectedUser.id) || []);

      if (checked) {
        userIndicators.add(indicatorId);
      } else {
        userIndicators.delete(indicatorId);
      }

      newMap.set(selectedUser.id, userIndicators);
      return newMap;
    });
  };

  const saveUserPermissions = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      const userIndicators = userPermissions.get(selectedUser.id) || new Set();

      // Preparar permisos para enviar al API
      const permissions = Array.from(userIndicators).map((indicatorId) => ({
        indicator_id: indicatorId,
        user_id: selectedUser.id,
        can_view: true,
        can_edit: false, // Por ahora solo damos permisos de vista
      }));

      // Debug: Mostrar datos que se van a enviar
      const response = await apiFetch(
        `/api/dashboard/indicators/permissions/user/${selectedUser.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissions }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        // Mostrar detalles de validación si están disponibles
        if (errorData.details) {
        }

        throw new Error(errorData.error || 'Error guardando permisos');
      }

      toast.success(`Permisos actualizados para ${selectedUser.name}`);

      // Recargar permisos para confirmar cambios
      await loadUserPermissions(selectedUser.id);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error guardando permisos');
    } finally {
      setSaving(false);
    }
  };

  const getSelectedIndicators = () => {
    if (!selectedUser || !selectedCategory) return new Set();
    return userPermissions.get(selectedUser.id) || new Set();
  };

  const getCategoryIndicators = () => {
    if (!selectedCategory) return [];
    return indicatorsByCategory[selectedCategory] || [];
  };

  const getSelectedCount = () => {
    const selectedIndicators = getSelectedIndicators();
    const categoryIndicators = getCategoryIndicators();
    return categoryIndicators.filter((indicator) => selectedIndicators.has(indicator.id)).length;
  };

  const handleSelectAllCategory = () => {
    if (!selectedUser || !selectedCategory) return;

    const categoryIndicators = getCategoryIndicators();
    const selectedIndicators = getSelectedIndicators();
    const allSelected = categoryIndicators.every((indicator) =>
      selectedIndicators.has(indicator.id)
    );

    // Si todos están seleccionados, deseleccionar todos; si no, seleccionar todos
    categoryIndicators.forEach((indicator) => {
      handleIndicatorToggle(indicator.id, !allSelected);
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProtectedPage
      requiredPermission={{
        modulo: 'AJUSTES',
        accion: 'ADMINISTRAR_INDICADORES',
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Permisos de Indicadores</h1>
            <p className="text-gray-600 mt-2">
              Configura qué indicadores puede ver cada usuario en su dashboard
            </p>
          </div>

          <div className="flex space-x-3">
            <a
              href="/dashboard/indicadores"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span>Gestión de Indicadores</span>
            </a>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de Selección de Usuario */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Seleccionar Usuario
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Elige el usuario para configurar sus permisos
                </p>
              </div>

              <div className="p-6">
                {loadingUsers ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg
                      className="w-12 h-12 mx-auto mb-4 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <p>No hay usuarios disponibles</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleUserChange(user.id)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                          selectedUser?.id === user.id
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              selectedUser?.id === user.id ? 'bg-blue-100' : 'bg-gray-100'
                            }`}
                          >
                            {user.image ? (
                              <Image
                                src={user.image}
                                alt={user.name}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span
                                className={`text-sm font-medium ${
                                  selectedUser?.id === user.id ? 'text-blue-600' : 'text-gray-600'
                                }`}
                              >
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`font-medium truncate ${
                                selectedUser?.id === user.id ? 'text-blue-900' : 'text-gray-900'
                              }`}
                            >
                              {user.name}
                            </div>
                            <div
                              className={`text-sm truncate ${
                                selectedUser?.id === user.id ? 'text-blue-600' : 'text-gray-500'
                              }`}
                            >
                              {user.email}
                            </div>
                          </div>
                          {selectedUser?.id === user.id && (
                            <svg
                              className="w-5 h-5 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel de Configuración de Permisos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      Indicadores por Categoría
                    </h2>
                    {selectedUser && (
                      <p className="text-sm text-gray-600 mt-1">
                        Configurando permisos para:{' '}
                        <span className="font-medium text-gray-900">{selectedUser.name}</span>
                      </p>
                    )}
                  </div>

                  {selectedUser && (
                    <button
                      onClick={saveUserPermissions}
                      disabled={saving}
                      className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin"></div>
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>Guardar Cambios</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {!selectedUser ? (
                  <div className="text-center py-12">
                    <svg
                      className="w-16 h-16 text-gray-300 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Selecciona un usuario
                    </h3>
                    <p className="text-gray-500">
                      Elige un usuario de la lista para configurar sus permisos de indicadores
                    </p>
                  </div>
                ) : Object.keys(indicatorsByCategory).length === 0 ? (
                  <div className="text-center py-12">
                    <svg
                      className="w-16 h-16 text-gray-300 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay indicadores</h3>
                    <p className="text-gray-500 mb-4">No hay indicadores activos para configurar</p>
                    <a
                      href="/dashboard/indicadores"
                      className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <span>Crear Indicadores</span>
                    </a>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Tabs de Categorías */}
                    <div className="border-b border-gray-200">
                      <nav className="-mb-px flex space-x-8 overflow-x-auto">
                        {Object.keys(indicatorsByCategory).map((category) => {
                          const categoryIndicators = indicatorsByCategory[category];
                          const selectedIndicators = getSelectedIndicators();
                          const selectedCount = categoryIndicators.filter((indicator) =>
                            selectedIndicators.has(indicator.id)
                          ).length;

                          return (
                            <button
                              key={category}
                              onClick={() => handleCategoryChange(category)}
                              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                selectedCategory === category
                                  ? 'border-blue-500 text-blue-600'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span>{category}</span>
                                <span
                                  className={`px-2 py-0.5 text-xs rounded-full ${
                                    selectedCategory === category
                                      ? 'bg-blue-100 text-blue-600'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {selectedCount}/{categoryIndicators.length}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </nav>
                    </div>

                    {/* Contenido de la Categoría Seleccionada */}
                    {selectedCategory && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-md font-medium text-gray-900">
                            Indicadores de {selectedCategory} ({getSelectedCount()}/
                            {getCategoryIndicators().length} seleccionados)
                          </h3>
                          <button
                            onClick={handleSelectAllCategory}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          >
                            {getCategoryIndicators().every((indicator) =>
                              getSelectedIndicators().has(indicator.id)
                            )
                              ? 'Deseleccionar todos'
                              : 'Seleccionar todos'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {getCategoryIndicators().map((indicator) => {
                            const isSelected = getSelectedIndicators().has(indicator.id);
                            return (
                              <div
                                key={indicator.id}
                                className={`p-4 rounded-lg border transition-all duration-200 ${
                                  isSelected
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div
                                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                        isSelected ? 'bg-green-100' : 'bg-gray-100'
                                      }`}
                                    >
                                      {indicator.icon ? (
                                        <span className="text-lg">{indicator.icon}</span>
                                      ) : (
                                        <svg
                                          className={`w-5 h-5 ${isSelected ? 'text-green-600' : 'text-gray-400'}`}
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                    <div>
                                      <div
                                        className={`font-medium ${isSelected ? 'text-green-900' : 'text-gray-900'}`}
                                      >
                                        {indicator.name}
                                      </div>
                                      <div
                                        className={`text-sm ${isSelected ? 'text-green-600' : 'text-gray-500'}`}
                                      >
                                        {indicator.description || 'Sin descripción'}
                                      </div>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <span
                                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                                            isSelected
                                              ? 'bg-green-100 text-green-700'
                                              : 'bg-gray-100 text-gray-600'
                                          }`}
                                        >
                                          {indicator.type}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <label className="flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) =>
                                        handleIndicatorToggle(indicator.id, e.target.checked)
                                      }
                                      className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <span
                                      className={`ml-2 text-sm font-medium ${
                                        isSelected ? 'text-green-700' : 'text-gray-700'
                                      }`}
                                    >
                                      {isSelected ? 'Visible' : 'Oculto'}
                                    </span>
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <svg
              className="w-6 h-6 text-blue-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <h4 className="font-medium mb-2">Información importante:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Los usuarios solo verán los indicadores que tengan marcados como
                  &quot;Visible&quot;
                </li>
                <li>
                  Si no asignas permisos específicos a un usuario, podrá ver todos los indicadores
                  públicos
                </li>
                <li>Los cambios se aplicarán inmediatamente después de guardar</li>
                <li>
                  Los usuarios pueden reordenar los indicadores visibles en su dashboard personal
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
