import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { Flower2, Star, Heart, Gift, Plus, Sparkles } from "lucide-react";
import { BouquetCreationModal } from "./BouquetCreationModal";
import { BouquetRecipeDisplay } from "./BouquetRecipeDisplay";
import { RarityImage } from "./RarityImage";
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";
import type { UserFlower, UserBouquet, PlacedBouquet, BouquetRecipe } from "@shared/schema";

export const BouquetsView: React.FC = () => {
  const { user } = useAuth();
  const { credits, updateCredits } = useCredits();
  const [myFlowers, setMyFlowers] = useState<UserFlower[]>([]);
  const [myBouquets, setMyBouquets] = useState<UserBouquet[]>([]);
  const [placedBouquets, setPlacedBouquets] = useState<PlacedBouquet[]>([]);
  const [showBouquetCreation, setShowBouquetCreation] = useState(false);
  const [bouquetRecipes, setBouquetRecipes] = useState<Record<number, BouquetRecipe>>({});
  const [expandedBouquet, setExpandedBouquet] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyFlowers();
      fetchMyBouquets();
      fetchPlacedBouquets();
      fetchBouquetRecipes();
    }
  }, [user]);

  const fetchMyFlowers = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/${user.id}/flowers`);
      if (response.ok) {
        const data = await response.json();
        setMyFlowers(data.flowers || []);
      }
    } catch (error) {
      console.error('Failed to fetch my flowers:', error);
    }
  };

  const fetchMyBouquets = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/${user.id}/bouquets`);
      if (response.ok) {
        const data = await response.json();
        // Show all bouquets regardless of quantity for recipe viewing
        setMyBouquets(data.bouquets || []);
        console.log('Bouquets loaded:', data.bouquets);
      }
    } catch (error) {
      console.error('Failed to fetch my bouquets:', error);
    }
  };


  const fetchPlacedBouquets = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/${user.id}/placed-bouquets`);
      if (response.ok) {
        const data = await response.json();
        setPlacedBouquets(data.placedBouquets || []);
      }
    } catch (error) {
      console.error('Failed to fetch placed bouquets:', error);
    }
  };

  const fetchBouquetRecipes = async () => {
    try {
      const response = await fetch('/api/bouquets/recipes');
      if (response.ok) {
        const data = await response.json();
        const recipeMap: Record<number, BouquetRecipe> = {};
        data.recipes.forEach((recipe: BouquetRecipe) => {
          recipeMap[recipe.bouquetId] = recipe;
        });
        setBouquetRecipes(recipeMap);
      }
    } catch (error) {
      console.error('Failed to fetch bouquet recipes:', error);
    }
  };

  const [ingredientsCache, setIngredientsCache] = useState<Record<number, any[]>>({});

  const fetchBouquetIngredients = async (bouquetId: number): Promise<any[]> => {
    if (ingredientsCache[bouquetId]) return ingredientsCache[bouquetId];
    
    const recipe = bouquetRecipes[bouquetId];
    if (!recipe) return [];
    
    try {
      const flowerIds = [recipe.flowerId1, recipe.flowerId2, recipe.flowerId3];
      const ingredients: any[] = [];
      
      // Get flower details for each ingredient
      for (const flowerId of flowerIds) {
        const flowerResponse = await fetch(`/api/flower/${flowerId}`);
        if (flowerResponse.ok) {
          const flower = await flowerResponse.json();
          ingredients.push(flower);
        }
      }
      
      setIngredientsCache(prev => ({ ...prev, [bouquetId]: ingredients }));
      return ingredients;
    } catch (error) {
      console.error('Failed to fetch flower ingredients:', error);
      return [];
    }
  };

  const handleCreateBouquet = async (flowerId1: number, flowerId2: number, flowerId3: number, name?: string, generateName?: boolean) => {
    try {
      const response = await fetch('/api/bouquets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowerId1,
          flowerId2,
          flowerId3,
          name,
          generateName
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✨ ${result.message}`);
        // Refresh all data
        await fetchMyFlowers();
        await fetchMyBouquets();
        await fetchBouquetRecipes();
        // Credits are already deducted on server side, no need to deduct here
        setShowBouquetCreation(false);
      } else {
        const error = await response.json();
        alert(error.message || 'Fehler beim Erstellen des Bouquets');
      }
    } catch (error) {
      console.error('Error creating bouquet:', error);
      alert('Fehler beim Erstellen des Bouquets');
    }
  };

  const getBorderColor = (rarity: RarityTier): string => {
    switch (rarity) {
      case 'common': return '#fbbf24';      // yellow-400
      case 'uncommon': return '#4ade80';    // green-400  
      case 'rare': return '#3b82f6';        // blue-400
      case 'super-rare': return '#06b6d4';  // cyan-400
      case 'epic': return '#a855f7';        // purple-400
      case 'legendary': return '#f97316';   // orange-400
      case 'mythical': return '#ef4444';    // red-400
      default: return '#9ca3af';            // gray-400
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardContent className="pt-6">
            <p className="text-center text-slate-400">Bitte melde dich an, um Bouquets zu erstellen</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Bouquets Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
          <Flower2 className="h-8 w-8 mr-3 text-rose-400" />
          Bouquets
        </h1>
        <p className="text-slate-400">Erstelle wunderschöne Blumensträuße aus deinen Blumen</p>
      </div>

      {/* My Bouquets Collection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Created Bouquets */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Gift className="h-5 w-5 mr-2 text-rose-400" />
              Meine Bouquets ({myBouquets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myBouquets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">Noch keine Bouquets erstellt</p>
                <p className="text-slate-500 text-sm mt-2">Erstelle dein erstes Bouquet in der Werkstatt</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {myBouquets.map((bouquet) => (
                  <div
                    key={bouquet.id}
                    className="bg-slate-900 rounded-lg p-3 border-2"
                    style={{ borderColor: getBorderColor('rare' as RarityTier) }}
                  >
                    <div>
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
                            <span className="text-xs text-rose-400">Bouquet</span>
                            <span className={`text-sm font-bold flex-shrink-0 ${
                              bouquet.quantity > 0 ? 'text-green-400' : 'text-gray-500'
                            }`}>x{bouquet.quantity}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <button
                          onClick={async () => {
                            const newExpanded = expandedBouquet === bouquet.bouquetId ? null : bouquet.bouquetId;
                            setExpandedBouquet(newExpanded);
                            // Refresh recipes when showing recipe
                            if (newExpanded === bouquet.bouquetId) {
                              await fetchBouquetRecipes();
                            }
                          }}
                          className="w-full px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded transition-colors"
                        >
                          {expandedBouquet === bouquet.bouquetId ? 'Rezept verbergen' : 'Rezept zeigen'}
                        </button>
                      </div>
                    </div>

                    {expandedBouquet === bouquet.bouquetId && (
                      <div className="mt-2">
                        <BouquetRecipeDisplay 
                          bouquetId={bouquet.bouquetId} 
                          recipe={bouquetRecipes[bouquet.bouquetId]} 
                          onRecreate={(flowerId1, flowerId2, flowerId3) => 
                            handleCreateBouquet(flowerId1, flowerId2, flowerId3, undefined, true)
                          }
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Bouquet Creation Workshop */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center">
              <Gift className="h-5 w-5 mr-2 text-purple-400" />
              Bouquet Werkstatt
            </div>
            <Button
              onClick={() => setShowBouquetCreation(true)}
              disabled={myFlowers.length < 3}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Bouquet erstellen
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myFlowers.length < 3 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-4">Du benötigst mindestens 3 Blumen für ein Bouquet</p>
              <p className="text-slate-500 text-sm">
                Du hast derzeit <span className="text-rose-400 font-bold">{myFlowers.length}</span> Blumen
              </p>
              <p className="text-slate-500 text-sm mt-2">Züchte mehr Blumen in deinem Garten!</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-green-400 mb-4">✨ Du kannst jetzt Bouquets erstellen!</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-600">
                  <h4 className="text-white font-bold mb-2">🌸 Bouquet Erstellung</h4>
                  <ul className="text-slate-400 text-sm space-y-1">
                    <li>• Wähle 3 beliebige Blumen aus</li>
                    <li>• Kosten: 30 Credits</li>
                    <li>• AI generiert deutschen Namen</li>
                    <li>• Bouquet wird ins Inventar hinzugefügt</li>
                  </ul>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-600">
                  <h4 className="text-white font-bold mb-2">🦋 Schmetterling System</h4>
                  <ul className="text-slate-400 text-sm space-y-1">
                    <li>• Platziere Bouquets im Garten</li>
                    <li>• Schmetterlinge spawnen alle 1-5min</li>
                    <li>• Bouquet verwelkt nach 21min</li>
                    <li>• Erhalte Samen als Belohnung</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bouquet Creation Modal */}
      <BouquetCreationModal
        isOpen={showBouquetCreation}
        onClose={() => setShowBouquetCreation(false)}
        userFlowers={myFlowers}
        onCreateBouquet={handleCreateBouquet}
        credits={credits}
      />
    </div>
  );
};