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
    const margin = 10; // smaller margin from screen edge
    const offset = 10; // very small offset from cursor
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calculate available space around cursor
    const spaceRight = windowWidth - mousePosition.x - margin;
    const spaceLeft = mousePosition.x - margin;
    const spaceBelow = windowHeight - mousePosition.y - margin;
    const spaceAbove = mousePosition.y - margin;
    
    // Determine horizontal position - prefer where there's more space
    let left: number;
    if (spaceRight >= previewWidth + offset) {
      // Fits on the right
      left = mousePosition.x + offset;
    } else if (spaceLeft >= previewWidth + offset) {
      // Fits on the left
      left = mousePosition.x - offset - previewWidth;
    } else {
      // Center horizontally with preference for keeping cursor visible
      left = Math.max(margin, Math.min(windowWidth - previewWidth - margin, mousePosition.x - previewWidth / 2));
    }
    
    // Determine vertical position - prefer below cursor
    let top: number;
    if (spaceBelow >= previewHeight + offset) {
      // Fits below cursor
      top = mousePosition.y + offset;
    } else if (spaceAbove >= previewHeight + offset) {
      // Fits above cursor
      top = mousePosition.y - offset - previewHeight;
    } else {
      // Center vertically
      top = Math.max(margin, Math.min(windowHeight - previewHeight - margin, mousePosition.y - previewHeight / 2));
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