import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { SeedSelectionModal } from "./SeedSelectionModal";
import { BouquetSelectionModal } from "./BouquetSelectionModal";
import { RarityImage } from "./RarityImage";
import { FlowerHoverPreview } from "./FlowerHoverPreview";
import { ButterflyHoverPreview } from "./ButterflyHoverPreview";
import { getGrowthTime, formatTime, getRarityDisplayName, getRarityColor, type RarityTier } from "@shared/rarity";
import { 
  Flower,
  Lock,
  Coins,
  Shovel,
  Sprout,
  Clock,
  Heart,
  Sparkles
} from "lucide-react";
import type { UserBouquet, PlacedBouquet, FieldButterfly } from "@shared/schema";
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
  hasBouquet?: boolean;
  bouquetId?: number;
  bouquetName?: string;
  bouquetPlacedAt?: Date;
  bouquetExpiresAt?: Date;
  hasButterfly?: boolean;
  butterflyId?: number;
  butterflyName?: string;
  butterflyImageUrl?: string;
  butterflyRarity?: string;
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

  // Initialize garden with fields 1,2,11,12 unlocked (indices 0,1,10,11)
  const [gardenFields, setGardenFields] = useState<GardenField[]>(() => {
    const startFields = [1, 2, 11, 12]; // Field IDs that should be unlocked
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      isUnlocked: startFields.includes(i + 1),
      hasPlant: false,
      plantType: undefined
    }));
  });

  const [userSeeds, setUserSeeds] = useState<UserSeed[]>([]);
  const [fieldButterflies, setFieldButterflies] = useState<FieldButterfly[]>([]);
  const [userBouquets, setUserBouquets] = useState<UserBouquet[]>([]);
  const [placedBouquets, setPlacedBouquets] = useState<PlacedBouquet[]>([]);
  const [showSeedSelection, setShowSeedSelection] = useState(false);
  const [showBouquetSelection, setShowBouquetSelection] = useState(false);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [harvestingField, setHarvestingField] = useState<number | null>(null);
  const [harvestedFields, setHarvestedFields] = useState<Set<number>>(new Set());
  const [collectedBouquets, setCollectedBouquets] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user) {
      // Use async function to ensure proper order
      const fetchAllData = async () => {
        await fetchUserSeeds();
        await fetchPlantedFields();
        await fetchUserBouquets();
        await fetchPlacedBouquets();
        await fetchFieldButterflies();
      };
      fetchAllData();
    }
  }, [user]);

  // Auto-refresh butterflies every 10 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchFieldButterflies();
    }, 10000);
    
    return () => clearInterval(interval);
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

  const fetchFieldButterflies = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/${user.id}/field-butterflies`);
      if (response.ok) {
        const data = await response.json();
        setFieldButterflies(data.fieldButterflies || []);
        updateGardenWithFieldButterflies(data.fieldButterflies || []);
      }
    } catch (error) {
      console.error('Failed to fetch field butterflies:', error);
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

  const fetchUserBouquets = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/${user.id}/bouquets`);
      if (response.ok) {
        const data = await response.json();
        setUserBouquets(data.bouquets || []);
      }
    } catch (error) {
      console.error('Failed to fetch user bouquets:', error);
    }
  };

  const fetchPlacedBouquets = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/${user.id}/placed-bouquets`);
      if (response.ok) {
        const data = await response.json();
        setPlacedBouquets(data.placedBouquets || []);
        updateGardenWithPlacedBouquets(data.placedBouquets || []);
      }
    } catch (error) {
      console.error('Failed to fetch placed bouquets:', error);
    }
  };

  const updateGardenWithPlacedBouquets = (placedBouquets: PlacedBouquet[]) => {
    console.log('Updating garden with placed bouquets:', placedBouquets);
    setGardenFields(prev => prev.map(field => {
      const placedBouquet = placedBouquets.find(pb => pb.fieldIndex === field.id - 1);
      if (placedBouquet) {
        return {
          ...field,
          hasBouquet: true,
          bouquetId: placedBouquet.bouquetId,
          bouquetName: (placedBouquet as any).bouquetName || undefined,
          bouquetPlacedAt: new Date(placedBouquet.placedAt),
          bouquetExpiresAt: new Date(placedBouquet.expiresAt)
        };
      } else {
        return {
          ...field,
          hasBouquet: false,
          bouquetId: undefined,
          bouquetName: undefined,
          bouquetPlacedAt: undefined,
          bouquetExpiresAt: undefined
        };
      }
    }));
  };

  const updateGardenWithFieldButterflies = (butterflies: FieldButterfly[]) => {
    console.log('Updating garden with field butterflies:', butterflies);
    setGardenFields(prev => prev.map(field => {
      const butterfly = butterflies.find(bf => bf.fieldIndex === field.id - 1);
      if (butterfly) {
        return {
          ...field,
          hasButterfly: true,
          butterflyId: butterfly.butterflyId,
          butterflyName: butterfly.butterflyName,
          butterflyImageUrl: butterfly.butterflyImageUrl,
          butterflyRarity: butterfly.butterflyRarity
        };
      } else {
        return {
          ...field,
          hasButterfly: false,
          butterflyId: undefined,
          butterflyName: undefined,
          butterflyImageUrl: undefined,
          butterflyRarity: undefined
        };
      }
    }));
  };

  const updateGardenWithPlantedFields = (plantedFields: any[]) => {
    console.log('Updating garden with planted fields:', plantedFields);
    setGardenFields(prev => prev.map(field => {
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
      // Field was harvested or never had a plant - clear only plant data
      if (field.hasPlant) {
        console.log(`Clearing field ${field.id} - was harvested`);
      }
      return {
        ...field,
        hasPlant: false,
        isGrowing: false,
        plantedAt: undefined,
        growthTimeSeconds: undefined,
        seedRarity: undefined,
        flowerId: undefined,
        flowerName: undefined,
        flowerImageUrl: undefined
        // Keep bouquet and butterfly data intact
      };
    }));
    
    console.log('New garden state:', gardenFields.filter(f => f.hasPlant).map(f => `Field ${f.id}: ${f.flowerName}`));
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

  const openBouquetSelection = (fieldIndex: number) => {
    setSelectedFieldIndex(fieldIndex);
    setShowBouquetSelection(true);
  };

  const placeBouquet = async (bouquetId: number, fieldIndex: number) => {
    try {
      const response = await fetch('/api/bouquets/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bouquetId,
          fieldIndex
        })
      });

      if (response.ok) {
        // Refresh data
        await fetchUserBouquets();
        await fetchPlacedBouquets();
      } else {
        const error = await response.json();
        alert(error.message || 'Fehler beim Platzieren');
      }
    } catch (error) {
      console.error('Failed to place bouquet:', error);
      alert('Fehler beim Platzieren');
    }
  };

  const getBouquetStatus = (field: GardenField) => {
    if (!field.hasBouquet || !field.bouquetPlacedAt || !field.bouquetExpiresAt) {
      return null;
    }

    const placedAt = field.bouquetPlacedAt.getTime();
    const expiresAt = field.bouquetExpiresAt.getTime();
    const currentTimeMs = currentTime.getTime();
    const totalDuration = expiresAt - placedAt;
    const elapsed = currentTimeMs - placedAt;
    const remaining = Math.max(0, expiresAt - currentTimeMs);

    return {
      isExpired: remaining === 0,
      remainingTime: formatTime(Math.floor(remaining / 1000)),
      progress: Math.min(100, (elapsed / totalDuration) * 100)
    };
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
        await fetchFieldButterflies();
      } else {
        const error = await response.json();
        alert(error.message || 'Fehler beim Pflanzen');
      }
    } catch (error) {
      console.error('Failed to plant seed:', error);
      alert('Fehler beim Pflanzen');
    }
  };

  const collectButterfly = async (fieldIndex: number) => {
    if (!user) return;

    try {
      console.log(`🦋 Attempting to collect butterfly on field ${fieldIndex}`);
      const response = await fetch('/api/garden/collect-butterfly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldIndex,
        }),
      });

      if (response.ok) {
        // Refresh data
        await fetchFieldButterflies();
        const data = await response.json();
        console.log(`🦋 ${data.message}`);
      } else {
        const error = await response.json();
        // Only log error if it's not a "no butterfly found" message
        if (!error.message.includes('Kein Schmetterling')) {
          console.error('Failed to collect butterfly:', error.message);
        }
      }
    } catch (error) {
      console.error('Failed to collect butterfly:', error);
    }
  };

  const collectExpiredBouquet = async (fieldIndex: number) => {
    if (!user) return;

    try {
      console.log(`💧 Attempting to collect expired bouquet on field ${fieldIndex}`);
      
      // Add visual feedback immediately
      setCollectedBouquets(prev => new Set([...Array.from(prev), fieldIndex]));
      
      const response = await fetch('/api/bouquets/collect-expired', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldIndex,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`💧 ${data.message}`);
        
        // Show beautiful toast with seed information
        if (data.seedDrop) {
          const { rarity, quantity } = data.seedDrop;
          const rarityName = getRarityDisplayName(rarity as RarityTier);
          
          toast.success("Verwelktes Bouquet gesammelt!", {
            description: `Du hast ${quantity}x ${rarityName} Samen erhalten! 🌱`,
            duration: 4000,
            className: "border-l-4 " + getRarityColor(rarity as RarityTier).replace('text-', 'border-l-'),
          });
        }
        
        // Refresh all garden data
        await fetchPlacedBouquets();
        await fetchUserSeeds();
        await fetchFieldButterflies();
        
        // Remove visual feedback after short delay
        setTimeout(() => {
          setCollectedBouquets(prev => {
            const newSet = new Set(prev);
            newSet.delete(fieldIndex);
            return newSet;
          });
        }, 1200);
      } else {
        const error = await response.json();
        // Only log error if it's not a "no expired bouquet" message for debugging
        if (!error.message.includes('Kein verwelktes Bouquet')) {
          console.error('Failed to collect expired bouquet:', error.message);
        }
        // Remove visual feedback on error
        setCollectedBouquets(prev => {
          const newSet = new Set(prev);
          newSet.delete(fieldIndex);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Failed to collect expired bouquet:', error);
      // Remove visual feedback on error
      setCollectedBouquets(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldIndex);
        return newSet;
      });
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
      console.log('Starting harvest for field:', fieldIndex);
      
      // Add visual feedback immediately
      setHarvestedFields(prev => new Set([...Array.from(prev), fieldIndex]));
      
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
        console.log('Blume erfolgreich geerntet!');
        // Refresh data immediately
        await fetchPlantedFields();
        // Remove visual feedback after short delay
        setTimeout(() => {
          setHarvestedFields(prev => {
            const newSet = new Set(prev);
            newSet.delete(fieldIndex);
            return newSet;
          });
        }, 800);
      } else {
        const error = await response.json();
        alert(error.message || 'Fehler beim Ernten');
        // Remove visual feedback on error
        setHarvestedFields(prev => {
          const newSet = new Set(prev);
          newSet.delete(fieldIndex);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Failed to harvest:', error);
      alert('Fehler beim Ernten');
      // Remove visual feedback on error
      setHarvestedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldIndex);
        return newSet;
      });
    }
  };


  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-full">
      {/* Enhanced Garden Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-2xl blur-xl"></div>
        <div className="relative bg-gradient-to-r from-slate-800/80 to-slate-900/80 p-8 rounded-2xl border border-green-500/30 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Flower className="h-12 w-12 mr-4 text-green-400 animate-pulse" />
              <div className="absolute inset-0 h-12 w-12 mr-4 text-green-400 animate-ping opacity-20"></div>
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-green-300 via-emerald-300 to-teal-300 bg-clip-text text-transparent">
                Mariposa Garten 🌱
              </h1>
            </div>
          </div>
          <p className="text-slate-300 text-xl">Züchte wunderschöne Blumen für deine Schmetterlinge</p>
        </div>
      </div>

      {/* Enhanced Garden Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-800/40 to-emerald-800/40 border-2 border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:scale-105 shadow-xl group">
          <CardHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-t-lg -mx-6 -my-2"></div>
            <div className="relative flex flex-row items-center justify-between space-y-0 pb-2 z-10">
              <CardTitle className="text-lg font-bold text-green-300">
                Freigeschaltete Felder
              </CardTitle>
              <div className="relative">
                <Shovel className="h-8 w-8 text-green-400 group-hover:animate-pulse" />
                <div className="absolute inset-0 h-8 w-8 text-green-400 animate-ping opacity-20"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-400 mb-2">
              {gardenFields.filter(f => f.isUnlocked).length}/50
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300" style={{width: `${(gardenFields.filter(f => f.isUnlocked).length / 50) * 100}%`}}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-800/40 to-rose-800/40 border-2 border-pink-500/30 hover:border-pink-400/50 transition-all duration-300 hover:scale-105 shadow-xl group">
          <CardHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-t-lg -mx-6 -my-2"></div>
            <div className="relative flex flex-row items-center justify-between space-y-0 pb-2 z-10">
              <CardTitle className="text-lg font-bold text-pink-300">
                Gepflanzte Blumen
              </CardTitle>
              <div className="relative">
                <Flower className="h-8 w-8 text-pink-400 group-hover:animate-pulse" />
                <div className="absolute inset-0 h-8 w-8 text-pink-400 animate-ping opacity-20"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-pink-400 mb-2">
              {gardenFields.filter(f => f.hasPlant).length}
            </div>
            <div className="text-slate-400 text-sm">🌸 Aktive Blumen</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-800/40 to-yellow-800/40 border-2 border-orange-500/30 hover:border-orange-400/50 transition-all duration-300 hover:scale-105 shadow-xl group">
          <CardHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-t-lg -mx-6 -my-2"></div>
            <div className="relative flex flex-row items-center justify-between space-y-0 pb-2 z-10">
              <CardTitle className="text-lg font-bold text-orange-300">
                Credits
              </CardTitle>
              <div className="relative">
                <Coins className="h-8 w-8 text-orange-400 group-hover:animate-pulse" />
                <div className="absolute inset-0 h-8 w-8 text-orange-400 animate-ping opacity-20"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-400 mb-2">{credits} Cr</div>
            <div className="text-slate-400 text-sm">💰 Verfügbares Geld</div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Garden Grid */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-green-500/30 shadow-2xl">
        <CardHeader className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-t-lg -mx-6 -my-2"></div>
          <CardTitle className="text-white flex items-center relative z-10">
            <div className="relative">
              <Sprout className="h-8 w-8 mr-3 text-green-400 animate-pulse" />
              <div className="absolute inset-0 h-8 w-8 mr-3 text-green-400 animate-ping opacity-30"></div>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">
              Garten Felder 🌿
            </span>
          </CardTitle>
          <div className="text-slate-400 mt-2 relative z-10">
            <p className="flex items-center">
              <span className="mr-4">📋 Links-klick: Samen pflanzen</span>
              <span>🌈 Rechts-klick: Bouquet platzieren</span>
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {gardenFields.map((field) => {
              // Check if field is adjacent to any unlocked field
              const isNextToUnlock = !field.isUnlocked && (() => {
                const row = Math.floor((field.id - 1) / 10);
                const col = (field.id - 1) % 10;
                
                // Check all 8 adjacent positions (including diagonals)
                const adjacent = [
                  { r: row - 1, c: col - 1 }, { r: row - 1, c: col }, { r: row - 1, c: col + 1 },
                  { r: row, c: col - 1 },                             { r: row, c: col + 1 },
                  { r: row + 1, c: col - 1 }, { r: row + 1, c: col }, { r: row + 1, c: col + 1 }
                ];
                
                return adjacent.some(pos => {
                  if (pos.r < 0 || pos.r >= 5 || pos.c < 0 || pos.c >= 10) return false;
                  const adjacentFieldId = pos.r * 10 + pos.c + 1;
                  const adjacentField = gardenFields.find(f => f.id === adjacentFieldId);
                  return adjacentField?.isUnlocked;
                });
              })();
              
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
                    } else if (field.hasButterfly) {
                      collectButterfly(field.id - 1);
                    } else if (field.isUnlocked && !field.hasPlant && !field.hasBouquet && !field.hasButterfly) {
                      openSeedSelection(field.id - 1);
                    } else if (field.isUnlocked && field.hasPlant) {
                      const status = getFieldStatus(field);
                      if (status?.isGrown) {
                        harvestField(field.id - 1);
                      }
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault(); // Prevent default context menu
                    if (field.isUnlocked && !field.hasPlant && !field.hasBouquet && !field.hasButterfly) {
                      openBouquetSelection(field.id - 1);
                    }
                  }}
                >
                  {/* Harvest Visual Feedback */}
                  {harvestedFields.has(field.id - 1) && (
                    <div className="absolute inset-0 bg-green-400/30 rounded-lg flex items-center justify-center z-10">
                      <div className="text-white font-bold text-lg animate-pulse">
                        +1 Blume!
                      </div>
                    </div>
                  )}
                  
                  {collectedBouquets.has(field.id - 1) && (
                    <div className="absolute inset-0 bg-yellow-400/30 rounded-lg flex items-center justify-center z-10">
                      <div className="text-white font-bold text-sm animate-pulse text-center">
                        +3 Samen<br/>erhalten!
                      </div>
                    </div>
                  )}
                  
                  {!field.isUnlocked && (
                    <>
                      <Lock className="h-4 w-4 text-slate-400" />
                      {isNextToUnlock && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-orange-400 font-bold">
                          {calculateUnlockCost(field.id)} Cr
                        </div>
                      )}
                    </>
                  )}
                  
                  {field.isUnlocked && field.hasPlant && !harvestedFields.has(field.id - 1) && (() => {
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
                            <div className="bg-green-500/20 border border-green-400 rounded-lg px-2 py-1 mt-2">
                              <div className="text-base font-bold text-green-300 text-center animate-pulse">
                                ⏱️ {status.remainingTime}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      // Fallback to icon
                      return <Flower className="h-6 w-6 text-pink-400" />;
                    }
                  })()}

                  {/* Bouquet Display */}
                  {field.isUnlocked && field.hasBouquet && (() => {
                    const bouquetStatus = getBouquetStatus(field);
                    return (
                      <div className="flex flex-col items-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger 
                              className={bouquetStatus?.isExpired ? "cursor-pointer" : "cursor-default"}
                              onClick={() => bouquetStatus?.isExpired && collectExpiredBouquet(field.id - 1)}
                            >
                              <div className="relative">
                                <RarityImage 
                                  src="/Blumen/Bouquet.jpg"
                                  alt="Bouquet"
                                  rarity={(() => {
                                    const placedBouquet = placedBouquets.find(b => b.fieldIndex === (field.id - 1));
                                    return (placedBouquet?.bouquetRarity || "common") as RarityTier;
                                  })()}
                                  size="large"
                                  className="mx-auto w-16 h-16"
                                />
                                <Heart className="absolute -top-1 -right-1 h-4 w-4 text-pink-400" />
                                {bouquetStatus?.isExpired && (
                                  <div className="absolute inset-0 bg-gray-800/70 rounded-lg flex items-center justify-center">
                                    <Sparkles className="h-6 w-6 text-yellow-400" />
                                  </div>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-800 border-slate-600 text-white">
                              <div className="text-center">
                                <div className="font-bold text-sm">{field.bouquetName || `Bouquet #${field.bouquetId}`}</div>
                                {bouquetStatus && (
                                  <div className={`text-sm font-semibold ${
                                    bouquetStatus.isExpired 
                                      ? 'text-orange-300 animate-bounce' 
                                      : 'text-pink-300'
                                  }`}>
                                    {bouquetStatus.isExpired ? "🥀 Verwelkt - klicke zum Sammeln" : `💐 ${bouquetStatus.remainingTime}`}
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {bouquetStatus && !bouquetStatus.isExpired && (
                          <div className="bg-pink-500/20 border border-pink-400 rounded-lg px-2 py-1 mt-2">
                            <div className="text-base font-bold text-pink-300 text-center animate-pulse">
                              💐 {bouquetStatus.remainingTime}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Butterfly Display */}
                  {field.isUnlocked && field.hasButterfly && (
                    <div className="flex flex-col items-center">
                      <ButterflyHoverPreview
                        butterflyImageUrl={field.butterflyImageUrl || "/Schmetterlinge/001.jpg"}
                        butterflyName={field.butterflyName || "Schmetterling"}
                        rarity={field.butterflyRarity as RarityTier || "common"}
                      >
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger 
                              className="cursor-pointer"
                              onClick={() => collectButterfly(field.id - 1)}
                            >
                              <div className="relative">
                                <RarityImage 
                                  src={field.butterflyImageUrl || "/Schmetterlinge/001.jpg"}
                                  alt="Schmetterling"
                                  rarity={field.butterflyRarity as RarityTier || "common"}
                                  size="large"
                                  className="mx-auto w-16 h-16 animate-pulse"
                                />
                                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-orange-400 animate-pulse" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-800 border-slate-600 text-white">
                              <div className="text-center">
                                <div className="font-bold text-sm">{field.butterflyName}</div>
                                <div className={`text-xs ${getRarityColor(field.butterflyRarity as RarityTier || "common")}`}>
                                  {getRarityDisplayName(field.butterflyRarity as RarityTier || "common")}
                                </div>
                                <div className="text-xs text-orange-400 mt-1">Klicke zum Sammeln</div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </ButterflyHoverPreview>
                    </div>
                  )}
                  
                  {field.isUnlocked && !field.hasPlant && !field.hasBouquet && !field.hasButterfly && (
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
            <p className="mb-2">🌱 Linksklick auf ein freies Feld um einen Samen zu pflanzen</p>
            <p className="mb-2">💐 Rechtsklick auf ein freies Feld um ein Bouquet zu platzieren</p>
            <p className="mb-2">⏰ Hover über wachsende Pflanzen um die Restzeit zu sehen</p>
            <p className="mb-2">🌸 Klicke auf gewachsene Blumen um sie zu ernten</p>
            <p className="mb-2">🦋 Klicke auf Schmetterlinge um sie zu sammeln</p>
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

      {/* Bouquet Selection Modal */}
      <BouquetSelectionModal
        isOpen={showBouquetSelection}
        onClose={() => setShowBouquetSelection(false)}
        fieldIndex={selectedFieldIndex}
        userBouquets={userBouquets}
        onPlaceBouquet={placeBouquet}
      />
    </div>
  );
};