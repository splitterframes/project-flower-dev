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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsHovering(true);
    updateMousePosition(e);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isHovering) {
      updateMousePosition(e);
    }
  };

  const updateMousePosition = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {children}
      
      {isHovering && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${mousePosition.x + 50}px`,
            top: `${mousePosition.y - 200}px`,
          }}
        >
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