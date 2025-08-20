import React from 'react';

interface SpencerLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SpencerLogo: React.FC<SpencerLogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center justify-center bg-gradient-primary rounded-lg ${className}`}>
      <div className={`font-bold text-white text-center leading-tight ${sizeClasses[size]}`}>
        <div>SPENCER</div>
        <div className="text-[0.6em] tracking-wider">TRANSPORTES</div>
      </div>
    </div>
  );
};

export default SpencerLogo;