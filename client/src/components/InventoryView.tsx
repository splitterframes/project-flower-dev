import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/stores/useAuth";
import { Package, Flower, Bug, Gem, Sprout, Star } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";
import { RarityImage } from "./RarityImage";
import { FlowerHoverPreview } from "./FlowerHoverPreview";
import { ButterflyHoverPreview } from "./ButterflyHoverPreview";
import type { UserFlower, UserBouquet, UserButterfly } from "@shared/schema";

export const InventoryView: React.FC = () => {
  const { user } = useAuth();
  const [mySeeds, setMySeeds] = useState<any[]>([]);
  const [myFlowers, setMyFlowers] = useState<UserFlower[]>([]);
  const [myBouquets, setMyBouquets] = useState<UserBouquet[]>([]);
  const [myButterflies, setMyButterflies] = useState<UserButterfly[]>([]);

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

  const getSortedFlowers = (rarityFilter?: string | string[]) => {
    let filtered = myFlowers;
    
    if (rarityFilter) {
      if (Array.isArray(rarityFilter)) {
        filtered = myFlowers.filter(flower => flower.flowerRarity && rarityFilter.includes(flower.flowerRarity));
      } else {
        filtered = myFlowers.filter(flower => flower.flowerRarity === rarityFilter);
      }
    }
    
    return filtered.sort((a, b) => (a.flowerName || '').localeCompare(b.flowerName || ''));
  };

  const getFlowersByRarity = (rarity: string) => {
    return myFlowers.filter(flower => flower.flowerRarity === rarity);
  };

  const getButterflyesByRarity = (rarity: string) => {
    return myButterflies.filter(butterfly => butterfly.butterflyRarity === rarity);
  };

  const getBouquetsByRarity = (rarity: string) => {
    return myBouquets.filter(bouquet => (bouquet.bouquetRarity || "common") === rarity && bouquet.quantity > 0);
  };

  const getSortedButterflies = (rarityFilter?: string | string[]) => {
    let filtered = myButterflies;
    
    if (rarityFilter) {
      if (Array.isArray(rarityFilter)) {
        filtered = myButterflies.filter(butterfly => rarityFilter.includes(butterfly.butterflyRarity));
      } else {
        filtered = myButterflies.filter(butterfly => butterfly.butterflyRarity === rarityFilter);
      }
    }
    
    return filtered.sort((a, b) => a.butterflyName.localeCompare(b.butterflyName));
  };

  const getSortedBouquets = (rarityFilter?: string | string[]) => {
    let filtered = myBouquets.filter(bouquet => bouquet.quantity > 0);
    
    if (rarityFilter) {
      if (Array.isArray(rarityFilter)) {
        filtered = filtered.filter(bouquet => rarityFilter.includes(bouquet.bouquetRarity || "common"));
      } else {
        filtered = filtered.filter(bouquet => (bouquet.bouquetRarity || "common") === rarityFilter);
      }
    }
    
    return filtered.sort((a, b) => a.bouquetName.localeCompare(b.bouquetName));
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'Gewöhnlich';
      case 'uncommon': return 'Ungewöhnlich'; 
      case 'rare': return 'Selten';
      case 'super-rare': return 'Super-Selten';
      case 'epic': return 'Episch';
      case 'legendary': return 'Legendär';
      case 'mythical': return 'Mythisch';
      default: return rarity;
    }
  };

  const getRarityColorClass = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-yellow-400';
      case 'uncommon': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'super-rare': return 'text-cyan-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-orange-400';
      case 'mythical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const rarities = ['common', 'uncommon', 'rare', 'super-rare', 'epic', 'legendary', 'mythical'];

  const FlowerCard = ({ flower, getBorderColor }: { flower: any; getBorderColor: (rarity: RarityTier) => string }) => (
    <div
      className="bg-slate-900 rounded-lg p-3 border-2"
      style={{ borderColor: getBorderColor(flower.flowerRarity as RarityTier) }}
    >
      <div className="flex items-center space-x-3">
        <FlowerHoverPreview
          flowerImageUrl={flower.flowerImageUrl}
          flowerName={flower.flowerName}
          rarity={flower.flowerRarity as RarityTier}
        >
          <RarityImage 
            src={flower.flowerImageUrl}
            alt={flower.flowerName}
            rarity={flower.flowerRarity as RarityTier}
            size="medium"
            className="w-12 h-12"
          />
        </FlowerHoverPreview>
        <div className="flex-1">
          <h4 className="font-bold text-white text-sm">{flower.flowerName}</h4>
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs ${getRarityColor(flower.flowerRarity as RarityTier)}`}>
              {getRarityDisplayName(flower.flowerRarity as RarityTier)}
            </span>
            <span className="text-sm font-bold text-green-400 flex-shrink-0">x{flower.quantity}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const ButterflyCard = ({ butterfly, getBorderColor }: { butterfly: any; getBorderColor: (rarity: RarityTier) => string }) => (
    <div
      className="bg-slate-900 rounded-lg p-3 border-2"
      style={{ borderColor: getBorderColor(butterfly.butterflyRarity as RarityTier) }}
    >
      <div className="flex items-center space-x-3">
        <ButterflyHoverPreview
          butterflyImageUrl={butterfly.butterflyImageUrl}
          butterflyName={butterfly.butterflyName}
          rarity={butterfly.butterflyRarity as RarityTier}
        >
          <RarityImage 
            src={butterfly.butterflyImageUrl}
            alt={butterfly.butterflyName}
            rarity={butterfly.butterflyRarity as RarityTier}
            size="medium"
            className="w-12 h-12"
          />
        </ButterflyHoverPreview>
        <div className="flex-1">
          <h4 className="font-bold text-white text-sm">{butterfly.butterflyName}</h4>
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs ${getRarityColor(butterfly.butterflyRarity as RarityTier)}`}>
              {getRarityDisplayName(butterfly.butterflyRarity as RarityTier)}
            </span>
            <span className="text-sm font-bold text-green-400 flex-shrink-0">x{butterfly.quantity}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const BouquetCard = ({ bouquet, getBorderColor }: { bouquet: any; getBorderColor: (rarity: RarityTier) => string }) => (
    <div
      className="bg-slate-900 rounded-lg p-3 border-2"
      style={{ borderColor: getBorderColor((bouquet.bouquetRarity || "common") as RarityTier) }}
    >
      <div className="flex items-center space-x-3">
        <RarityImage 
          src="/Blumen/Bouquet.jpg"
          alt="Bouquet"
          rarity={(bouquet.bouquetRarity || "common") as RarityTier}
          size="medium"
          className="w-12 h-12"
        />
        <div className="flex-1">
          <h4 className="font-bold text-white text-sm">{bouquet.bouquetName}</h4>
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs ${getRarityColor((bouquet.bouquetRarity || "common") as RarityTier)}`}>
              {getRarityDisplayName((bouquet.bouquetRarity || "common") as RarityTier)}
            </span>
            <span className="text-sm font-bold text-green-400 flex-shrink-0">x{bouquet.quantity}</span>
          </div>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (user) {
      fetchMySeeds();
      fetchMyFlowers();
      fetchMyBouquets();
      fetchMyButterflies();
    }
  }, [user]);

  // Auto-refresh butterflies inventory every 15 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchMyButterflies();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [user]);

  const fetchMySeeds = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/${user.id}/seeds`);
      if (response.ok) {
        const data = await response.json();
        setMySeeds(data.seeds || []);
      }
    } catch (error) {
      console.error('Failed to fetch my seeds:', error);
    }
  };

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
        setMyBouquets(data.bouquets || []);
      }
    } catch (error) {
      console.error('Failed to fetch my bouquets:', error);
    }
  };

  const fetchMyButterflies = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/${user.id}/butterflies`);
      if (response.ok) {
        const data = await response.json();
        setMyButterflies(data.butterflies || []);
      }
    } catch (error) {
      console.error('Failed to fetch my butterflies:', error);
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
        // Refresh all relevant data
        await fetchMyFlowers();
        await fetchMyBouquets();
        // Update credits would be here if we had access to it
      } else {
        const error = await response.json();
        alert(error.message || 'Fehler beim Erstellen des Bouquets');
      }
    } catch (error) {
      console.error('Failed to create bouquet:', error);
      alert('Fehler beim Erstellen des Bouquets');
    }
  };


  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardContent className="pt-6">
            <p className="text-center text-slate-400">Bitte melde dich an, um dein Inventar zu sehen</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-full">
      {/* Compact Inventory Header */}
      <div className="bg-slate-800/60 p-4 rounded-lg border border-indigo-500/30 text-center">
        <h1 className="text-2xl font-bold text-indigo-300 mb-1">
          Inventar 🎒
        </h1>
        <p className="text-slate-400 text-sm">Verwalte deine Blumen und Schmetterlinge</p>
      </div>

      {/* Organized Inventory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seeds Section */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-green-500/30 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center">
              <Sprout className="h-5 w-5 mr-2 text-green-400" />
              <span className="text-lg font-semibold text-green-300">
                Samen 🌱 ({mySeeds.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mySeeds.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">Noch keine Samen gesammelt</p>
                <p className="text-slate-500 text-sm mt-2">Kaufe Samen im Markt oder erhalte sie durch Gärtnern</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mySeeds.map((userSeed) => (
                  <div
                    key={userSeed.id}
                    className="bg-slate-900 rounded-lg p-3 border-2"
                    style={{ borderColor: getBorderColor(userSeed.seedRarity as RarityTier) }}
                  >
                    <div className="flex items-center space-x-3">
                      <RarityImage 
                        src="/Blumen/0.jpg"
                        alt={userSeed.seedName}
                        rarity={userSeed.seedRarity as RarityTier}
                        size="large"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-sm">{userSeed.seedName}</h4>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs ${getRarityColor(userSeed.seedRarity as RarityTier)}`}>
                            {getRarityDisplayName(userSeed.seedRarity as RarityTier)}
                          </span>
                          <span className="text-sm font-bold text-green-400 flex-shrink-0">x{userSeed.quantity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Flowers Section */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-pink-500/30 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center">
              <Flower className="h-5 w-5 mr-2 text-pink-400" />
              <span className="text-lg font-semibold text-pink-300">
                Blumen 🌸 ({myFlowers.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myFlowers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">Noch keine Blumen gesammelt</p>
                <p className="text-slate-500 text-sm mt-2">Züchte Blumen in deinem Garten</p>
              </div>
            ) : (
              <Accordion type="multiple" className="w-full space-y-2">
                {rarities.map((rarity) => {
                  const flowersInRarity = getFlowersByRarity(rarity);
                  if (flowersInRarity.length === 0) return null;
                  
                  return (
                    <AccordionItem key={rarity} value={rarity} className="border border-slate-600 rounded-lg bg-slate-800/50">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                          <span className={`font-semibold ${getRarityColorClass(rarity)}`}>
                            {getRarityLabel(rarity)}
                          </span>
                          <span className="text-sm text-slate-400">
                            {flowersInRarity.reduce((sum, flower) => sum + flower.quantity, 0)} Blumen
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
                          {getSortedFlowers(rarity).map((flower) => (
                            <FlowerCard key={flower.id} flower={flower} getBorderColor={getBorderColor} />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* Butterflies Section */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-yellow-500/30 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center">
              <Bug className="h-5 w-5 mr-2 text-yellow-400" />
              <span className="text-lg font-semibold text-yellow-300">
                Schmetterlinge 🦋 ({myButterflies.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myButterflies.length === 0 ? (
              <div className="text-center py-12 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 rounded-lg"></div>
                <div className="relative z-10">
                  <div className="relative mb-6">
                    <Bug className="h-16 w-16 text-yellow-400 mx-auto animate-bounce" />
                    <div className="absolute inset-0 h-16 w-16 mx-auto text-yellow-400 animate-ping opacity-20"></div>
                  </div>
                  <p className="text-slate-300 text-xl mb-3">🦋 Noch keine Schmetterlinge gefangen</p>
                  <p className="text-slate-400 text-lg">Schmetterlinge werden von deinen Blumen angezogen</p>
                </div>
              </div>
            ) : (
              <Accordion type="multiple" className="w-full space-y-2">
                {rarities.map((rarity) => {
                  const butterfliesInRarity = getButterflyesByRarity(rarity);
                  if (butterfliesInRarity.length === 0) return null;
                  
                  return (
                    <AccordionItem key={rarity} value={rarity} className="border border-slate-600 rounded-lg bg-slate-800/50">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                          <span className={`font-semibold ${getRarityColorClass(rarity)}`}>
                            {getRarityLabel(rarity)}
                          </span>
                          <span className="text-sm text-slate-400">
                            {butterfliesInRarity.reduce((sum, butterfly) => sum + butterfly.quantity, 0)} Schmetterlinge
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
                          {getSortedButterflies(rarity).map((butterfly) => (
                            <ButterflyCard key={butterfly.id} butterfly={butterfly} getBorderColor={getBorderColor} />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* Bouquets Section */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/30 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center">
              <Gem className="h-5 w-5 mr-2 text-purple-400" />
              <span className="text-lg font-semibold text-purple-300">
                Bouquets 💐 ({myBouquets.filter(b => b.quantity > 0).length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myBouquets.filter(b => b.quantity > 0).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">Noch keine Bouquets erstellt</p>
                <p className="text-slate-500 text-sm mt-2">Erstelle Bouquets im Bouquet-Bereich</p>
              </div>
            ) : (
              <Accordion type="multiple" className="w-full space-y-2">
                {rarities.map((rarity) => {
                  const bouquetsInRarity = getBouquetsByRarity(rarity);
                  if (bouquetsInRarity.length === 0) return null;
                  
                  return (
                    <AccordionItem key={rarity} value={rarity} className="border border-slate-600 rounded-lg bg-slate-800/50">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                          <span className={`font-semibold ${getRarityColorClass(rarity)}`}>
                            {getRarityLabel(rarity)}
                          </span>
                          <span className="text-sm text-slate-400">
                            {bouquetsInRarity.reduce((sum, bouquet) => sum + bouquet.quantity, 0)} Bouquets
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
                          {getSortedBouquets(rarity).map((bouquet) => (
                            <BouquetCard key={bouquet.id} bouquet={bouquet} getBorderColor={getBorderColor} />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
};