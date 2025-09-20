import React, { useState, useEffect, useRef } from "react";
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";
import { Sparkles, Clock } from "lucide-react";

interface ButterflyHoverPreviewProps {
  butterflyImageUrl: string;
  butterflyName: string;
  rarity: RarityTier | "vip";
  children: React.ReactNode;
  // Optional sell countdown data
  placedAt?: string;
  canSell?: boolean;
  timeRemainingMs?: number;
  isSpinning?: boolean;
}

export const ButterflyHoverPreview: React.FC<ButterflyHoverPreviewProps> = ({
  butterflyImageUrl,
  butterflyName,
  rarity,
  children,
  placedAt,
  canSell,
  timeRemainingMs,
  isSpinning = false
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(butterflyImageUrl);
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });

  // Reset state when butterflyImageUrl prop changes
  useEffect(() => {
    setCurrentSrc(butterflyImageUrl);
    setImageError(false);
  }, [butterflyImageUrl]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (isSpinning) return; // No hover during spin animation
    
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

  const formatTimeRemaining = (ms: number): string => {
    // Round to nearest minute to prevent flickering between values
    const roundedMs = Math.ceil(ms / (1000 * 60)) * (1000 * 60);
    const hours = Math.floor(roundedMs / (1000 * 60 * 60));
    const minutes = Math.floor((roundedMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
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
                  alt={butterflyName}
                  className="w-full h-full object-cover"
                  onError={() => {
                    // For butterflies, try fallback to 0.jpg before showing icon
                    if (currentSrc.includes('Schmetterlinge') && !currentSrc.includes('0.jpg')) {
                      setCurrentSrc('/Schmetterlinge/0.jpg');
                    } else {
                      setImageError(true);
                    }
                  }}
                />
              ) : (
                <Sparkles className="w-24 h-24 text-purple-400" />
              )}
            </div>
            <div className="text-center">
              <div className="font-bold text-white text-lg mb-1">{butterflyName}</div>
              <div className={`text-sm ${rarity === "vip" ? "text-pink-200 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-full px-2 py-1" : getRarityColor(rarity as RarityTier)}`}>
                {rarity === "vip" ? "✨ VIP Premium 👑" : getRarityDisplayName(rarity as RarityTier)}
              </div>
              
              {/* Sell Progress Bar */}
              {placedAt && !canSell && timeRemainingMs !== undefined && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-center text-orange-300 text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{formatTimeRemaining(timeRemainingMs)}</span>
                  </div>
                  
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-green-500 rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.max(0, Math.min(100, ((72 * 60 * 60 * 1000 - timeRemainingMs) / (72 * 60 * 60 * 1000)) * 100))}%`
                      }}
                    ></div>
                  </div>
                  
                  <div className="text-xs text-slate-400">
                    Verkaufbar in {formatTimeRemaining(timeRemainingMs)}
                  </div>
                </div>
              )}
              
              {placedAt && canSell && (
                <div className="mt-3">
                  <div className="flex items-center justify-center text-green-400 text-sm font-semibold">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Verkaufsbereit!</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};