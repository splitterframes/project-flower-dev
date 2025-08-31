import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RarityImage } from "./RarityImage";
import { Heart, X, Clock, Sparkles } from "lucide-react";
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";
import type { UserBouquet } from "@shared/schema";

interface BouquetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldIndex: number;
  userBouquets: UserBouquet[];
  onPlaceBouquet: (bouquetId: number, fieldIndex: number) => void;
}

export const BouquetSelectionModal: React.FC<BouquetSelectionModalProps> = ({
  isOpen,
  onClose,
  fieldIndex,
  userBouquets,
  onPlaceBouquet
}) => {
  const [selectedBouquet, setSelectedBouquet] = useState<UserBouquet | null>(null);

  const handlePlaceBouquet = () => {
    if (!selectedBouquet) return;
    
    onPlaceBouquet(selectedBouquet.bouquetId, fieldIndex);
    setSelectedBouquet(null);
    onClose();
  };

  // Reset selection when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedBouquet(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-500/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <DialogHeader className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-t-lg -mx-6 -my-2"></div>
          <DialogTitle className="flex items-center text-white relative z-10">
            <div className="relative">
              <Heart className="h-8 w-8 mr-3 text-pink-400 animate-pulse" />
              <div className="absolute inset-0 h-8 w-8 mr-3 text-pink-400 animate-ping opacity-30"></div>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
              Bouquet platzieren 💐 - Feld {fieldIndex + 1}
            </span>
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

        <div className="space-y-6">
          {/* Enhanced Info Box */}
          <div className="bg-gradient-to-r from-yellow-800/30 to-orange-800/30 rounded-xl p-6 border-2 border-yellow-500/30 shadow-xl relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 rounded-xl"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="relative">
                  <Sparkles className="h-6 w-6 mr-3 text-yellow-400 animate-pulse" />
                  <div className="absolute inset-0 h-6 w-6 mr-3 text-yellow-400 animate-ping opacity-20"></div>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">Bouquet-System ✨</span>
              </div>
              <ul className="text-slate-300 space-y-2 text-lg">
                <li className="flex items-center">⏰ Bouquet wird 21 Minuten lang Schmetterlinge anlocken</li>
                <li className="flex items-center">🦋 Schmetterlinge spawnen alle 1-5 Minuten</li>
                <li className="flex items-center">🥀 Nach 21 Minuten verwelkt das Bouquet und gibt Samen</li>
                <li className="flex items-center">📍 Ein Bouquet pro Feld möglich</li>
              </ul>
            </div>
          </div>

          {/* Enhanced Bouquet Selection */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent flex items-center">
              💐 Wähle ein Bouquet ({userBouquets.length} verfügbar)
            </h3>
            
            {userBouquets.length === 0 ? (
              <div className="text-center py-12 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-lg"></div>
                <div className="relative z-10">
                  <div className="relative mb-6">
                    <Heart className="h-16 w-16 text-purple-400 mx-auto animate-bounce" />
                    <div className="absolute inset-0 h-16 w-16 mx-auto text-purple-400 animate-ping opacity-20"></div>
                  </div>
                  <p className="text-slate-300 text-xl mb-3">💐 Keine Bouquets verfügbar</p>
                  <p className="text-slate-400 text-lg">Erstelle zuerst Bouquets im Bouquets-Tab</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {userBouquets.map((bouquet) => (
                  <Card 
                    key={bouquet.id} 
                    className={`cursor-pointer transition-all duration-300 hover:scale-105 shadow-lg ${
                      selectedBouquet?.id === bouquet.id 
                        ? 'bg-gradient-to-br from-purple-800/60 to-pink-800/60 border-2 border-purple-400 ring-2 ring-purple-400 shadow-purple-500/50' 
                        : 'bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-600 hover:border-purple-400/50'
                    }`}
                    onClick={() => setSelectedBouquet(bouquet)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <RarityImage 
                          src="/Blumen/Bouquet.jpg"
                          alt="Bouquet"
                          rarity={"rare" as RarityTier}
                          size="medium"
                          className="w-12 h-12"
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-white text-sm">{bouquet.bouquetName || `Bouquet #${bouquet.id}`}</h4>
                          <div className="flex items-center justify-between gap-2">
                            <Badge className="text-xs text-rose-400 bg-rose-400/20">
                              Bouquet
                            </Badge>
                            <span className="text-sm font-bold text-green-400">x{bouquet.quantity}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="text-slate-300 border-2 border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-lg px-6 py-3 transition-all duration-300"
            >
              ❌ Abbrechen
            </Button>
            <Button
              onClick={handlePlaceBouquet}
              disabled={!selectedBouquet}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-lg px-6 py-3 font-bold transition-all duration-300 hover:scale-110 shadow-lg"
            >
              <div className="relative">
                <Clock className="h-5 w-5 mr-2 animate-pulse" />
              </div>
              💐 Bouquet platzieren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};