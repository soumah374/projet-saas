import React from 'react';
import { Link } from 'react-router-dom';

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

  const logoElement = (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* <img 
        src="/Logo-saKom-1.ico" 
        alt="saKom Logo" 
        className={sizeClasses[size]} 
      /> */}
      {showText && (
        <span className={`font-bold ${textSizes[size]}`}>
          saKom
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