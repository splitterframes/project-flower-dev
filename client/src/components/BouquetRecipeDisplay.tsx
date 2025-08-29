import React, { useState, useEffect } from 'react';
import { RarityImage } from './RarityImage';
import type { BouquetRecipe } from '@shared/schema';
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
}

export const BouquetRecipeDisplay: React.FC<BouquetRecipeDisplayProps> = ({
  bouquetId,
  recipe,
  onRecreate
}) => {
  const [ingredients, setIngredients] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(false);

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
    <div className="bg-slate-800 border-t border-slate-700 rounded-b-lg">
      <div className="p-3">
        <h4 className="text-white text-sm font-medium mb-3">Rezept-Zutaten:</h4>
        
        <div className="grid grid-cols-3 gap-2 mb-3">
          {ingredients.map((flower, index) => (
            <div key={index} className="text-center">
              <RarityImage 
                src={flower.imageUrl}
                alt={flower.name}
                rarity={flower.rarity as RarityTier}
                size="small"
                className="w-8 h-8 mx-auto mb-1"
              />
              <div className="text-xs text-slate-300 truncate">{flower.name}</div>
            </div>
          ))}
        </div>

        {onRecreate && (
          <button
            onClick={() => onRecreate(recipe.flowerId1, recipe.flowerId2, recipe.flowerId3)}
            className="w-full px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded transition-colors"
          >
            Bouquet nachbauen
          </button>
        )}
      </div>
    </div>
  );
};