import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/stores/useAuth";
import { useNotification } from "../hooks/useNotification";
import { useCredits } from "@/lib/stores/useCredits";
import { useSuns } from "@/lib/stores/useSuns";
import { useSunSpawns } from "@/lib/stores/useSunSpawns";
import { SeedSelectionModal } from "./SeedSelectionModal";
import { BouquetSelectionModal } from "./BouquetSelectionModal";
import { FlowerSelectionModal } from "./FlowerSelectionModal";
import { FishSelectionModal } from "./FishSelectionModal";
import { FeedingDialog } from "./FeedingDialog";
import { FishRewardDialog } from "./FishRewardDialog";
import { RarityImage } from "./RarityImage";
import { FlowerHoverPreview } from "./FlowerHoverPreview";
import { FishHoverPreview } from "./FishHoverPreview";
import { CaterpillarHoverPreview } from "./CaterpillarHoverPreview";
import { getGrowthTime, formatTime, getRarityDisplayName, getRarityColor, calculateCaterpillarRarity, generateLatinCaterpillarName, type RarityTier } from "@shared/rarity";
import { 
  Flower,
  Lock,
  Coins,
  Shovel,
  Sprout,
  Clock,
  Heart,
  Sparkles,
  Sun,
  Waves
} from "lucide-react";
import type { UserBouquet, PlacedBouquet, FieldFish } from "@shared/schema";
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
  hasFlower?: boolean;
  fieldFlowerId?: number;
  fieldFlowerName?: string;
  fieldFlowerImageUrl?: string;
  fieldFlowerRarity?: string;
  hasFish?: boolean;
  fishId?: number;
  fishName?: string;
  fishImageUrl?: string;
  fishRarity?: string;
  hasCaterpillar?: boolean;
  caterpillarId?: number;
  caterpillarName?: string;
  caterpillarImageUrl?: string;
  caterpillarRarity?: string;
  caterpillarSpawnedAt?: Date;
  hasSunSpawn?: boolean;
  sunSpawnAmount?: number;
  sunSpawnExpiresAt?: Date;
  isPond?: boolean;
  unlocksAt?: number;
  cost?: number;
}

export function TeichView() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { credits, updateCredits } = useCredits();
  const { addSuns } = useSuns();
  const { removeSunSpawn } = useSunSpawns();

  // State management
  const [gardenFields, setGardenFields] = useState<GardenField[]>([]);
  const [userCaterpillars, setUserCaterpillars] = useState<any[]>([]);
  const [fieldCaterpillars, setFieldCaterpillars] = useState<any[]>([]);
  const [pondProgress, setPondProgress] = useState<Record<string, number>>({});
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showBouquetModal, setShowBouquetModal] = useState(false);
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [shakingField, setShakingField] = useState<number | null>(null);
  const [placedBouquets, setPlacedBouquets] = useState<PlacedBouquet[]>([]);
  const [showFlowerModal, setShowFlowerModal] = useState(false);
  const [showFishModal, setShowFishModal] = useState(false);
  const [showFeedingDialog, setShowFeedingDialog] = useState(false);
  const [isCollectingCaterpillar, setIsCollectingCaterpillar] = useState(false);
  const [collectingFish, setCollectingFish] = useState<Set<number>>(new Set());
  const [selectedFish, setSelectedFish] = useState<{
    id: number;
    fieldId: number;
    fishName: string;
    fishImageUrl: string;
    rarity: string;
  } | null>(null);
  
  // Flower-based system states
  const [userFlowers, setUserFlowers] = useState<any[]>([]);
  const [fieldFlowers, setFieldFlowers] = useState<any[]>([]);
  const [placedFlowers, setPlacedFlowers] = useState<{
    id: number;
    fieldId: number;
    flowerImageUrl: string;
    flowerName: string;
    flowerRarity: string;
    placedAt: Date;
    isShimmering: boolean;
    isDissolving: boolean;
  }[]>([]);
  
  const [placedFish, setPlacedFish] = useState<{
    id: number;
    fieldId: number;
    fishImageUrl: string;
    fishName: string;
    fishRarity: string;
    placedAt: Date;
    isSwimming: boolean;
  }[]>([]);
  
  const [fieldFish, setFieldFish] = useState<FieldFish[]>([]);
  const [growingCaterpillars, setGrowingCaterpillars] = useState<{
    id: number;
    fieldId: number;
    caterpillarImageUrl: string;
    caterpillarName: string;
    caterpillarRarity: string;
    spawnedAt: Date;
    isGrowingIn: boolean;
  }[]>([]);

  // Initialization
  useEffect(() => {
    initializeGarden();
    if (user) {
      fetchTeichData();
    }
  }, [user]);

  const initializeGarden = () => {
    const fields: GardenField[] = [];
    for (let i = 0; i < 50; i++) {
      const row = Math.floor(i / 10);
      const col = i % 10;
      const isPond = row >= 1 && row <= 3 && col >= 1 && col <= 8;
      
      fields.push({
        id: i + 1,
        isUnlocked: true,
        hasPlant: false,
        isPond,
        unlocksAt: isPond ? undefined : i + 1,
        cost: isPond ? undefined : 10
      });
    }
    setGardenFields(fields);
  };

  // Rarity inheritance logic
  const inheritCaterpillarRarity = (parentRarity: string): string => {
    const rarities = ['common', 'uncommon', 'rare', 'super-rare', 'epic', 'legendary', 'mythical'];
    const currentIndex = rarities.indexOf(parentRarity);
    
    if (currentIndex === -1) return 'common';
    
    const roll = Math.random();
    
    if (roll < 0.5) {
      return parentRarity; // 50% same rarity
    } else if (roll < 0.8) {
      return currentIndex > 0 ? rarities[currentIndex - 1] : rarities[0]; // 30% lower rarity  
    } else {
      return currentIndex < rarities.length - 1 ? rarities[currentIndex + 1] : rarities[rarities.length - 1]; // 20% higher rarity
    }
  };

  // Update garden with field caterpillars
  const updateGardenWithFieldCaterpillars = (caterpillars: any[]) => {
    setGardenFields(prev => prev.map(field => {
      const fieldIndex = field.id - 1;
      const caterpillar = caterpillars.find((c: any) => c.fieldIndex === fieldIndex);
      
      return {
        ...field,
        hasCaterpillar: !!caterpillar,
        caterpillarId: caterpillar?.id,
        caterpillarName: caterpillar?.caterpillarName,
        caterpillarImageUrl: caterpillar?.caterpillarImageUrl,
        caterpillarRarity: caterpillar?.caterpillarRarity,
        caterpillarSpawnedAt: caterpillar?.spawnedAt ? new Date(caterpillar.spawnedAt) : undefined
      };
    }));
  };

  // Fetch pond data
  const fetchTeichData = async () => {
    if (!user) return;

    try {
      const [caterpillarRes, userCaterpillarsRes, pondProgressRes, flowersRes, fieldFlowersRes, fieldFishRes] = await Promise.all([
        fetch(`/api/user/${user.id}/field-caterpillars`),
        fetch(`/api/user/${user.id}/caterpillars`),
        fetch(`/api/user/${user.id}/pond-progress`),
        fetch(`/api/user/${user.id}/flowers`),
        fetch(`/api/user/${user.id}/field-flowers`),
        fetch(`/api/user/${user.id}/field-fish`)
      ]);

      if (caterpillarRes.ok && userCaterpillarsRes.ok && pondProgressRes.ok && flowersRes.ok && fieldFlowersRes.ok && fieldFishRes.ok) {
        const [caterpillarData, userCaterpillarsData, pondProgressData, flowersData, fieldFlowersData, fieldFishData] = await Promise.all([
          caterpillarRes.json(),
          userCaterpillarsRes.json(),
          pondProgressRes.json(),
          flowersRes.json(),
          fieldFlowersRes.json(),
          fieldFishRes.json()
        ]);

        console.log('🌊 Updating pond with field caterpillars:', caterpillarData.fieldCaterpillars);

        // Update pond fields with caterpillars and flowers
        const updatedFields = gardenFields.map((field) => {
          const fieldIndex = field.id - 1;
          
          const caterpillar = !field.isPond ? caterpillarData.fieldCaterpillars.find((c: any) => c.fieldIndex === fieldIndex) : null;
          const fieldFlower = fieldFlowersData.fieldFlowers.find((f: any) => f.fieldIndex === fieldIndex);
          const fish = field.isPond ? fieldFishData.fieldFish.find((f: any) => f.fieldIndex === fieldIndex) : null;

          return {
            ...field,
            hasPlant: false,
            plantType: undefined,
            isGrowing: false,
            plantedAt: undefined,
            growthTimeSeconds: undefined,
            seedRarity: undefined,
            flowerId: undefined,
            flowerName: undefined,
            flowerImageUrl: undefined,
            hasBouquet: false,
            bouquetId: undefined,
            bouquetName: undefined,
            bouquetRarity: undefined,
            bouquetPlacedAt: undefined,
            bouquetExpiresAt: undefined,
            hasFlower: fieldFlower ? true : false,
            fieldFlowerId: fieldFlower ? fieldFlower.flowerId : undefined,
            fieldFlowerName: fieldFlower ? fieldFlower.flowerName : undefined,
            fieldFlowerImageUrl: fieldFlower ? fieldFlower.flowerImageUrl : undefined,
            fieldFlowerRarity: fieldFlower ? fieldFlower.flowerRarity : undefined,
            hasCaterpillar: caterpillar ? true : false,
            caterpillarId: caterpillar ? caterpillar.id : undefined,
            caterpillarName: caterpillar ? caterpillar.caterpillarName : undefined,
            caterpillarImageUrl: caterpillar ? caterpillar.caterpillarImageUrl : undefined,
            caterpillarRarity: caterpillar ? caterpillar.caterpillarRarity : undefined,
            caterpillarSpawnedAt: caterpillar ? new Date(caterpillar.spawnedAt) : undefined,
            hasFish: fish ? true : false,
            fishId: fish ? fish.id : undefined,
            fishName: fish ? fish.fishName : undefined,
            fishImageUrl: fish ? fish.fishImageUrl : undefined,
            fishRarity: fish ? fish.fishRarity : undefined,
            hasSunSpawn: false,
            sunSpawnAmount: undefined,
            sunSpawnExpiresAt: undefined
          };
        });

        setGardenFields(updatedFields);
        setUserCaterpillars(userCaterpillarsData.caterpillars);
        setPondProgress(pondProgressData.pondProgress || {});
        setUserFlowers(flowersData.flowers || []);
        setFieldFlowers(fieldFlowersData.fieldFlowers || []);
        setFieldFish(fieldFishData.fieldFish || []);
      }
    } catch (error) {
      console.error('Failed to fetch pond data:', error);
    }
  };

  // Flower placement and caterpillar spawning
  const placeFlowerOnField = async (flowerId: number) => {
    if (!user || selectedField === null) return;

    const flower = userFlowers.find(f => f.id === flowerId);
    if (!flower) return;

    if (flower.quantity <= 0) {
      showNotification('Fehler', 'Diese Blume ist nicht mehr verfügbar.', 'error');
      return;
    }

    const existingFieldFlower = fieldFlowers.find(f => f.fieldIndex === selectedField - 1);
    if (existingFieldFlower) {
      showNotification('Fehler', 'Auf diesem Feld ist bereits eine Blume platziert.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/garden/place-flower-on-field', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString()
        },
        body: JSON.stringify({
          fieldIndex: selectedField - 1,
          flowerId: flowerId
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local flower inventory
        setUserFlowers(prev => 
          prev.map(f => 
            f.id === flowerId 
              ? { ...f, quantity: Math.max(0, f.quantity - 1) }
              : f
          )
        );

        // Add shimmer effect
        const tempFlowerId = Date.now();
        setPlacedFlowers(prev => [...prev, {
          id: tempFlowerId,
          fieldId: selectedField,
          flowerImageUrl: flower.flowerImageUrl,
          flowerName: flower.flowerName,
          flowerRarity: flower.flowerRarity as RarityTier,
          placedAt: new Date(),
          isShimmering: true,
          isDissolving: false
        }]);

        // Get shimmer time based on rarity
        const getShimmerTime = (rarity: string): number => {
          switch (rarity.toLowerCase()) {
            case 'common': return 2000;
            case 'uncommon': return 3000;
            case 'rare': return 4000;
            case 'super-rare': return 5000;
            case 'epic': return 6000;
            case 'legendary': return 8000;
            case 'mythical': return 10000;
            default: return 3000;
          }
        };

        const shimmerTime = getShimmerTime(flower.flowerRarity);

        // After shimmer time, start dissolving and spawn caterpillar
        setTimeout(() => {
          setPlacedFlowers(prev => prev.map(f => 
            f.id === tempFlowerId 
              ? { ...f, isShimmering: false, isDissolving: true }
              : f
          ));

          // Spawn caterpillar from flower
          spawnCaterpillarFromFlower(selectedField - 1);

          // Remove visual flower after dissolve animation
          setTimeout(() => {
            setPlacedFlowers(prev => prev.filter(f => f.id !== tempFlowerId));
          }, 1000);
        }, shimmerTime);

        showNotification('Erfolg', 'Blume erfolgreich platziert!', 'success');
        setShowFlowerModal(false);
        setSelectedField(null);
      } else {
        const error = await response.json();
        showNotification('Fehler', error.message || 'Fehler beim Platzieren der Blume.', 'error');
      }
    } catch (error) {
      console.error('Error placing flower:', error);
      showNotification('Fehler', 'Netzwerkfehler beim Platzieren.', 'error');
    }
  };

  // Spawn caterpillar from flower
  const spawnCaterpillarFromFlower = async (fieldIndex: number) => {
    if (!user) return;
    
    try {
      console.log("🌸 CALLING API: Spawning caterpillar from flower on field", fieldIndex);
      const response = await fetch('/api/garden/spawn-caterpillar-from-flower', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString()
        },
        body: JSON.stringify({
          fieldIndex: fieldIndex
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log("🌸 SUCCESS: Caterpillar spawned from flower!", result);
        
        // Refresh pond data to show new caterpillar
        fetchTeichData();
        
        showNotification('Erfolg', `Eine Raupe ist aus der Blume entstanden! Seltenheit: ${getRarityDisplayName(result.caterpillar.caterpillarRarity as RarityTier)}`, 'success');
      } else {
        console.error("🌸 ERROR: Failed to spawn caterpillar from flower:", response.status);
      }
    } catch (error) {
      console.error('🌸 NETWORK ERROR spawning caterpillar from flower:', error);
    }
  };

  // Handle field click for flower placement
  const handleFieldClick = (field: GardenField) => {
    if (!user) return;

    // Only allow flower placement on grass fields (not pond water)
    if (!field.isPond && !field.hasCaterpillar && !field.hasFlower) {
      if (userFlowers.length > 0) {
        console.log("🌸 Opening flower selection for field", field.id, "with", userFlowers.length, "flowers");
        setSelectedField(field.id);
        setShowFlowerModal(true);
      } else {
        showNotification('Keine Blumen', 'Du hast keine Blumen im Inventar.', 'error');
      }
    }
  };

  // Handle field fish collection
  const handleFieldFishClick = async (field: GardenField) => {
    if (!user || !field.hasFish || !field.fishId) return;
    
    console.log(`🐟 Attempting to collect fish on field ${field.id}`);
    
    try {
      const response = await fetch('/api/garden/collect-field-fish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fieldFishId: field.fishId
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add to collecting animation
        setCollectingFish(prev => new Set([...prev, field.id]));
        
        // Remove after animation
        setTimeout(() => {
          setCollectingFish(prev => {
            const newSet = new Set(prev);
            newSet.delete(field.id);
            return newSet;
          });
          
          // Refresh data
          fetchTeichData();
        }, 1000);

        showNotification('Erfolg', `${field.fishName} gesammelt!`, 'success');
      } else {
        const error = await response.json();
        showNotification('Fehler', error.message, 'error');
      }
    } catch (error) {
      console.error('Error collecting field fish:', error);
      showNotification('Fehler', 'Netzwerkfehler beim Sammeln.', 'error');
    }
  };

  // Feeding dialog handlers
  const openFeedingDialog = () => {
    setShowFeedingDialog(true);
  };

  const closeFeedingDialog = () => {
    setShowFeedingDialog(false);
  };

  // After successful feeding, refresh data
  const handleSuccessfulFeeding = () => {
    fetchTeichData();
  };

  // Render pond field content
  const renderFieldContent = (field: GardenField) => {
    const isGrassField = !field.isPond;
    const borderColor = field.isPond ? 'border-blue-400/50' : 'border-green-400/50';
    const backgroundColor = field.isPond ? 'bg-blue-500/20' : 'bg-green-500/20';
    
    return (
      <div 
        className={`relative w-full h-full rounded-lg border-2 ${borderColor} ${backgroundColor} cursor-pointer transition-all duration-200 hover:shadow-lg flex items-center justify-center overflow-hidden`}
        onClick={() => {
          if (field.hasFish) {
            handleFieldFishClick(field);
          } else if (isGrassField) {
            handleFieldClick(field);
          }
        }}
      >
        {/* Background pattern */}
        <div className={`absolute inset-0 ${field.isPond ? 'bg-gradient-to-br from-blue-400/10 to-blue-600/10' : 'bg-gradient-to-br from-green-400/10 to-green-600/10'} opacity-60`}></div>
        
        {/* Field content */}
        {field.hasFlower && (
          <div className="relative z-10">
            <FlowerHoverPreview
              flowerName={field.fieldFlowerName!}
              flowerImageUrl={field.fieldFlowerImageUrl!}
              rarity={field.fieldFlowerRarity! as RarityTier}
            >
              <div className={`w-12 h-12 rounded-full border-2 ${getRarityColor(field.fieldFlowerRarity! as RarityTier).border} overflow-hidden shadow-lg`}>
                <RarityImage 
                  src={field.fieldFlowerImageUrl!}
                  alt={field.fieldFlowerName!}
                  rarity={field.fieldFlowerRarity! as RarityTier}
                  className="w-full h-full object-cover"
                />
              </div>
            </FlowerHoverPreview>
          </div>
        )}

        {field.hasCaterpillar && (
          <div className="relative z-10">
            <CaterpillarHoverPreview
              caterpillarName={field.caterpillarName!}
              caterpillarImageUrl={field.caterpillarImageUrl!}
              rarity={field.caterpillarRarity! as RarityTier}
            >
              <div className={`w-12 h-12 rounded-full border-2 ${getRarityColor(field.caterpillarRarity! as RarityTier).border} overflow-hidden shadow-lg animate-pulse`}>
                <RarityImage 
                  src={field.caterpillarImageUrl!}
                  alt={field.caterpillarName!}
                  rarity={field.caterpillarRarity! as RarityTier}
                  className="w-full h-full object-cover"
                />
              </div>
            </CaterpillarHoverPreview>
          </div>
        )}

        {field.hasFish && (
          <div className="relative z-10">
            <FishHoverPreview
              fishName={field.fishName!}
              fishImageUrl={field.fishImageUrl!}
              rarity={field.fishRarity! as RarityTier}
            >
              <div className={`w-12 h-12 rounded-full border-2 ${getRarityColor(field.fishRarity! as RarityTier).border} overflow-hidden shadow-lg ${collectingFish.has(field.id) ? 'animate-bounce' : 'animate-pulse'}`}>
                <RarityImage 
                  src={field.fishImageUrl!}
                  alt={field.fishName!}
                  rarity={field.fishRarity! as RarityTier}
                  className="w-full h-full object-cover"
                />
              </div>
            </FishHoverPreview>
          </div>
        )}

        {/* Empty field indicators */}
        {!field.hasFlower && !field.hasCaterpillar && !field.hasFish && (
          <div className="relative z-10">
            {field.isPond ? (
              <Waves className="h-8 w-8 text-blue-400/50" />
            ) : (
              <Flower className="h-8 w-8 text-green-400/50" />
            )}
          </div>
        )}

        {/* Shimmer effects for placed flowers */}
        {placedFlowers.filter(f => f.fieldId === field.id).map(flower => (
          <div key={flower.id} className={`absolute inset-0 z-20 ${flower.isShimmering ? 'animate-pulse' : flower.isDissolving ? 'animate-ping opacity-50' : ''}`}>
            <div className={`w-12 h-12 mx-auto mt-4 rounded-full border-2 ${getRarityColor(flower.flowerRarity as RarityTier).border} overflow-hidden shadow-lg`}>
              <RarityImage 
                src={flower.flowerImageUrl}
                alt={flower.flowerName}
                rarity={flower.flowerRarity as RarityTier}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 p-6 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 min-h-screen">
        {/* Header */}
        <Card className="bg-gradient-to-br from-slate-800 to-blue-900 border-2 border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl font-bold text-white">
              <Waves className="h-8 w-8 mr-3 text-blue-400" />
              <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                🌊 Teich - Blumen-Raupen System
              </span>
              <HelpButton 
                title="Teich System"
                content="Platziere Blumen auf den Grasfeldern um Raupen zu spawnen! Die Raupen haben die gleiche Seltenheit wie die verwendeten Blumen. Sammle Fische aus dem Teich und füttere Raupen für bessere Belohnungen."
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              <Button 
                onClick={openFeedingDialog}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white border-0 shadow-lg"
                disabled={userCaterpillars.length === 0}
              >
                <Heart className="h-4 w-4 mr-2" />
                Raupen füttern ({userCaterpillars.length})
              </Button>
              <div className="text-white text-sm">
                Platziere Blumen auf Grasfeldern → Raupen spawnen → Sammle Fische
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Garden Grid */}
        <Card className="bg-gradient-to-br from-slate-800 to-blue-900 border-2 border-blue-500/30">
          <CardContent className="p-6">
            <div className="grid grid-cols-10 gap-2 max-w-4xl mx-auto">
              {gardenFields.map((field) => (
                <div key={field.id} className="aspect-square">
                  {renderFieldContent(field)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        <FlowerSelectionModal
          isOpen={showFlowerModal}
          onClose={() => {
            setShowFlowerModal(false);
            setSelectedField(null);
          }}
          userFlowers={userFlowers}
          onSelectFlower={placeFlowerOnField}
          fieldIndex={selectedField || 0}
        />

        <FishSelectionModal
          isOpen={showFishModal}
          onClose={() => {
            setShowFishModal(false);
            setSelectedField(null);
          }}
          userFish={[]}
          onSelectFish={() => {}}
          fieldIndex={selectedField || 0}
        />

        <FeedingDialog
          isOpen={showFeedingDialog}
          onClose={closeFeedingDialog}
          onSuccessfulFeeding={handleSuccessfulFeeding}
        />

        {selectedFish && (
          <FishRewardDialog
            fish={selectedFish}
            onClose={() => setSelectedFish(null)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

export default TeichView;