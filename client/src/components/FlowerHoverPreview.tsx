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
    const absoluteX = e.clientX;
    const absoluteY = e.clientY;
    
    setMousePosition({
      x: absoluteX,
      y: absoluteY
    });
  };

  const getPreviewPosition = () => {
    const previewWidth = 400; // 24rem = 384px + padding
    const previewHeight = 450; // estimated height
    const margin = 20; // margin from screen edge
    const offset = 20; // offset from cursor
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Determine horizontal position
    const canFitRight = mousePosition.x + offset + previewWidth + margin <= windowWidth;
    const canFitLeft = mousePosition.x - offset - previewWidth >= margin;
    
    let left: number;
    if (canFitRight) {
      left = mousePosition.x + offset;
    } else if (canFitLeft) {
      left = mousePosition.x - offset - previewWidth;
    } else {
      // Center if neither fits perfectly
      left = Math.max(margin, Math.min(windowWidth - previewWidth - margin, mousePosition.x - previewWidth / 2));
    }
    
    // Determine vertical position
    let top = mousePosition.y - previewHeight / 2;
    top = Math.max(margin, Math.min(windowHeight - previewHeight - margin, top));
    
    return { left, top };
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
          style={getPreviewPosition()}
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