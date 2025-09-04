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
  const [fieldCaterpillars, setFieldCaterpillars] = useState<any[]>([]);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showBouquetModal, setShowBouquetModal] = useState(false);
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [shakingField, setShakingField] = useState<number | null>(null);
  const [placedBouquets, setPlacedBouquets] = useState<PlacedBouquet[]>([]);
  const [showButterflyModal, setShowButterflyModal] = useState(false);
  const [showFishModal, setShowFishModal] = useState(false);
  const [showFeedingDialog, setShowFeedingDialog] = useState(false);
  // Caterpillar modal removed - they spawn automatically
  const [userButterflies, setUserButterflies] = useState<any[]>([]);
  const [placedButterflies, setPlacedButterflies] = useState<{
    id: number;
    fieldId: number;
    butterflyImageUrl: string;
    butterflyName: string;
    butterflyRarity: string;
    placedAt: Date;
    isShrinkling: boolean;
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

  const fetchTeichData = async () => {
    if (!user) return;

    try {
      // Fetch pond-specific data including feeding progress
      const [caterpillarRes, userCaterpillarsRes, pondProgressRes, butterfliesRes, fieldButterfliesRes] = await Promise.all([
        fetch(`/api/user/${user.id}/field-caterpillars`),
        fetch(`/api/user/${user.id}/caterpillars`),
        fetch(`/api/user/${user.id}/pond-progress`),
        fetch(`/api/user/${user.id}/butterflies`),
        fetch(`/api/user/${user.id}/field-butterflies`)
      ]);

      if (caterpillarRes.ok && userCaterpillarsRes.ok && pondProgressRes.ok && butterfliesRes.ok && fieldButterfliesRes.ok) {
        const [caterpillarData, userCaterpillarsData, pondProgressData, butterfliesData, fieldButterfliesData] = await Promise.all([
          caterpillarRes.json(),
          userCaterpillarsRes.json(),
          pondProgressRes.json(),
          butterfliesRes.json(),
          fieldButterfliesRes.json()
        ]);

        console.log('🌊 Updating pond with field caterpillars:', caterpillarData.fieldCaterpillars);

        // Update pond fields with caterpillars and butterflies (no sun spawns in pond view)
        const updatedFields = gardenFields.map((field) => {
          const fieldIndex = field.id - 1;
          
          // Check for caterpillar (only on grass fields)
          const caterpillar = !field.isPond ? caterpillarData.fieldCaterpillars.find((c: any) => c.fieldId === fieldIndex) : null;
          
          // Check for butterfly (only on grass fields)
          const butterfly = !field.isPond ? fieldButterfliesData.fieldButterflies.find((b: any) => b.fieldIndex === fieldIndex) : null;

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
            butterflyRarity: undefined,
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
            // Add feeding progress for pond fields - disabled to remove "0" display
            feedingProgress: undefined
          };
        });

        setGardenFields(updatedFields);
        // Clear garden-specific data for pond view
        setUserSeeds([]);
        setUserBouquets([]);
        setPlacedBouquets([]);
        setFieldButterflies(fieldButterfliesData.fieldButterflies || []);
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

    // Start first shake after random delay (20-40s)
    const getRandomInterval = () => Math.random() * 20000 + 20000; // 20-40 seconds
    
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

  // SIMPLE NEW BUTTERFLY LIFECYCLE SYSTEM - Database Only
  const butterflyLifecycleTimers = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const [butterflyPhases, setButterflyPhases] = useState<Map<number, 'wiggle' | 'shrink'>>(new Map());

  useEffect(() => {
    // Track database butterflies for lifecycle
    gardenFields.forEach((field) => {
      if (field.hasButterfly && field.butterflyImageUrl && !butterflyLifecycleTimers.current.has(field.id)) {
        console.log(`🦋 NEW SYSTEM: Starting lifecycle for butterfly on field ${field.id}`);
        
        // Set initial wiggle phase
        setButterflyPhases(prev => new Map(prev).set(field.id, 'wiggle'));
        
        // Start lifecycle timer
        const lifecycleTimer = setTimeout(() => {
          console.log(`🦋 NEW SYSTEM: Field ${field.id} → shrink phase`);
          setButterflyPhases(prev => new Map(prev).set(field.id, 'shrink'));
          
          // After 10 more seconds: spawn caterpillar
          const spawnTimer = setTimeout(() => {
            console.log(`🦋 NEW SYSTEM: Field ${field.id} → spawning caterpillar`);
            
            // Remove from phases
            setButterflyPhases(prev => {
              const newMap = new Map(prev);
              newMap.delete(field.id);
              return newMap;
            });
            
            // Spawn caterpillar to database
            fetch('/api/garden/spawn-caterpillar', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'x-user-id': user?.id.toString() || '1'
              },
              body: JSON.stringify({
                fieldIndex: field.id - 1, // Convert to 0-based
                parentRarity: field.butterflyRarity
              })
            }).then(response => {
              if (response.ok) {
                console.log(`🐛 NEW SYSTEM: Caterpillar spawned on field ${field.id - 1}`);
                
                // Remove butterfly from database
                return fetch('/api/garden/remove-butterfly', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': user?.id.toString() || '1'
                  },
                  body: JSON.stringify({
                    fieldIndex: field.id - 1
                  })
                });
              } else {
                throw new Error('Caterpillar spawn failed');
              }
            }).then(response => {
              if (response?.ok) {
                console.log(`🦋 NEW SYSTEM: Butterfly removed from field ${field.id - 1}`);
              }
            }).catch(error => {
              console.error('🦋 NEW SYSTEM: Lifecycle failed:', error);
            });
            
            butterflyLifecycleTimers.current.delete(field.id);
          }, 10000); // 10 seconds shrink phase
          
        }, 5000); // 5 seconds wiggle phase
        
        butterflyLifecycleTimers.current.set(field.id, lifecycleTimer);
      }
    });
    
    // Cleanup timers for removed butterflies
    const currentButterflyFields = new Set(
      gardenFields.filter(f => f.hasButterfly).map(f => f.id)
    );
    
    for (const [fieldId, timer] of butterflyLifecycleTimers.current.entries()) {
      if (!currentButterflyFields.has(fieldId)) {
        clearTimeout(timer);
        butterflyLifecycleTimers.current.delete(fieldId);
        setButterflyPhases(prev => {
          const newMap = new Map(prev);
          newMap.delete(fieldId);
          return newMap;
        });
      }
    }
  }, [gardenFields.map(f => f.hasButterfly ? f.id : null).join(',')]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const timer of butterflyLifecycleTimers.current.values()) {
        clearTimeout(timer);
      }
      butterflyLifecycleTimers.current.clear();
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

        // Add to placedButterflies for lifecycle animations  
        setPlacedButterflies(prev => [...prev, {
          id: Date.now() + Math.random(), // Unique ID
          fieldId: selectedField,
          butterflyImageUrl: butterfly.butterflyImageUrl,
          butterflyName: butterfly.butterflyName,
          butterflyRarity: butterfly.butterflyRarity,
          placedAt: new Date(),
          isShrinkling: false
        }]);

        // Refresh garden data to show placed butterfly
        fetchTeichData();
        showNotification('Butterfly platziert!', `${butterfly.butterflyName} wurde platziert!`, 'success');
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

  const collectFish = () => {
    showNotification('Fisch gesammelt!', 'Der Fisch wurde erfolgreich gesammelt!', 'success');
  };

  // Caterpillars spawn automatically when butterflies disappear, no manual placement


  const collectButterfly = async (fieldId: number) => {
    if (!user) return;
    
    console.log('🦋 Attempting to collect butterfly on field', fieldId - 1);
    
    try {
      const response = await fetch('/api/garden/collect-butterfly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
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
  const collectCaterpillar = async (fieldId: number) => {
    if (!user) return;
    
    console.log('🐛 Attempting to collect caterpillar on field', fieldId - 1);
    
    try {
      const response = await fetch(`/api/user/${user.id}/collect-field-caterpillar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldIndex: fieldId - 1 })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🐛 Raupe erfolgreich gesammelt!');
        showNotification('Raupe gesammelt!', result.message, 'success');
        fetchTeichData();
      } else {
        const error = await response.json();
        showNotification('Fehler', error.message || 'Raupe konnte nicht gesammelt werden.', 'error');
      }
    } catch (error) {
      console.error('Failed to collect caterpillar:', error);
      showNotification('Fehler', 'Netzwerkfehler beim Sammeln der Raupe.', 'error');
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
          fieldIndex: fieldIndex - 1 // Convert to 0-based index
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🐟 Fish feeding result:', result);
        
        if (result.fishCreated) {
          showNotification('Fisch geboren!', `Ein ${result.fishName} wurde geboren! Seltenheit: ${result.fishRarity}`, 'success');
        } else {
          showNotification('Fisch gefüttert!', `Fütterung ${result.feedingCount}/3 abgeschlossen.`, 'success');
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
          fieldIndex: fieldIndex - 1 // Convert to 0-based index
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
            <CardTitle className="text-white text-center">
              <div className="flex items-center justify-center gap-3">
                <Waves className="h-6 w-6 text-blue-400" />
                <span className="text-2xl font-bold text-blue-300">Mein Teich</span>
                <Waves className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-xs text-slate-400">
                Grasfelder: Butterflies • Teichfelder: Fish füttern
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
                          // Check for fish to collect (placeholder - will implement fish detection)
                          console.log("🐟 Check for fish on pond field", field.id);
                        }
                        return;
                      }
                      
                      // GRASFELD: Butterfly platzieren ODER Caterpillar einsammeln
                      if (!field.isPond) {
                        // Check if caterpillar is present on this field to collect
                        const caterpillarOnField = fieldCaterpillars.find(c => c.fieldId === field.id - 1);
                        
                        if (caterpillarOnField) {
                          console.log("🐛 Collecting caterpillar from grass field", field.id);
                          collectCaterpillar(field.id - 1);
                        } else {
                          // Place butterfly on grass field
                          setSelectedField(field.id);
                          setShowButterflyModal(true);
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

                    {/* Butterfly - only show if no local animation running */}
                    {field.hasButterfly && field.butterflyImageUrl && !placedButterflies.find(b => b.fieldId === field.id) && (
                      <ButterflyHoverPreview
                        butterflyId={field.butterflyId!}
                        butterflyName={field.butterflyName!}
                        butterflyImageUrl={field.butterflyImageUrl}
                        rarity={field.butterflyRarity as RarityTier}
                      >
                        <div 
                          className={`absolute inset-0 flex items-center justify-center cursor-pointer transition-all ${field.butterflyShrinking ? 'scale-0 opacity-0' : 'scale-100 opacity-100 hover:scale-110'}`}
                          style={{
                            transitionDuration: field.butterflyShrinking ? '20000ms' : '200ms' // 20s shrinking animation
                          }}
                        >
                          <RarityImage
                            src={field.butterflyImageUrl}
                            alt={field.butterflyName || "Schmetterling"}
                            rarity={field.butterflyRarity as RarityTier || "common"}
                            size="medium"
                            className="w-16 h-16"
                          />
                        </div>
                      </ButterflyHoverPreview>
                    )}

                    {/* Field Caterpillar with Bounce Effect - hide during butterfly animation AND local caterpillars */}
                    {field.hasCaterpillar && field.caterpillarImageUrl && !placedButterflies.find(b => b.fieldId === field.id) && !placedCaterpillars.find(c => c.fieldId === field.id) && (
                      <CaterpillarHoverPreview
                        caterpillarId={field.caterpillarId!}
                        caterpillarName={field.caterpillarName!}
                        caterpillarImageUrl={field.caterpillarImageUrl}
                        rarity={field.caterpillarRarity as RarityTier}
                      >
                        <div 
                          className="absolute inset-0 flex items-center justify-center cursor-pointer transition-all hover:scale-110 animate-bounce-spawn"
                          onClick={() => collectCaterpillar(field.id)}
                          style={{
                            animation: 'bounce-spawn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards'
                          }}
                        >
                          <RarityImage
                            src={field.caterpillarImageUrl}
                            alt={field.caterpillarName || "Raupe"}
                            rarity={field.caterpillarRarity as RarityTier || "common"}
                            size="medium"
                            className="w-16 h-16"
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

                    {/* NEW SIMPLE BUTTERFLY SYSTEM - Database with Phases */}
                    {field.hasButterfly && field.butterflyImageUrl && (
                      <ButterflyHoverPreview
                        butterflyId={field.butterflyId!}
                        butterflyName={field.butterflyName!}
                        butterflyImageUrl={field.butterflyImageUrl}
                        rarity={field.butterflyRarity as RarityTier}
                      >
                        <div 
                          className={`absolute inset-0 flex items-center justify-center cursor-pointer transition-all ${
                            butterflyPhases.get(field.id) === 'shrink' 
                              ? 'opacity-30 transform scale-50' 
                              : 'scale-100 opacity-100 hover:scale-110 animate-wiggle'
                          }`}
                          style={{
                            transitionDuration: butterflyPhases.get(field.id) === 'shrink' ? '10000ms' : '200ms'
                          }}
                        >
                          <RarityImage
                            src={field.butterflyImageUrl}
                            alt={field.butterflyName || "Schmetterling"}
                            rarity={field.butterflyRarity as RarityTier || "common"}
                            size="medium"
                            className="w-16 h-16"
                          />
                        </div>
                      </ButterflyHoverPreview>
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

                    {/* Local Caterpillars REMOVED - Only use database caterpillars */}

                    {/* Pond Feeding Progress Icons - disabled to prevent "0" display */}
                    {false && field.isPond && field.feedingProgress && field.feedingProgress > 0 && field.feedingProgress < 3 && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {field.feedingProgress === 1 && (
                          <div className="text-6xl animate-pulse drop-shadow-lg">🐟</div>
                        )}
                        {field.feedingProgress === 2 && (
                          <div className="text-6xl animate-bounce drop-shadow-lg">🐠</div>
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

        {/* Butterfly Selection Modal */}
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
          fieldIndex={selectedField || 0}
        />

        {/* Caterpillar Selection Modal removed - they spawn automatically */}
      </TooltipProvider>
    </div>
  );
};