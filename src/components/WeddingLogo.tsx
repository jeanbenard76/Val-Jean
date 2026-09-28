import React from 'react';
import logoImg from '../assets/images/logo.png';

interface WeddingLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  themeColor?: 'blue' | 'gold' | 'white';
}

export default function WeddingLogo({
  className = '',
  size = 'md',
}: WeddingLogoProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16 sm:w-20 sm:h-20',
    lg: 'w-32 h-32 sm:w-48 sm:h-48',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`} id="wedding-logo">
      <img
        src={logoImg}
        alt="Valentine & Jean Logo"
        className={`${sizeClasses[size]} object-contain transition-all duration-300 rounded-full`}
        style={{ mixBlendMode: 'multiply' }}
      />
    </div>
  );
}

