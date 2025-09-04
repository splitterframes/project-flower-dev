import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/stores/useAuth";
import { FishHoverPreview } from "./FishHoverPreview";
import { RarityImage } from "./RarityImage";
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";
import type { UserFish } from "@shared/schema";

interface FishSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFishSelected: (fishId: number, fishImageUrl: string, fishName: string, rarity: RarityTier) => void;
}

export const FishSelectionModal: React.FC<FishSelectionModalProps> = ({
  isOpen,
  onClose,
  onFishSelected
}) => {
  const { user } = useAuth();
  const [myFish, setMyFish] = useState<UserFish[]>([]);

  useEffect(() => {
    if (isOpen && user) {
      fetchMyFish();
    }
  }, [isOpen, user]);

  const fetchMyFish = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/${user.id}/fish`);
      if (response.ok) {
        const data = await response.json();
        setMyFish(data.fish || []);
      }
    } catch (error) {
      console.error('Failed to fetch fish:', error);
    }
  };

  const handleFishSelection = (fish: UserFish) => {
    onFishSelected(
      fish.id,
      fish.fishImageUrl, 
      fish.fishName,
      fish.fishRarity as RarityTier
    );
    onClose();
  };

  const getBorderColor = (rarity: RarityTier): string => {
    switch (rarity) {
      case 'common': return '#fbbf24';      // yellow-400
      case 'uncommon': return '#4ade80';    // green-400  
      case 'rare': return '#3b82f6';        // blue-400
      case 'super-rare': return '#06b6d4';  // cyan-400
      case 'epic': return '#a855f7';        // purple-400
      case 'legendary': return '#f97316';   // orange-400
      case 'mythical': return '#ef4444';    // red-400
      default: return '#9ca3af';            // gray-400
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-900 border border-blue-500/50">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-bold">
            🐟 Wähle einen Fisch für den Teich
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {myFish.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-300 text-lg mb-2">🐟 Keine Fische verfügbar</div>
              <div className="text-slate-500">Sammle Fische um sie im Teich zu platzieren</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {myFish
                .filter(fish => fish.quantity > 0)
                .map((fish) => (
                  <Card
                    key={fish.id}
                    className="bg-slate-800 border-2 hover:bg-slate-700 transition-all duration-200 cursor-pointer p-4"
                    style={{ borderColor: getBorderColor(fish.fishRarity as RarityTier) }}
                    onClick={() => handleFishSelection(fish)}
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <FishHoverPreview
                        fishImageUrl={fish.fishImageUrl}
                        fishName={fish.fishName}
                        rarity={fish.fishRarity as RarityTier}
                      >
                        <RarityImage 
                          src={fish.fishImageUrl}
                          alt={fish.fishName}
                          rarity={fish.fishRarity as RarityTier}
                          size="large"
                          className="w-20 h-20"
                        />
                      </FishHoverPreview>
                      
                      <div className="text-center">
                        <h3 className="text-white font-semibold text-sm mb-1">
                          {fish.fishName}
                        </h3>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <span 
                            className="text-xs font-medium"
                            style={{ color: getBorderColor(fish.fishRarity as RarityTier) }}
                          >
                            {getRarityDisplayName(fish.fishRarity as RarityTier)}
                          </span>
                        </div>
                        <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                          Verfügbar: {fish.quantity}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
          >
            Abbrechen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};