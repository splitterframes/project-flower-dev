import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/stores/useAuth";
import { Package, Flower, Bug, Gem, Sprout, Star } from "lucide-react";
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";
import { RarityImage } from "./RarityImage";
import { FlowerHoverPreview } from "./FlowerHoverPreview";

export const InventoryView: React.FC = () => {
  const { user } = useAuth();
  const [mySeeds, setMySeeds] = useState<any[]>([]);
  const [myFlowers, setMyFlowers] = useState<any[]>([]);

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

  useEffect(() => {
    if (user) {
      fetchMySeeds();
      fetchMyFlowers();
    }
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
    <div className="p-6 space-y-6">
      {/* Inventory Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
          <Package className="h-8 w-8 mr-3 text-blue-400" />
          Inventar
        </h1>
        <p className="text-slate-400">Verwalte deine Blumen, Schmetterlinge und Materialien</p>
      </div>

      {/* Inventory Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Seeds */}
        <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Sprout className="h-5 w-5 mr-2 text-green-400" />
              Samen
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

        {/* Flowers */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Flower className="h-5 w-5 mr-2 text-pink-400" />
              Blumen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myFlowers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">Noch keine Blumen gesammelt</p>
                <p className="text-slate-500 text-sm mt-2">Züchte Blumen in deinem Garten</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
                {myFlowers.map((flower) => (
                  <div
                    key={flower.id}
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Butterflies */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Bug className="h-5 w-5 mr-2 text-yellow-400" />
              Schmetterlinge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-slate-400">Noch keine Schmetterlinge gefangen</p>
              <p className="text-slate-500 text-sm mt-2">Schmetterlinge werden von deinen Blumen angezogen</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};