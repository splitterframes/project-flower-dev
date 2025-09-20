import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { getRarityColor, getRarityDisplayName } from "@shared/rarity";
import { RarityImage } from './RarityImage';
import { Sparkles } from 'lucide-react';

interface ButterflySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userButterflies: any[];
  onSelectButterfly: (butterflyId: number) => void;
  fieldIndex: number;
}

export const ButterflySelectionModal: React.FC<ButterflySelectionModalProps> = ({
  isOpen,
  onClose,
  userButterflies,
  onSelectButterfly,
  fieldIndex
}) => {
  // Filter out butterflies with quantity 0
  const availableButterflies = userButterflies.filter(butterfly => butterfly.quantity > 0);

  const handleSelectButterfly = (butterflyId: number) => {
    onSelectButterfly(butterflyId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Schmetterling platzieren - Feld {fieldIndex}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3 p-1">
            {availableButterflies.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-slate-500" />
                <p>Keine Schmetterlinge im Inventar</p>
                <p className="text-sm mt-2">Besuche die Blumen-Ansicht um Schmetterlinge zu sammeln!</p>
              </div>
            ) : (
              availableButterflies.map((butterfly) => (
                <Button
                  key={butterfly.id}
                  onClick={() => handleSelectButterfly(butterfly.id)}
                  className="w-full h-auto p-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-left"
                  variant="ghost"
                >
                  <div className="flex items-center space-x-4 w-full">
                    <div className="relative">
                      <RarityImage
                        src={butterfly.butterflyImageUrl}
                        alt={butterfly.butterflyName}
                        rarity={butterfly.butterflyRarity}
                        size="medium"
                        className="w-14 h-14 rounded-lg"
                      />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-white text-base mb-1">
                        {butterfly.butterflyName}
                      </h4>
                      <p className={`text-sm font-medium ${getRarityColor(butterfly.butterflyRarity)}`}>
                        {getRarityDisplayName(butterfly.butterflyRarity)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded font-bold">
                          x{butterfly.quantity}
                        </span>
                        <span className="text-xs text-slate-400">verfügbar</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium">
                        Platzieren
                      </div>
                    </div>
                  </div>
                </Button>
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="flex justify-end pt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:text-white hover:border-slate-500"
          >
            Abbrechen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};