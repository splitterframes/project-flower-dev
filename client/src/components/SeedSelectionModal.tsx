import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RarityImage } from "./RarityImage";
import { Sprout, Star, X } from "lucide-react";
import { getRarityColor, getRarityBorder, type RarityTier, getGrowthTime, formatTime } from "@shared/rarity";

interface SeedOption {
  id: number;
  seedId: number;
  seedName: string;
  seedRarity: string;
  quantity: number;
}

interface SeedSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  seeds: SeedOption[];
  fieldIndex: number;
  onSelectSeed: (userSeedId: number, seedId: number, fieldIndex: number) => void;
}

export const SeedSelectionModal: React.FC<SeedSelectionModalProps> = ({
  isOpen,
  onClose,
  seeds,
  fieldIndex,
  onSelectSeed
}) => {
  const handleSeedSelect = (userSeedId: number, seedId: number) => {
    onSelectSeed(userSeedId, seedId, fieldIndex);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-white">
            <Sprout className="h-5 w-5 mr-2 text-green-400" />
            Samen auswählen - Feld {fieldIndex + 1}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          {seeds.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">Du hast keine Samen zum Pflanzen</p>
              <p className="text-slate-500 text-sm mt-2">Kaufe Samen im Markt oder erhalte sie durch Gärtnern</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {seeds.map((seed) => (
                <Card 
                  key={seed.id}
                  className="bg-slate-900 border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => handleSeedSelect(seed.id, seed.seedId)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <RarityImage 
                        src="/Blumen/0.jpg"
                        alt="Samen"
                        rarity={seed.seedRarity as RarityTier}
                        size="medium"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-white text-sm truncate">{seed.seedName}</h4>
                          <div className="flex items-center ml-2">
                            <Star className={`h-3 w-3 mr-1 ${getRarityColor(seed.seedRarity as RarityTier)}`} />
                            <span className={`text-xs ${getRarityColor(seed.seedRarity as RarityTier)}`}>
                              {seed.seedRarity}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-green-400">x{seed.quantity}</span>
                          <span className="text-slate-400">
                            Wachszeit: {formatTime(getGrowthTime(seed.seedRarity as RarityTier))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};