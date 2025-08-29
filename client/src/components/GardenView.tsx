import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { SeedSelectionModal } from "./SeedSelectionModal";
import { RarityImage } from "./RarityImage";
import { HarvestAnimation } from "./HarvestAnimation";
import { FlowerHoverPreview } from "./FlowerHoverPreview";
import { getGrowthTime, formatTime, getRarityDisplayName, getRarityColor, type RarityTier } from "@shared/rarity";
import { 
  Flower,
  Lock,
  Coins,
  Shovel,
  Sprout,
  Clock
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GardenField {
  id: number;
  isUnlocked: boolean;
  hasPlant: boolean;
  plantType?: string;
  isGrowing?: boolean;
  plantedAt?: Date;
  growthTimeSeconds?: number;
  seedRarity?: string;
  flowerId?: number;
  flowerName?: string;
  flowerImageUrl?: string;
}

interface UserSeed {
  id: number;
  seedId: number;
  seedName: string;
  seedRarity: string;
  quantity: number;
}

export const GardenView: React.FC = () => {
  const { user } = useAuth();
  const { credits, updateCredits } = useCredits();

  // Initialize garden with first 4 fields unlocked
  const [gardenFields, setGardenFields] = useState<GardenField[]>(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      isUnlocked: i < 4,
      hasPlant: false,
      plantType: undefined
    }));
  });

  const [userSeeds, setUserSeeds] = useState<UserSeed[]>([]);
  const [showSeedSelection, setShowSeedSelection] = useState(false);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [harvestingField, setHarvestingField] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserSeeds();
      fetchPlantedFields();
    }
  }, [user]);

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchUserSeeds = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/${user.id}/seeds`);
      if (response.ok) {
        const data = await response.json();
        setUserSeeds(data.seeds || []);
      }
    } catch (error) {
      console.error('Failed to fetch user seeds:', error);
    }
  };

  const fetchPlantedFields = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/garden/fields/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        updateGardenWithPlantedFields(data.fields || []);
      }
    } catch (error) {
      console.error('Failed to fetch planted fields:', error);
    }
  };

  const updateGardenWithPlantedFields = (plantedFields: any[]) => {
    setGardenFields(prev => 
      prev.map(field => {
        const plantedField = plantedFields.find(pf => pf.fieldIndex === field.id - 1);
        if (plantedField) {
          const plantedAt = new Date(plantedField.plantedAt);
          const growthTimeSeconds = getGrowthTime(plantedField.seedRarity as RarityTier);
          const isGrown = plantedField.isGrown || 
            (currentTime.getTime() - plantedAt.getTime()) / 1000 >= growthTimeSeconds;
          
          return {
            ...field,
            hasPlant: true,
            isGrowing: !isGrown,
            plantedAt,
            growthTimeSeconds,
            seedRarity: plantedField.seedRarity,
            flowerId: plantedField.flowerId,
            flowerName: plantedField.flowerName,
            flowerImageUrl: plantedField.flowerImageUrl
          };
        }
        return field;
      })
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardContent className="pt-6">
            <p className="text-center text-slate-400">Bitte melde dich an, um den Garten zu betreten</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculateUnlockCost = (fieldId: number) => {
    // First unlocked field costs 1000, then multiply by 1.2 for each subsequent field
    const unlockedCount = gardenFields.filter(f => f.isUnlocked).length;
    return Math.round(1000 * Math.pow(1.2, unlockedCount));
  };

  const unlockField = async (fieldId: number) => {
    const cost = calculateUnlockCost(fieldId);
    
    if (credits < cost) {
      alert(`Du brauchst ${cost} Cr um dieses Feld freizuschalten!`);
      return;
    }

    // Update credits
    await updateCredits(user.id, -cost);
    
    // Unlock the field
    setGardenFields(prev => 
      prev.map(field => 
        field.id === fieldId 
          ? { ...field, isUnlocked: true }
          : field
      )
    );
  };

  const openSeedSelection = (fieldIndex: number) => {
    setSelectedFieldIndex(fieldIndex);
    setShowSeedSelection(true);
  };

  const plantSeed = async (userSeedId: number, seedId: number, fieldIndex: number) => {
    try {
      const response = await fetch('/api/garden/plant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fieldIndex,
          seedId,
          userSeedId
        })
      });

      if (response.ok) {
        // Refresh data
        await fetchUserSeeds();
        await fetchPlantedFields();
      } else {
        const error = await response.json();
        alert(error.message || 'Fehler beim Pflanzen');
      }
    } catch (error) {
      console.error('Failed to plant seed:', error);
      alert('Fehler beim Pflanzen');
    }
  };

  const getFieldStatus = (field: GardenField) => {
    if (!field.hasPlant || !field.plantedAt || !field.growthTimeSeconds) {
      return null;
    }

    const plantedAt = field.plantedAt.getTime();
    const currentTimeMs = currentTime.getTime();
    const elapsedSeconds = Math.floor((currentTimeMs - plantedAt) / 1000);
    const remainingSeconds = Math.max(0, field.growthTimeSeconds - elapsedSeconds);

    return {
      isGrown: remainingSeconds === 0,
      remainingTime: formatTime(remainingSeconds),
      progress: Math.min(100, (elapsedSeconds / field.growthTimeSeconds) * 100)
    };
  };

  const harvestField = async (fieldIndex: number) => {
    try {
      // Start harvest animation
      setHarvestingField(fieldIndex);
      
      const response = await fetch('/api/garden/harvest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fieldIndex
        })
      });

      if (response.ok) {
        // Show success feedback with animation - could be enhanced with toast
        console.log('Blume erfolgreich geerntet!');
        // Animation will handle the refresh and cleanup
      } else {
        const error = await response.json();
        alert(error.message || 'Fehler beim Ernten');
        // Stop animation on error
        setHarvestingField(null);
      }
    } catch (error) {
      console.error('Failed to harvest field:', error);
      alert('Fehler beim Ernten');
      // Stop animation on error
      setHarvestingField(null);
    }
  };

  const handleHarvestAnimationComplete = async () => {
    // Refresh garden data when animation completes
    await fetchPlantedFields();
    setHarvestingField(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Garden Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
          <Flower className="h-8 w-8 mr-3 text-pink-400" />
          Mariposa Garten
        </h1>
        <p className="text-slate-400">Züchte wunderschöne Blumen für deine Schmetterlinge</p>
      </div>

      {/* Garden Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Freigeschaltete Felder
            </CardTitle>
            <Shovel className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {gardenFields.filter(f => f.isUnlocked).length}/50
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Gepflanzte Blumen
            </CardTitle>
            <Flower className="h-4 w-4 text-pink-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-400">
              {gardenFields.filter(f => f.hasPlant).length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Credits
            </CardTitle>
            <Coins className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{credits} Cr</div>
          </CardContent>
        </Card>
      </div>

      {/* Garden Grid */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Flower className="h-5 w-5 mr-2 text-pink-400" />
            Garten Felder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {gardenFields.map((field) => {
              const isNextToUnlock = !field.isUnlocked && 
                gardenFields.filter(f => f.isUnlocked).length === field.id - 1;
              
              return (
                <div
                  key={field.id}
                  className={`
                    aspect-square border-2 rounded-lg relative flex items-center justify-center cursor-pointer transition-all
                    ${field.isUnlocked 
                      ? 'border-green-500 bg-green-900/20 hover:bg-green-900/40' 
                      : isNextToUnlock 
                        ? 'border-orange-500 bg-slate-700 hover:bg-slate-600' 
                        : 'border-slate-600 bg-slate-800 opacity-50'
                    }
                  `}
                  style={{
                    backgroundImage: field.isUnlocked ? 'url("/Landschaft/gras.png")' : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                  onClick={() => {
                    if (!field.isUnlocked && isNextToUnlock) {
                      unlockField(field.id);
                    } else if (field.isUnlocked && !field.hasPlant) {
                      openSeedSelection(field.id - 1);
                    } else if (field.isUnlocked && field.hasPlant) {
                      const status = getFieldStatus(field);
                      if (status?.isGrown) {
                        harvestField(field.id - 1);
                      }
                    }
                  }}
                >
                  {/* Harvest Animation */}
                  {harvestingField === field.id - 1 && (
                    <HarvestAnimation 
                      fieldIndex={field.id - 1}
                      onComplete={handleHarvestAnimationComplete}
                    />
                  )}
                  
                  {!field.isUnlocked && (
                    <>
                      <Lock className="h-4 w-4 text-slate-400" />
                      {isNextToUnlock && (
                        <div className="absolute -bottom-6 text-xs text-orange-400">
                          {calculateUnlockCost(field.id)} Cr
                        </div>
                      )}
                    </>
                  )}
                  
                  {field.isUnlocked && field.hasPlant && (() => {
                    const status = getFieldStatus(field);
                    if (status?.isGrown && field.flowerImageUrl) {
                      // Show grown flower with hover preview and tooltip
                      return (
                        <FlowerHoverPreview
                          flowerImageUrl={field.flowerImageUrl}
                          flowerName={field.flowerName || "Unbekannte Blume"}
                          rarity={field.seedRarity as RarityTier}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="cursor-pointer">
                                <RarityImage 
                                  src={field.flowerImageUrl}
                                  alt="Blume"
                                  rarity={field.seedRarity as RarityTier}
                                  size="large"
                                  className="mx-auto w-16 h-16"
                                />
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-800 border-slate-600 text-white">
                                <div className="text-center">
                                  <div className="font-bold text-sm">{field.flowerName}</div>
                                  <div className={`text-xs ${getRarityColor(field.seedRarity as RarityTier)}`}>
                                    {getRarityDisplayName(field.seedRarity as RarityTier)}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FlowerHoverPreview>
                      );
                    } else if (field.isGrowing) {
                      // Show seed image while growing
                      return (
                        <div className="flex flex-col items-center">
                          <RarityImage 
                            src="/Blumen/0.jpg"
                            alt="Wachsender Samen"
                            rarity={field.seedRarity as RarityTier}
                            size="medium"
                            className="mx-auto w-14 h-14"
                          />
                          {status && (
                            <div className="text-xs text-green-400 mt-1">
                              {status.remainingTime}
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      // Fallback to icon
                      return <Flower className="h-6 w-6 text-pink-400" />;
                    }
                  })()}
                  
                  {field.isUnlocked && !field.hasPlant && (
                    <div className="text-xs text-green-400">+</div>
                  )}
                  
                  <div className="absolute top-1 left-1 text-xs text-slate-500">
                    {field.id}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="text-center text-slate-400">
            <p className="mb-2">🌱 Klicke auf ein freies Feld um einen Samen zu pflanzen</p>
            <p className="mb-2">⏰ Hover über wachsende Pflanzen um die Restzeit zu sehen</p>
            <p className="mb-2">🌸 Klicke auf gewachsene Blumen um sie zu ernten</p>
            <p className="mb-2">🔓 Klicke auf ein gesperrtes Feld um es freizuschalten</p>
            <p>💰 Jedes weitere Feld kostet 20% mehr als das vorherige</p>
          </div>
        </CardContent>
      </Card>

      {/* Seed Selection Modal */}
      <SeedSelectionModal
        isOpen={showSeedSelection}
        onClose={() => setShowSeedSelection(false)}
        seeds={userSeeds}
        fieldIndex={selectedFieldIndex}
        onSelectSeed={plantSeed}
      />
    </div>
  );
};