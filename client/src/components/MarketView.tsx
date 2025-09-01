import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { getRarityColor, type RarityTier } from "@shared/rarity";
import { 
  Store,
  TrendingUp,
  ShoppingCart,
  Coins,
  Package,
  HandCoins,
  Star
} from "lucide-react";

interface MarketListing {
  id: number;
  sellerUsername: string;
  seedName: string;
  seedRarity: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

interface Seed {
  id: number;
  name: string;
  rarity: string;
  price: number;
  description?: string;
}

export const MarketView: React.FC = () => {
  const { user } = useAuth();
  const { credits, updateCredits } = useCredits();
  const [marketListings, setMarketListings] = useState<MarketListing[]>([]);
  const [mySeeds, setMySeeds] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [isLoading, setIsLoading] = useState(false);
  
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
  
  // Sell form state
  const [sellForm, setSellForm] = useState({
    seedId: 0,
    quantity: 1,
    pricePerUnit: 10
  });

  useEffect(() => {
    if (user) {
      fetchMarketListings();
      fetchMySeeds();
    }
  }, [user]);

  const fetchMarketListings = async () => {
    try {
      const response = await fetch('/api/market/listings');
      if (response.ok) {
        const data = await response.json();
        setMarketListings(data.listings || []);
      }
    } catch (error) {
      console.error('Failed to fetch market listings:', error);
    }
  };

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

  const buyListing = async (listingId: number, quantity: number, totalCost: number) => {
    if (!user || credits < totalCost) {
      alert(`Du brauchst ${totalCost} Cr um dieses Angebot zu kaufen!`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/market/buy', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user?.id.toString() || '1'
        },
        body: JSON.stringify({ listingId, quantity })
      });

      if (response.ok) {
        await updateCredits(user.id, -totalCost);
        await fetchMarketListings();
        await fetchMySeeds();
        alert('Kauf erfolgreich!');
      } else {
        const error = await response.json();
        alert(error.message || 'Kauf fehlgeschlagen');
      }
    } catch (error) {
      alert('Kauf fehlgeschlagen');
    }
    setIsLoading(false);
  };

  const createListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !sellForm.seedId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/market/create-listing', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user?.id.toString() || '1'
        },
        body: JSON.stringify(sellForm)
      });

      if (response.ok) {
        await fetchMarketListings();
        await fetchMySeeds();
        setSellForm({ seedId: 0, quantity: 1, pricePerUnit: 10 });
        alert('Angebot erfolgreich erstellt!');
      } else {
        const error = await response.json();
        alert(error.message || 'Angebot fehlgeschlagen');
      }
    } catch (error) {
      alert('Angebot fehlgeschlagen');
    }
    setIsLoading(false);
  };


  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardContent className="pt-6">
            <p className="text-center text-slate-400">Bitte melde dich an, um den Markt zu betreten</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-full">
      {/* Compact Market Header */}
      <div className="bg-slate-800/60 p-4 rounded-lg border border-emerald-500/30 text-center">
        <h1 className="text-2xl font-bold text-emerald-300 mb-1">
          Samen Markt 🌱
        </h1>
        <p className="text-slate-400 text-sm">Handel mit anderen Spielern</p>
      </div>

      {/* Compact Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-orange-800/40 to-yellow-800/40 border border-orange-500/30 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold text-orange-300">
                Credits
              </CardTitle>
              <Coins className="h-4 w-4 text-orange-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className="text-2xl font-bold text-orange-400">{credits} Cr</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-800/40 to-emerald-800/40 border border-green-500/30 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold text-green-300">
                Angebote
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className="text-2xl font-bold text-green-400">{marketListings.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-800/40 to-indigo-800/40 border border-blue-500/30 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold text-blue-300">
                Samen
              </CardTitle>
              <Package className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className="text-2xl font-bold text-blue-400">{mySeeds.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Market Tabs */}
      <div className="flex justify-center space-x-4">
        <Button
          variant={activeTab === "buy" ? "default" : "outline"}
          onClick={() => setActiveTab("buy")}
          className={`relative transition-all duration-300 ${
            activeTab === "buy" 
              ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg scale-110" 
              : "border-slate-500 text-slate-300 hover:border-green-400 hover:text-green-400"
          } px-8 py-3 font-bold text-lg`}
        >
          <div className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-3" />
            <span>🛋️ Kaufen</span>
          </div>
          {activeTab === "buy" && (
            <div className="absolute inset-0 bg-green-400 rounded opacity-20 animate-ping"></div>
          )}
        </Button>
        <Button
          variant={activeTab === "sell" ? "default" : "outline"}
          onClick={() => setActiveTab("sell")}
          className={`relative transition-all duration-300 ${
            activeTab === "sell" 
              ? "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg scale-110" 
              : "border-slate-500 text-slate-300 hover:border-orange-400 hover:text-orange-400"
          } px-8 py-3 font-bold text-lg`}
        >
          <div className="flex items-center">
            <HandCoins className="h-5 w-5 mr-3" />
            <span>💰 Verkaufen</span>
          </div>
          {activeTab === "sell" && (
            <div className="absolute inset-0 bg-orange-400 rounded opacity-20 animate-ping"></div>
          )}
        </Button>
      </div>

      {/* Enhanced Market Content */}
      {activeTab === "buy" && (
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-green-500/30 shadow-2xl">
          <CardHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-t-lg -mx-6 -my-2"></div>
            <CardTitle className="text-white flex items-center relative z-10">
              <div className="relative">
                <ShoppingCart className="h-8 w-8 mr-3 text-green-400 animate-pulse" />
                <div className="absolute inset-0 h-8 w-8 mr-3 text-green-400 animate-ping opacity-30"></div>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">
                Markt Angebote 🛋️
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {marketListings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">Noch keine Angebote verfügbar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="bg-slate-900 rounded-lg p-4 border-2"
                    style={{ borderColor: getBorderColor(listing.seedRarity as RarityTier) }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-white">{listing.seedName}</h4>
                      <div className="flex items-center">
                        <Star className={`h-4 w-4 mr-1 ${getRarityColor(listing.seedRarity as RarityTier)}`} />
                        <span className={`text-xs ${getRarityColor(listing.seedRarity as RarityTier)}`}>
                          {listing.seedRarity}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">Von: {listing.sellerUsername}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Menge:</span>
                        <span className="text-white">{listing.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Preis/Stück:</span>
                        <span className="text-orange-400">{listing.pricePerUnit} Cr</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-300">Gesamt:</span>
                        <span className="text-orange-400">{listing.totalPrice} Cr</span>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-4 bg-green-600 hover:bg-green-700"
                      onClick={() => buyListing(listing.id, listing.quantity, listing.totalPrice)}
                      disabled={isLoading || credits < listing.totalPrice}
                    >
                      {isLoading ? "Kaufe..." : "Kaufen"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "sell" && (
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-orange-500/30 shadow-2xl">
          <CardHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-t-lg -mx-6 -my-2"></div>
            <CardTitle className="text-white flex items-center relative z-10">
              <div className="relative">
                <HandCoins className="h-8 w-8 mr-3 text-orange-400 animate-pulse" />
                <div className="absolute inset-0 h-8 w-8 mr-3 text-orange-400 animate-ping opacity-30"></div>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-orange-300 to-yellow-300 bg-clip-text text-transparent">
                Samen Verkaufen 💰
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mySeeds.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">Du hast noch keine Samen zum Verkaufen</p>
                <p className="text-slate-500 text-sm mt-2">Züchte Blumen im Garten um Samen zu erhalten</p>
              </div>
            ) : (
              <form onSubmit={createListing} className="space-y-4 max-w-md mx-auto">
                <div>
                  <Label htmlFor="seedSelect">Samen auswählen</Label>
                  <select
                    id="seedSelect"
                    value={sellForm.seedId}
                    onChange={(e) => setSellForm({...sellForm, seedId: Number(e.target.value)})}
                    className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md text-white"
                    required
                  >
                    <option value={0}>-- Samen wählen --</option>
                    {mySeeds.map((seed) => (
                      <option key={seed.id} value={seed.seedId}>
                        {seed.seedName} (x{seed.quantity})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="quantity">Menge</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={sellForm.quantity}
                    onChange={(e) => setSellForm({...sellForm, quantity: Number(e.target.value)})}
                    className="bg-slate-900 border-slate-600 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="pricePerUnit">Preis pro Stück (Cr)</Label>
                  <Input
                    id="pricePerUnit"
                    type="number"
                    min="1"
                    value={sellForm.pricePerUnit}
                    onChange={(e) => setSellForm({...sellForm, pricePerUnit: Number(e.target.value)})}
                    className="bg-slate-900 border-slate-600 text-white"
                    required
                  />
                </div>

                <div className="bg-slate-900 p-3 rounded-md">
                  <p className="text-slate-300">
                    Gesamtpreis: <span className="text-orange-400 font-bold">
                      {sellForm.quantity * sellForm.pricePerUnit} Cr
                    </span>
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={isLoading || !sellForm.seedId}
                >
                  {isLoading ? "Erstelle Angebot..." : "Angebot erstellen"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};