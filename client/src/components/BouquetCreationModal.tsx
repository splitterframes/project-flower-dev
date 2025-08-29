import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RarityImage } from "./RarityImage";
import { Sparkles, Heart, X, Coins } from "lucide-react";
import { getRarityColor, getRarityDisplayName, type RarityTier, getRarityTierIndex } from "@shared/rarity";
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

  const selectFlower = (flower: UserFlower, slotIndex: number) => {
    // Check if flower is already selected in another slot
    const isAlreadySelected = selectedFlowers.some((selected, index) => 
      selected && selected.flowerId === flower.flowerId && index !== slotIndex
    );
    
    if (isAlreadySelected) {
      return; // Don't allow selecting the same flower twice
    }

    const newSelection = [...selectedFlowers];
    newSelection[slotIndex] = flower;
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
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-white">
            <Heart className="h-5 w-5 mr-2 text-pink-400" />
            Bouquet erstellen
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
          {/* Cost and Credits */}
          <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg">
            <div className="flex items-center">
              <Coins className="h-4 w-4 mr-2 text-orange-400" />
              <span className="text-sm">Kosten: 30 Credits</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm">Verfügbare Credits: </span>
              <Badge variant={credits >= 30 ? "default" : "destructive"} className="ml-2">
                {credits}
              </Badge>
            </div>
          </div>

          {/* Selected Flowers */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Ausgewählte Blumen (3 benötigt)</h3>
            <div className="grid grid-cols-3 gap-4">
              {selectedFlowers.map((flower, index) => (
                <Card key={index} className="bg-slate-900 border-slate-700">
                  <CardContent className="p-4 text-center">
                    {flower ? (
                      <div className="space-y-2">
                        <RarityImage 
                          src={flower.flowerImageUrl}
                          alt={flower.flowerName}
                          rarity={flower.flowerRarity as RarityTier}
                          size="large"
                          className="mx-auto"
                        />
                        <div className="text-xs text-slate-300 truncate">{flower.flowerName}</div>
                        <Badge className={getRarityColor(flower.flowerRarity as RarityTier)}>
                          {getRarityDisplayName(flower.flowerRarity as RarityTier)}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFlower(index)}
                          className="text-red-400 border-red-400 hover:bg-red-400/10"
                        >
                          Entfernen
                        </Button>
                      </div>
                    ) : (
                      <div className="py-8">
                        <div className="w-16 h-16 mx-auto bg-slate-700 rounded-lg flex items-center justify-center mb-2">
                          <Heart className="h-8 w-8 text-slate-500" />
                        </div>
                        <div className="text-slate-400 text-sm">Slot {index + 1}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Preview average rarity */}
            {selectedFlowers.some(f => f !== null) && (
              <div className="text-center">
                <span className="text-sm text-slate-400">Durchschnittliche Seltenheit: </span>
                <Badge className={getRarityColor(calculateAverageRarity())}>
                  {getRarityDisplayName(calculateAverageRarity())}
                </Badge>
              </div>
            )}
          </div>

          {/* Name Input */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Bouquet Name</h3>
            <div className="flex gap-2">
              <Input
                value={bouquetName}
                onChange={(e) => setBouquetName(e.target.value)}
                placeholder="Gib einen Namen ein oder lass ihn generieren..."
                className="bg-slate-900 border-slate-700 text-white"
                maxLength={50}
              />
              <Button
                onClick={generateName}
                disabled={isGeneratingName || selectedFlowers.every(f => f === null)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Sparkles className="h-4 w-4" />
                {isGeneratingName ? "..." : "Generieren"}
              </Button>
            </div>
          </div>

          {/* Available Flowers */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Verfügbare Blumen</h3>
            {availableFlowers.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                Du hast keine verfügbaren Blumen für ein Bouquet
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-64 overflow-y-auto">
                {availableFlowers.map((flower) => (
                  <Card 
                    key={flower.id}
                    className="bg-slate-900 border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    <CardContent className="p-3 text-center">
                      <RarityImage 
                        src={flower.flowerImageUrl}
                        alt={flower.flowerName}
                        rarity={flower.flowerRarity as RarityTier}
                        size="medium"
                        className="mx-auto mb-2"
                      />
                      <div className="text-xs text-slate-300 truncate mb-1">{flower.flowerName}</div>
                      <Badge className={`${getRarityColor(flower.flowerRarity as RarityTier)} text-xs`}>
                        {flower.quantity}x
                      </Badge>
                      
                      {/* Selection buttons for each slot */}
                      <div className="flex gap-1 mt-2">
                        {[0, 1, 2].map(slotIndex => (
                          <Button
                            key={slotIndex}
                            variant="outline"
                            size="sm"
                            onClick={() => selectFlower(flower, slotIndex)}
                            disabled={selectedFlowers[slotIndex] !== null}
                            className="text-xs px-2 py-1 h-6"
                          >
                            {slotIndex + 1}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Create Button */}
          <Button
            onClick={handleCreateBouquet}
            disabled={!canCreate}
            className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-slate-600"
          >
            <Heart className="h-4 w-4 mr-2" />
            {!canCreate 
              ? (credits < 30 ? "Nicht genügend Credits" : "Wähle 3 Blumen aus")
              : "Bouquet erstellen (30 Credits)"
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};