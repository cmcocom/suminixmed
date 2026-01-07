'use client';

import React, { useState } from 'react';
import { api } from '@/lib/fetcher';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface ImageUploadProps {
  onImageUploaded: (imagePath: string) => void;
  currentImage?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizeClasses = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
};

const sizePixels = {
  sm: 48,
  md: 64,
  lg: 96,
};

export const ImageUpload: React.FC<ImageUploadProps> = React.memo(
  ({ onImageUploaded, currentImage, className = '', size = 'md', label = 'Subir imagen' }) => {
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 5MB');
        return;
      }

      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await api.form('/api/upload', formData);

        if (!response.ok) {
          throw new Error('Error al subir la imagen');
        }

        const data = await response.json();
        if (data.success && data.path) {
          onImageUploaded(data.path);
          toast.success('Imagen subida correctamente');
        } else {
          throw new Error('Error al procesar la imagen');
        }
      } catch (error) {
        toast.error('Error al subir la imagen');
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        {currentImage && (
          <div className={`${sizeClasses[size]} relative`}>
            <Image
              src={currentImage}
              alt="Vista previa de la imagen"
              width={sizePixels[size]}
              height={sizePixels[size]}
              className={`${sizeClasses[size]} rounded-lg object-cover border`}
            />
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
              </div>
            )}
          </div>
        )}

        <div className="relative">
          <label htmlFor="imageUpload" className="sr-only">
            {label}
          </label>
          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            title={label}
            onChange={handleFileUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-600
            hover:file:bg-indigo-100
            disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {uploading && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-indigo-500"></div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ImageUpload.displayName = 'ImageUpload';
