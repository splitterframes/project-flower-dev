import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { Flower2, Star, Heart, Gift, Plus, Sparkles, Palette } from "lucide-react";
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
  const [myCreatedRecipes, setMyCreatedRecipes] = useState<any[]>([]); // Persistent user recipes
  const [placedBouquets, setPlacedBouquets] = useState<PlacedBouquet[]>([]);
  const [showBouquetCreation, setShowBouquetCreation] = useState(false);
  const [bouquetRecipes, setBouquetRecipes] = useState<Record<number, BouquetRecipe>>({});
  const [expandedBouquet, setExpandedBouquet] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyFlowers();
      fetchMyBouquets();
      fetchMyCreatedRecipes(); // Fetch persistent user recipes
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

  const fetchMyCreatedRecipes = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/${user.id}/created-bouquet-recipes`);
      if (response.ok) {
        const data = await response.json();
        setMyCreatedRecipes(data.recipes || []);
        console.log('User created recipes loaded:', data.recipes);
      }
    } catch (error) {
      console.error('Failed to fetch user created recipes:', error);
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
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user?.id.toString() || '1'
        },
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
        
        // Show beautiful success toast
        if (result.bouquet) {
          const rarityName = getRarityDisplayName(result.bouquet.rarity as RarityTier);
          
          toast.success("Bouquet erfolgreich erstellt!", {
            description: `"${result.bouquet.name}" (${rarityName}) wurde erstellt! 💐`,
            duration: 4000,
            className: "border-l-4 " + getRarityColor(result.bouquet.rarity as RarityTier).replace('text-', 'border-l-'),
          });
        } else {
          toast.success("Bouquet erfolgreich erstellt!", {
            description: "Dein neues Bouquet steht bereit! 💐",
            duration: 4000,
          });
        }
        
        // Refresh all data
        await fetchMyFlowers();
        await fetchMyBouquets();
        await fetchBouquetRecipes();
        await fetchMyCreatedRecipes();
        // Fetch updated credits from server after deduction
        if (user) {
          const creditsResponse = await fetch(`/api/user/${user.id}/credits`);
          if (creditsResponse.ok) {
            const creditsData = await creditsResponse.json();
            // Update credits display with current value from server
            const { setCredits } = useCredits.getState();
            setCredits(creditsData.credits);
          }
        }
        setShowBouquetCreation(false);
      } else {
        const error = await response.json();
        
        // Show user-friendly error message for duplicate names and other errors
        if (error.message && error.message.includes('existiert bereits')) {
          toast.error("❌ Name bereits vergeben", {
            description: error.message,
            duration: 5000,
            className: "border-l-4 border-l-red-500",
          });
        } else {
          toast.error("Fehler beim Erstellen", {
            description: error.message || 'Bouquet konnte nicht erstellt werden',
            duration: 4000,
          });
        }
      }
    } catch (error) {
      console.error('Error creating bouquet:', error);
      toast.error("Verbindungsfehler", {
        description: 'Bouquet konnte nicht erstellt werden',
        duration: 4000,
      });
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
    <div className="p-6 space-y-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-full">
      {/* Compact Bouquets Header */}
      <div className="bg-slate-800/60 p-4 rounded-lg border border-pink-500/30">
        <div className="text-center mb-3">
          <h1 className="text-2xl font-bold text-pink-300 mb-1">
            Bouquet Kollektion
          </h1>
          <p className="text-slate-400 text-sm">Erstelle Blumensträuße aus deinen Blumen</p>
        </div>
        
        {/* Compact Stats */}
        <div className="flex justify-center gap-6 text-sm">
          <div className="flex items-center space-x-2">
            <Flower2 className="h-4 w-4 text-blue-400" />
            <span className="text-white font-semibold">{myFlowers.length}</span>
            <span className="text-slate-400">Blumen</span>
          </div>
          <div className="flex items-center space-x-2">
            <Gift className="h-4 w-4 text-pink-400" />
            <span className="text-white font-semibold">{myCreatedRecipes.length}</span>
            <span className="text-slate-400">Rezepte</span>
          </div>
        </div>
      </div>

      {/* My Bouquets Collection - Single Column */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/30 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center">
              <Gift className="h-5 w-5 mr-2 text-purple-400" />
              <span className="text-lg font-semibold text-purple-300">
                Meine Bouquets
              </span>
            </div>
            <Badge className="bg-purple-600 text-white px-2 py-1 text-sm">
              {myCreatedRecipes.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myCreatedRecipes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">Noch keine Bouquet-Rezepte erstellt</p>
              <p className="text-slate-500 text-sm mt-2">Erstelle dein erstes Bouquet in der Werkstatt</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myCreatedRecipes.map((recipe) => (
                <Card 
                  key={recipe.bouquetId}
                  className="bg-gradient-to-br from-slate-900 to-slate-950 border border-purple-400/30 hover:border-purple-400/50 transition-all duration-300"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <RarityImage 
                        src="/Blumen/Bouquet.jpg"
                        alt="Bouquet"
                        rarity={(recipe.bouquetRarity || "common") as RarityTier}
                        size="medium"
                        className="w-16 h-16 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-lg mb-1 truncate">
                          {recipe.bouquetName || `Bouquet #${recipe.bouquetId}`}
                        </h4>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant="secondary"
                              className={`px-2 py-1 text-sm ${getRarityColor((recipe.bouquetRarity || "common") as RarityTier)}`}
                            >
                              <Star className="h-3 w-3 mr-1" />
                              {getRarityDisplayName((recipe.bouquetRarity || "common") as RarityTier)}
                            </Badge>
                            <Badge className="bg-blue-500/20 text-blue-400 border border-blue-400/30 px-2 py-1 text-sm">
                              <Palette className="h-3 w-3 mr-1" />
                              Rezept
                            </Badge>
                          </div>
                          <Button
                            onClick={async () => {
                              const newExpanded = expandedBouquet === recipe.bouquetId ? null : recipe.bouquetId;
                              setExpandedBouquet(newExpanded);
                            }}
                            variant="outline"
                            size="sm"
                            className="text-purple-300 border-purple-400/30 hover:bg-purple-500/10"
                          >
                            {expandedBouquet === recipe.bouquetId ? 'Ausblenden' : 'Rezept anzeigen'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Recipe Display */}
                    {expandedBouquet === recipe.bouquetId && (
                      <div className="mt-4 pt-4 border-t border-purple-400/20">
                        <BouquetRecipeDisplay 
                          bouquetId={recipe.bouquetId} 
                          recipe={{
                            id: 0,
                            bouquetId: recipe.bouquetId,
                            flowerId1: recipe.flowerId1,
                            flowerId2: recipe.flowerId2,
                            flowerId3: recipe.flowerId3,
                            createdAt: new Date()
                          }}
                          userFlowers={myFlowers}
                          onRecreate={(flowerId1, flowerId2, flowerId3) => 
                            handleCreateBouquet(flowerId1, flowerId2, flowerId3, recipe.bouquetName, false)
                          }
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clean Bouquet Workshop */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-orange-500/30 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center">
              <Palette className="h-5 w-5 mr-2 text-orange-400" />
              <span className="text-lg font-semibold text-orange-300">
                Bouquet Werkstatt 🎨
              </span>
            </div>
            <Button
              onClick={() => setShowBouquetCreation(true)}
              disabled={myFlowers.length < 3}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                myFlowers.length >= 3
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-slate-600 text-slate-300 cursor-not-allowed'
              }`}
            >
              <Plus className="h-4 w-4 mr-1" />
              {myFlowers.length >= 3 ? 'Erstellen' : 'Mehr Blumen'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myFlowers.length < 3 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-red-400/30">
                <Heart className="h-12 w-12 text-red-400" />
              </div>
              <p className="text-slate-300 mb-4 text-xl font-semibold">Du benötigst mindestens 3 Blumen für ein Bouquet</p>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600 inline-block">
                <p className="text-slate-400 text-lg">
                  Du hast derzeit <Badge className="bg-rose-500/20 text-rose-400 border border-rose-400/30 px-3 py-1 font-bold">{myFlowers.length}</Badge> Blumen
                </p>
                <p className="text-slate-500 mt-3">Züchte mehr Blumen in deinem Garten! 🌱</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-green-400/30">
                <Sparkles className="h-10 w-10 text-green-400 animate-pulse" />
              </div>
              <p className="text-green-300 mb-8 text-2xl font-bold">✨ Du kannst jetzt Bouquets erstellen!</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-gradient-to-br from-purple-800/40 to-pink-800/40 rounded-xl p-6 border-2 border-purple-400/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-purple-500/20 rounded-lg mr-3 border border-purple-400/30">
                      <Heart className="h-6 w-6 text-purple-400" />
                    </div>
                    <h4 className="text-white font-bold text-lg">🌸 Bouquet Erstellung</h4>
                  </div>
                  <ul className="text-slate-300 space-y-2">
                    <li className="flex items-center">
                      <Star className="h-4 w-4 mr-2 text-yellow-400" />
                      Wähle 3 beliebige Blumen aus
                    </li>
                    <li className="flex items-center">
                      <Star className="h-4 w-4 mr-2 text-yellow-400" />
                      Kosten: 30 Credits
                    </li>
                    <li className="flex items-center">
                      <Star className="h-4 w-4 mr-2 text-yellow-400" />
                      AI generiert deutschen Namen
                    </li>
                    <li className="flex items-center">
                      <Star className="h-4 w-4 mr-2 text-yellow-400" />
                      Bouquet wird ins Inventar hinzugefügt
                    </li>
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-blue-800/40 to-cyan-800/40 rounded-xl p-6 border-2 border-blue-400/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg mr-3 border border-blue-400/30">
                      <Sparkles className="h-6 w-6 text-blue-400" />
                    </div>
                    <h4 className="text-white font-bold text-lg">🦋 Schmetterling System</h4>
                  </div>
                  <ul className="text-slate-300 space-y-2">
                    <li className="flex items-center">
                      <Star className="h-4 w-4 mr-2 text-cyan-400" />
                      Platziere Bouquets im Garten
                    </li>
                    <li className="flex items-center">
                      <Star className="h-4 w-4 mr-2 text-cyan-400" />
                      Schmetterlinge spawnen alle 1-5min
                    </li>
                    <li className="flex items-center">
                      <Star className="h-4 w-4 mr-2 text-cyan-400" />
                      Bouquet verwelkt nach 21min
                    </li>
                    <li className="flex items-center">
                      <Star className="h-4 w-4 mr-2 text-cyan-400" />
                      Erhalte Samen als Belohnung
                    </li>
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