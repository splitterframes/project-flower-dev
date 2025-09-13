import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RarityImage } from "./RarityImage";
import { Sparkles, Heart, X, Coins, Crown, Star } from "lucide-react";
import { getRarityColor, getRarityDisplayName, getRarityBadgeStyle, type RarityTier, getRarityTierIndex } from "@shared/rarity";
import type { UserFlower } from "@shared/schema";

interface BouquetCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userFlowers: UserFlower[];
  onCreateBouquet: (flowerId1: number, flowerId2: number, flowerId3: number, name?: string, generateName?: boolean) => void;
  credits: number;
}

export const BouquetCreationModal: React.FC<BouquetCreationModalProps> = ({
  isOpen,
  onClose,
  userFlowers,
  onCreateBouquet,
  credits
}) => {
  const [selectedFlowers, setSelectedFlowers] = useState<(UserFlower | null)[]>([null, null, null]);
  const [bouquetName, setBouquetName] = useState("");
  const [isGeneratingName, setIsGeneratingName] = useState(false);

  const selectFlower = (flower: UserFlower) => {
    // Check if flower is already selected
    const isAlreadySelected = selectedFlowers.some(selected => 
      selected && selected.flowerId === flower.flowerId
    );
    
    if (isAlreadySelected) {
      return; // Don't allow selecting the same flower twice
    }

    // Find first empty slot
    const firstEmptySlotIndex = selectedFlowers.findIndex(slot => slot === null);
    
    if (firstEmptySlotIndex === -1) {
      return; // All slots are full
    }

    const newSelection = [...selectedFlowers];
    newSelection[firstEmptySlotIndex] = flower;
    setSelectedFlowers(newSelection);
  };

  const removeFlower = (slotIndex: number) => {
    const newSelection = [...selectedFlowers];
    newSelection[slotIndex] = null;
    setSelectedFlowers(newSelection);
  };

  const calculateAverageRarity = (): RarityTier => {
    const validFlowers = selectedFlowers.filter(f => f !== null) as UserFlower[];
    if (validFlowers.length === 0) return "common";
    
    const totalRarityScore = validFlowers.reduce((sum, flower) => {
      return sum + getRarityTierIndex(flower.flowerRarity as RarityTier);
    }, 0);
    
    const avgScore = Math.round(totalRarityScore / validFlowers.length);
    const rarities: RarityTier[] = ["common", "uncommon", "rare", "super-rare", "epic", "legendary", "mythical"];
    return rarities[Math.min(avgScore, rarities.length - 1)];
  };

  const canCreate = selectedFlowers.every(f => f !== null) && credits >= 30;

  const handleCreateBouquet = () => {
    if (!canCreate) return;
    
    const flowers = selectedFlowers as UserFlower[];
    if (bouquetName.trim()) {
      onCreateBouquet(flowers[0].flowerId, flowers[1].flowerId, flowers[2].flowerId, bouquetName.trim());
    } else {
      onCreateBouquet(flowers[0].flowerId, flowers[1].flowerId, flowers[2].flowerId, undefined, true);
    }
    
    // Reset form
    setSelectedFlowers([null, null, null]);
    setBouquetName("");
    onClose();
  };

  const generateName = async () => {
    setIsGeneratingName(true);
    try {
      const response = await fetch('/api/bouquets/generate-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rarity: calculateAverageRarity()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setBouquetName(data.name);
      }
    } catch (error) {
      console.error('Failed to generate name:', error);
    } finally {
      setIsGeneratingName(false);
    }
  };

  // Group flowers by rarity for better organization
  const flowersByRarity = userFlowers.reduce((acc, flower) => {
    const rarity = flower.flowerRarity as RarityTier;
    if (!acc[rarity]) acc[rarity] = [];
    acc[rarity].push(flower);
    return acc;
  }, {} as Record<RarityTier, UserFlower[]>);

  const availableFlowers = userFlowers.filter(flower => 
    !selectedFlowers.some(selected => selected && selected.flowerId === flower.flowerId)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-pink-500/30 text-white max-w-5xl max-h-[95vh] overflow-y-auto shadow-2xl">
        <DialogHeader className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-t-lg -mx-6 -my-2"></div>
          <DialogTitle className="flex items-center text-white text-2xl font-bold relative z-10">
            <div className="relative">
              <Heart className="h-7 w-7 mr-3 text-pink-400 animate-pulse" />
              <div className="absolute inset-0 h-7 w-7 mr-3 text-pink-400 animate-ping opacity-20"></div>
            </div>
            <span className="bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
              Bouquet erstellen
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Cost and Credits - Enhanced */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-xl blur-sm"></div>
            <div className="relative bg-gradient-to-r from-slate-800/80 to-slate-900/80 p-4 rounded-xl border border-orange-400/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="relative">
                    <Coins className="h-6 w-6 mr-3 text-orange-400 animate-bounce" />
                    <div className="absolute inset-0 h-6 w-6 mr-3 text-orange-400 animate-ping opacity-30"></div>
                  </div>
                  <span className="text-lg font-semibold text-orange-300">Kosten: 30 Credits</span>
                </div>
                <div className="flex items-center space-x-6">
                  {/* Average rarity display */}
                  {selectedFlowers.some(f => f !== null) && (
                    <div className="flex items-center space-x-2">
                      <Star className={`h-5 w-5 ${getRarityColor(calculateAverageRarity())} animate-pulse`} />
                      <span className="text-sm font-semibold">Durchschnitt:</span>
                      <Badge className={`${getRarityBadgeStyle(calculateAverageRarity())} text-sm font-bold px-3 py-1`}>
                        {getRarityDisplayName(calculateAverageRarity())}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <span className="text-lg mr-3">Verfügbare Credits:</span>
                    <Badge 
                      variant={credits >= 30 ? "default" : "destructive"} 
                      className={`text-lg px-4 py-2 font-bold ${
                        credits >= 30 
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' 
                          : 'bg-gradient-to-r from-red-600 to-rose-600 text-white animate-pulse'
                      }`}
                    >
                      {credits}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Flowers - Enhanced */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Crown className="h-6 w-6 mr-3 text-yellow-400" />
              <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
                Ausgewählte Blumen (3 benötigt)
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {selectedFlowers.map((flower, index) => (
                <Card key={index} className="relative group transition-all duration-300 hover:scale-105">
                  <div className={`absolute inset-0 rounded-lg ${
                    flower 
                      ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-400/40'
                      : 'bg-gradient-to-br from-slate-700/40 to-slate-800/40 border-2 border-slate-600/40 border-dashed'
                  } transition-all duration-300`}></div>
                  <CardContent className="relative p-6 text-center">
                    {flower ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <RarityImage 
                            src={flower.flowerImageUrl}
                            alt={flower.flowerName}
                            rarity={flower.flowerRarity as RarityTier}
                            size="large"
                            className="mx-auto transform transition-transform duration-300 hover:scale-110"
                          />
                          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
                            ✓
                          </div>
                        </div>
                        <div className="text-sm font-medium text-white truncate">{flower.flowerName}</div>
                        <Badge className={`${getRarityBadgeStyle(flower.flowerRarity as RarityTier)} text-sm font-bold px-3 py-1`}>
                          {getRarityDisplayName(flower.flowerRarity as RarityTier)}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFlower(index)}
                          className="text-red-400 border-red-400 hover:bg-red-500/20 hover:border-red-300 transition-all duration-200"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Entfernen
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative">
                          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-slate-500 group-hover:to-slate-600 transition-all duration-300">
                            <Heart className="h-10 w-10 text-slate-400 group-hover:text-pink-400 transition-colors duration-300" />
                          </div>
                        </div>
                        <div className="text-slate-400 font-medium">Slot {index + 1}</div>
                        <div className="text-xs text-slate-500">Blume auswählen</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

          </div>

          {/* Name Input - Enhanced */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Sparkles className="h-6 w-6 mr-3 text-purple-400" />
              <h3 className="text-xl font-bold">Bouquet Name</h3>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  value={bouquetName}
                  onChange={(e) => setBouquetName(e.target.value)}
                  placeholder="Gib einen Namen ein oder lass ihn generieren..."
                  className="bg-slate-900/80 border-2 border-purple-500/30 text-white text-lg py-3 px-4 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200"
                  maxLength={50}
                />
                {bouquetName && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
              <Button
                onClick={generateName}
                disabled={isGeneratingName || selectedFlowers.every(f => f === null)}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 px-6 py-3 text-lg font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Sparkles className={`h-5 w-5 mr-2 ${isGeneratingName ? 'animate-spin' : 'animate-pulse'}`} />
                {isGeneratingName ? "Generiere..." : "Generieren"}
              </Button>
            </div>
          </div>

          {/* Available Flowers - Enhanced */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="relative">
                <Heart className="h-6 w-6 mr-3 text-rose-400" />
                <div className="absolute inset-0 h-6 w-6 mr-3 text-rose-400 animate-ping opacity-30"></div>
              </div>
              <h3 className="text-xl font-bold">Verfügbare Blumen</h3>
              {availableFlowers.length > 0 && (
                <Badge className="ml-3 bg-blue-600 text-white px-3 py-1">
                  {availableFlowers.length} verfügbar
                </Badge>
              )}
            </div>
            {availableFlowers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-slate-700 rounded-full flex items-center justify-center mb-4">
                  <Heart className="h-8 w-8 text-slate-500" />
                </div>
                <div className="text-slate-400 text-lg">Du hast keine verfügbaren Blumen für ein Bouquet</div>
                <div className="text-slate-500 text-sm mt-2">Sammle mehr Blumen im Garten!</div>
              </div>
            ) : (
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-80 overflow-y-auto">
                  {availableFlowers
                    .sort((a, b) => getRarityTierIndex(b.flowerRarity as RarityTier) - getRarityTierIndex(a.flowerRarity as RarityTier))
                    .map((flower) => (
                    <Card 
                      key={flower.id}
                      className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 cursor-pointer hover:border-pink-400/50 transition-all duration-300 hover:scale-105 hover:shadow-lg group"
                    >
                      <CardContent className="p-4 text-center">
                        <div className="relative">
                          <RarityImage 
                            src={flower.flowerImageUrl}
                            alt={flower.flowerName}
                            rarity={flower.flowerRarity as RarityTier}
                            size="medium"
                            className="mx-auto mb-3 transition-transform duration-300 group-hover:scale-110"
                          />
                          <Badge className={`${getRarityBadgeStyle(flower.flowerRarity as RarityTier)} text-xs font-bold px-2 py-1 absolute -top-2 -right-2`}>
                            {flower.quantity}x
                          </Badge>
                        </div>
                        <div className="text-xs font-medium text-white truncate mb-2">{flower.flowerName}</div>
                        
                        {/* Enhanced Selection button */}
                        <div className="flex justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => selectFlower(flower)}
                            disabled={selectedFlowers.every(slot => slot !== null) || selectedFlowers.some(selected => selected && selected.flowerId === flower.flowerId)}
                            className={`px-4 py-2 h-9 font-bold transition-all duration-200 ${
                              selectedFlowers.every(slot => slot !== null) || selectedFlowers.some(selected => selected && selected.flowerId === flower.flowerId)
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                                : 'border-pink-400/50 text-pink-300 hover:bg-pink-500/20 hover:border-pink-400 hover:scale-110'
                            }`}
                          >
                            {selectedFlowers.some(selected => selected && selected.flowerId === flower.flowerId)
                              ? '✓ Ausgewählt'
                              : selectedFlowers.every(slot => slot !== null)
                              ? 'Alle Slots belegt'
                              : '+ Hinzufügen'
                            }
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Create Button - Enhanced */}
          <div className="relative">
            <div className={`absolute inset-0 rounded-2xl blur-lg opacity-50 ${
              canCreate 
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 animate-pulse' 
                : 'bg-gradient-to-r from-slate-600 to-slate-700'
            }`}></div>
            <Button
              onClick={handleCreateBouquet}
              disabled={!canCreate}
              className={`relative w-full text-xl font-bold py-6 rounded-2xl transition-all duration-300 ${
                canCreate 
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 hover:scale-105 shadow-lg' 
                  : 'bg-gradient-to-r from-slate-600 to-slate-700 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center">
                <Heart className={`h-6 w-6 mr-3 ${canCreate ? 'animate-pulse' : ''}`} />
                {!canCreate 
                  ? (credits < 30 ? "❌ Nicht genügend Credits" : "⚠️ Wähle 3 Blumen aus")
                  : "🌸 Bouquet erstellen (30 Credits)"
                }
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};