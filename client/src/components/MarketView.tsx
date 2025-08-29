import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-400';
      case 'rare': return 'text-purple-400';
      case 'uncommon': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-400';
      case 'rare': return 'border-purple-400';
      case 'uncommon': return 'border-blue-400';
      default: return 'border-gray-400';
    }
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
    <div className="p-6 space-y-6">
      {/* Market Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
          <Store className="h-8 w-8 mr-3 text-green-400" />
          Samen Markt
        </h1>
        <p className="text-slate-400">Handel mit anderen Spielern und finde seltene Samen</p>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Deine Credits
            </CardTitle>
            <Coins className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{credits} Cr</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Aktive Angebote
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{marketListings.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Deine Samen
            </CardTitle>
            <Package className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{mySeeds.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Market Tabs */}
      <div className="flex justify-center space-x-2">
        <Button
          variant={activeTab === "buy" ? "default" : "outline"}
          onClick={() => setActiveTab("buy")}
          className={activeTab === "buy" ? "bg-green-600 hover:bg-green-700" : "border-slate-600"}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Kaufen
        </Button>
        <Button
          variant={activeTab === "sell" ? "default" : "outline"}
          onClick={() => setActiveTab("sell")}
          className={activeTab === "sell" ? "bg-orange-600 hover:bg-orange-700" : "border-slate-600"}
        >
          <HandCoins className="h-4 w-4 mr-2" />
          Verkaufen
        </Button>
      </div>

      {/* Market Content */}
      {activeTab === "buy" && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2 text-green-400" />
              Markt Angebote
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
                    className={`bg-slate-900 rounded-lg p-4 border-2 ${getRarityBorder(listing.seedRarity)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-white">{listing.seedName}</h4>
                      <div className="flex items-center">
                        <Star className={`h-4 w-4 mr-1 ${getRarityColor(listing.seedRarity)}`} />
                        <span className={`text-xs ${getRarityColor(listing.seedRarity)}`}>
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
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <HandCoins className="h-5 w-5 mr-2 text-orange-400" />
              Samen Verkaufen
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