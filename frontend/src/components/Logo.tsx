import React from 'react';
import { Link } from 'react-router-dom';
import { usePublicAppConfig } from '@/hooks/use-app-config';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  linkTo?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '',
  linkTo = '/'
}) => {
  const { data: config } = usePublicAppConfig();
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  const appName = config?.app_name || 'saKom';
  const logoUrl = config?.logo_url;

  const logoElement = (
    <div className={`flex items-center gap-2 ${className}`}>
      {logoUrl ? (
        <img 
          src={logoUrl} 
          alt={`${appName} Logo`} 
          className={`${sizeClasses[size]} object-contain`} 
        />
      ) : (
        // Fallback: afficher un icône par défaut si pas de logo
        <div className={`${sizeClasses[size]} bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs`}>
          {appName.charAt(0).toUpperCase()}
        </div>
      )}
      {showText && (
        <span 
          className={`font-bold ${textSizes[size]}`}
          style={{ color: config?.primary_color || undefined }}
        >
          {appName}
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="inline-block">
        {logoElement}
      </Link>
    );
  }

  return logoElement;
}; 