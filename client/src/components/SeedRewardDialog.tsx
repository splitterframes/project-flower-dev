import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";
import { Sparkles, Package, Gift } from "lucide-react";

interface SeedRewardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  quantity: number;
  rarity: string;
}

export const SeedRewardDialog: React.FC<SeedRewardDialogProps> = ({
  isOpen,
  onClose,
  quantity,
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
      <DialogContent className="bg-gradient-to-br from-emerald-950 via-green-950 to-emerald-950 border-2 border-green-500/30 text-white max-w-md shadow-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Samen erhalten - {rarityName}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center p-6 space-y-6">
          {/* Animated Icon */}
          <div className={`relative ${isAnimating ? 'animate-bounce' : ''}`}>
            <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-full p-4 shadow-lg">
              <Package className="h-12 w-12 text-white" />
            </div>
            {isAnimating && (
              <div className="absolute -top-2 -right-2">
                <Sparkles className="h-6 w-6 text-yellow-400 animate-ping" />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-green-300 flex items-center justify-center gap-2">
              <Gift className="h-6 w-6" />
              Verwelktes Bouquet gesammelt!
            </h2>
            <p className="text-green-200">Du hast Samen aus dem verwelkten Bouquet erhalten:</p>
          </div>

          {/* Reward Display */}
          <div className="bg-black/30 rounded-lg p-6 border border-green-500/30 w-full">
            <div className="flex items-center justify-center gap-4">
              <div className="text-4xl font-bold text-white">
                {quantity}x
              </div>
              <Badge 
                className="text-lg font-bold px-4 py-2 border-2"
                style={{ 
                  backgroundColor: rarityColor.replace('text-', 'bg-').replace('-400', '-600'),
                  borderColor: rarityColor.replace('text-', 'border-').replace('-400', '-400'),
                  color: 'white'
                }}
              >
                🌱 {rarityName} Samen
              </Badge>
            </div>
            
            {/* Sparkle Animation */}
            {isAnimating && (
              <div className="flex justify-center mt-3 space-x-2">
                <Sparkles className="h-4 w-4 text-yellow-400 animate-ping" style={{animationDelay: '0ms'}} />
                <Sparkles className="h-4 w-4 text-yellow-400 animate-ping" style={{animationDelay: '200ms'}} />
                <Sparkles className="h-4 w-4 text-yellow-400 animate-ping" style={{animationDelay: '400ms'}} />
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-green-300/80 text-sm">
            Die Samen wurden automatisch zu deinem Inventar hinzugefügt!
          </p>

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-8 py-2 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            Perfekt! 🌟
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};