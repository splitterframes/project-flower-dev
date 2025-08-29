import React, { useState } from "react";
import { getRarityBorder, type RarityTier } from "@shared/rarity";
import { Flower, Sparkles } from "lucide-react";

interface RarityImageProps {
  src: string;
  alt: string;
  rarity: RarityTier;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const RarityImage: React.FC<RarityImageProps> = ({
  src,
  alt,
  rarity,
  size = 'medium',
  className = ""
}) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    small: 'w-6 h-6',      // 32px -> 24px (8px smaller)
    medium: 'w-10 h-10',   // 48px -> 40px (8px smaller) 
    large: 'w-14 h-14'     // 64px -> 56px (8px smaller)
  };

  const borderSize = {
    small: 'border-2',
    medium: 'border-2',
    large: 'border-4'
  };

  const iconSize = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8'
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`
      ${sizeClasses[size]} 
      ${borderSize[size]} 
      ${getRarityBorder(rarity)} 
      rounded-lg 
      overflow-hidden 
      bg-slate-800 
      flex 
      items-center 
      justify-center 
      ${className}
    `} style={{ borderStyle: 'solid' }}>
      {!imageError ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      ) : (
        // Fallback icon for missing images
        src.includes('Blumen') ? (
          <Flower className={`${iconSize[size]} text-pink-400`} />
        ) : (
          <Sparkles className={`${iconSize[size]} text-purple-400`} />
        )
      )}
    </div>
  );
};