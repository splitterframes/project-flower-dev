import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RarityImage } from '@/components/RarityImage';
import { getRarityColor, getRarityDisplayName, type RarityTier } from '@shared/rarity';

interface UserFlower {
  id: number;
  flowerId: number;
  flowerName: string;
  flowerImageUrl: string;
  flowerRarity: string;
  quantity: number;
}

interface FlowerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userFlowers: UserFlower[];
  onSelectFlower: (flowerId: number) => void;
  fieldIndex: number;
}

export const FlowerSelectionModal: React.FC<FlowerSelectionModalProps> = ({
  isOpen,
  onClose,
  userFlowers,
  onSelectFlower,
  fieldIndex
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-blue-400/30 max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-blue-300">
            🌸 Blume für Feld {fieldIndex + 1} auswählen
          </DialogTitle>
          <DialogDescription className="text-center text-blue-200">
            Wähle eine Blume aus deinem Inventar zum Platzieren (spawnt später Raupen)
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-2">
          {userFlowers.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-blue-300 mb-2">🌸 Keine Blumen verfügbar</p>
              <p className="text-blue-400 text-sm">Sammle Blumen im Garten um sie hier zu platzieren!</p>
            </div>
          ) : (
            userFlowers
              .filter(flower => flower.quantity > 0)
              .map((flower) => (
                <Card 
                  key={flower.id}
                  className="cursor-pointer transition-all border-2 hover:scale-105 border-slate-600 hover:border-blue-400/60 bg-slate-800/40"
                  onClick={() => onSelectFlower(flower.id)}
                >
                  <CardContent className="p-3 text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-lg overflow-hidden border-2"
                         style={{ borderColor: getRarityColor(flower.flowerRarity as RarityTier) }}>
                      <RarityImage
                        src={flower.flowerImageUrl}
                        alt={flower.flowerName}
                        rarity={flower.flowerRarity as RarityTier}
                        size="large"
                        className="w-full h-full"
                      />
                    </div>
                    <h3 className="font-semibold text-white text-xs truncate mb-1">
                      {flower.flowerName}
                    </h3>
                    <Badge 
                      className="mb-2 text-xs"
                      style={{ backgroundColor: getRarityColor(flower.flowerRarity as RarityTier) }}
                    >
                      {getRarityDisplayName(flower.flowerRarity as RarityTier)}
                    </Badge>
                    <p className="text-blue-300 text-xs">
                      🌸 Verfügbar: {flower.quantity}
                    </p>
                  </CardContent>
                </Card>
              ))
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-blue-500/20">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-slate-500 text-slate-300 hover:bg-slate-700"
          >
            Abbrechen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};