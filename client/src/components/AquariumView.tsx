import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/lib/stores/useAuth";
import { useNotification } from "../hooks/useNotification";
import { useCredits } from "@/lib/stores/useCredits";
import { Fish, Plus, Clock, Star, Waves, Eye } from "lucide-react";
import { HelpButton } from './HelpButton';
import { getRarityColor, getRarityDisplayName, getRarityBadgeStyle, type RarityTier } from "@shared/rarity";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FishDetailModal } from "./FishDetailModal";
import { FishSelectionModal } from "./FishSelectionModal";

// Types for aquarium system
interface AquariumFish {
  id: number;
  userId: number;
  tankId: number;
  slotIndex: number;
  fishId: number;
  fishName: string;
  fishRarity: string;
  fishImageUrl: string;
  placedAt: string;
  createdAt: string;
}

interface AquariumTank {
  id: number;
  userId: number;
  tankNumber: number;
  purchasedAt: string;
  createdAt: string;
}

interface UserFish {
  id: number;
  userId: number;
  fishId: number;
  fishName: string;
  fishRarity: string;
  fishImageUrl: string;
  quantity: number;
  createdAt: string;
}

interface FishDetailProps {
  id: number;
  fishName: string;
  fishRarity: string;
  fishImageUrl: string;
  placedAt: string;
  userId: number;
  tankId?: number;
}

export const AquariumView: React.FC = () => {
  const { user } = useAuth();
  const { credits, setCredits } = useCredits();
  const { showNotification } = useNotification();
  
  const [userFish, setUserFish] = useState<UserFish[]>([]);
  const [aquariumFish, setAquariumFish] = useState<AquariumFish[]>([]);
  const [tanks, setTanks] = useState<Map<number, AquariumTank>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedFish, setSelectedFish] = useState<FishDetailProps | null>(null);
  const [currentFishIndex, setCurrentFishIndex] = useState<number>(0);
  const [showFishModal, setShowFishModal] = useState(false);
  const [currentTankIndex, setCurrentTankIndex] = useState(0);
  
  // Fish selection modal states
  const [selectedTankForFish, setSelectedTankForFish] = useState<number | null>(null);
  const [selectedSlotForFish, setSelectedSlotForFish] = useState<number | null>(null);

  // Tank purchasing states
  const [purchasingTank, setPurchasingTank] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      await Promise.all([
        loadUserFish(),
        loadAquariumFish(),
        loadTanks(),
      ]);
    } catch (error) {
      console.error('Failed to load aquarium data:', error);
      showNotification('Fehler beim Laden der Aquarium-Daten', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUserFish = async () => {
    if (!user) return;

    const response = await fetch(`/api/user/${user.id}/fish`);
    const data = await response.json();
    setUserFish(data.fish || []);
  };

  const loadAquariumFish = async () => {
    if (!user) return;

    const response = await fetch(`/api/user/${user.id}/aquarium-fish`);
    const data = await response.json();
    setAquariumFish(data.fish || []);
  };

  const loadTanks = async () => {
    if (!user) return;

    const response = await fetch(`/api/user/${user.id}/aquarium-tanks`);
    const data = await response.json();
    
    const tanksMap = new Map<number, AquariumTank>();
    (data.tanks || []).forEach((tank: AquariumTank) => {
      tanksMap.set(tank.tankNumber, tank);
    });
    setTanks(tanksMap);
  };

  // Fish selection callback - adapts to existing handlePlaceFish API
  const handleFishSelectionCallback = async (fishId: number, fishImageUrl: string, fishName: string, rarity: string) => {
    if (selectedTankForFish !== null && selectedSlotForFish !== null) {
      await handlePlaceFish(selectedTankForFish, selectedSlotForFish, fishId);
      setSelectedTankForFish(null);
      setSelectedSlotForFish(null);
    }
  };

  const handlePurchaseTank = async (tankNumber: number) => {
    if (!user) return;

    setPurchasingTank(tankNumber);
    
    try {
      const response = await fetch('/api/aquarium/purchase-tank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({ tankNumber })
      });

      const data = await response.json();

      if (response.ok) {
        showNotification(`Aquarium ${tankNumber} gekauft!`, 'success');
        await loadTanks();
        const creditsResponse = await fetch(`/api/user/${user.id}/credits`);
        if (creditsResponse.ok) {
          const creditsData = await creditsResponse.json();
          setCredits(creditsData.credits);
        }
      } else {
        showNotification(data.message || 'Fehler beim Kauf', 'error');
      }
    } catch (error) {
      showNotification('Netzwerkfehler beim Kauf', 'error');
    } finally {
      setPurchasingTank(null);
    }
  };

  const handlePlaceFish = async (tankNumber: number, slotIndex: number, fishId: number) => {
    if (!user) return;

    try {
      const response = await fetch('/api/aquarium/place-fish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({ tankNumber, slotIndex, fishId })
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Fisch im Aquarium platziert!', 'success');
        await loadData();
      } else {
        showNotification(data.message || 'Fehler beim Platzieren', 'error');
      }
    } catch (error) {
      showNotification('Netzwerkfehler beim Platzieren', 'error');
    }
  };

  const handleRemoveFish = async (aquariumFishId: number) => {
    if (!user) return;

    try {
      const response = await fetch('/api/aquarium/remove-fish', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({ aquariumFishId })
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Fisch aus Aquarium entfernt!', 'success');
        await loadData();
      } else {
        showNotification(data.message || 'Fehler beim Entfernen', 'error');
      }
    } catch (error) {
      showNotification('Netzwerkfehler beim Entfernen', 'error');
    }
  };

  const getFishInTank = (tankNumber: number): AquariumFish[] => {
    const tank = tanks.get(tankNumber);
    if (!tank) return [];
    
    return aquariumFish.filter(fish => fish.tankId === tank.id);
  };

  const getSlotFish = (tankNumber: number, slotIndex: number): AquariumFish | null => {
    const tankFish = getFishInTank(tankNumber);
    return tankFish.find(fish => fish.slotIndex === slotIndex) || null;
  };

  // Get all placed fish in order (for navigation)
  const getAllPlacedFish = (): AquariumFish[] => {
    const allFish: AquariumFish[] = [];
    for (let tankNumber = 1; tankNumber <= 3; tankNumber++) {
      const tankFish = getFishInTank(tankNumber).sort((a, b) => a.slotIndex - b.slotIndex);
      allFish.push(...tankFish);
    }
    return allFish;
  };

  // Navigation functions
  const handleFishSelect = (fish: AquariumFish) => {
    console.log("🐟 Fish clicked:", fish.fishName, fish.id);
    const allFish = getAllPlacedFish();
    const index = allFish.findIndex(f => f.id === fish.id);
    
    setSelectedFish({
      id: fish.id,
      fishName: fish.fishName,
      fishRarity: fish.fishRarity,
      fishImageUrl: fish.fishImageUrl,
      placedAt: fish.placedAt,
      userId: fish.userId,
      tankId: fish.tankId
    });
    setCurrentFishIndex(index);
    setShowFishModal(true);
    console.log("🐟 Modal should open:", showFishModal, selectedFish);
  };

  const handleNextFish = () => {
    const allFish = getAllPlacedFish();
    if (currentFishIndex < allFish.length - 1) {
      const nextFish = allFish[currentFishIndex + 1];
      setSelectedFish({
        id: nextFish.id,
        fishName: nextFish.fishName,
        fishRarity: nextFish.fishRarity,
        fishImageUrl: nextFish.fishImageUrl,
        placedAt: nextFish.placedAt,
        userId: nextFish.userId,
        tankId: nextFish.tankId
      });
      setCurrentFishIndex(currentFishIndex + 1);
    }
  };

  const handlePreviousFish = () => {
    const allFish = getAllPlacedFish();
    if (currentFishIndex > 0) {
      const prevFish = allFish[currentFishIndex - 1];
      setSelectedFish({
        id: prevFish.id,
        fishName: prevFish.fishName,
        fishRarity: prevFish.fishRarity,
        fishImageUrl: prevFish.fishImageUrl,
        placedAt: prevFish.placedAt,
        userId: prevFish.userId,
        tankId: prevFish.tankId
      });
      setCurrentFishIndex(currentFishIndex - 1);
    }
  };

  const renderTankSlot = (tankNumber: number, slotIndex: number) => {
    const fish = getSlotFish(tankNumber, slotIndex);
    const tank = tanks.get(tankNumber);
    
    if (fish) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="w-full h-full bg-gradient-to-br from-blue-900/20 to-blue-700/30 border-2 rounded-lg flex items-center justify-center cursor-pointer hover:from-blue-800/30 hover:to-blue-600/40 transition-all relative overflow-hidden"
              style={{ borderColor: getRarityColor(fish.fishRarity) }}
              onClick={() => handleFishSelect(fish)}
            >
              <img
                src={fish.fishImageUrl}
                alt={fish.fishName}
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling!.style.display = 'flex';
                }}
              />
              <div
                className="w-full h-full bg-gradient-to-br from-blue-500 to-teal-500 rounded flex items-center justify-center text-2xl"
                style={{ display: 'none' }}
              >
                🐟
              </div>
              
              {/* Rarity glow effect */}
              <div 
                className="absolute inset-0 rounded-lg opacity-20"
                style={{ 
                  backgroundColor: getRarityColor(fish.fishRarity),
                  boxShadow: `inset 0 0 20px ${getRarityColor(fish.fishRarity)}`
                }}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-semibold">{fish.fishName}</p>
              <Badge className={`${getRarityBadgeStyle(fish.fishRarity as RarityTier)} text-xs px-2 py-1`}>
                {getRarityDisplayName(fish.fishRarity as RarityTier)}
              </Badge>
              <p className="text-xs text-blue-300 mt-1">Klicken für Details</p>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }

    // Empty slot
    return (
      <div 
        className="w-full h-full bg-blue-950/30 border-2 border-blue-700/50 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-900/40 hover:border-blue-600/70 transition-all"
        onClick={() => {
          if (tank && userFish.length > 0) {
            setSelectedTankForFish(tank.tankNumber);
            setSelectedSlotForFish(slotIndex);
            setShowFishModal(true);
          } else if (!tank) {
            showNotification('Kaufe zuerst dieses Aquarium!', 'warning');
          } else {
            showNotification('Du hast keine Fische im Inventar!', 'warning');
          }
        }}
      >
        <Plus className="h-4 w-4 text-blue-400/60" />
      </div>
    );
  };

  const renderTank = (tankNumber: number) => {
    const tank = tanks.get(tankNumber);
    const tankFish = getFishInTank(tankNumber);
    // Calculate cost: Tank 1 = free, Tank 2 = 2500, each further x1.5
    const tankCost = tankNumber === 1 ? 0 : Math.round(2500 * Math.pow(1.5, tankNumber - 2));

    if (!tank) {
      // Tank not purchased
      return (
        <Card key={tankNumber} className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg text-blue-300 flex items-center space-x-2">
                <Waves className="h-5 w-5" />
                <span>Aquarium {tankNumber}</span>
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePurchaseTank(tankNumber)}
                disabled={purchasingTank === tankNumber || credits < tankCost}
                className="bg-blue-900/20 border-blue-500/50 text-blue-300 hover:bg-blue-800/30"
              >
                {purchasingTank === tankNumber ? 'Kaufe...' : tankCost === 0 ? 'Kostenlos' : `${tankCost} Cr`}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-400">
              <Waves className="h-12 w-12 mx-auto mb-4 text-blue-500/50" />
              <p className="text-sm">Aquarium nicht gekauft</p>
              <p className="text-xs mt-2">24 Fisch-Plätze verfügbar</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Tank purchased - show 6x4 grid (24 slots)
    return (
      <Card key={tankNumber} className="bg-gradient-to-br from-blue-950/50 to-teal-950/30 border-blue-500/30">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg text-blue-300 flex items-center space-x-2">
              <Waves className="h-5 w-5" />
              <span>Aquarium {tankNumber}</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-blue-900/20 text-blue-300 border-blue-500/50">
                {tankFish.length}/24 Fische
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="grid grid-cols-6 gap-1 p-3 bg-gradient-to-br from-blue-900/20 to-teal-900/10 rounded-lg border border-blue-500/20">
              {Array.from({ length: 24 }, (_, slotIndex) => (
                <div key={slotIndex} className="aspect-square">
                  {renderTankSlot(tankNumber, slotIndex)}
                </div>
              ))}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-teal-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Fish className="h-12 w-12 mx-auto mb-4 text-blue-400 animate-pulse" />
            <p className="text-blue-300">Lade Aquarium...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-teal-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative mb-8">
          {/* HelpButton in absoluter Position rechts oben */}
          <div className="absolute top-0 right-0">
            <HelpButton helpText="Im Aquarium präsentierst du deine schönsten Fische! Kaufe Aquarium-Tanks für Credits und stelle deine seltenen Fische zur Schau. Jedes Aquarium hat 24 Plätze für deine Sammlung!" viewType="aquarium" />
          </div>
          
          {/* Zentrierter Content */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-blue-300 mb-2 flex items-center justify-center space-x-3">
              <Waves className="h-10 w-10" />
              <span>Aquarium</span>
              <Waves className="h-10 w-10" />
            </h1>
            <p className="text-blue-200 max-w-2xl mx-auto">
              Zeige deine wertvollsten Fische in wunderschönen Aquarien! Jedes Aquarium bietet 24 Plätze für deine Fisch-Sammlung.
            </p>
          </div>
        </div>

        {/* Tank Navigation */}
        <div className="flex justify-center mb-6">
          <div className="flex space-x-2 bg-slate-800/50 rounded-lg p-2">
            {[1, 2, 3, 4].map((tankNum) => {
              const tank = tanks.get(tankNum);
              const tankFish = getFishInTank(tankNum);
              
              return (
                <Button
                  key={tankNum}
                  variant={currentTankIndex === tankNum - 1 ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentTankIndex(tankNum - 1)}
                  className={`flex items-center space-x-2 ${
                    currentTankIndex === tankNum - 1
                      ? "bg-blue-600 text-white"
                      : "text-blue-300 hover:text-white hover:bg-blue-800/30"
                  }`}
                >
                  <Waves className="h-4 w-4" />
                  <span>#{tankNum}</span>
                  {tank && (
                    <Badge 
                      variant="secondary" 
                      className="ml-1 text-xs bg-blue-900/50 text-blue-200"
                    >
                      {tankFish.length}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Current Tank Display */}
        <div className="mb-8">
          {renderTank(currentTankIndex + 1)}
        </div>

        {/* Fish Inventory */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600">
          <CardHeader>
            <CardTitle className="text-lg text-blue-300 flex items-center space-x-2">
              <Fish className="h-5 w-5" />
              <span>Fisch Inventar ({userFish.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userFish.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Fish className="h-12 w-12 mx-auto mb-4 text-blue-500/50" />
                <p>Keine Fische im Inventar</p>
                <p className="text-xs mt-2">Sammle Fische im Teich!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {userFish.map((fish) => (
                  <div
                    key={fish.id}
                    className="bg-gradient-to-br from-blue-900/20 to-blue-700/10 border-2 rounded-lg p-3 text-center hover:from-blue-800/30 hover:to-blue-600/20 transition-all cursor-pointer"
                    style={{ borderColor: getRarityColor(fish.fishRarity) }}
                    onDoubleClick={() => {
                      const tank = tanks.get(currentTankIndex + 1);
                      if (tank) {
                        const tankFish = getFishInTank(currentTankIndex + 1);
                        if (tankFish.length >= 24) {
                          showNotification('Aquarium ist voll!', 'warning');
                        } else {
                          // Find first empty slot
                          let emptySlot = -1;
                          for (let i = 0; i < 24; i++) {
                            if (!tankFish.find(f => f.slotIndex === i)) {
                              emptySlot = i;
                              break;
                            }
                          }
                          if (emptySlot !== -1) {
                            handlePlaceFish(currentTankIndex + 1, emptySlot, fish.id);
                          }
                        }
                      } else {
                        showNotification('Kaufe zuerst ein Aquarium!', 'warning');
                      }
                    }}
                    onClick={() => {
                      console.log("🐟 Inventory Fish clicked:", fish.fishName, fish.id);
                      // Create a compatible fish object for the modal
                      setSelectedFish({
                        id: fish.id,
                        fishName: fish.fishName,
                        fishRarity: fish.fishRarity,
                        fishImageUrl: fish.fishImageUrl,
                        placedAt: new Date().toISOString(), // Use current time for inventory fish
                        userId: fish.userId,
                        tankId: 0 // Inventory fish don't have tankId
                      });
                      setCurrentFishIndex(0);
                      setShowFishModal(true);
                      console.log("🐟 Inventory Modal should open:", fish.fishName);
                    }}
                  >
                    <img
                      src={fish.fishImageUrl}
                      alt={fish.fishName}
                      className="w-12 h-12 mx-auto mb-2 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.style.display = 'flex';
                      }}
                    />
                    <div
                      className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-blue-500 to-teal-500 rounded flex items-center justify-center text-lg"
                      style={{ display: 'none' }}
                    >
                      🐟
                    </div>
                    <h3 className="font-semibold text-white text-xs truncate">
                      {fish.fishName}
                    </h3>
                    <Badge 
                      className="mb-1 text-xs"
                      style={{ backgroundColor: getRarityColor(fish.fishRarity) }}
                    >
                      {getRarityDisplayName(fish.fishRarity as RarityTier)}
                    </Badge>
                    <p className="text-blue-300 text-xs">
                      Anzahl: {fish.quantity}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fish Detail Modal */}
      <FishDetailModal
        isOpen={showFishModal && selectedFish !== null}
        onClose={() => {
          setShowFishModal(false);
          setSelectedFish(null);
        }}
        fish={selectedFish}
        onSold={() => {
          setShowFishModal(false);
          setSelectedFish(null);
          loadData();
        }}
        currentIndex={currentFishIndex}
        totalCount={getAllPlacedFish().length}
        onNext={currentFishIndex < getAllPlacedFish().length - 1 ? handleNextFish : undefined}
        onPrevious={currentFishIndex > 0 ? handlePreviousFish : undefined}
      />

      {/* Fish Selection Modal */}
      <FishSelectionModal
        isOpen={showFishModal && selectedTankForFish !== null && selectedSlotForFish !== null}
        onClose={() => {
          setShowFishModal(false);
          setSelectedTankForFish(null);
          setSelectedSlotForFish(null);
        }}
        onFishSelected={handleFishSelectionCallback}
      />
    </div>
  );
};