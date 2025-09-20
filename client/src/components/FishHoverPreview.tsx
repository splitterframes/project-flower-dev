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
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(fishImageUrl);
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });

  // Reset state when fishImageUrl prop changes
  useEffect(() => {
    setCurrentSrc(fishImageUrl);
    setImageError(false);
  }, [fishImageUrl]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dialogWidth = 280; // Dialog width + padding
    const dialogHeight = 320; // Dialog height + padding
    const margin = 8; // Margin from element
    
    // Check if we're inside a modal dialog
    const modalDialog = e.currentTarget.closest('[role="dialog"]');
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    let viewportLeft = 0;
    let viewportTop = 0;
    
    if (modalDialog) {
      // Use modal dialog boundaries instead of full viewport
      const modalRect = modalDialog.getBoundingClientRect();
      viewportWidth = modalRect.width;
      viewportHeight = modalRect.height;
      viewportLeft = modalRect.left;
      viewportTop = modalRect.top;
    }
    
    // Calculate horizontal position
    let x = rect.right + margin; // Default: right of element
    if (x + dialogWidth > viewportLeft + viewportWidth) {
      // Not enough space on right, position on left
      x = rect.left - dialogWidth - margin;
      if (x < viewportLeft) {
        // Not enough space on left either, center it within available space
        x = Math.max(viewportLeft + margin, viewportLeft + (viewportWidth - dialogWidth) / 2);
      }
    }
    
    // Calculate vertical position
    let y = rect.top; // Default: aligned with top of element
    if (y + dialogHeight > viewportTop + viewportHeight) {
      // Not enough space below, position above
      y = rect.bottom - dialogHeight;
      if (y < viewportTop) {
        // Not enough space above either, center vertically within available space
        y = Math.max(viewportTop + margin, viewportTop + (viewportHeight - dialogHeight) / 2);
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