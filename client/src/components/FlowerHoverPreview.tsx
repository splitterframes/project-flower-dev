import React, { useState, useEffect } from 'react';
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";
import { Flower } from "lucide-react";

interface FlowerHoverPreviewProps {
  flowerImageUrl: string;
  flowerName: string;
  rarity: RarityTier;
  children: React.ReactNode;
  isSpinning?: boolean;
}

export const FlowerHoverPreview: React.FC<FlowerHoverPreviewProps> = ({
  flowerImageUrl,
  flowerName,
  rarity,
  children,
  isSpinning = false
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(flowerImageUrl);
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });

  // Reset state when flowerImageUrl prop changes
  useEffect(() => {
    setCurrentSrc(flowerImageUrl);
    setImageError(false);
  }, [flowerImageUrl]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (isSpinning) return; // No hover during spin animation
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDialogPosition({
      x: rect.right + 8, // 8px Abstand rechts vom Element
      y: rect.top
    });
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
      
      {isHovering && !isSpinning && (
        <div 
          className="fixed z-[999999] pointer-events-none" 
          style={{ 
            left: `${dialogPosition.x}px`,
            top: `${dialogPosition.y}px`,
            isolation: 'isolate' 
          }}
        >
          <div className="bg-slate-900 border-2 border-slate-600 rounded-lg p-3 shadow-2xl">
            <div className="w-64 h-64 rounded-lg overflow-hidden mb-2 bg-slate-800 flex items-center justify-center">
              {!imageError ? (
                <img
                  src={currentSrc}
                  alt={flowerName}
                  className="w-full h-full object-cover"
                  onError={() => {
                    // For flowers, try fallback to 0.jpg before showing icon
                    if (currentSrc.includes('Blumen') && !currentSrc.includes('0.jpg')) {
                      setCurrentSrc('/Blumen/0.jpg');
                    } else {
                      setImageError(true);
                    }
                  }}
                />
              ) : (
                <Flower className="w-24 h-24 text-pink-400" />
              )}
            </div>
            <div className="text-center">
              <div className="font-bold text-white text-lg mb-1">{flowerName}</div>
              <div className={`text-sm ${getRarityColor(rarity)}`}>
                🌸 {getRarityDisplayName(rarity)} Blume
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};