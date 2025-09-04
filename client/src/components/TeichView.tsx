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
  hasSunSpawn?: boolean;
  sunSpawnAmount?: number;
  sunSpawnExpiresAt?: Date;
  isPond?: boolean; // New field for pond areas
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
  const [fieldButterflies, setFieldButterflies] = useState<FieldButterfly[]>([]);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showBouquetModal, setShowBouquetModal] = useState(false);
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [shakingField, setShakingField] = useState<number | null>(null);
  const [placedBouquets, setPlacedBouquets] = useState<PlacedBouquet[]>([]);

  const fetchGardenData = async () => {
    if (!user) return;

    try {
      // Fetch all data in parallel
      const [fieldsRes, unlockedRes, seedsRes, bouquetsRes, placedBouquetsRes, butterflyRes, sunSpawnsRes] = await Promise.all([
        fetch(`/api/garden/fields/${user.id}`),
        fetch(`/api/user/${user.id}/unlocked-fields`),
        fetch(`/api/user/${user.id}/seeds`),
        fetch(`/api/user/${user.id}/bouquets`),
        fetch(`/api/user/${user.id}/placed-bouquets`),
        fetch(`/api/user/${user.id}/field-butterflies`),
        fetch(`/api/garden/sun-spawns`)
      ]);

      if (fieldsRes.ok && unlockedRes.ok && seedsRes.ok && bouquetsRes.ok) {
        const [fieldsData, unlockedData, seedsData, bouquetsData, placedData, butterflyData, sunSpawnsData] = await Promise.all([
          fieldsRes.json(),
          unlockedRes.json(),
          seedsRes.json(),
          bouquetsRes.json(),
          placedBouquetsRes.json(),
          butterflyRes.json(),
          sunSpawnsRes.json()
        ]);

        console.log('Updating garden with planted fields:', fieldsData.fields);
        console.log('Updating garden with placed bouquets:', placedData.placedBouquets);
        console.log('Updating garden with field butterflies:', butterflyData.fieldButterflies);
        console.log('Updating garden with sun spawns:', sunSpawnsData.sunSpawns);

        // Update garden fields with all data
        const updatedFields = Array.from({ length: 50 }, (_, i) => {
          const fieldId = i + 1;
          const fieldData = fieldsData.fields.find((f: any) => f.fieldIndex === i);
          const isUnlocked = !isPondField(fieldId); // All non-pond fields are unlocked
          const placedBouquet = placedData.placedBouquets.find((b: any) => b.fieldIndex === i);
          const butterfly = butterflyData.fieldButterflies.find((b: any) => b.fieldIndex === i);
          const sunSpawn = sunSpawnsData.sunSpawns.find((s: any) => s.fieldIndex === i && s.isActive);

          return {
            id: fieldId,
            isUnlocked,
            hasPlant: !!fieldData,
            plantType: fieldData ? 'seed' : undefined,
            isGrowing: fieldData ? !fieldData.isGrown : false,
            plantedAt: fieldData ? new Date(fieldData.plantedAt) : undefined,
            growthTimeSeconds: fieldData ? getGrowthTime(fieldData.seedRarity) : undefined,
            seedRarity: fieldData?.seedRarity,
            flowerId: fieldData?.flowerId,
            flowerName: fieldData?.flowerName,
            flowerImageUrl: fieldData?.flowerImageUrl,
            hasBouquet: !!placedBouquet,
            bouquetId: placedBouquet?.bouquetId,
            bouquetName: placedBouquet?.bouquetName,
            bouquetRarity: placedBouquet?.bouquetRarity,
            bouquetPlacedAt: placedBouquet ? new Date(placedBouquet.placedAt) : undefined,
            bouquetExpiresAt: placedBouquet ? new Date(placedBouquet.expiresAt) : undefined,
            hasButterfly: !!butterfly,
            butterflyId: butterfly?.butterflyId,
            butterflyName: butterfly?.butterflyName,
            butterflyImageUrl: butterfly?.butterflyImageUrl,
            butterflyRarity: butterfly?.butterflyRarity,
            hasSunSpawn: !!sunSpawn,
            sunSpawnAmount: sunSpawn?.sunAmount,
            sunSpawnExpiresAt: sunSpawn ? new Date(sunSpawn.expiresAt) : undefined,
            isPond: isPondField(fieldId)
          };
        });

        setGardenFields(updatedFields);
        setUserSeeds(seedsData.seeds);
        setUserBouquets(bouquetsData.bouquets);
        setPlacedBouquets(placedData.placedBouquets);
        setFieldButterflies(butterflyData.fieldButterflies);
        setSunSpawns(sunSpawnsData.sunSpawns);
      }
    } catch (error) {
      console.error('Failed to fetch garden data:', error);
    }
  };

  useEffect(() => {
    fetchGardenData();
    const interval = setInterval(fetchGardenData, 10000);
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
        fetchGardenData();
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
        fetchGardenData();
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
        fetchGardenData();
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
        fetchGardenData();
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
        fetchGardenData();
      } else {
        const error = await response.json();
        showNotification('Fehler', error.message || 'Schmetterling konnte nicht gesammelt werden.', 'error');
      }
    } catch (error) {
      console.error('Failed to collect butterfly:', error);
      showNotification('Fehler', 'Netzwerkfehler beim Sammeln des Schmetterlings.', 'error');
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
        fetchGardenData();
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
                Links: Samen • Rechts: Bouquet
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
                      aspect-square border-2 rounded-lg relative flex items-center justify-center cursor-pointer transition-all touch-target
                      ${field.isPond 
                        ? 'border-blue-500 bg-gradient-to-br from-blue-800/40 to-teal-800/40' 
                        : field.isUnlocked 
                          ? 'border-green-500 bg-green-900/20 hover:bg-green-900/40 active:bg-green-900/60' 
                          : isNextToUnlock 
                            ? 'border-orange-500 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 opacity-50' 
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
                        showNotification('Dies ist ein Teichfeld - hier können keine Pflanzen angebaut werden.', 'info', 'Teichfeld');
                        return;
                      }
                      
                      // For now, non-pond fields are unlocked but without function
                      if (field.isUnlocked && !field.isPond) {
                        showNotification('Diese Felder sind noch nicht funktional.', 'info', 'In Entwicklung');
                        return;
                      }
                      
                      // No sun collection in TeichView
                      if (field.hasButterfly) {
                        collectButterfly(field.id);
                      } else if (field.hasPlant && !field.isGrowing) {
                        harvestField(field.id);
                      } else if (field.isUnlocked && !field.hasPlant && !field.hasBouquet) {
                        setSelectedField(field.id);
                        setShowSeedModal(true);
                      } else if (field.isUnlocked && !field.hasBouquet && !field.hasPlant) {
                        setSelectedField(field.id);
                        setShowBouquetModal(true);
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

                    {/* Butterfly */}
                    {field.hasButterfly && field.butterflyImageUrl && (
                      <ButterflyHoverPreview
                        butterflyId={field.butterflyId!}
                        butterflyName={field.butterflyName!}
                        butterflyImageUrl={field.butterflyImageUrl}
                        rarity={field.butterflyRarity as RarityTier}
                      >
                        <div className="absolute inset-0 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                          <RarityImage
                            src={field.butterflyImageUrl}
                            alt={field.butterflyName || "Schmetterling"}
                            rarity={field.butterflyRarity as RarityTier || "common"}
                            size="small"
                            className="w-8 h-8"
                          />
                        </div>
                      </ButterflyHoverPreview>
                    )}

                    {/* Bouquet */}
                    {field.hasBouquet && (
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
      </TooltipProvider>
    </div>
  );
};