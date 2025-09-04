import React from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { RarityImage } from "./RarityImage";
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";

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
  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className="cursor-pointer">
          {children}
        </div>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-80 p-0 bg-slate-900 border-2 shadow-xl z-[100]" 
        style={{ borderColor: `var(--rarity-${rarity})` }}
        side="right"
        align="center"
      >
        <div className="relative overflow-hidden rounded-lg">
          {/* Header with rarity color */}
          <div 
            className="h-2" 
            style={{ backgroundColor: `var(--rarity-${rarity})` }}
          />
          
          {/* Content */}
          <div className="p-4">
            {/* Fish Image */}
            <div className="flex justify-center mb-4">
              <RarityImage 
                src={fishImageUrl}
                alt={fishName}
                rarity={rarity}
                size="xlarge"
                className="w-40 h-40 object-contain"
              />
            </div>
            
            {/* Fish Info */}
            <div className="text-center space-y-2">
              <h3 className="text-white font-bold text-lg">
                {fishName}
              </h3>
              <p 
                className="text-sm font-semibold"
                style={{ color: `var(--rarity-${rarity})` }}
              >
                🐟 {getRarityDisplayName(rarity)} Fisch
              </p>
              <p className="text-slate-400 text-xs">
                Aquatische Kreatur aus den Tiefen des Teichs
              </p>
            </div>
          </div>
          
          {/* Bottom rarity accent */}
          <div 
            className="h-1" 
            style={{ backgroundColor: `var(--rarity-${rarity})` }}
          />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};