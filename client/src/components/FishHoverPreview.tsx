import React, { useState, useEffect } from "react";
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";
import { Fish } from "lucide-react";

interface FishHoverPreviewProps {
  fishImageUrl: string;
  fishName: string;
  rarity: RarityTier;
  children: React.ReactNode;
}

export const FishHoverPreview: React.FC<FishHoverPreviewProps> = ({
  fishImageUrl,
  fishName,
  rarity,
  children
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(fishImageUrl);

  // Reset state when fishImageUrl prop changes
  useEffect(() => {
    setCurrentSrc(fishImageUrl);
    setImageError(false);
  }, [fishImageUrl]);

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
    const previewWidth = 400;
    const previewHeight = 450;
    const margin = 20;
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Simple and reliable: Try left first, then right
    let left = mousePosition.x - 200; // Start 200px to the left
    let top = mousePosition.y + 20;   // 20px below cursor
    
    // If goes off left edge, move to right side
    if (left < margin) {
      left = mousePosition.x + 20;
    }
    
    // If goes off right edge, clamp to right
    if (left + previewWidth > windowWidth - margin) {
      left = windowWidth - previewWidth - margin;
    }
    
    // If goes off bottom, move above cursor
    if (top + previewHeight > windowHeight - margin) {
      top = mousePosition.y - previewHeight - 20;
    }
    
    // If goes off top, clamp to top
    if (top < margin) {
      top = margin;
    }
    
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
                  alt={fishName}
                  className="w-full h-full object-cover"
                  onError={() => {
                    // For fish, try fallback to 0.jpg before showing icon
                    if (currentSrc.includes('Fische') && !currentSrc.includes('0.jpg')) {
                      setCurrentSrc('/Fische/0.jpg');
                    } else {
                      setImageError(true);
                    }
                  }}
                />
              ) : (
                <Fish className="w-24 h-24 text-blue-400" />
              )}
            </div>
            <div className="text-center">
              <div className="font-bold text-white text-lg mb-1">{fishName}</div>
              <div className={`text-sm ${getRarityColor(rarity as RarityTier)}`}>
                🐟 {getRarityDisplayName(rarity as RarityTier)} Fisch
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};