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
import { ButterflySelectionModal } from "./ButterflySelectionModal";
import { FishSelectionModal } from "./FishSelectionModal";
import { FeedingDialog } from "./FeedingDialog";
import { FishRewardDialog } from "./FishRewardDialog";
// CaterpillarSelectionModal import removed - they spawn automatically
import { RarityImage } from "./RarityImage";
import { FlowerHoverPreview } from "./FlowerHoverPreview";
import { ButterflyHoverPreview } from "./ButterflyHoverPreview";
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
import type { UserBouquet, PlacedBouquet, FieldButterfly, FieldFish } from "@shared/schema";
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
  isPond?: boolean; // New field for pond areas
  // Pond feeding progress tracking
  feedingProgress?: number; // 0-3: 0=none, 1=🐟, 2=🐠, 3=fish born
}

interface UserCaterpillar {
  id: number;
  userId: number;
  caterpillarId: number;
  caterpillarName: string;
  caterpillarRarity: string;
  caterpillarImageUrl: string;
  quantity: number;
  createdAt: string;
}

interface UserSeed {
  id: number;
  seedId: number;
  seedName: string;
  seedRarity: string;
  quantity: number;
}

export const TeichView: React.FC = () => {
  const { user } = useAuth();
  const { credits, updateCredits } = useCredits();
  const { suns, setSuns } = useSuns();
  const { sunSpawns, setSunSpawns, removeSunSpawn, getSunSpawnOnField, setLoading } = useSunSpawns();
  const { showNotification } = useNotification();

  // Function to check if a field is in the pond area (middle 8x3 fields)
  const isPondField = (fieldId: number) => {
    const row = Math.floor((fieldId - 1) / 10);
    const col = (fieldId - 1) % 10;
    
    // Pond area: rows 1-3, columns 1-8 (0-indexed)
    return row >= 1 && row <= 3 && col >= 1 && col <= 8;
  };

  // Initialize garden fields (will be populated from backend)
  const [gardenFields, setGardenFields] = useState<GardenField[]>(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      isUnlocked: !isPondField(i + 1), // All non-pond fields are unlocked
      hasPlant: false,
      isPond: isPondField(i + 1)
    }));
  });

  const [userSeeds, setUserSeeds] = useState<UserSeed[]>([]);
  const [userBouquets, setUserBouquets] = useState<UserBouquet[]>([]);
  const [userCaterpillars, setUserCaterpillars] = useState<UserCaterpillar[]>([]);
  const [fieldButterflies, setFieldButterflies] = useState<FieldButterfly[]>([]);
  const [fieldFish, setFieldFish] = useState<FieldFish[]>([]);
  const [fieldCaterpillars, setFieldCaterpillars] = useState<any[]>([]);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showBouquetModal, setShowBouquetModal] = useState(false);
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [shakingField, setShakingField] = useState<number | null>(null);
  const [placedBouquets, setPlacedBouquets] = useState<PlacedBouquet[]>([]);
  const [showButterflyModal, setShowButterflyModal] = useState(false);
  const [showFishModal, setShowFishModal] = useState(false);
  const [showFeedingDialog, setShowFeedingDialog] = useState(false);
  const [isCollectingCaterpillar, setIsCollectingCaterpillar] = useState(false);
  const [collectingFish, setCollectingFish] = useState<Set<number>>(new Set());
  const [fadingFish, setFadingFish] = useState<Set<number>>(new Set());
  
  // Fish Reward Dialog State
  const [isFishRewardDialogOpen, setIsFishRewardDialogOpen] = useState(false);
  const [fishRewardData, setFishRewardData] = useState<{
    fishName: string;
    fishImageUrl: string;
    rarity: string;
  } | null>(null);
  // Caterpillar modal removed - they spawn automatically
  const [userButterflies, setUserButterflies] = useState<any[]>([]);
  const [placedButterflies, setPlacedButterflies] = useState<{
    id: number;
    fieldId: number;
    butterflyImageUrl: string;
    butterflyName: string;
    butterflyRarity: string;
    placedAt: Date;
    isWiggling: boolean;
    isBursting: boolean;
  }[]>([]);
  const [placedFish, setPlacedFish] = useState<{
    id: number;
    fieldId: number;
    fishImageUrl: string;
    fishName: string;
    fishRarity: string;
    placedAt: Date;
    isShrinkling: boolean;
  }[]>([]);
  const [placedCaterpillars, setPlacedCaterpillars] = useState<{
    id: number;
    fieldId: number;
    caterpillarImageUrl: string;
    caterpillarName: string;
    caterpillarRarity: string;
    placedAt: Date;
    isShrinkling: boolean;
    isGrowing?: boolean;
  }[]>([]);

  // State for spawning caterpillars with grow-in animation
  const [spawnedCaterpillars, setSpawnedCaterpillars] = useState<{
    id: number;
    fieldId: number;
    caterpillarImageUrl: string;
    caterpillarName: string;
    caterpillarRarity: string;
    spawnedAt: Date;
    isGrowingIn: boolean;
  }[]>([]);

  // Raritäts-Vererbungslogik 50-30-20
  const inheritCaterpillarRarity = (parentRarity: string): string => {
    const rarities = ['common', 'uncommon', 'rare', 'super-rare', 'epic', 'legendary', 'mythical'];
    const currentIndex = rarities.indexOf(parentRarity);
    
    if (currentIndex === -1) return 'common';
    
    const roll = Math.random();
    
    if (roll < 0.5) {
      // 50% same rarity
      return parentRarity;
    } else if (roll < 0.8) {
      // 30% lower rarity  
      return currentIndex > 0 ? rarities[currentIndex - 1] : rarities[0];
    } else {
      // 20% higher rarity
      return currentIndex < rarities.length - 1 ? rarities[currentIndex + 1] : rarities[rarities.length - 1];
    }
  };

  // Caterpillar spawning nach Burst
  const spawnCaterpillarAfterBurst = async (fieldIndex: number, butterflyRarity: string) => {
    if (!user) return;
    
    try {
      console.log("🐛 CALLING API: Spawning caterpillar on field", fieldIndex);
      const response = await fetch('/api/garden/spawn-caterpillar', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString()
        },
        body: JSON.stringify({
          fieldIndex: fieldIndex,
          parentRarity: butterflyRarity
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log("🐛 SUCCESS: Caterpillar spawned!", result);
        
        // Lokale grow-in animation starten
        const caterpillarAnimId = Date.now() + Math.random();
        const inheritedRarity = inheritCaterpillarRarity(butterflyRarity);
        
        // Sofort die echten Daten laden - permanente Raupe erscheint direkt
        fetchTeichData();
        
      } else {
        console.error("🐛 ERROR: Failed to spawn caterpillar:", response.status);
      }
    } catch (error) {
      console.error('🐛 NETWORK ERROR spawning caterpillar:', error);
    }
  };

  const handleButterflyPlacement = (fieldId: number, butterfly: any) => {
    setSelectedField(fieldId);
    placeButterflyOnField(butterfly.id);
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
        const data = await response.json();
        console.log('🐟 Fisch erfolgreich gesammelt!');
        toast.success(`${field.fishName} gesammelt!`);
        
        // Refresh data to show updated state
        fetchTeichData();
      } else {
        const errorData = await response.json();
        console.error('Field fish collection failed:', errorData);
        toast.error(errorData.message || 'Fehler beim Sammeln des Fisches.');
      }
    } catch (error) {
      console.error('Field fish collection error:', error);
      toast.error('Fehler beim Sammeln des Fisches.');
    }
  };

  // Handle field caterpillar collection
  const handleCaterpillarClick = async (field: GardenField) => {
    if (!user || !field.hasCaterpillar || isCollectingCaterpillar) return;
    
    console.log(`🐛 Attempting to collect caterpillar on field ${field.id}`);
    setIsCollectingCaterpillar(true);
    
    try {
      const response = await fetch(`/api/user/${user.id}/collect-field-caterpillar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldIndex: field.id - 1 // Convert to 0-based index
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🐛 Raupe erfolgreich gesammelt!');
        toast.success(`${field.caterpillarName} gesammelt!`);
        
        // Refresh data to show updated state
        fetchTeichData();
      } else {
        const errorData = await response.json();
        console.error('Field caterpillar collection failed:', errorData);
        toast.error(errorData.message || 'Fehler beim Sammeln der Raupe.');
      }
    } catch (error) {
      console.error('Field caterpillar collection error:', error);
      toast.error('Fehler beim Sammeln der Raupe.');
    } finally {
      setIsCollectingCaterpillar(false);
    }
  };

  const fetchTeichData = async () => {
    if (!user) return;

    try {
      // Fetch pond-specific data including feeding progress
      const [caterpillarRes, userCaterpillarsRes, pondProgressRes, butterfliesRes, fieldButterfliesRes, fieldFishRes] = await Promise.all([
        fetch(`/api/user/${user.id}/field-caterpillars`),
        fetch(`/api/user/${user.id}/caterpillars`),
        fetch(`/api/user/${user.id}/pond-progress`),
        fetch(`/api/user/${user.id}/butterflies`),
        fetch(`/api/user/${user.id}/field-butterflies`),
        fetch(`/api/user/${user.id}/field-fish`)
      ]);

      if (caterpillarRes.ok && userCaterpillarsRes.ok && pondProgressRes.ok && butterfliesRes.ok && fieldButterfliesRes.ok && fieldFishRes.ok) {
        const [caterpillarData, userCaterpillarsData, pondProgressData, butterfliesData, fieldButterfliesData, fieldFishData] = await Promise.all([
          caterpillarRes.json(),
          userCaterpillarsRes.json(),
          pondProgressRes.json(),
          butterfliesRes.json(),
          fieldButterfliesRes.json(),
          fieldFishRes.json()
        ]);

        console.log('🌊 Updating pond with field caterpillars:', caterpillarData.fieldCaterpillars);

        // Update pond fields with caterpillars and butterflies (no sun spawns in pond view)
        const updatedFields = gardenFields.map((field) => {
          const fieldIndex = field.id - 1;
          
          // Check for caterpillar (only on grass fields)
          const caterpillar = !field.isPond ? caterpillarData.fieldCaterpillars.find((c: any) => c.fieldIndex === fieldIndex) : null;
          
          // Check for butterfly - should show both on grass fields AND pond fields as small colored dots
          const butterfly = fieldButterfliesData.fieldButterflies.find((b: any) => b.fieldIndex === fieldIndex);
          
          // Removed debug logging - bug fixed!
          
          // Check for field fish (only on pond fields) - BUG FIX: use fieldIndex (0-based) consistently
          const fish = field.isPond ? fieldFishData.fieldFish.find((f: any) => f.fieldIndex === fieldIndex) : null;

          return {
            ...field,
            // Clear all garden-related properties for pond view
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
            hasButterfly: butterfly ? true : false,
            butterflyId: butterfly ? butterfly.butterflyId : undefined,
            butterflyName: butterfly ? butterfly.butterflyName : undefined,
            butterflyImageUrl: butterfly ? butterfly.butterflyImageUrl : undefined,
            butterflyRarity: butterfly ? butterfly.butterflyRarity : undefined,
            hasFish: !!fish,
            fishId: fish ? fish.id : undefined,
            fishName: fish ? fish.fishName : undefined,
            fishImageUrl: fish ? fish.fishImageUrl : undefined,
            fishRarity: fish ? fish.fishRarity : undefined,
            // Only keep caterpillar data for grass fields
            hasCaterpillar: !!caterpillar,
            caterpillarId: caterpillar?.caterpillarId,
            caterpillarName: caterpillar?.caterpillarName,
            caterpillarImageUrl: caterpillar?.caterpillarImageUrl,
            caterpillarRarity: caterpillar?.caterpillarRarity,
            caterpillarSpawnedAt: caterpillar ? new Date(caterpillar.spawnedAt) : undefined,
            // No sun spawns in pond view
            hasSunSpawn: false,
            sunSpawnAmount: undefined,
            sunSpawnExpiresAt: undefined,
            // Add feeding progress for pond fields from API data (only if > 0) - FIX: Use fieldIndex
            feedingProgress: field.isPond && pondProgressData.pondProgress?.[field.id - 1] > 0 ? pondProgressData.pondProgress[field.id - 1] : undefined
          };
        });

        setGardenFields(updatedFields);
        // Clear garden-specific data for pond view
        setUserSeeds([]);
        setUserBouquets([]);
        setPlacedBouquets([]);
        setFieldButterflies(fieldButterfliesData.fieldButterflies || []);
        setFieldFish(fieldFishData.fieldFish || []);
        setFieldCaterpillars(caterpillarData.fieldCaterpillars);
        setSunSpawns([]); // No sun spawns in pond view
        setUserButterflies(butterfliesData.butterflies || []);
        setUserCaterpillars(userCaterpillarsData.caterpillars || []);
      }
    } catch (error) {
      console.error('Failed to fetch garden data:', error);
    }
  };

  // Frontend only displays backend data - no lifecycle logic


  useEffect(() => {
    fetchTeichData();
    const interval = setInterval(fetchTeichData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Pond field shaking animation system
  useEffect(() => {
    const startShaking = () => {
      // Get all pond field IDs (middle 8x3 area: rows 1-3, cols 1-8)
      const pondFields: number[] = [];
      for (let row = 1; row <= 3; row++) {
        for (let col = 1; col <= 8; col++) {
          const fieldId = row * 10 + col + 1;
          pondFields.push(fieldId);
        }
      }
      
      // Select random pond field
      const randomField = pondFields[Math.floor(Math.random() * pondFields.length)];
      setShakingField(randomField);
      
      // Stop shaking after 6 seconds
      setTimeout(() => {
        setShakingField(null);
      }, 6000);
    };

    // Start first shake after random delay (10-20s)
    const getRandomInterval = () => Math.random() * 10000 + 10000; // 10-20 seconds
    
    let timeoutId = setTimeout(() => {
      startShaking();
      
      // Set up recurring shaking with new random interval each time
      const scheduleNext = () => {
        timeoutId = setTimeout(() => {
          startShaking();
          scheduleNext(); // Schedule the next shake
        }, getRandomInterval());
      };
      
      scheduleNext();
    }, getRandomInterval());

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);


  // Fish shrinking system
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    
    placedFish.forEach((fish) => {
      if (fish.isShrinkling) return;
      
      const timeAlive = Date.now() - fish.placedAt.getTime();
      
      // Set up shrinking for new fish only
      if (timeAlive < 1000) { // Only set up shrinking for new fish
        // Wait 10 seconds before starting to shrink
        const shrinkStartTimeout = setTimeout(() => {
          setPlacedFish(prev => 
            prev.map(f => f.id === fish.id ? { ...f, isShrinkling: true } : f)
          );
          
          // Remove after shrinking animation (30-90 seconds)
          const shrinkDuration = Math.random() * 60000 + 30000; // 30-90 seconds
          const removeTimeout = setTimeout(() => {
            setPlacedFish(prev => prev.filter(f => f.id !== fish.id));
          }, shrinkDuration);
          
          intervals.push(removeTimeout);
        }, 10000); // 10 seconds delay before shrinking starts
        
        intervals.push(shrinkStartTimeout);
      }
    });
    
    return () => {
      intervals.forEach(clearTimeout);
    };
  }, [placedFish]);

  // Caterpillar shrinking system
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    
    placedCaterpillars.forEach((caterpillar) => {
      if (caterpillar.isShrinkling) return;
      
      const timeAlive = Date.now() - caterpillar.placedAt.getTime();
      
      // Set up shrinking for new caterpillars only
      if (timeAlive < 1000) { // Only set up shrinking for new caterpillars
        // Wait 10 seconds before starting to shrink
        const shrinkStartTimeout = setTimeout(() => {
          setPlacedCaterpillars(prev => 
            prev.map(c => c.id === caterpillar.id ? { ...c, isShrinkling: true } : c)
          );
          
          // Remove after shrinking animation (30-90 seconds)
          const shrinkDuration = Math.random() * 60000 + 30000; // 30-90 seconds
          const removeTimeout = setTimeout(() => {
            setPlacedCaterpillars(prev => prev.filter(c => c.id !== caterpillar.id));
          }, shrinkDuration);
          
          intervals.push(removeTimeout);
        }, 10000); // 10 seconds delay before shrinking starts
        
        intervals.push(shrinkStartTimeout);
      }
    });
    
    return () => {
      intervals.forEach(clearTimeout);
    };
  }, [placedCaterpillars]);

  // Get butterfly border color based on rarity
  const getButterflyBorderColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return '#FFD700';
      case 'uncommon': return '#00FF00';
      case 'rare': return '#0066FF';
      case 'super-rare': return '#00FFFF';
      case 'epic': return '#9966FF';
      case 'legendary': return '#FF8800';
      case 'mythical': return '#FF0044';
      default: return '#FFD700';
    }
  };

  // Get fish border color based on rarity
  const getFishBorderColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return '#FFD700';
      case 'uncommon': return '#00FF00';
      case 'rare': return '#0066FF';
      case 'super-rare': return '#00FFFF';
      case 'epic': return '#9966FF';
      case 'legendary': return '#FF8800';
      case 'mythical': return '#FF0044';
      default: return '#FFD700';
    }
  };

  // Get caterpillar border color based on rarity
  const getCaterpillarBorderColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return '#FFD700';
      case 'uncommon': return '#00FF00';
      case 'rare': return '#0066FF';
      case 'super-rare': return '#00FFFF';
      case 'epic': return '#9966FF';
      case 'legendary': return '#FF8800';
      case 'mythical': return '#FF0044';
      default: return '#FFD700';
    }
  };

  const unlockField = async (fieldId: number) => {
    if (!user) return;

    const fieldIndex = fieldId - 1;
    const cost = 10;

    if (credits < cost) {
      showNotification('Nicht genügend Credits!', 'Zum Freischalten eines Feldes benötigst du 10 Credits.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/garden/unlock-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, fieldIndex, cost })
      });

      if (response.ok) {
        updateCredits(credits - cost);
        fetchTeichData();
        showNotification('Feld freigeschaltet!', `Du hast Feld ${fieldId} für ${cost} Credits freigeschaltet.`, 'success');
      } else {
        const error = await response.json();
        showNotification('Fehler', error.message || 'Feld konnte nicht freigeschaltet werden.', 'error');
      }
    } catch (error) {
      console.error('Failed to unlock field:', error);
      showNotification('Fehler', 'Netzwerkfehler beim Freischalten des Feldes.', 'error');
    }
  };

  const plantSeed = async (seedId: number, fieldIndex?: number) => {
    if (!user) return;
    const targetField = fieldIndex !== undefined ? fieldIndex : (selectedField || 1) - 1;

    try {
      const response = await fetch('/api/garden/plant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fieldIndex: targetField,
          seedId
        })
      });

      if (response.ok) {
        fetchTeichData();
        showNotification('Samen gepflanzt!', 'Der Samen wurde erfolgreich gepflanzt.', 'success');
      } else {
        const error = await response.json();
        showNotification('Fehler', error.message || 'Samen konnte nicht gepflanzt werden.', 'error');
      }
    } catch (error) {
      console.error('Failed to plant seed:', error);
      showNotification('Fehler', 'Netzwerkfehler beim Pflanzen.', 'error');
    }

    setShowSeedModal(false);
    setSelectedField(null);
  };

  const harvestField = async (fieldId: number) => {
    if (!user) return;

    console.log('Starting harvest for field:', fieldId - 1);

    try {
      const response = await fetch('/api/garden/harvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fieldIndex: fieldId - 1
        })
      });

      if (response.ok) {
        console.log('Blume erfolgreich geerntet!');
        showNotification('Blume geerntet!', 'Die Blume wurde erfolgreich geerntet.', 'success');
        fetchTeichData();
      } else {
        const error = await response.json();
        showNotification('Fehler', error.message || 'Blume konnte nicht geerntet werden.', 'error');
      }
    } catch (error) {
      console.error('Failed to harvest field:', error);
      showNotification('Fehler', 'Netzwerkfehler beim Ernten.', 'error');
    }
  };

  const placeBouquet = async (bouquetId: number, fieldIndex?: number) => {
    if (!user) return;
    const targetField = fieldIndex !== undefined ? fieldIndex : (selectedField || 1) - 1;

    try {
      const response = await fetch('/api/garden/place-bouquet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fieldIndex: targetField,
          bouquetId
        })
      });

      if (response.ok) {
        fetchTeichData();
        showNotification('Bouquet platziert!', 'Das Bouquet wurde erfolgreich platziert.', 'success');
      } else {
        const error = await response.json();
        showNotification('Fehler', error.message || 'Bouquet konnte nicht platziert werden.', 'error');
      }
    } catch (error) {
      console.error('Failed to place bouquet:', error);
      showNotification('Fehler', 'Netzwerkfehler beim Platzieren.', 'error');
    }

    setShowBouquetModal(false);
    setSelectedField(null);
  };

  const placeButterflyOnField = async (butterflyId: number) => {
    if (!user || selectedField === null) return;

    const butterfly = userButterflies.find(b => b.id === butterflyId);
    if (!butterfly) return;

    // Check if butterfly quantity is available
    if (butterfly.quantity <= 0) {
      showNotification('Fehler', 'Dieser Schmetterling ist nicht mehr verfügbar.', 'error');
      return;
    }

    // Check if field already has a placed butterfly (both local state and database)
    const existingLocalButterfly = placedButterflies.find(b => b.fieldId === selectedField);
    const existingDbButterfly = fieldButterflies.find(b => b.fieldIndex === selectedField - 1);
    
    if (existingLocalButterfly || existingDbButterfly) {
      showNotification('Auf diesem Feld ist bereits ein Schmetterling platziert.', 'info');
      return;
    }

    try {
      const response = await fetch('/api/garden/place-butterfly', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString()
        },
        body: JSON.stringify({
          fieldIndex: selectedField - 1, // Convert to 0-based index
          butterflyId: butterflyId
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state - reduce butterfly quantity
        setUserButterflies(prev => 
          prev.map(b => 
            b.id === butterflyId 
              ? { ...b, quantity: Math.max(0, b.quantity - 1) }
              : b
          )
        );

        // 🦋 NEW: Schmetterling verschwindet automatisch und spawnt Raupe
        // Add temporary visual butterfly that will disappear
        const tempButterflyId = Date.now();
        setPlacedButterflies(prev => [...prev, {
          id: tempButterflyId,
          fieldId: selectedField,
          butterflyImageUrl: butterfly.butterflyImageUrl,
          butterflyName: butterfly.butterflyName,
          butterflyRarity: butterfly.butterflyRarity as RarityTier,
          placedAt: new Date(),
          isWiggling: true
        }]);

        // Get wackel time based on butterfly rarity (seltener = länger wackeln)
        const getWackelTime = (rarity: string): number => {
          switch (rarity.toLowerCase()) {
            case 'common': return 3000;      // 3 Sekunden - schnellstes Spawnen
            case 'uncommon': return 5000;    // 5 Sekunden
            case 'rare': return 8000;        // 8 Sekunden
            case 'super-rare': return 12000; // 12 Sekunden 
            case 'epic': return 18000;       // 18 Sekunden
            case 'legendary': return 20000;  // 20 Sekunden
            case 'mythical': return 30000;   // 30 Sekunden - längstes Wackeln
            default: return 3000;
          }
        };

        const wackelTime = getWackelTime(butterfly.butterflyRarity);
        
        // Animate butterfly disappearing and spawn caterpillar after rarity-based time
        setTimeout(async () => {
          // Remove butterfly with burst animation
          setPlacedButterflies(prev => 
            prev.map(b => 
              b.id === tempButterflyId 
                ? { ...b, isWiggling: false, isBursting: true }
                : b
            )
          );

          // Remove butterfly completely after burst animation
          setTimeout(() => {
            setPlacedButterflies(prev => prev.filter(b => b.id !== tempButterflyId));
          }, 1000);

          // Spawn caterpillar on the field
          try {
            const caterpillarResponse = await fetch('/api/garden/spawn-caterpillar', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'x-user-id': user.id.toString()
              },
              body: JSON.stringify({
                fieldIndex: selectedField - 1,
                parentRarity: butterfly.butterflyRarity
              })
            });

            if (caterpillarResponse.ok) {
              // Refresh data to show spawned caterpillar
              fetchTeichData();
            }
          } catch (error) {
            console.error('Failed to spawn caterpillar:', error);
          }
        }, wackelTime);
      } else {
        const error = await response.json();
        showNotification('Fehler', error.message || 'Butterfly konnte nicht platziert werden.', 'error');
      }

    } catch (error) {
      console.error('Failed to place butterfly:', error);
      showNotification('Fehler', 'Fehler beim Platzieren des Schmetterlings.', 'error');
    }

    setShowButterflyModal(false);
    setSelectedField(null);
  };

  // Fish placement and collection functions
  const handleFishSelection = async (fishId: number, fishImageUrl: string, fishName: string, rarity: RarityTier) => {
    if (!user || selectedField === null) return;
    
    const fieldIndex = selectedField - 1;
    
    // Add to local state immediately for visual feedback
    setPlacedFish(prev => [...prev, {
      id: Date.now(), // Temporary ID
      fieldId: selectedField,
      fishImageUrl,
      fishName,
      fishRarity: rarity,
      placedAt: new Date(),
      isShrinkling: false
    }]);

    setShowFishModal(false);
    setSelectedField(null);
    
    showNotification('Fisch platziert!', `${fishName} schwimmt im Teich umher!`, 'success');
  };

  const collectFish = async (fieldId: number) => {
    if (!user) return;
    
    // Find the fish on this field (using correct 0-based index conversion)
    const fishOnField = fieldFish.find(f => f.fieldIndex === fieldId - 1);
    if (!fishOnField) {
      console.log(`🐟 No fish found on field ${fieldId}`);
      return;
    }
    
    console.log(`🐟 Attempting to collect fish on field ${fieldId}`, fishOnField);
    
    try {
      const response = await fetch('/api/garden/collect-field-fish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fieldFishId: fishOnField.id  // Use the correct fish database ID
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🐟 Fisch erfolgreich gesammelt!');
        
        // Show the beautiful fish reward dialog
        setFishRewardData({
          fishName: fishOnField.fishName,
          fishImageUrl: fishOnField.fishImageUrl,
          rarity: fishOnField.fishRarity
        });
        setIsFishRewardDialogOpen(true);
        
        // Refresh data to show updated state
        fetchTeichData();
      } else {
        const errorData = await response.json();
        console.error('Field fish collection failed:', errorData);
      }
    } catch (error) {
      console.error('Collect fish error:', error);
    }
  };

  // Caterpillars spawn automatically when butterflies disappear, no manual placement


  const collectButterfly = async (fieldId: number) => {
    if (!user) return;
    
    console.log('🦋 Attempting to collect butterfly on field', fieldId - 1);
    
    try {
      const response = await fetch('/api/garden/collect-butterfly', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString()
        },
        body: JSON.stringify({
          fieldIndex: fieldId - 1
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🦋 Schmetterling erfolgreich gesammelt!');
        showNotification('Schmetterling gesammelt!', result.message, 'success');
        fetchTeichData();
      } else {
        const error = await response.json();
        showNotification('Fehler', error.message || 'Schmetterling konnte nicht gesammelt werden.', 'error');
      }
    } catch (error) {
      console.error('Failed to collect butterfly:', error);
      showNotification('Fehler', 'Netzwerkfehler beim Sammeln des Schmetterlings.', 'error');
    }
  };

  // Collect field caterpillar handler
  const collectCaterpillar = async (fieldIndex: number) => {
    if (!user) return;
    
    console.log('🐛 Attempting to collect caterpillar on field', fieldIndex);
    // Blockierung wird bereits im onClick gesetzt
    
    try {
      const response = await fetch(`/api/user/${user.id}/collect-field-caterpillar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldIndex: fieldIndex })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🐛 Raupe erfolgreich gesammelt!');
        fetchTeichData();
        
        // Prevent butterfly dialog from opening for 1.5 seconds
        setTimeout(() => {
          setIsCollectingCaterpillar(false);
        }, 1500);
      } else {
        const error = await response.json();
        console.error('Collection failed:', error);
        setIsCollectingCaterpillar(false);
      }
    } catch (error) {
      console.error('Failed to collect caterpillar:', error);
      setIsCollectingCaterpillar(false);
    }
  };

  const onFeedCaterpillar = async (caterpillarId: number, fieldIndex: number) => {
    if (!user) return;

    try {
      console.log('🐛 Feeding caterpillar to fish on field', fieldIndex);
      
      const response = await fetch('/api/garden/feed-fish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          caterpillarId,
          fieldIndex: fieldIndex // Backend expects 0-based index (already calculated)
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🐟 Fish feeding result:', result);
        
        if (result.fishCreated) {
          showNotification('Fisch geboren!', `Ein ${result.fishName} wurde geboren! Seltenheit: ${result.fishRarity}`, 'success');
        } else {
          // Use the ACTUAL server-calculated rarity, not a random one!
          const rarityNames = {
            'common': 'Gewöhnlich',
            'uncommon': 'Ungewöhnlich', 
            'rare': 'Selten',
            'super-rare': 'Super-selten',
            'epic': 'Episch',
            'legendary': 'Legendär',
            'mythical': 'Mythisch'
          };
          const rarityName = rarityNames[result.fishRarity as keyof typeof rarityNames] || result.fishRarity;
          
          showNotification(
            `Fütterung ${result.feedingCount}/3 abgeschlossen.\n\nAktueller Durchschnitt: ${rarityName}`, 
            'success'
          );
        }
        
        fetchTeichData(); // Refresh field data
        setShakingField(null); // Stop shaking after feeding
      } else {
        const error = await response.json();
        showNotification('Fehler', error.message || 'Fütterung fehlgeschlagen.', 'error');
      }
    } catch (error) {
      console.error('Failed to feed caterpillar:', error);
      showNotification('Fehler', 'Netzwerkfehler beim Füttern.', 'error');
    }
  };

  const onFeedButterfly = async (butterflyId: number, fieldIndex: number) => {
    if (!user) return;

    try {
      console.log('🦋→🐛 Converting butterfly to caterpillar for feeding fish on field', fieldIndex);
      
      const response = await fetch('/api/garden/feed-butterfly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          butterflyId,
          fieldIndex: fieldIndex // Backend expects 0-based index (already calculated)
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🦋 Butterfly feeding result:', result);
        
        if (result.fishCreated) {
          showNotification('Fisch geboren!', `Ein ${result.fishName} wurde geboren! Seltenheit: ${result.fishRarity}`, 'success');
        } else {
          showNotification('Schmetterling → Raupe!', `Schmetterling zu Raupe konvertiert! Fütterung ${result.feedingCount}/3 abgeschlossen.`, 'success');
        }
        
        fetchTeichData(); // Refresh field data
        setShakingField(null); // Stop shaking after feeding
      } else {
        const error = await response.json();
        showNotification('Fehler', error.message || 'Schmetterling-Fütterung fehlgeschlagen.', 'error');
      }
    } catch (error) {
      console.error('🦋 Failed to feed butterfly:', error);
      showNotification('Fehler', 'Netzwerkfehler beim Füttern mit Schmetterling.', 'error');
    }
  };

  const collectSun = async (fieldId: number) => {
    if (!user) return;
    
    console.log('Starting sun collection for field:', fieldId - 1);
    setLoading(true);
    
    try {
      const response = await fetch('/api/garden/collect-sun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fieldIndex: fieldId - 1
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Sun collected successfully!', result);
        
        // Update suns count in global state
        setSuns(suns + result.sunAmount);
        
        // Remove from local state immediately
        removeSunSpawn(fieldId - 1);
        
        showNotification('Sonnen gesammelt!', result.message, 'success');
        
        // Refresh garden data to sync with server
        fetchTeichData();
      } else {
        const error = await response.json();
        showNotification('Fehler', error.message || 'Sonnen konnten nicht gesammelt werden.', 'error');
      }
    } catch (error) {
      console.error('Failed to collect sun:', error);
      showNotification('Fehler', 'Netzwerkfehler beim Sammeln der Sonnen.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-400">Bitte melde dich an, um den Teich zu besuchen.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 pb-20">
      <TooltipProvider>
        <Card className="bg-gradient-to-br from-blue-900 to-teal-900 border border-blue-500/30 shadow-lg mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-white">
              <div className="flex items-center justify-between">
                <div></div> {/* Spacer links */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3">
                    <Waves className="h-6 w-6 text-blue-400" />
                    <span className="text-2xl font-bold text-blue-300">Mariposa Teich</span>
                    <Waves className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="text-xs text-slate-400">
                    Setze Schmetterlinge ins Gras damit sie neue Raupen bilden und fütter deine Fische mit Ihnen - Sie da wackelt was!
                  </div>
                </div>
                <div className="flex justify-end">
                  <HelpButton helpText="Am Teich setzt du Schmetterlinge auf Grasfelder um Raupen zu züchten. Füttere deine Fische in den blauen Teichfeldern mit den Raupen - je höher die Rarität der Raupen, desto bessere Fische bekommst du!" viewType="pond" />
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 sm:gap-2 garden-grid-mobile sm:garden-grid-desktop">
              {gardenFields.map((field) => {
                // In TeichView, no unlock logic needed since grass fields are auto-unlocked
                const isNextToUnlock = false;
                
                return (
                  <div
                    key={field.id}
                    className={`
                      aspect-square border-2 rounded-lg relative flex items-center justify-center transition-all touch-target
                      ${field.isPond 
                        ? 'border-blue-500 bg-gradient-to-br from-blue-800/40 to-teal-800/40 cursor-pointer' 
                        : field.isUnlocked 
                          ? 'border-green-500 bg-green-900/20 hover:bg-green-900/40 active:bg-green-900/60 cursor-pointer' 
                          : isNextToUnlock 
                            ? 'border-orange-500 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 opacity-50 cursor-pointer' 
                            : 'border-slate-600 bg-slate-800 opacity-40'
                      }
                      ${shakingField === field.id ? 'pond-shake' : ''}
                    `}
                    style={{
                      backgroundImage: field.isPond ? 'url("/Landschaft/teich.png")' : 'url("/Landschaft/gras.png")',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      minHeight: '44px',
                      minWidth: '44px',
                      animation: shakingField === field.id ? 'pond-wobble 1.5s ease-in-out infinite' : 'none'
                    }}
                    onClick={() => {
                      if (field.isPond) {
                        // TEICHFELD: Wackelnd → Fütterungs-Dialog, sonst Fish einsammeln
                        if (shakingField === field.id) {
                          // Open feeding dialog if user has caterpillars (only caterpillars can feed fish)
                          if (userCaterpillars.length > 0) {
                            console.log("🐛 Opening feeding dialog for pond field", field.id);
                            setSelectedField(field.id);
                            setShowFeedingDialog(true);
                          } else {
                            showNotification('Keine Futtermittel', 'Du hast keine Raupen zum Füttern im Inventar.', 'error');
                          }
                        } else {
                          // Try to collect fish from pond field (convert field.id to 0-based index)
                          const fishOnField = fieldFish.find(f => f.fieldIndex === field.id - 1);
                          if (fishOnField) {
                            console.log("🐟 Attempting to collect fish on field", field.id);
                            collectFish(field.id);
                          } else {
                            console.log("🐟 Check for fish on pond field", field.id);
                          }
                        }
                        return;
                      }
                      
                      // GRASFELD: Butterfly platzieren (KEINE Caterpillar-Logik hier - wird von Raupe onClick gehandelt)
                      if (!field.isPond) {
                        // Check if caterpillar is present - dann NICHT den Schmetterlings-Dialog öffnen
                        const caterpillarOnField = fieldCaterpillars.find(c => c.fieldIndex === field.id - 1) || 
                                                  field.hasCaterpillar;
                        
                        if (caterpillarOnField) {
                          console.log("🐛 Caterpillar present on field", field.id, "- ignoring field click");
                          return; // Caterpillar-Clicks werden von deren eigenem onClick gehandelt
                        }
                        
                        // Schmetterling-Auswahl Dialog öffnen (nur wenn keine Raupe da ist)
                        if (!isCollectingCaterpillar && userButterflies.length > 0) {
                          console.log("🦋 Opening butterfly selection for field", field.id, "with", userButterflies.length, "butterflies");
                          setSelectedField(field.id);
                          setShowButterflyModal(true);
                        } else if (isCollectingCaterpillar) {
                          console.log("🐛 Currently collecting caterpillar, skipping butterfly dialog for", field.id);
                        } else {
                          showNotification('Keine Schmetterlinge', 'Du hast keine Schmetterlinge im Inventar.', 'error');
                        }
                        return;
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (field.isPond) return;
                      if (field.isUnlocked && !field.hasBouquet) {
                        setSelectedField(field.id);
                        setShowBouquetModal(true);
                      }
                    }}
                  >

                    {/* Pond indicator */}
                    {field.isPond && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Waves className="h-6 w-6 text-blue-300/80" />
                      </div>
                    )}

                    {/* No sun spawns in TeichView at all */}
                    {false && field.hasSunSpawn && field.sunSpawnAmount && !field.isPond && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-yellow-400/20 rounded-lg border border-yellow-400/50 animate-pulse cursor-pointer hover:bg-yellow-400/30">
                            <Sun className="h-5 w-5 text-yellow-400" />
                            <span className="text-xs font-bold text-yellow-300">+{field.sunSpawnAmount}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Klicken zum Einsammeln: +{field.sunSpawnAmount} Sonnen</p>
                          {field.sunSpawnExpiresAt && (
                            <p className="text-xs text-red-300">
                              Läuft ab in {Math.max(0, Math.ceil((field.sunSpawnExpiresAt.getTime() - Date.now()) / 1000))}s
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )}


                    {/* Local placed butterflies with wiggle and burst animations */}
                    {placedButterflies.find(b => b.fieldId === field.id) && (() => {
                      const butterfly = placedButterflies.find(b => b.fieldId === field.id)!;
                      return (
                        <div 
                          className={`absolute inset-0 flex items-center justify-center cursor-pointer ${
                            butterfly.isWiggling ? 'animate-wiggle' : ''
                          } ${
                            butterfly.isBursting ? 'animate-burst' : ''
                          }`}
                        >
                          <RarityImage
                            src={butterfly.butterflyImageUrl}
                            alt={butterfly.butterflyName || "Schmetterling"}
                            rarity={butterfly.butterflyRarity as RarityTier || "common"}
                            size="large"
                            className="w-full h-full"
                          />
                        </div>
                      );
                    })()}

                    {/* Butterflies are only visible in garden view, not in pond view */}
                    {false && (
                      <ButterflyHoverPreview
                        butterflyId={field.butterflyId!}
                        butterflyName={field.butterflyName!}
                        butterflyImageUrl={field.butterflyImageUrl!}
                        rarity={field.butterflyRarity as RarityTier}
                      >
                        <div 
                          className="absolute inset-0 flex items-center justify-center cursor-pointer hover:scale-110 transition-all"
                          onClick={() => collectButterfly(field.id)}
                        >
                          <RarityImage
                            src={field.butterflyImageUrl!}
                            alt={field.butterflyName || "Schmetterling"}
                            rarity={field.butterflyRarity as RarityTier || "common"}
                            size="large"
                            className="w-full h-full"
                          />
                        </div>
                      </ButterflyHoverPreview>
                    )}

                    {/* Real Field Caterpillars from Database (PERMANENT - highest priority) */}
                    {fieldCaterpillars
                      .filter(c => c.fieldIndex === field.id - 1)
                      .map(caterpillar => (
                      <CaterpillarHoverPreview
                        key={`real-caterpillar-${caterpillar.id}`}
                        caterpillarId={caterpillar.caterpillarId}
                        caterpillarName={caterpillar.caterpillarName}
                        caterpillarImageUrl={caterpillar.caterpillarImageUrl}
                        rarity={caterpillar.caterpillarRarity as RarityTier}
                      >
                        <div 
                          className="absolute inset-0 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-30 animate-fade-in"
                          onClick={(e) => {
                            e.stopPropagation(); // Verhindert Event-Bubbling zum Feld
                            setIsCollectingCaterpillar(true); // Sofort blockieren
                            collectCaterpillar(field.id - 1);
                          }}
                        >
                          <RarityImage
                            src={caterpillar.caterpillarImageUrl}
                            alt={caterpillar.caterpillarName || "Raupe"}
                            rarity={caterpillar.caterpillarRarity as RarityTier || "common"}
                            size="large"
                            className="w-full h-full field-image"
                          />
                        </div>
                      </CaterpillarHoverPreview>
                    ))}


                    {/* Field Caterpillar with Bounce Effect - hide during butterfly animation, local caterpillars AND spawned caterpillars */}
                    {field.hasCaterpillar && field.caterpillarImageUrl && !placedButterflies.find(b => b.fieldId === field.id) && !placedCaterpillars.find(c => c.fieldId === field.id) && !spawnedCaterpillars.find(c => c.fieldId === field.id) && (
                      <CaterpillarHoverPreview
                        caterpillarId={field.caterpillarId!}
                        caterpillarName={field.caterpillarName!}
                        caterpillarImageUrl={field.caterpillarImageUrl}
                        rarity={field.caterpillarRarity as RarityTier}
                      >
                        <div 
                          className="absolute inset-0 flex items-center justify-center cursor-pointer transition-all hover:scale-110 animate-bounce-spawn"
                          onClick={(e) => {
                            e.stopPropagation(); // Verhindert Event-Bubbling zum Feld
                            setIsCollectingCaterpillar(true); // Sofort blockieren
                            collectCaterpillar(field.id - 1);
                          }}
                          style={{
                            animation: 'bounce-spawn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards'
                          }}
                        >
                          <RarityImage
                            src={field.caterpillarImageUrl}
                            alt={field.caterpillarName || "Raupe"}
                            rarity={field.caterpillarRarity as RarityTier || "common"}
                            size="large"
                            className="w-full h-full field-image"
                          />
                        </div>
                      </CaterpillarHoverPreview>
                    )}

                    {/* Bouquet - disabled in TeichView */}
                    {false && field.hasBouquet && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <RarityImage
                          src="/Blumen/Bouquet.jpg"
                          alt={field.bouquetName || "Bouquet"}
                          rarity={field.bouquetRarity as RarityTier || "common"}
                          size="small"
                          className="w-10 h-10"
                        />
                        {field.bouquetExpiresAt && (
                          <div className="absolute -bottom-1 text-xs text-white/80 bg-black/60 px-1 rounded">
                            {Math.max(0, Math.ceil((field.bouquetExpiresAt.getTime() - Date.now()) / (1000 * 60)))}m
                          </div>
                        )}
                      </div>
                    )}

                    {/* Plant/Seed */}
                    {field.hasPlant && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {field.isGrowing ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex flex-col items-center">
                                <RarityImage
                                  src="/Blumen/0.jpg"
                                  alt="Wachsender Samen"
                                  rarity={field.seedRarity as RarityTier || "common"}
                                  size="small"
                                  className="w-8 h-8"
                                />
                                <div className="text-xs text-white/80 mt-1 bg-black/60 px-1 rounded flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {field.plantedAt && field.growthTimeSeconds && (
                                    <>
                                      {(() => {
                                        const now = Date.now();
                                        const plantTime = field.plantedAt.getTime();
                                        const growthMs = field.growthTimeSeconds * 1000;
                                        const remainingMs = Math.max(0, (plantTime + growthMs) - now);
                                        return formatTime(Math.ceil(remainingMs / 1000));
                                      })()}
                                    </>
                                  )}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{field.flowerName || "Unbekannte Blume"}</p>
                              <p className="text-sm text-slate-300">
                                Wächst noch...
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <FlowerHoverPreview
                            flowerId={field.flowerId!}
                            flowerName={field.flowerName!}
                            flowerImageUrl={field.flowerImageUrl!}
                            rarity={field.seedRarity as RarityTier}
                          >
                            <div className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform">
                              <RarityImage
                                src={field.flowerImageUrl!}
                                alt={field.flowerName || "Blume"}
                                rarity={field.seedRarity as RarityTier || "common"}
                                size="small"
                                className="w-10 h-10"
                              />
                              <div className="absolute -bottom-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center animate-bounce">
                                <Flower className="h-3 w-3 mr-1" />
                                +1 Blume!
                              </div>
                            </div>
                          </FlowerHoverPreview>
                        )}
                      </div>
                    )}


                    {/* Placed Fish Display */}
                    {placedFish
                      .filter(fish => fish.fieldId === field.id)
                      .map(fish => (
                        <div
                          key={fish.id}
                          className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                            fish.isShrinkling ? 'animate-pulse opacity-50 scale-75' : 'opacity-100 scale-100'
                          }`}
                          style={{
                            transform: fish.isShrinkling ? 'scale(0.7)' : 'scale(1)',
                            transition: 'all 0.5s ease-in-out'
                          }}
                        >
                          <FishHoverPreview
                            fishImageUrl={fish.fishImageUrl}
                            fishName={fish.fishName}
                            rarity={fish.fishRarity as RarityTier}
                          >
                            <div
                              className="w-8 h-8 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform"
                              style={{ borderColor: getFishBorderColor(fish.fishRarity) }}
                            >
                              <img
                                src={fish.fishImageUrl}
                                alt={fish.fishName}
                                className="w-full h-full object-cover rounded-full"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling!.style.display = 'block';
                                }}
                              />
                              <div
                                className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center"
                                style={{ display: 'none' }}
                              >
                                🐟
                              </div>
                            </div>
                          </FishHoverPreview>
                        </div>
                      ))}

                    {/* Field Fish - Spawned from feeding (bouncing animation) */}
                    {field.hasFish && (
                      <div 
                        className={`absolute inset-0 flex items-center justify-center cursor-pointer group z-30 ${
                          collectingFish.has(field.id) 
                            ? 'opacity-0 scale-50 transition-all duration-300' 
                            : 'animate-bounce opacity-100 scale-100'
                        }`}
                        onClick={() => collectingFish.has(field.id) ? null : collectFish(field.id)}
                      >
                        <div className={`relative transform transition-transform duration-200 ${
                          collectingFish.has(field.id) ? '' : 'group-hover:scale-110'
                        }`}>
                          <RarityImage 
                            src={field.fishImageUrl!}
                            alt={field.fishName || "Fisch"}
                            rarity={field.fishRarity as RarityTier || "common"}
                            size="large"
                            className="w-full h-full"
                          />
                          <div className={`absolute -top-1 -right-1 bg-cyan-400 text-white text-xs px-1 py-0.5 rounded-full flex items-center transition-opacity duration-300 ${
                            collectingFish.has(field.id) ? 'opacity-0' : 'animate-pulse opacity-100'
                          }`}>
                            🐟
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Field Caterpillars - Spawned from butterflies (full field size) */}
                    {field.hasCaterpillar && (
                      <div 
                        className="absolute inset-0 flex items-center justify-center cursor-pointer group animate-pulse z-30"
                        onClick={() => handleCaterpillarClick(field)}
                      >
                        <CaterpillarHoverPreview
                          caterpillarImageUrl={field.caterpillarImageUrl!}
                          caterpillarName={field.caterpillarName!}
                          rarity={field.caterpillarRarity as RarityTier}
                          className="z-10"
                        >
                          <div className="relative transform group-hover:scale-110 transition-transform duration-200">
                            <RarityImage 
                              src={field.caterpillarImageUrl!}
                              alt={field.caterpillarName || "Raupe"}
                              rarity={field.caterpillarRarity as RarityTier || "common"}
                              size="large"
                              className="w-full h-full"
                            />
                            <div className="absolute -top-1 -right-1 bg-green-400 text-white text-xs px-1 py-0.5 rounded-full flex items-center animate-bounce">
                              🐛
                            </div>
                          </div>
                        </CaterpillarHoverPreview>
                      </div>
                    )}

                    {/* Pond Feeding Progress Icons - Show fish symbols for feeding progress */}
                    {field.isPond && field.feedingProgress && field.feedingProgress > 0 && field.feedingProgress < 3 && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        {field.feedingProgress === 1 && (
                          <div className="text-6xl animate-pulse drop-shadow-lg filter drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]">🐟</div>
                        )}
                        {field.feedingProgress === 2 && (
                          <div className="text-6xl animate-bounce drop-shadow-lg filter drop-shadow-[0_2px_8px_rgba(34,197,94,0.5)]">🐠</div>
                        )}
                      </div>
                    )}


                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        <SeedSelectionModal
          isOpen={showSeedModal}
          onClose={() => {
            setShowSeedModal(false);
            setSelectedField(null);
          }}
          seeds={userSeeds || []}
          onSelectSeed={plantSeed}
          fieldIndex={selectedField || 0}
        />

        <BouquetSelectionModal
          isOpen={showBouquetModal}
          onClose={() => {
            setShowBouquetModal(false);
            setSelectedField(null);
          }}
          userBouquets={userBouquets || []}
          onPlaceBouquet={placeBouquet}
          fieldIndex={selectedField || 0}
        />

        {/* Butterfly Selection Modal - DISABLED für direkte Platzierung */}
        <ButterflySelectionModal
          isOpen={showButterflyModal}
          onClose={() => {
            setShowButterflyModal(false);
            setSelectedField(null);
          }}
          userButterflies={userButterflies}
          onSelectButterfly={placeButterflyOnField}
          fieldIndex={selectedField || 0}
        />

        {/* Fish Selection Modal */}
        <FishSelectionModal
          isOpen={showFishModal}
          onClose={() => {
            setShowFishModal(false);
            setSelectedField(null);
          }}
          onFishSelected={handleFishSelection}
        />

        {/* Feeding Dialog */}
        <FeedingDialog
          isOpen={showFeedingDialog}
          onClose={() => {
            setShowFeedingDialog(false);
            setSelectedField(null);
          }}
          caterpillars={userCaterpillars}
          onFeedCaterpillar={onFeedCaterpillar}
          fieldIndex={(selectedField || 1) - 1}
        />

        {/* Caterpillar Selection Modal removed - they spawn automatically */}

        {/* Fish Reward Dialog */}
        <FishRewardDialog
          isOpen={isFishRewardDialogOpen}
          onClose={() => setIsFishRewardDialogOpen(false)}
          fishName={fishRewardData?.fishName || ""}
          fishImageUrl={fishRewardData?.fishImageUrl || ""}
          rarity={fishRewardData?.rarity || "common"}
        />
      </TooltipProvider>
    </div>
  );
};