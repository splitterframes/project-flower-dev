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

  // Reset state when caterpillarImageUrl prop changes
  useEffect(() => {
    setCurrentSrc(caterpillarImageUrl);
    setImageError(false);
  }, [caterpillarImageUrl]);

  const handleMouseEnter = () => {
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
        <div className="absolute z-[99999] pointer-events-none left-full -top-20 ml-2">
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