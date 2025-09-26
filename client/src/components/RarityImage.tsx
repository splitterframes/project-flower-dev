import React, { useState, useEffect } from "react";
import { type RarityTier, toRarityTier } from "@shared/rarity";
import { Flower, Sparkles } from "lucide-react";

type RarityLike = RarityTier | (string & {});

interface RarityImageProps {
  src?: string | null;
  alt: string;
  rarity: RarityLike;
  size?: 'small' | 'medium' | 'large' | 'xl' | number;
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
  const [currentSrc, setCurrentSrc] = useState<string>(src ?? "");
  const normalizedRarity = toRarityTier(rarity);

  // Reset state when src prop changes
  useEffect(() => {
    if (src) {
      setCurrentSrc(src);
      setImageError(false);
    } else {
      setCurrentSrc("");
      setImageError(true);
    }
  }, [src]);
  
  const sizeClasses = {
    small: 'w-8 h-8',      // 32px
    medium: 'w-12 h-12',   // 48px
    large: 'w-16 h-16',    // 64px
    xl: 'w-20 h-20'        // 80px
  };

  const borderSize = {
    small: 'border-2',
    medium: 'border-2',
    large: 'border-4',
    xl: 'border-4'
  };

  const iconSize = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8',
    xl: 'h-10 w-10'
  };

  const resolvedSizeKey =
    typeof size === 'string' && sizeClasses[size as keyof typeof sizeClasses]
      ? (size as keyof typeof sizeClasses)
      : 'medium';

  const numericSize = typeof size === 'number' ? size : undefined;

  const getBorderColor = (rarity: RarityTier): string => {
    switch (rarity) {
      case 'common': return '#fbbf24';      // yellow-400
      case 'uncommon': return '#4ade80';    // green-400  
      case 'rare': return '#3b82f6';        // blue-400
      case 'super-rare': return '#06b6d4';  // cyan-400
      case 'epic': return '#a855f7';        // purple-400
      case 'legendary': return '#f97316';   // orange-400
      case 'mythical': return '#ef4444';    // red-400
      default: return '#9ca3af';            // gray-400
    }
  };

  const handleImageError = () => {
    // Try fallback to 0.jpg for different creature types before showing icon
    if (!currentSrc) {
      setImageError(true);
      return;
    }

    if (currentSrc.includes('Schmetterlinge') && !currentSrc.includes('0.jpg')) {
      setCurrentSrc('/Schmetterlinge/0.jpg');
    } else if (currentSrc.includes('Fische') && !currentSrc.includes('0.jpg')) {
      setCurrentSrc('/Fische/0.jpg');
    } else if (currentSrc.includes('Raupen') && !currentSrc.includes('0.jpg')) {
      // First try removing padding from padded numbers (07.jpg -> 7.jpg)  
      const match = currentSrc.match(/\/Raupen\/0*(\d+)\.jpg$/);
      if (match && match[1] && currentSrc.includes('0' + match[1])) {
        setCurrentSrc(`/Raupen/${match[1]}.jpg`);
      } else {
        setCurrentSrc('/Raupen/0.jpg');
      }
    } else {
      setImageError(true);
    }
  };

  return (
    <div 
      className={`
        ${className.includes('field-image') ? '' : sizeClasses[resolvedSizeKey]} 
        ${borderSize[resolvedSizeKey]} 
        rounded-lg 
        overflow-hidden 
        bg-slate-800 
        flex 
        items-center 
        justify-center 
        flex-shrink-0
        ${className}
      `} 
      style={{ 
        borderStyle: 'solid',
        borderColor: getBorderColor(normalizedRarity),
        aspectRatio: '1/1',
        ...(numericSize ? { width: numericSize, height: numericSize } : {})
      }}>
      {!imageError ? (
        <img
          src={currentSrc}
          alt={alt}
          className="w-full h-full object-cover"
          style={{ aspectRatio: '1/1' }}
          onError={handleImageError}
        />
      ) : (
        // Fallback icon for missing images
        currentSrc.includes('Blumen') ? (
          <Flower className={`${iconSize[resolvedSizeKey]} text-pink-400`} />
        ) : (
          <Sparkles className={`${iconSize[resolvedSizeKey]} text-purple-400`} />
        )
      )}
    </div>
  );
};