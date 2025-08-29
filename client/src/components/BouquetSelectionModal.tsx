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
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-white">
            <Heart className="h-5 w-5 mr-2 text-pink-400" />
            Bouquet platzieren - Feld {fieldIndex + 1}
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
          {/* Info Box */}
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-600">
            <div className="flex items-center mb-2">
              <Sparkles className="h-4 w-4 mr-2 text-yellow-400" />
              <span className="font-semibold text-white">Bouquet-System</span>
            </div>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• Bouquet wird 21 Minuten lang Schmetterlinge anlocken</li>
              <li>• Schmetterlinge spawnen alle 1-5 Minuten</li>
              <li>• Nach 21 Minuten verwelkt das Bouquet und gibt Samen</li>
              <li>• Ein Bouquet pro Feld möglich</li>
            </ul>
          </div>

          {/* Bouquet Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Wähle ein Bouquet ({userBouquets.length} verfügbar)</h3>
            
            {userBouquets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">Keine Bouquets verfügbar</p>
                <p className="text-slate-500 text-sm mt-2">Erstelle zuerst Bouquets im Bouquets-Tab</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {userBouquets.map((bouquet) => (
                  <Card 
                    key={bouquet.id} 
                    className={`cursor-pointer transition-all ${
                      selectedBouquet?.id === bouquet.id 
                        ? 'bg-purple-900/50 border-purple-400 ring-2 ring-purple-400' 
                        : 'bg-slate-900 border-slate-700 hover:bg-slate-800'
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
                          <h4 className="font-bold text-white text-sm">Bouquet #{bouquet.id}</h4>
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

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={onClose}
              className="text-slate-400 border-slate-600 hover:bg-slate-700"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handlePlaceBouquet}
              disabled={!selectedBouquet}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              <Clock className="h-4 w-4 mr-2" />
              Bouquet platzieren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};