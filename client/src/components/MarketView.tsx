import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { useSuns } from "@/lib/stores/useSuns";
import { useNotification } from "../hooks/useNotification";
import { getRarityColor, generateLatinCaterpillarName, type RarityTier } from "@shared/rarity";

// getBorderColor helper function
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
import { 
  Store,
  TrendingUp,
  ShoppingCart,
  Coins,
  Package,
  HandCoins,
  Star
} from "lucide-react";
import { HelpButton } from './HelpButton';

interface MarketListing {
  id: number;
  sellerUsername: string;
  itemType: 'seed' | 'caterpillar';
  // Seed fields
  seedName?: string;
  seedRarity?: string;
  // Caterpillar fields
  caterpillarId?: number;
  caterpillarName?: string;
  caterpillarRarity?: string;
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
  const { suns, setSuns } = useSuns();
  const { showNotification } = useNotification();
  const [marketListings, setMarketListings] = useState<MarketListing[]>([]);
  const [creditOffers, setCreditOffers] = useState<any[]>([]);
  const [sunOffers, setSunOffers] = useState<any[]>([]);
  const [mySeeds, setMySeeds] = useState<any[]>([]);
  const [myCaterpillars, setMyCaterpillars] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"buy" | "sell" | "server">("buy");
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
    itemType: 'seed' as 'seed' | 'caterpillar',
    seedId: 0,
    caterpillarId: 0,
    quantity: 1,
    pricePerUnit: 10
  });

  useEffect(() => {
    if (user) {
      fetchMarketListings();
      fetchServerOffers();
      fetchMySeeds();
      fetchMyCaterpillars();
    }
  }, [user]);

  const fetchServerOffers = async () => {
    try {
      const response = await fetch('/api/market/server-shop');
      if (response.ok) {
        const data = await response.json();
        setCreditOffers(data.creditOffers || []);
        setSunOffers(data.sunOffers || []);
      }
    } catch (error) {
      console.error('Failed to fetch server offers:', error);
    }
  };

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

  const fetchMyCaterpillars = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/${user.id}/caterpillars`);
      if (response.ok) {
        const data = await response.json();
        setMyCaterpillars(data.caterpillars || []);
      }
    } catch (error) {
      console.error('Failed to fetch my caterpillars:', error);
    }
  };

  const buyListing = async (listingId: number, quantity: number, totalCost: number) => {
    if (!user || credits < totalCost) {
      showNotification(`Du brauchst ${totalCost} Cr um dieses Angebot zu kaufen!`, 'warning');
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
        await fetchMyCaterpillars();
        showNotification('Kauf erfolgreich!', 'success');
      } else {
        const error = await response.json();
        showNotification(error.message || 'Kauf fehlgeschlagen', 'error');
      }
    } catch (error) {
      showNotification('Kauf fehlgeschlagen', 'error');
    }
    setIsLoading(false);
  };

  const createListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (sellForm.itemType === 'seed' && !sellForm.seedId) return;
    if (sellForm.itemType === 'caterpillar' && !sellForm.caterpillarId) return;

    setIsLoading(true);
    try {
      // Create clean request data - only send relevant fields
      const requestData = {
        itemType: sellForm.itemType,
        ...(sellForm.itemType === 'seed' ? { seedId: sellForm.seedId } : { caterpillarId: sellForm.caterpillarId }),
        quantity: sellForm.quantity,
        pricePerUnit: sellForm.pricePerUnit
      };

      const response = await fetch('/api/market/create-listing', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user?.id.toString() || '1'
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        // Immediately remove the sold item from local state for instant UI update
        if (sellForm.itemType === 'caterpillar' && sellForm.caterpillarId) {
          setMyCaterpillars(prev => prev.filter(cat => cat.id !== sellForm.caterpillarId));
        } else if (sellForm.itemType === 'seed' && sellForm.seedId) {
          setMySeeds(prev => prev.map(seed => 
            seed.seedId === sellForm.seedId 
              ? { ...seed, quantity: Math.max(0, seed.quantity - sellForm.quantity) }
              : seed
          ).filter(seed => seed.quantity > 0));
        }
        
        await fetchMarketListings();
        await fetchMySeeds();
        await fetchMyCaterpillars();
        setSellForm({ 
          itemType: 'seed',
          seedId: 0, 
          caterpillarId: 0,
          quantity: 1, 
          pricePerUnit: 10 
        });
        showNotification('Angebot erfolgreich erstellt!', 'success');
      } else {
        const error = await response.json();
        showNotification(error.message || 'Angebot fehlgeschlagen', 'error');
      }
    } catch (error) {
      showNotification('Angebot fehlgeschlagen', 'error');
    }
    setIsLoading(false);
  };

  const buyFromServer = async (seedId: number, quantity: number, totalCost: number) => {
    if (!user || credits < totalCost) {
      showNotification(`Du brauchst ${totalCost} Cr um ${quantity} Samen zu kaufen!`, 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/market/buy-from-server', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({ seedId, quantity })
      });

      if (response.ok) {
        const data = await response.json();
        await updateCredits(user.id, -totalCost);
        await fetchMySeeds();
        showNotification(data.message || 'Kauf erfolgreich!', 'success');
      } else {
        const error = await response.json();
        showNotification(error.message || 'Kauf fehlgeschlagen', 'error');
      }
    } catch (error) {
      showNotification('Kauf fehlgeschlagen', 'error');
    }
    setIsLoading(false);
  };

  const buyFromServerWithSuns = async (seedId: number, quantity: number, pricePerUnit: number) => {
    if (!user) return;
    
    const totalCost = quantity * pricePerUnit;
    
    if (suns < totalCost) {
      showNotification(`Du brauchst ${totalCost} Sonnen um ${quantity} Samen zu kaufen!`, 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/market/buy-from-server-suns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString()
        },
        body: JSON.stringify({ seedId, quantity })
      });

      if (response.ok) {
        const data = await response.json();
        showNotification(data.message, 'success');
        // Update suns by fetching from server
        const sunsResponse = await fetch(`/api/user/${user.id}/suns`);
        if (sunsResponse.ok) {
          const sunsData = await sunsResponse.json();
          setSuns(sunsData.suns);
        }
        await fetchMySeeds();
      } else {
        const errorData = await response.json();
        showNotification(errorData.message || 'Fehler beim Kauf', 'error');
      }
    } catch (error) {
      console.error('Suns purchase error:', error);
      showNotification('Fehler beim Kauf', 'error');
    } finally {
      setIsLoading(false);
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
    <div className="p-6 space-y-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-full">
      {/* Market Header with Stats */}
      <div className="bg-slate-800/60 p-6 rounded-lg border border-emerald-500/30">
        {/* Title Section */}
        <div className="flex items-center justify-between mb-4">
          <div></div> {/* Spacer links */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-emerald-300 mb-1">
              Samen Markt 🌱
            </h1>
            <p className="text-slate-400 text-sm">Handel mit anderen Spielern</p>
          </div>
          <div className="flex justify-end">
            <HelpButton helpText="Im Markt kaufst du Samen von anderen Spielern oder vom Server. Du kannst auch deine eigenen Samen verkaufen und Credits verdienen. Schau regelmäßig nach neuen Angeboten!" viewType="market" />
          </div>
        </div>
        
        {/* Compact Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-orange-800/40 to-yellow-800/40 border border-orange-500/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Coins className="h-3 w-3 text-orange-400 mr-1" />
              <span className="text-xs font-semibold text-orange-300">Credits</span>
            </div>
            <div className="text-lg font-bold text-orange-400">{credits} Cr</div>
          </div>

          <div className="bg-gradient-to-br from-green-800/40 to-emerald-800/40 border border-green-500/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
              <span className="text-xs font-semibold text-green-300">Angebote</span>
            </div>
            <div className="text-lg font-bold text-green-400">{marketListings.length}</div>
          </div>

          <div className="bg-gradient-to-br from-blue-800/40 to-indigo-800/40 border border-blue-500/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Package className="h-3 w-3 text-blue-400 mr-1" />
              <span className="text-xs font-semibold text-blue-300">Samen</span>
            </div>
            <div className="text-lg font-bold text-blue-400">{mySeeds.length}</div>
          </div>
        </div>
      </div>

      {/* Enhanced Market Tabs */}
      <div className="flex justify-center space-x-8">
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
          variant={activeTab === "server" ? "default" : "outline"}
          onClick={() => setActiveTab("server")}
          className={`relative transition-all duration-300 ${
            activeTab === "server" 
              ? "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg scale-110" 
              : "border-slate-500 text-slate-300 hover:border-blue-400 hover:text-blue-400"
          } px-8 py-3 font-bold text-lg`}
        >
          <div className="flex items-center">
            <Store className="h-5 w-5 mr-3" />
            <span>🏪 Shop</span>
          </div>
          {activeTab === "server" && (
            <div className="absolute inset-0 bg-blue-400 rounded opacity-20 animate-ping"></div>
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
                {marketListings.map((listing) => {
                  const rarity = listing.itemType === 'seed' ? listing.seedRarity : listing.caterpillarRarity;
                  const itemName = listing.itemType === 'seed' 
                    ? listing.seedName 
                    : (listing.caterpillarName || generateLatinCaterpillarName((listing as any).caterpillarIdOriginal || (listing as any).caterpillarId || 0));
                  const itemIcon = listing.itemType === 'seed' ? '🌱' : '🐛';
                  
                  return (
                    <div
                      key={listing.id}
                    className="bg-slate-900 rounded-lg p-4 border-2"
                    style={{ borderColor: getBorderColor(rarity as RarityTier) }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {/* Item Icon/Image */}
                        {listing.itemType === 'seed' ? (
                          <span className="mr-2 text-2xl">{itemIcon}</span>
                        ) : (
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div className="w-16 h-16 rounded-lg border-2 mr-3 bg-slate-700 flex-shrink-0 overflow-hidden shadow-md cursor-pointer hover:scale-105 transition-transform"
                                   style={{ borderColor: getBorderColor(rarity as RarityTier) }}>
                                <img
                                  src={(listing as any).caterpillarImageUrl || `/Raupen/${((listing as any).caterpillarIdOriginal || (listing as any).caterpillarId || 0).toString().padStart(3, '0')}.jpg`}
                                  alt={itemName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-lg">🐛</div>';
                                  }}
                                />
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80 p-4">
                              <div className="flex flex-col space-y-3">
                                {/* Großes Raupenbild */}
                                <div className="flex justify-center">
                                  <div className="w-50 h-50 rounded-xl border-4 bg-slate-700 overflow-hidden shadow-lg"
                                       style={{ borderColor: getBorderColor(rarity as RarityTier) }}>
                                    <img
                                      src={(listing as any).caterpillarImageUrl || `/Raupen/${((listing as any).caterpillarIdOriginal || (listing as any).caterpillarId || 0).toString().padStart(3, '0')}.jpg`}
                                      alt={itemName}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-3xl">🐛</div>';
                                      }}
                                    />
                                  </div>
                                </div>
                                
                                {/* Raupe-Details */}
                                <div className="text-center space-y-2">
                                  <h3 className="font-bold text-lg text-white">{itemName}</h3>
                                  <div className="flex items-center justify-center space-x-1">
                                    <Star className={`h-5 w-5 ${getRarityColor(rarity as RarityTier)}`} />
                                    <span className={`text-sm font-semibold ${getRarityColor(rarity as RarityTier)}`}>
                                      {rarity?.toUpperCase()}
                                    </span>
                                  </div>
                                  <p className="text-slate-400 text-sm">
                                    ID: {(listing as any).caterpillarIdOriginal || (listing as any).caterpillarId || 0}
                                  </p>
                                  
                                  {/* Preis-Infos */}
                                  <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-slate-300">Anzahl:</span>
                                      <span className="text-white font-medium">{listing.quantity}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1">
                                      <span className="text-slate-300">Preis/Stück:</span>
                                      <span className="text-orange-400 font-medium">{listing.pricePerUnit} Cr</span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1 pt-2 border-t border-slate-600">
                                      <span className="text-slate-300 font-medium">Gesamt:</span>
                                      <span className="text-orange-400 font-bold">{listing.totalPrice} Cr</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        )}
                        <h4 className="font-bold text-white">
                          {itemName}
                        </h4>
                      </div>
                      <div className="flex items-center">
                        <Star className={`h-4 w-4 mr-1 ${getRarityColor(rarity as RarityTier)}`} />
                        <span className={`text-xs ${getRarityColor(rarity as RarityTier)}`}>
                          {rarity}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">Von: {listing.sellerUsername}</p>
                    <p className="text-slate-300 text-xs mb-3">Typ: {listing.itemType === 'seed' ? 'Samen' : 'Raupe'}</p>
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
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "server" && (
        <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-yellow-500/30 rounded-lg shadow-2xl">
          <div className="flex items-center mb-6">
            <div className="text-yellow-400 text-4xl mr-3 animate-pulse">☀️</div>
            <span className="text-3xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Sonnen-Shop
            </span>
          </div>
          <p className="text-slate-400 text-sm mb-6">Kaufe Samen mit Sonnen</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sunOffers.map((offer) => (
              <div
                key={offer.id}
                className="bg-slate-900 rounded-lg p-4 border-2"
                style={{ borderColor: getBorderColor(offer.seedRarity as RarityTier) }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-white">{offer.seedName}</h4>
                  <div className="flex items-center">
                    <Star className={`h-4 w-4 mr-1 ${getRarityColor(offer.seedRarity as RarityTier)}`} />
                    <span className={`text-xs ${getRarityColor(offer.seedRarity as RarityTier)}`}>
                      {offer.seedRarity}
                    </span>
                  </div>
                </div>
                <p className="text-slate-400 text-sm mb-3">Von: {offer.seller}</p>
                <p className="text-slate-300 text-sm mb-3">{offer.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Verfügbar:</span>
                    <span className="text-white">♾️ Unbegrenzt</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Preis/Stück:</span>
                    <span className="text-yellow-400">{offer.pricePerUnit} ☀️</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex space-x-2">
                    <Button
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                      onClick={() => buyFromServerWithSuns(offer.seedId, 1, offer.pricePerUnit)}
                      disabled={isLoading || suns < offer.pricePerUnit}
                    >
                      1x kaufen ({offer.pricePerUnit} ☀️)
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                      onClick={() => buyFromServerWithSuns(offer.seedId, 5, offer.pricePerUnit * 5)}
                      disabled={isLoading || suns < offer.pricePerUnit * 5}
                    >
                      5x kaufen ({offer.pricePerUnit * 5} ☀️)
                    </Button>
                    <Button
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                      onClick={() => buyFromServerWithSuns(offer.seedId, 10, offer.pricePerUnit * 10)}
                      disabled={isLoading || suns < offer.pricePerUnit * 10}
                    >
                      10x kaufen ({offer.pricePerUnit * 10} ☀️)
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "sell" && (
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-orange-500/30 shadow-2xl overflow-visible">
          <CardHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-t-lg -mx-6 -my-2"></div>
            <CardTitle className="text-white flex items-center relative z-10">
              <div className="relative">
                <HandCoins className="h-8 w-8 mr-3 text-orange-400 animate-pulse" />
                <div className="absolute inset-0 h-8 w-8 mr-3 text-orange-400 animate-ping opacity-30"></div>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-orange-300 to-yellow-300 bg-clip-text text-transparent">
                Items Verkaufen 💰
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-visible">
            {(sellForm.itemType === 'seed' && mySeeds.length === 0) || (sellForm.itemType === 'caterpillar' && myCaterpillars.length === 0) ? (
              <div className="text-center py-8">
                {sellForm.itemType === 'seed' ? (
                  <>
                    <p className="text-slate-400">Du hast noch keine Samen zum Verkaufen</p>
                    <p className="text-slate-500 text-sm mt-2">Züchte Blumen im Garten um Samen zu erhalten</p>
                  </>
                ) : (
                  <>
                    <p className="text-slate-400">Du hast noch keine Raupen zum Verkaufen</p>
                    <p className="text-slate-500 text-sm mt-2">Sammel Raupen am Teich um sie zu verkaufen</p>
                  </>
                )}
              </div>
            ) : (
              <div className="relative">
                <form onSubmit={createListing} className="space-y-4 max-w-md mx-auto">
                {/* Item Type Selector */}
                <div>
                  <Label>Was möchtest du verkaufen?</Label>
                  <div className="flex space-x-4 mt-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="itemType"
                        value="seed"
                        checked={sellForm.itemType === 'seed'}
                        onChange={(e) => setSellForm({...sellForm, itemType: 'seed', seedId: 0, caterpillarId: 0, quantity: 1})}
                        className="mr-2"
                      />
                      <span className="text-white">🌱 Samen</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="itemType"
                        value="caterpillar"
                        checked={sellForm.itemType === 'caterpillar'}
                        onChange={(e) => setSellForm({...sellForm, itemType: 'caterpillar', seedId: 0, caterpillarId: 0})}
                        className="mr-2"
                      />
                      <span className="text-white">🐛 Raupen</span>
                    </label>
                  </div>
                </div>

                {/* Item Selector based on type */}
                {sellForm.itemType === 'seed' ? (
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
                ) : (
                  <div className="relative">
                    <Label>Raupe auswählen</Label>
                    <div className="space-y-3 max-h-64 overflow-y-auto" style={{ position: 'relative' }}>
                      {myCaterpillars.length === 0 ? (
                        <div className="text-center py-4 text-slate-400">
                          Keine Raupen verfügbar
                        </div>
                      ) : (
                        myCaterpillars.map((caterpillar) => {
                          const caterpillarName = caterpillar.caterpillarName || generateLatinCaterpillarName(caterpillar.caterpillarId || caterpillar.id);
                          const isSelected = sellForm.caterpillarId === caterpillar.id;
                          
                          return (
                            <div
                              key={caterpillar.id}
                              onClick={() => setSellForm({...sellForm, caterpillarId: caterpillar.id})}
                              className={`cursor-pointer rounded-lg p-3 border-2 transition-all duration-200 hover:scale-[1.02] ${
                                isSelected 
                                  ? `border-orange-400 bg-orange-400/20 shadow-lg` 
                                  : `hover:border-slate-500 border-slate-600 bg-slate-800`
                              }`}
                              style={isSelected ? { borderColor: getBorderColor(caterpillar.caterpillarRarity as RarityTier) } : {}}
                            >
                              <div className="flex items-center space-x-3">
                                {/* Raupe Bild - einfach ohne Hover */}
                                <div 
                                  className="w-16 h-16 rounded-lg bg-slate-700 border-2 flex-shrink-0 overflow-hidden"
                                  style={{ borderColor: getBorderColor(caterpillar.caterpillarRarity as RarityTier) }}
                                >
                                  <img
                                    src={caterpillar.caterpillarImageUrl || `/Raupen/${(caterpillar.caterpillarId || caterpillar.id).toString().padStart(3, '0')}.png`}
                                    alt={caterpillarName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // Fallback zu einem Platzhalter wenn Bild nicht gefunden wird
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-2xl">🐛</div>';
                                    }}
                                  />
                                </div>
                                
                                {/* Raupe Info */}
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-bold text-white text-sm">{caterpillarName}</h4>
                                    <div className="flex items-center">
                                      <Star className={`h-3 w-3 mr-1 ${getRarityColor(caterpillar.caterpillarRarity as RarityTier)}`} />
                                      <span className={`text-xs font-medium ${getRarityColor(caterpillar.caterpillarRarity as RarityTier)}`}>
                                        {caterpillar.caterpillarRarity}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    ID: {caterpillar.caterpillarId || caterpillar.id}
                                  </div>
                                </div>
                                
                                {/* Auswahl Indikator */}
                                {isSelected && (
                                  <div className="flex-shrink-0">
                                    <div className="w-6 h-6 rounded-full bg-orange-400 flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">✓</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Quantity for seeds and caterpillars */}
                <div>
                  <Label htmlFor="quantity">Menge</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={sellForm.itemType === 'seed' 
                      ? (mySeeds.find(s => s.seedId === sellForm.seedId)?.quantity || 1)
                      : (myCaterpillars.find(c => c.id === sellForm.caterpillarId)?.quantity || 1)
                    }
                    value={sellForm.quantity}
                    onChange={(e) => setSellForm({...sellForm, quantity: Number(e.target.value)})}
                    className="bg-slate-900 border-slate-600 text-white"
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Verfügbar: {sellForm.itemType === 'seed' 
                      ? (mySeeds.find(s => s.seedId === sellForm.seedId)?.quantity || 0)
                      : (myCaterpillars.find(c => c.id === sellForm.caterpillarId)?.quantity || 0)
                    }
                  </p>
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
                  disabled={isLoading || (sellForm.itemType === 'seed' && !sellForm.seedId) || (sellForm.itemType === 'caterpillar' && !sellForm.caterpillarId)}
                >
                  {isLoading ? "Erstelle Angebot..." : "Angebot erstellen"}
                </Button>
              </form>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};