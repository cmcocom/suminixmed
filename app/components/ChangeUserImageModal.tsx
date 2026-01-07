'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/fetcher';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useUserImage } from '../contexts/UserImageContext';

interface ChangeUserImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImage: string | null;
}

export default function ChangeUserImageModal({
  isOpen,
  onClose,
  currentImage,
}: ChangeUserImageModalProps) {
  const { data: session } = useSession();
  const { updateUserImage } = useUserImage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    setSelectedFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !session?.user) {
      toast.error('Por favor selecciona una imagen');
      return;
    }

    setIsUploading(true);
    const uploadToast = toast.loading('Actualizando imagen...');

    try {
      // 1. Subir imagen
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('folder', 'users');
      const uploadResponse = await api.form('/api/upload', formData);

      if (!uploadResponse.ok) {
        throw new Error('Error al subir la imagen');
      }

      const { url: newImageUrl } = await uploadResponse.json();
      // 2. Actualizar usuario en BD
      const { email, name } = session.user;
      const userId = (session.user as { id?: string }).id;

      if (!userId) {
        throw new Error('ID de usuario no disponible');
      }

      const updateBody = {
        email,
        name,
        image: newImageUrl,
      };
      const updateResponse = await api.put(`/api/users/${userId}`, updateBody);

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Error al actualizar el perfil');
      }
      // 3. Actualizar contexto de imagen (igual que en gestión de usuarios)
      // SOLUCIÓN: updateUserImage() actualiza el contexto y el sidebar lo refleja automáticamente
      updateUserImage(newImageUrl);
      toast.success('Imagen actualizada correctamente', { id: uploadToast });

      // 4. Cerrar modal
      handleClose();
    } catch (error) {
      toast.error('Error al actualizar la imagen', { id: uploadToast });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
        {/* Header compacto con gradiente */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-3 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold !text-white">Cambiar Imagen</h3>
            <button
              onClick={handleClose}
              disabled={isUploading}
              title="Cerrar"
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5 transition-all duration-200 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body compacto */}
        <div className="p-5 space-y-4">
          {/* Preview de imágenes */}
          <div className="flex items-center justify-center gap-6">
            {/* Imagen actual */}
            <div className="text-center">
              <p className="text-xs font-medium text-gray-600 mb-2">Actual</p>
              {currentImage ? (
                <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-gray-300">
                  <Image src={currentImage} alt="Actual" fill className="object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center ring-2 ring-gray-300">
                  <svg
                    className="w-10 h-10 text-gray-400"
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
                </div>
              )}
            </div>

            {/* Flecha */}
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>

            {/* Imagen nueva */}
            <div className="text-center">
              <p className="text-xs font-medium text-gray-600 mb-2">Nueva</p>
              {previewUrl ? (
                <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-indigo-500">
                  <Image src={previewUrl} alt="Nueva" fill className="object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center ring-2 ring-dashed ring-gray-300">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Botón de selección de archivo */}
          <div>
            <input
              id="file-upload"
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className="flex items-center justify-center w-full px-4 py-3 bg-indigo-50 border-2 border-indigo-200 border-dashed rounded-lg cursor-pointer hover:bg-indigo-100 transition-all duration-200 change-image-file-label"
            >
              <svg
                className="w-5 h-5 text-indigo-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm font-medium change-image-text-span">
                {selectedFile ? selectedFile.name : 'Seleccionar imagen'}
              </span>
            </label>
            {selectedFile && (
              <p className="mt-2 text-xs text-center text-gray-500">
                {(selectedFile.size / 1024).toFixed(0)} KB • PNG, JPG (max. 5MB)
              </p>
            )}
          </div>
        </div>

        {/* Footer compacto */}
        <div className="bg-gray-50 px-5 py-3 rounded-b-xl flex gap-2">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 !text-white text-sm rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 font-medium disabled:opacity-50 shadow-sm"
          >
            {isUploading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Guardando...
              </span>
            ) : (
              'Guardar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
