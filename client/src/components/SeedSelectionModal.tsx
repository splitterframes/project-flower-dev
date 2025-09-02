import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RarityImage } from "./RarityImage";
import { Sprout, Star, X, Clock, Sparkles } from "lucide-react";
import { getRarityColor, getRarityDisplayName, type RarityTier, getGrowthTime, formatTime } from "@shared/rarity";

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
      <DialogContent className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-orange-500/30 text-white max-w-3xl shadow-2xl">
        <DialogHeader className="relative">
          {/* Enhanced Header Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-t-lg -mx-6 -my-2"></div>
          
          <DialogTitle className="flex items-center text-white relative z-10">
            <div className="relative">
              <Sprout className="h-7 w-7 mr-3 text-orange-400 animate-pulse" />
              <div className="absolute inset-0 h-7 w-7 mr-3 text-orange-400 animate-ping opacity-30"></div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-300 to-yellow-300 bg-clip-text text-transparent">
              🌱 Samen auswählen - Feld {fieldIndex + 1}
            </span>
          </DialogTitle>
          
        </DialogHeader>

        <div className="space-y-6">
          {seeds.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-red-400/30">
                <Sprout className="h-12 w-12 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-300 mb-4">Keine Samen verfügbar</h3>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600 inline-block">
                <p className="text-slate-400 text-lg mb-2">Du hast keine Samen zum Pflanzen</p>
                <p className="text-slate-500">Kaufe Samen im Markt oder erhalte sie durch Gärtnern 🛒</p>
              </div>
            </div>
          ) : (
            <>
              {/* Info Header */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur-sm"></div>
                <div className="relative bg-gradient-to-r from-slate-800/80 to-slate-900/80 p-4 rounded-xl border border-green-400/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative">
                        <Sparkles className="h-6 w-6 mr-3 text-green-400 animate-bounce" />
                        <div className="absolute inset-0 h-6 w-6 mr-3 text-green-400 animate-ping opacity-30"></div>
                      </div>
                      <span className="text-lg font-semibold text-green-300">Verfügbare Samen:</span>
                    </div>
                    <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg px-4 py-2 font-bold">
                      {seeds.length} Arten
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Seeds Grid */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {seeds
                    .sort((a, b) => {
                      const rarityOrder = { common: 0, uncommon: 1, rare: 2, "super-rare": 3, epic: 4, legendary: 5, mythical: 6 };
                      return (rarityOrder[b.seedRarity as keyof typeof rarityOrder] || 0) - (rarityOrder[a.seedRarity as keyof typeof rarityOrder] || 0);
                    })
                    .map((seed) => (
                    <Card 
                      key={seed.id}
                      className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 cursor-pointer hover:border-orange-400/50 transition-all duration-300 hover:scale-105 hover:shadow-lg group relative overflow-hidden"
                      onClick={() => handleSeedSelect(seed.id, seed.seedId)}
                    >
                      {/* Glow Effect */}
                      <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${getRarityColor(seed.seedRarity as RarityTier).replace('text-', 'bg-')}`}></div>
                      
                      <CardContent className="p-5 relative z-10">
                        <div className="flex items-start space-x-4">
                          <div className="relative">
                            <RarityImage 
                              src="/Blumen/0.jpg"
                              alt="Samen"
                              rarity={seed.seedRarity as RarityTier}
                              size="large"
                              className="transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center animate-bounce">
                              {seed.quantity}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-white text-base truncate group-hover:text-orange-200 transition-colors duration-200">
                                {seed.seedName}
                              </h4>
                            </div>
                            
                            <Badge className={`${getRarityColor(seed.seedRarity as RarityTier)} text-sm font-bold px-3 py-1 w-fit`}>
                              <Star className="h-3 w-3 mr-1" />
                              {getRarityDisplayName(seed.seedRarity as RarityTier)}
                            </Badge>

                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center text-green-400 font-bold">
                                <Sparkles className="h-4 w-4 mr-1" />
                                {seed.quantity} verfügbar
                              </div>
                              <div className="flex items-center text-slate-400">
                                <Clock className="h-4 w-4 mr-1" />
                                {formatTime(getGrowthTime(seed.seedRarity as RarityTier))}
                              </div>
                            </div>

                            {/* Click hint */}
                            <div className="text-xs text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">
                              ✨ Klicken zum Pflanzen
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {/* Schließen Button */}
          <div className="flex justify-center pt-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="text-slate-300 border-2 border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-lg px-8 py-3 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              ✕ Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};