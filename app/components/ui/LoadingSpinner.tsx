'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white';
  text?: string;
  className?: string;
  fullPage?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const colorClasses = {
  primary: 'border-indigo-600',
  secondary: 'border-gray-600',
  white: 'border-white',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = React.memo(
  ({ size = 'md', color = 'primary', text, className = '', fullPage = true }) => {
    const containerClass = fullPage
      ? 'flex flex-col items-center justify-center min-h-[60vh]'
      : 'flex flex-col items-center justify-center';

    return (
      <div className={`${containerClass} ${className}`}>
        <div
          className={`animate-spin rounded-full border-t-2 border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`}
          role="status"
          aria-label="Cargando..."
        >
          <span className="sr-only">Cargando...</span>
        </div>
        {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

// Componente de página completa para cargas
export const LoadingPage: React.FC<{ text?: string }> = ({ text = 'Cargando...' }) => {
  return <LoadingSpinner size="lg" text={text} fullPage={true} />;
};
