import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";
import { Sparkles, Fish, Trophy } from "lucide-react";

interface FishRewardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fishName: string;
  fishImageUrl: string;
  rarity: string;
}

export const FishRewardDialog: React.FC<FishRewardDialogProps> = ({
  isOpen,
  onClose,
  fishName,
  fishImageUrl,
  rarity
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const rarityName = getRarityDisplayName(rarity as RarityTier);
  const rarityColor = getRarityColor(rarity as RarityTier);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-blue-950 via-cyan-950 to-blue-950 border-2 border-blue-500/30 text-white max-w-md shadow-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Fisch gefangen - {fishName}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center p-6 space-y-6">
          {/* Animated Icon */}
          <div className={`relative ${isAnimating ? 'animate-bounce' : ''}`}>
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full p-4 shadow-lg">
              <Fish className="h-12 w-12 text-white" />
            </div>
            {isAnimating && (
              <div className="absolute -top-2 -right-2">
                <Sparkles className="h-6 w-6 text-yellow-400 animate-ping" />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-cyan-300 flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6" />
              Fisch gefangen!
            </h2>
            <p className="text-cyan-200">Du hast einen wunderschönen Fisch aus dem Teich gefangen:</p>
          </div>

          {/* Fish Display */}
          <div className="bg-black/30 rounded-lg p-6 border border-blue-500/30 w-full">
            {/* Fish Image */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <img 
                  src={fishImageUrl}
                  alt={fishName}
                  className="w-64 h-64 object-contain rounded-lg shadow-lg"
                  style={{ width: '250px', height: '250px' }}
                />
                {isAnimating && (
                  <div className="absolute -top-2 -right-2">
                    <Sparkles className="h-8 w-8 text-yellow-400 animate-ping" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Fish Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <Badge 
                  className="text-lg font-bold px-4 py-2 border-2"
                  style={{ 
                    backgroundColor: rarityColor.replace('text-', 'bg-').replace('-400', '-600'),
                    borderColor: rarityColor.replace('text-', 'border-').replace('-400', '-400'),
                    color: 'white'
                  }}
                >
                  🐟 {fishName}
                </Badge>
              </div>
              
              <div className="flex items-center justify-center">
                <Badge 
                  className="text-sm font-bold px-3 py-1"
                  style={{ 
                    backgroundColor: rarityColor.replace('text-', 'bg-').replace('-400', '-700'),
                    color: 'white'
                  }}
                >
                  {rarityName}
                </Badge>
              </div>
            </div>
            
            {/* Sparkle Animation */}
            {isAnimating && (
              <div className="flex justify-center mt-3 space-x-2">
                <Sparkles className="h-4 w-4 text-cyan-400 animate-ping" style={{animationDelay: '0ms'}} />
                <Sparkles className="h-4 w-4 text-blue-400 animate-ping" style={{animationDelay: '200ms'}} />
                <Sparkles className="h-4 w-4 text-cyan-400 animate-ping" style={{animationDelay: '400ms'}} />
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-blue-300/80 text-sm">
            Der Fisch wurde automatisch zu deinem Inventar hinzugefügt!
          </p>

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold px-8 py-2 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            Fantastisch! 🌊
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};