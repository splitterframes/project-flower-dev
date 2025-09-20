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
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(caterpillarImageUrl);
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });

  // Reset state when caterpillarImageUrl prop changes
  useEffect(() => {
    setCurrentSrc(caterpillarImageUrl);
    setImageError(false);
  }, [caterpillarImageUrl]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dialogWidth = 280; // Dialog width + padding
    const dialogHeight = 320; // Dialog height + padding
    const margin = 8; // Margin from element
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate horizontal position
    let x = rect.right + margin; // Default: right of element
    if (x + dialogWidth > viewportWidth) {
      // Not enough space on right, position on left
      x = rect.left - dialogWidth - margin;
      if (x < 0) {
        // Not enough space on left either, center it
        x = Math.max(margin, (viewportWidth - dialogWidth) / 2);
      }
    }
    
    // Calculate vertical position
    let y = rect.top; // Default: aligned with top of element
    if (y + dialogHeight > viewportHeight) {
      // Not enough space below, position above
      y = rect.bottom - dialogHeight;
      if (y < 0) {
        // Not enough space above either, center vertically
        y = Math.max(margin, (viewportHeight - dialogHeight) / 2);
      }
    }
    
    setDialogPosition({ x, y });
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