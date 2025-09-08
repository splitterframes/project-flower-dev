import React, { useState } from 'react';
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";

interface FlowerHoverPreviewProps {
  flowerImageUrl: string;
  flowerName: string;
  rarity: RarityTier;
  children: React.ReactNode;
}

export const FlowerHoverPreview: React.FC<FlowerHoverPreviewProps> = ({
  flowerImageUrl,
  flowerName,
  rarity,
  children
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isHovering && (
        <div className="absolute z-50 pointer-events-none left-full top-0 ml-2">
          <div className="bg-slate-900 border-2 border-slate-600 rounded-lg p-4 shadow-2xl">
            <div className="w-96 h-96 rounded-lg overflow-hidden mb-3">
              <img
                src={flowerImageUrl}
                alt={flowerName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image doesn't load
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="text-center">
              <div className="font-bold text-white text-lg mb-1">{flowerName}</div>
              <div className={`text-sm ${getRarityColor(rarity)}`}>
                {getRarityDisplayName(rarity)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};