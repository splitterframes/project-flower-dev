import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RarityImage } from './RarityImage';
import { FlowerHoverPreview } from './FlowerHoverPreview';
import { getRarityColor, getRarityDisplayName } from '@shared/rarity';
import type { BouquetRecipe, UserFlower } from '@shared/schema';
import type { RarityTier } from '@shared/rarity';
import { CheckCircle, XCircle, Package, Heart, X, Star, Palette } from 'lucide-react';

interface Flower {
  id: number;
  name: string;
  rarity: string;
  imageUrl: string;
}

interface BouquetRecipeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bouquetId: number;
  bouquetName?: string;
  bouquetRarity?: RarityTier;
  recipe?: BouquetRecipe;
  onRecreate?: (flowerId1: number, flowerId2: number, flowerId3: number) => void;
  userFlowers?: UserFlower[];
}

export const BouquetRecipeDialog: React.FC<BouquetRecipeDialogProps> = ({
  isOpen,
  onClose,
  bouquetId,
  bouquetName,
  bouquetRarity = "common",
  recipe,
  onRecreate,
  userFlowers = []
}) => {
  const [ingredients, setIngredients] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if user has enough flowers to recreate bouquet
  const canRecreate = () => {
    if (!recipe || !userFlowers.length) return false;
    
    const requiredFlowerIds = [recipe.flowerId1, recipe.flowerId2, recipe.flowerId3];
    
    // Count required flowers
    const flowerCounts: Record<number, number> = {};
    requiredFlowerIds.forEach(id => {
      flowerCounts[id] = (flowerCounts[id] || 0) + 1;
    });
    
    // Check if user has enough of each required flower
    for (const [flowerId, requiredCount] of Object.entries(flowerCounts)) {
      const userFlower = userFlowers.find(f => f.flowerId === parseInt(flowerId));
      const availableCount = userFlower?.quantity || 0;
      
      if (availableCount < requiredCount) {
        return false;
      }
    }
    
    return true;
  };

  useEffect(() => {
    if (recipe && isOpen) {
      fetchIngredients();
    }
  }, [recipe, isOpen]);

  const fetchIngredients = async () => {
    if (!recipe) return;
    
    setLoading(true);
    try {
      const flowerIds = [recipe.flowerId1, recipe.flowerId2, recipe.flowerId3];
      const ingredientsData = [];
      
      for (const flowerId of flowerIds) {
        const response = await fetch(`/api/flower/${flowerId}`);
        if (response.ok) {
          const flower = await response.json();
          ingredientsData.push(flower);
        }
      }
      
      setIngredients(ingredientsData);
    } catch (error) {
      console.error('Failed to fetch ingredients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecreate = () => {
    if (recipe && onRecreate && canRecreate()) {
      onRecreate(recipe.flowerId1, recipe.flowerId2, recipe.flowerId3);
      onClose();
    }
  };

  if (!recipe) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-purple-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Palette className="h-6 w-6 text-purple-400" />
              <div>
                <h3 className="text-xl font-bold text-purple-300">Bouquet Rezept</h3>
                <p className="text-slate-400 text-sm">{bouquetName || `Bouquet #${bouquetId}`}</p>
              </div>
            </div>
            <Badge 
              className={`px-3 py-1 ${getRarityColor(bouquetRarity)}`}
            >
              <Star className="h-3 w-3 mr-1" />
              {getRarityDisplayName(bouquetRarity)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bouquet Display */}
          <div className="text-center">
            <RarityImage 
              src="/Blumen/Bouquet.jpg"
              alt="Bouquet"
              rarity={bouquetRarity}
              size="large"
              className="w-32 h-32 mx-auto mb-4"
            />
          </div>

          {/* Recipe Ingredients */}
          <div className="bg-slate-800/50 rounded-lg p-6 border border-purple-400/20">
            <h4 className="text-white font-semibold mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-purple-400" />
              Rezept Zutaten
            </h4>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-400">Lade Zutaten...</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {ingredients.map((flower, index) => {
                  const userFlower = userFlowers.find(f => f.flowerId === flower.id);
                  const hasEnough = userFlower && userFlower.quantity > 0;
                  
                  return (
                    <div key={index} className="text-center">
                      <div className="relative">
                        <FlowerHoverPreview flowerId={flower.id}>
                          <RarityImage 
                            src={flower.imageUrl}
                            alt={flower.name}
                            rarity={flower.rarity as RarityTier}
                            size="medium"
                            className="w-20 h-20 mx-auto mb-2"
                          />
                        </FlowerHoverPreview>
                        
                        {/* Availability indicator */}
                        <div className="absolute -top-2 -right-2">
                          {hasEnough ? (
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-white" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                              <XCircle className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <h5 className="text-white text-sm font-medium mb-1 truncate">
                        {flower.name}
                      </h5>
                      <Badge 
                        variant="secondary"
                        className={`text-xs px-2 py-1 ${getRarityColor(flower.rarity as RarityTier)}`}
                      >
                        {getRarityDisplayName(flower.rarity as RarityTier)}
                      </Badge>
                      
                      {/* Quantity info */}
                      <div className="mt-2">
                        {hasEnough ? (
                          <div className="text-green-400 text-xs flex items-center justify-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {userFlower?.quantity} verfügbar
                          </div>
                        ) : (
                          <div className="text-red-400 text-xs flex items-center justify-center">
                            <XCircle className="h-3 w-3 mr-1" />
                            Nicht verfügbar
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between space-x-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4 mr-2" />
              Verlassen
            </Button>
            
            <Button
              onClick={handleRecreate}
              disabled={!canRecreate()}
              className={`flex-1 font-semibold ${
                canRecreate() 
                  ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white border-2 border-green-400/50 hover:border-green-300' 
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600'
              }`}
            >
              <Heart className="h-4 w-4 mr-2" />
              {canRecreate() ? 'Nachstecken' : 'Zutaten fehlen'}
            </Button>
          </div>

          {/* Info Section */}
          <div className="bg-gradient-to-r from-purple-800/20 to-pink-800/20 rounded-lg p-4 border border-purple-400/30">
            <div className="flex items-center mb-2">
              <Star className="h-4 w-4 text-purple-400 mr-2" />
              <span className="text-purple-300 font-semibold text-sm">Informationen</span>
            </div>
            <div className="text-slate-300 text-sm space-y-1">
              <div>• Nachstecken erstellt ein neues Bouquet mit demselben Rezept</div>
              <div>• Kostet 30 Credits und verbraucht die benötigten Blumen</div>
              <div>• Originalname wird beibehalten</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};