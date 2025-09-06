import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RarityImage } from "./RarityImage";
import { Flower, X, Sparkles } from "lucide-react";
import { getRarityColor, getRarityBorder, getRarityDisplayName, type RarityTier } from "@shared/rarity";

interface FlowerOption {
  id: number;
  flowerId: number;
  flowerName: string;
  flowerRarity: string;
  flowerImageUrl: string;
  quantity: number;
}

interface FlowerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userFlowers: FlowerOption[];
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
  const handleFlowerSelect = (flowerId: number) => {
    onSelectFlower(flowerId);
    onClose();
  };

  const availableFlowers = userFlowers.filter(flower => flower.quantity > 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-pink-500/30 text-white max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <DialogHeader className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-t-lg -mx-6 -my-2"></div>
          
          <DialogTitle className="flex items-center text-white relative z-10">
            <div className="relative">
              <Flower className="h-7 w-7 mr-3 text-pink-400 animate-pulse" />
              <div className="absolute inset-0 h-7 w-7 mr-3 text-pink-400 animate-ping opacity-30"></div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
              🌸 Blume auswählen - Feld {fieldIndex + 1}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Box */}
          <div className="bg-gradient-to-r from-blue-800/30 to-purple-800/30 rounded-xl p-4 border-2 border-blue-500/30">
            <div className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-blue-400" />
              <span className="text-blue-200 text-sm">
                Platziere eine Blume auf dem Grasfeld. Nach kurzer Zeit wird eine Raupe mit der Seltenheit der Blume erscheinen!
              </span>
            </div>
          </div>

          {availableFlowers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-red-400/30">
                <Flower className="h-12 w-12 text-red-400" />
              </div>
              <p className="text-xl font-semibold text-red-300 mb-2">Keine Blumen verfügbar</p>
              <p className="text-gray-400 mb-6">
                Du hast keine Blumen im Inventar. Sammle Blumen aus deinem Garten oder kaufe welche im Markt.
              </p>
              <Button 
                onClick={onClose}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white border-0 shadow-lg"
              >
                Schließen
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {availableFlowers.map((flower) => (
                  <Card 
                    key={flower.id}
                    className={`relative cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 ${getRarityBorder(flower.flowerRarity as RarityTier)} bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm`}
                    onClick={() => handleFlowerSelect(flower.id)}
                  >
                    <CardContent className="p-4 text-center">
                      {/* Quantity Badge */}
                      <div className="absolute -top-2 -right-2 z-10">
                        <Badge 
                          className="bg-slate-600 text-white font-bold shadow-lg"
                        >
                          {flower.quantity}x
                        </Badge>
                      </div>

                      {/* Flower Image */}
                      <div className="relative mb-3">
                        <div className={`w-20 h-20 mx-auto rounded-full border-4 ${getRarityBorder(flower.flowerRarity as RarityTier)} overflow-hidden shadow-lg relative`}>
                          <RarityImage 
                            src={flower.flowerImageUrl}
                            alt={flower.flowerName}
                            rarity={flower.flowerRarity as RarityTier}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Subtle glow effect */}
                          <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse"></div>
                        </div>
                      </div>

                      {/* Flower Info */}
                      <h3 className="font-bold text-white text-sm mb-1 truncate" title={flower.flowerName}>
                        {flower.flowerName}
                      </h3>
                      
                      <Badge 
                        className="bg-slate-600 text-white text-xs px-2 py-1"
                      >
                        {getRarityDisplayName(flower.flowerRarity as RarityTier)}
                      </Badge>

                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-end justify-center pb-3">
                        <span className="text-white font-semibold text-sm">
                          Auswählen
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <Button 
                  onClick={onClose}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <X className="h-4 w-4 mr-2" />
                  Abbrechen
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};