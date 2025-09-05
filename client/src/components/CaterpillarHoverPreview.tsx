import React, { useState, useEffect } from "react";
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";
import { Bug } from "lucide-react";

interface CaterpillarHoverPreviewProps {
  caterpillarImageUrl: string;
  caterpillarName: string;
  rarity: RarityTier;
  children: React.ReactNode;
}

export const CaterpillarHoverPreview: React.FC<CaterpillarHoverPreviewProps> = ({
  caterpillarImageUrl,
  caterpillarName,
  rarity,
  children
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(caterpillarImageUrl);

  // Reset state when caterpillarImageUrl prop changes
  useEffect(() => {
    setCurrentSrc(caterpillarImageUrl);
    setImageError(false);
  }, [caterpillarImageUrl]);

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
            <div className="w-96 h-96 rounded-lg overflow-hidden mb-3 bg-slate-800 flex items-center justify-center">
              {!imageError ? (
                <img
                  src={currentSrc}
                  alt={caterpillarName}
                  className="w-full h-full object-cover"
                  onError={() => {
                    // For caterpillars, try fallback to 0.jpg before showing icon
                    if (currentSrc.includes('Raupen') && !currentSrc.includes('0.jpg')) {
                      setCurrentSrc('/Raupen/0.jpg');
                    } else {
                      setImageError(true);
                    }
                  }}
                />
              ) : (
                <Bug className="w-24 h-24 text-green-400" />
              )}
            </div>
            <div className="text-center">
              <div className="font-bold text-white text-lg mb-1">{caterpillarName}</div>
              <div className={`text-sm ${getRarityColor(rarity as RarityTier)}`}>
                🐛 {getRarityDisplayName(rarity as RarityTier)} Raupe
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};