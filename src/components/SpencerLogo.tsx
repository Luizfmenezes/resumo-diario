// src/components/SpencerLogo.tsx

import React from 'react';
// 1. Importamos a imagem do seu logo a partir da pasta assets
import logoImage from '@/assets/spencer-logo.png';

// Definimos os tipos das props para o componente (opcional, mas bom para TypeScript)
interface SpencerLogoProps {
  className?: string;
}

const SpencerLogo: React.FC<SpencerLogoProps> = ({ className }) => {
  // 2. Em vez das divs, retornamos uma tag <img>
  return (
    <img
      src={logoImage} // A imagem importada é usada aqui
      alt="Logo da Spencer Transportes" // Texto alternativo para acessibilidade
      className={className} // Passamos a className para poder controlar o estilo (tamanho, etc.) de fora
    />
  );
};

export default SpencerLogo;