import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/stores/useAuth";
import { useNotification } from "../hooks/useNotification";
import { useCredits } from "@/lib/stores/useCredits";
import { useSuns } from "@/lib/stores/useSuns";
import { useSunSpawns } from "@/lib/stores/useSunSpawns";
import { SeedSelectionModal } from "./SeedSelectionModal";
import { SeedRewardDialog } from "./SeedRewardDialog";
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
  Sparkles,
  Sun
} from "lucide-react";
import type { UserBouquet, PlacedBouquet, FieldButterfly } from "@shared/schema";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpButton } from "./HelpButton";

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
  bouquetRarity?: string;
  bouquetPlacedAt?: Date;
  bouquetExpiresAt?: Date;
  hasButterfly?: boolean;
  butterflyId?: number;
  butterflyName?: string;
  butterflyImageUrl?: string;
  butterflyRarity?: string;
  hasSunSpawn?: boolean;
  sunSpawnAmount?: number;
  sunSpawnExpiresAt?: Date;
}

interface UserSeed {
  id: number;
  seedId: number;
  seedName: string;
  seedRarity: string;
  quantity: number;
}

// Calculate background position for panoramic garden image
// 50 fields in 10x5 grid from one 2:1 ratio image (Gardenview.png)
const getBackgroundPosition = (fieldIndex: number) => {
  const column = fieldIndex % 10; // 0-9 columns
  const row = Math.floor(fieldIndex / 10); // 0-4 rows
  
  // With backgroundSize 1000% 500%, the image is scaled 10x wider and 5x taller
  // To show each segment, we need to move the image by full container sizes
  // Each horizontal segment = move image left by 100% of container width
  // Each vertical segment = move image up by 100% of container height
  const posX = -(column * 100); // 0%, -100%, -200%, ..., -900%
  const posY = -(row * 100); // 0%, -100%, -200%, -300%, -400%
  
  return `${posX}% ${posY}%`;
};

export const GardenView: React.FC = () => {
  const { user } = useAuth();
  const { credits, updateCredits } = useCredits();
  const { suns, setSuns } = useSuns();
  const { sunSpawns, setSunSpawns, removeSunSpawn, getSunSpawnOnField, setLoading } = useSunSpawns();
  const { showNotification } = useNotification();

  // Initialize garden fields (will be populated from backend)
  const [gardenFields, setGardenFields] = useState<GardenField[]>(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      isUnlocked: false, // Will be loaded from backend
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
  const [showButterflyModal, setShowButterflyModal] = useState(false);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number>(0);
  const [userButterflies, setUserButterflies] = useState<UserButterfly[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [harvestingField, setHarvestingField] = useState<number | null>(null);
  const [harvestedFields, setHarvestedFields] = useState<Set<number>>(new Set());
  const [collectedBouquets, setCollectedBouquets] = useState<Set<number>>(new Set());
  const [collectedSuns, setCollectedSuns] = useState<Set<number>>(new Set());
  const [bouquetSeedDrops, setBouquetSeedDrops] = useState<Record<number, {quantity: number, rarity: string}>>({});
  const [touchStart, setTouchStart] = useState<{fieldIndex: number, timer: NodeJS.Timeout} | null>(null);
  
  // Seed Reward Dialog State
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  const [rewardData, setRewardData] = useState<{quantity: number; rarity: string} | null>(null);

  useEffect(() => {
    if (user) {
      // Use async function to ensure proper order
      const fetchAllData = async () => {
        await fetchUnlockedFields(); // Load unlocked fields first
        await fetchUserSeeds();
        await fetchPlantedFields();
        await fetchUserBouquets();
        await fetchPlacedBouquets();
        await fetchFieldButterflies();
        await fetchSunSpawns();
        await fetchUserButterflies();
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

  // Auto-refresh sun spawns every 10 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchSunSpawns();
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

  const fetchUserButterflies = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/${user.id}/butterflies`);
      if (response.ok) {
        const data = await response.json();
        setUserButterflies(data.butterflies || []);
      }
    } catch (error) {
      console.error('Failed to fetch user butterflies:', error);
    }
  };

  const fetchUnlockedFields = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/${user.id}/unlocked-fields`);
      if (response.ok) {
        const data = await response.json();
        const unlockedIndices = new Set(data.unlockedFields.map((field: any) => field.fieldIndex));
        
        // Update garden fields with unlocked status
        setGardenFields(prev => prev.map(field => ({
          ...field,
          isUnlocked: unlockedIndices.has(field.id - 1) // Convert field ID to index
        })));
      }
    } catch (error) {
      console.error('Failed to fetch unlocked fields:', error);
    }
  };

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

  const fetchSunSpawns = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/garden/sun-spawns', {
        headers: {
          'x-user-id': user.id.toString()
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSunSpawns(data.sunSpawns || []);
        updateGardenWithSunSpawns(data.sunSpawns || []);
      }
    } catch (error) {
      console.error('Failed to fetch sun spawns:', error);
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
          bouquetRarity: (placedBouquet as any).bouquetRarity || "common",
          bouquetPlacedAt: new Date(placedBouquet.placedAt),
          bouquetExpiresAt: new Date(placedBouquet.expiresAt)
        };
      } else {
        return {
          ...field,
          hasBouquet: false,
          bouquetId: undefined,
          bouquetName: undefined,
          bouquetRarity: undefined,
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

  const updateGardenWithSunSpawns = (spawns: any[]) => {
    console.log('Updating garden with sun spawns:', spawns);
    setGardenFields(prev => prev.map(field => {
      const sunSpawn = spawns.find(spawn => spawn.fieldIndex === field.id - 1 && spawn.isActive);
      if (sunSpawn && new Date(sunSpawn.expiresAt) > new Date()) {
        return {
          ...field,
          hasSunSpawn: true,
          sunSpawnAmount: sunSpawn.sunAmount,
          sunSpawnExpiresAt: new Date(sunSpawn.expiresAt)
        };
      } else {
        return {
          ...field,
          hasSunSpawn: false,
          sunSpawnAmount: undefined,
          sunSpawnExpiresAt: undefined
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
    // Count unlocked fields excluding the 4 starter fields (1, 2, 11, 12)
    const starterFields = [1, 2, 11, 12];
    const unlockedCount = gardenFields.filter(f => f.isUnlocked && !starterFields.includes(f.id)).length;
    return Math.round(1000 * Math.pow(1.2, unlockedCount));
  };

  const unlockField = async (fieldId: number) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/user/${user.id}/unlock-field`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldIndex: fieldId - 1 // Convert field ID to index
        }),
      });

      if (response.ok) {
        // Refresh unlocked fields and update UI properly without page reload
        await fetchUnlockedFields();
        // Calculate and subtract the cost from current credits
        const cost = calculateUnlockCost(fieldId);
        updateCredits(credits - cost);
        showNotification('Feld freigeschaltet!', `Du hast Feld ${fieldId} für ${cost} Credits freigeschaltet.`, 'success');
      } else {
        const errorData = await response.json();
        showNotification(errorData.error || 'Fehler beim Freischalten des Feldes', 'error');
      }
    } catch (error) {
      console.error('Failed to unlock field:', error);
      showNotification('Fehler beim Freischalten des Feldes', 'error');
    }
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
          'Content-Type': 'application/json',
          'X-User-Id': user?.id.toString() || '1'
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
        showNotification(error.message || 'Fehler beim Platzieren', 'error');
      }
    } catch (error) {
      console.error('Failed to place bouquet:', error);
      showNotification('Fehler beim Platzieren', 'error');
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
          'Content-Type': 'application/json',
          'X-User-Id': user?.id.toString() || '1'
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
        showNotification(error.message || 'Fehler beim Pflanzen', 'error');
      }
    } catch (error) {
      console.error('Failed to plant seed:', error);
      showNotification('Fehler beim Pflanzen', 'error');
    }
  };

  const collectSun = async (fieldIndex: number) => {
    try {
      console.log('Starting sun collection for field:', fieldIndex);
      
      // Add visual feedback immediately
      setCollectedSuns(prev => new Set([...Array.from(prev), fieldIndex]));
      
      const response = await fetch('/api/garden/collect-sun', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id.toString() || '1'
        },
        body: JSON.stringify({
          fieldIndex,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Sun collected successfully!', data);
        
        // Update suns count
        setSuns(suns + data.sunAmount);
        
        // Remove sun spawn from local state
        removeSunSpawn(fieldIndex);
        
        // Refresh sun spawns data
        await fetchSunSpawns();
        
        // Animate collection
        setCollectedSuns(prev => new Set(prev).add(fieldIndex));
        
        // Remove visual feedback after short delay
        setTimeout(() => {
          setCollectedSuns(prev => {
            const newSet = new Set(prev);
            newSet.delete(fieldIndex);
            return newSet;
          });
        }, 800);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Fehler beim Einsammeln der Sonne');
        // Remove visual feedback on error
        setCollectedSuns(prev => {
          const newSet = new Set(prev);
          newSet.delete(fieldIndex);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Failed to collect sun:', error);
      toast.error('Fehler beim Einsammeln der Sonne');
      // Remove visual feedback on error
      setCollectedSuns(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldIndex);
        return newSet;
      });
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
          'X-User-Id': user?.id.toString() || '1'
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
          'X-User-Id': user?.id.toString() || '1'
        },
        body: JSON.stringify({
          fieldIndex,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Removed console.log to prevent duplicate notification display
        
        // Show beautiful seed reward dialog
        if (data.seedDrop) {
          const { rarity, quantity } = data.seedDrop;
          
          // Show the reward dialog
          setRewardData({ quantity, rarity });
          setIsRewardDialogOpen(true);
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
          setBouquetSeedDrops(prev => {
            const newDrops = { ...prev };
            delete newDrops[fieldIndex];
            return newDrops;
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
          'Content-Type': 'application/json',
          'X-User-Id': user?.id.toString() || '1'
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
        showNotification(error.message || 'Fehler beim Ernten', 'error');
        // Remove visual feedback on error
        setHarvestedFields(prev => {
          const newSet = new Set(prev);
          newSet.delete(fieldIndex);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Failed to harvest:', error);
      showNotification('Fehler beim Ernten', 'error');
      // Remove visual feedback on error
      setHarvestedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldIndex);
        return newSet;
      });
    }
  };

  const placeButterflyOnField = async (butterflyId: number) => {
    if (!user) return;

    try {
      console.log(`🦋 Placing butterfly ${butterflyId} on field ${selectedFieldIndex} for user ${user.id}`);
      
      const response = await fetch('/api/garden/place-butterfly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          fieldIndex: selectedFieldIndex - 1, // Convert 1-based to 0-based index
          butterflyId: butterflyId
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🦋 Butterfly placed successfully!', data.message);
        
        // Refresh data to show the placed butterfly
        await fetchFieldButterflies();
        await fetchUserButterflies();
        
        showNotification('Schmetterling platziert!', data.message, 'success');
      } else {
        const error = await response.json();
        showNotification('Fehler beim Platzieren', error.message || 'Schmetterling konnte nicht platziert werden.', 'error');
      }
    } catch (error) {
      console.error('Failed to place butterfly:', error);
      showNotification('Fehler beim Platzieren', 'Fehler beim Platzieren des Schmetterlings.', 'error');
    }

    setShowButterflyModal(false);
  };


  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-full">
      {/* Garden Header with Stats */}
      <div className="bg-slate-800/60 p-6 rounded-lg border border-green-500/30">
        {/* Title Section */}
        <div className="relative mb-4">
          {/* HelpButton in absoluter Position rechts oben */}
          <div className="absolute top-0 right-0">
            <HelpButton helpText="Im Mariposa Garten pflanzt du Samen, lässt sie wachsen und erstellst Bouquets für deine Schmetterlinge. Links-Klick auf Felder für Samen pflanzen, Rechts-Klick für Bouquets platzieren. Sammle die goldenen Sonnen!" viewType="garden" />
          </div>
          
          {/* Zentrierter Content */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-green-300 mb-1">
              Mariposa Garten 🌱
            </h1>
            <p className="text-slate-400 text-sm">Züchte Blumen für deine Schmetterlinge</p>
          </div>
        </div>
        
        {/* Compact Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-800/40 to-emerald-800/40 border border-green-500/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Shovel className="h-3 w-3 text-green-400 mr-1" />
              <span className="text-xs font-semibold text-green-300">Felder</span>
            </div>
            <div className="text-lg font-bold text-green-400 mb-1">
              {gardenFields.filter(f => f.isUnlocked).length}/50
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1">
              <div className="bg-green-500 h-1 rounded-full" style={{width: `${(gardenFields.filter(f => f.isUnlocked).length / 50) * 100}%`}}></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-800/40 to-rose-800/40 border border-pink-500/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Flower className="h-3 w-3 text-pink-400 mr-1" />
              <span className="text-xs font-semibold text-pink-300">Blumen</span>
            </div>
            <div className="text-lg font-bold text-pink-400">
              {gardenFields.filter(f => f.hasPlant).length}
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-800/40 to-yellow-800/40 border border-orange-500/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Coins className="h-3 w-3 text-orange-400 mr-1" />
              <span className="text-xs font-semibold text-orange-300">Credits</span>
            </div>
            <div className="text-lg font-bold text-orange-400">{credits} Cr</div>
          </div>
        </div>
      </div>

      {/* Compact Garden Grid */}
      <Card className="bg-slate-800 border border-green-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center">
              <Sprout className="h-5 w-5 mr-2 text-green-400" />
              <span className="text-lg font-semibold">Garten Felder 🌿</span>
            </div>
            <div className="text-xs text-slate-400">
              Links: Samen • Rechts: Bouquet
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Panorama Background Container */}
          <div className="relative">
            {/* Panorama Background Layer */}
            <div 
              className="absolute inset-0 rounded-lg overflow-hidden opacity-60"
              style={{
                backgroundImage: 'url("/Landschaft/Gardenview.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: 0
              }}
            />
            {/* Garden Grid with transparent backgrounds */}
            <div className="relative z-10 grid grid-cols-5 sm:grid-cols-10 gap-1 sm:gap-2 garden-grid-mobile sm:garden-grid-desktop">
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
                    aspect-square border-2 rounded-lg relative flex items-center justify-center cursor-pointer transition-all touch-target
                    ${field.isUnlocked 
                      ? 'border-green-500 bg-green-900/20 hover:bg-green-900/40 active:bg-green-900/60' 
                      : isNextToUnlock 
                        ? 'border-orange-500 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 opacity-50' 
                        : 'border-slate-600 bg-slate-800 opacity-40'
                    }
                  `}
                  style={{
                    backgroundColor: field.isUnlocked 
                      ? 'rgba(34, 197, 94, 0.1)' // Transparent green for unlocked
                      : isNextToUnlock 
                        ? 'rgba(249, 115, 22, 0.2)' // Transparent orange for next to unlock
                        : 'rgba(51, 65, 85, 0.3)', // Transparent slate for locked
                    minHeight: '44px',
                    minWidth: '44px'
                  }}
                  onClick={() => {
                    if (!field.isUnlocked && isNextToUnlock) {
                      unlockField(field.id);
                    } else if (field.hasSunSpawn) {
                      collectSun(field.id - 1);
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
                  onTouchStart={(e) => {
                    // Clear any existing touch timer
                    if (touchStart) {
                      clearTimeout(touchStart.timer);
                    }
                    
                    // Set up long press detection
                    if (field.isUnlocked && !field.hasPlant && !field.hasBouquet && !field.hasButterfly) {
                      const timer = setTimeout(() => {
                        // Long press detected - open bouquet selection
                        openBouquetSelection(field.id - 1);
                        setTouchStart(null);
                      }, 500); // 500ms long press
                      
                      setTouchStart({ fieldIndex: field.id - 1, timer });
                    }
                  }}
                  onTouchEnd={() => {
                    // Clear long press timer on touch end
                    if (touchStart) {
                      clearTimeout(touchStart.timer);
                      setTouchStart(null);
                    }
                  }}
                  onTouchCancel={() => {
                    // Clear long press timer on touch cancel
                    if (touchStart) {
                      clearTimeout(touchStart.timer);
                      setTouchStart(null);
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
                  
                  {/* Visual seed notification removed - user requested no more seed notifications */}
                  
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
                              <TooltipTrigger className="cursor-pointer w-full h-full">
                                <RarityImage 
                                  src={field.flowerImageUrl}
                                  alt="Blume"
                                  rarity={field.seedRarity as RarityTier}
                                  size="large"
                                  className="field-image"
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
                      // Show seed image while growing with animated scaling
                      const getGrowthScale = () => {
                        if (!status) return 0.3;
                        
                        // Get growth duration based on rarity
                        const growthDurations = {
                          common: 75,
                          uncommon: 120,
                          rare: 180,
                          'super-rare': 300,
                          epic: 450,
                          legendary: 540,
                          mythical: 600
                        };
                        
                        const totalDuration = growthDurations[field.seedRarity as keyof typeof growthDurations] || 75;
                        
                        // Calculate remaining seconds from time string (MM:SS format)
                        const parts = status.remainingTime.split(':');
                        const remainingSeconds = parts.length === 2 
                          ? parseInt(parts[0]) * 60 + parseInt(parts[1]) 
                          : 0;
                        
                        const elapsed = totalDuration - remainingSeconds;
                        const progress = Math.max(0, Math.min(1, elapsed / totalDuration));
                        
                        // Scale from 30% to 100%
                        return 0.3 + (0.7 * progress);
                      };
                      
                      const scale = getGrowthScale();
                      
                      return (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <div 
                            className="transition-transform duration-1000 ease-out"
                            style={{ transform: `scale(${scale})` }}
                          >
                            <RarityImage 
                              src="/Blumen/0.jpg"
                              alt="Wachsender Samen"
                              rarity={field.seedRarity as RarityTier}
                              size="medium"
                              className="field-image"
                            />
                          </div>
                          {status && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="bg-green-500/80 border border-green-400 rounded-lg px-2 py-1 backdrop-blur-sm">
                                <div className="text-xs font-bold text-white text-center animate-pulse">
                                  ⏱️ {status.remainingTime}
                                </div>
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
                      <div className="relative w-full h-full">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger 
                              className={`w-full h-full ${bouquetStatus?.isExpired ? "cursor-pointer" : "cursor-default"}`}
                              onClick={() => bouquetStatus?.isExpired && collectExpiredBouquet(field.id - 1)}
                            >
                              <div className="relative w-full h-full">
                                <RarityImage 
                                  src="/Blumen/Bouquet.jpg"
                                  alt="Bouquet"
                                  rarity={(field.bouquetRarity as RarityTier) || "common"}
                                  size="large"
                                  className="field-image"
                                />
                                <Heart className="absolute top-2 right-2 h-4 w-4 text-pink-400" />
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
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-pink-500/80 border border-pink-400 rounded-lg px-2 py-1 backdrop-blur-sm">
                              <div className="text-xs font-bold text-white text-center animate-pulse">
                                💐 {bouquetStatus.remainingTime}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Butterfly Display */}
                  {field.isUnlocked && field.hasButterfly && (
                    <div className="relative w-full h-full">
                      <ButterflyHoverPreview
                        butterflyImageUrl={field.butterflyImageUrl || "/Schmetterlinge/001.jpg"}
                        butterflyName={field.butterflyName || "Schmetterling"}
                        rarity={field.butterflyRarity as RarityTier || "common"}
                      >
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger 
                              className="cursor-pointer w-full h-full"
                              onClick={() => collectButterfly(field.id - 1)}
                            >
                              <div className="relative w-full h-full">
                                <RarityImage 
                                  src={field.butterflyImageUrl || "/Schmetterlinge/001.jpg"}
                                  alt="Schmetterling"
                                  rarity={field.butterflyRarity as RarityTier || "common"}
                                  size="large"
                                  className="field-image animate-pulse"
                                />
                                <Sparkles className="absolute top-2 right-2 h-4 w-4 text-orange-400 animate-pulse" />
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

                  {/* Sun Spawn Display */}
                  {field.hasSunSpawn && (
                    <div 
                      className="absolute inset-0 pointer-events-auto" 
                      style={{
                        zIndex: 9999,
                        transform: 'translateZ(0)', // Force new stacking context
                      }}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="cursor-pointer w-full h-full">
                            <div 
                              className={`relative w-full h-full flex items-center justify-center rounded-lg transition-all duration-300 ${collectedSuns.has(field.id - 1) ? 'scale-75 opacity-30' : 'hover:scale-110 animate-bounce'}`}
                              style={{
                                background: '#ffd700',
                                border: '3px solid #ffed4e',
                                boxShadow: '0 0 20px #ffd700, 0 0 40px #ffd700, 0 0 60px #ffd700',
                                opacity: '1 !important'
                              }}
                            >
                              <Sun 
                                className="w-full h-full max-w-16 max-h-16 animate-spin" 
                                style={{
                                  animationDuration: '3s',
                                  color: '#ffffff',
                                  opacity: '1 !important'
                                }} 
                              />
                              <Sparkles 
                                className="absolute top-1 right-1 h-6 w-6 text-white animate-pulse" 
                                style={{opacity: 1}}
                              />
                              <div 
                                className="absolute inset-0 rounded-lg animate-ping opacity-75"
                                style={{background: 'radial-gradient(circle, transparent 40%, rgba(255,215,0,0.4) 70%)'}}
                              ></div>
                              <div 
                                className="absolute bottom-0 left-0 right-0 text-xs font-bold text-black px-1 py-1 rounded-b-lg text-center"
                                style={{
                                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,215,0,0.9))',
                                  borderTop: '2px solid white'
                                }}
                              >
                                {field.sunSpawnAmount}☀️
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-800 border-slate-600 text-yellow-300">
                            <div className="text-center">
                              <div className="font-bold text-sm">☀️ Sonne</div>
                              <div className="text-xs">
                                {field.sunSpawnAmount || 1} Sonnen sammeln
                              </div>
                              <div className="text-xs text-orange-400 mt-1">Klicke zum Sammeln</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                  
                  {field.isUnlocked && !field.hasPlant && !field.hasBouquet && !field.hasButterfly && !field.hasSunSpawn && (
                    <div className="text-xs text-green-400">+</div>
                  )}
                  
                  <div className="absolute top-1 left-1 text-xs text-slate-500">
                    {field.id}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact Instructions */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-3">
          <div className="text-center text-slate-400 text-xs space-y-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs">
              <span>🌱 Linksklick: Samen pflanzen</span>
              <span>💐 Rechtsklick: Bouquet platzieren</span>
              <span>🌸 Gewachsene Blumen ernten</span>
              <span>🦋 Schmetterlinge sammeln</span>
            </div>
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

      {/* Seed Reward Dialog */}
      <SeedRewardDialog
        isOpen={isRewardDialogOpen}
        onClose={() => setIsRewardDialogOpen(false)}
        quantity={rewardData?.quantity || 0}
        rarity={rewardData?.rarity || 'common'}
      />
    </div>
  );
};