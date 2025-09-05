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
    const previewWidth = 400; // 24rem = 384px + padding
    const previewHeight = 450; // estimated height
    const margin = 15; // safe margin from screen edge
    const offset = 12; // close but visible offset from cursor
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Default position: left side of cursor (300px to the left as requested)
    let left = mousePosition.x - 300;
    let top = mousePosition.y + offset;
    
    // Horizontal bounds checking
    if (left < margin) {
      // Move to right side of cursor if left doesn't fit
      left = mousePosition.x + offset;
      // If that also doesn't fit, clamp to right edge
      if (left + previewWidth > windowWidth - margin) {
        left = windowWidth - previewWidth - margin;
      }
    }
    
    // Vertical bounds checking  
    if (top + previewHeight > windowHeight - margin) {
      // Move above cursor
      top = mousePosition.y - offset - previewHeight;
    }
    
    // Final safety clamp to ensure always visible
    left = Math.max(margin, Math.min(left, windowWidth - previewWidth - margin));
    top = Math.max(margin, Math.min(top, windowHeight - previewHeight - margin));
    
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