import React, { useState, useEffect } from 'react';
import { RarityImage } from './RarityImage';
import { getRarityColor, getRarityDisplayName } from '@shared/rarity';
import type { BouquetRecipe, UserFlower } from '@shared/schema';
import type { RarityTier } from '@shared/rarity';

interface Flower {
  id: number;
  name: string;
  rarity: string;
  imageUrl: string;
}

interface BouquetRecipeDisplayProps {
  bouquetId: number;
  recipe?: BouquetRecipe;
  onRecreate?: (flowerId1: number, flowerId2: number, flowerId3: number) => void;
  userFlowers?: UserFlower[];
}

export const BouquetRecipeDisplay: React.FC<BouquetRecipeDisplayProps> = ({
  bouquetId,
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
    if (recipe) {
      fetchIngredients();
    }
  }, [recipe]);

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

  if (!recipe) {
    return (
      <div className="p-3 bg-slate-800 border-t border-slate-700">
        <p className="text-slate-400 text-sm text-center">Rezept nicht verfügbar</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-3 bg-slate-800 border-t border-slate-700">
        <p className="text-slate-400 text-sm text-center">Lade Rezept...</p>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-600 bg-slate-800/80">
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white text-sm font-medium">Zutaten</h4>
          {onRecreate && (
            <button
              onClick={() => onRecreate(recipe.flowerId1, recipe.flowerId2, recipe.flowerId3)}
              disabled={!canRecreate()}
              className={`px-2 py-1 text-xs rounded ${
                canRecreate() 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-slate-600 text-slate-400 cursor-not-allowed'
              }`}
              title={!canRecreate() ? 'Nicht genügend Blumen im Inventar' : 'Bouquet mit deinen Blumen neustecken'}
            >
              Nachstellen
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          {ingredients.map((flower, index) => (
            <div key={index} className="flex items-center gap-3 p-2 bg-slate-900/50 rounded-lg border border-slate-600/30">
              <RarityImage 
                src={flower.imageUrl}
                alt={flower.name}
                rarity={flower.rarity as RarityTier}
                size="medium"
                className="w-16 h-16 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{flower.name}</div>
                <div className={`text-xs font-medium ${getRarityColor(flower.rarity as RarityTier)}`}>
                  {getRarityDisplayName(flower.rarity as RarityTier)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};