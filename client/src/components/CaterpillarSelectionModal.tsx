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
import { CaterpillarHoverPreview } from "./CaterpillarHoverPreview";
import { RarityImage } from "./RarityImage";
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";
import type { UserCaterpillar } from "@shared/schema";

interface CaterpillarSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaterpillarSelected: (caterpillarId: number, caterpillarImageUrl: string, caterpillarName: string, rarity: RarityTier) => void;
}

export const CaterpillarSelectionModal: React.FC<CaterpillarSelectionModalProps> = ({
  isOpen,
  onClose,
  onCaterpillarSelected
}) => {
  const { user } = useAuth();
  const [myCaterpillars, setMyCaterpillars] = useState<UserCaterpillar[]>([]);

  useEffect(() => {
    if (isOpen && user) {
      fetchMyCaterpillars();
    }
  }, [isOpen, user]);

  const fetchMyCaterpillars = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/${user.id}/caterpillars`);
      if (response.ok) {
        const data = await response.json();
        setMyCaterpillars(data.caterpillars || []);
      }
    } catch (error) {
      console.error('Failed to fetch caterpillars:', error);
    }
  };

  const handleCaterpillarSelection = (caterpillar: UserCaterpillar) => {
    onCaterpillarSelected(
      caterpillar.id,
      caterpillar.caterpillarImageUrl, 
      caterpillar.caterpillarName,
      caterpillar.caterpillarRarity as RarityTier
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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-900 border border-green-500/50">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-bold">
            🐛 Wähle eine Raupe für den Teich
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {myCaterpillars.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-300 text-lg mb-2">🐛 Keine Raupen verfügbar</div>
              <div className="text-slate-500">Sammle Raupen um sie im Teich zu platzieren</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {myCaterpillars
                .filter(caterpillar => caterpillar.quantity > 0)
                .map((caterpillar) => (
                  <Card
                    key={caterpillar.id}
                    className="bg-slate-800 border-2 hover:bg-slate-700 transition-all duration-200 cursor-pointer p-4"
                    style={{ borderColor: getBorderColor(caterpillar.caterpillarRarity as RarityTier) }}
                    onClick={() => handleCaterpillarSelection(caterpillar)}
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <CaterpillarHoverPreview
                        caterpillarImageUrl={caterpillar.caterpillarImageUrl}
                        caterpillarName={caterpillar.caterpillarName}
                        rarity={caterpillar.caterpillarRarity as RarityTier}
                      >
                        <RarityImage 
                          src={caterpillar.caterpillarImageUrl}
                          alt={caterpillar.caterpillarName}
                          rarity={caterpillar.caterpillarRarity as RarityTier}
                          size="large"
                          className="w-20 h-20"
                        />
                      </CaterpillarHoverPreview>
                      
                      <div className="text-center">
                        <h3 className="text-white font-semibold text-sm mb-1">
                          {caterpillar.caterpillarName}
                        </h3>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <span 
                            className="text-xs font-medium"
                            style={{ color: getBorderColor(caterpillar.caterpillarRarity as RarityTier) }}
                          >
                            {getRarityDisplayName(caterpillar.caterpillarRarity as RarityTier)}
                          </span>
                        </div>
                        <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
                          Verfügbar: {caterpillar.quantity}
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