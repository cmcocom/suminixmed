'use client';

import { useEffect, useState } from 'react';
import apiFetch from '@/lib/fetcher';

interface Role {
  id?: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
}

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: Role) => void;
  role?: Role | null; // si viene, es edición; si no, creación
}

export default function RoleModal({ isOpen, onClose, onSuccess, role }: RoleModalProps) {
  const isEdit = !!role?.id;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(role?.name || '');
      setDescription(role?.description || '');
      setIsActive(role?.is_active ?? true);
      setError(null);
      setSaving(false);
    }
  }, [isOpen, role]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError('El nombre es requerido');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: trimmed,
        description: description.trim() || undefined,
        is_active: isActive,
      };

      const res = await apiFetch(isEdit ? `/api/rbac/roles/${role!.id}` : '/api/rbac/roles', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // intentar extraer cuerpo
        let msg = 'Error al guardar el rol';
        try {
          const data = await res.json();
          msg = data?.error || msg;
        } catch {}
        setError(msg);
        return;
      }

      const data = await res.json();
      const saved = data?.data || data; // POST/PUT devuelven {data}
      onSuccess({
        id: saved.id,
        name: saved.name,
        description: saved.description,
        is_active: saved.is_active,
      });
      onClose();
    } catch {
      setError('Error de conexión al guardar el rol');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60000]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Editar Rol' : 'Crear Nuevo Rol'}
          </h3>
          <p className="text-sm text-gray-500">
            {isEdit
              ? 'Actualiza la información del rol.'
              : 'Define el nombre y la descripción del nuevo rol.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej. ANALISTA"
              maxLength={100}
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Resumen del rol (opcional)"
              disabled={saving}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              disabled={saving}
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Rol activo
            </label>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Rol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
