import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { useSuns } from "@/lib/stores/useSuns";
import { useNotification } from "../hooks/useNotification";
import { getRarityColor, getRarityDisplayName } from "@shared/rarity";
import { Clock, DollarSign, Zap, ChevronLeft, ChevronRight, Fish, X, Coins } from "lucide-react";

interface FishDetailProps {
  id: number;
  fishName: string;
  fishRarity: string;
  fishImageUrl: string;
  placedAt: string;
  userId: number;
  tankId?: number;
}

interface FishDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  fish: FishDetailProps | null;
  onSold: () => void;
  readOnly?: boolean;
  currentIndex?: number;
  totalCount?: number;
  onNext?: () => void;
  onPrevious?: () => void;
}

export const FishDetailModal: React.FC<FishDetailModalProps> = ({
  isOpen,
  onClose,
  fish,
  onSold,
  readOnly = false,
  currentIndex,
  totalCount,
  onNext,
  onPrevious
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [canSell, setCanSell] = useState<boolean>(false);
  const [isSelling, setIsSelling] = useState<boolean>(false);
  
  // Sonnen-Boost state
  const [boostMinutes, setBoostMinutes] = useState<string>('1');
  const [isBoosting, setIsBoosting] = useState<boolean>(false);
  const { suns, setSuns } = useSuns();
  const { setCredits } = useCredits();
  const { showNotification } = useNotification();
  const { user } = useAuth();

  // Mouse wheel navigation
  useEffect(() => {
    if (!isOpen || !onNext || !onPrevious) return;

    const handleWheel = (e: Event) => {
      e.preventDefault();
      const wheelEvent = e as WheelEvent;
      if (wheelEvent.deltaY > 0) {
        // Scroll down = Next
        if (currentIndex !== undefined && totalCount !== undefined && currentIndex < totalCount - 1) {
          onNext();
        }
      } else if (wheelEvent.deltaY < 0) {
        // Scroll up = Previous  
        if (currentIndex !== undefined && currentIndex > 0) {
          onPrevious();
        }
      }
    };

    // Add wheel event listener to dialog
    const dialogElement = document.querySelector('[role="dialog"]');
    if (dialogElement) {
      dialogElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => dialogElement.removeEventListener('wheel', handleWheel);
    }
  }, [isOpen, onNext, onPrevious, currentIndex, totalCount]);

  // Calculate countdown every second (24 hours for fish vs 72 hours for butterflies)
  useEffect(() => {
    if (!fish || readOnly) return;

    const fetchSellStatus = async () => {
      try {
        const response = await fetch(`/api/aquarium/fish/${fish.id}/sell-status`, {
          headers: { 
            'X-User-Id': fish.userId.toString()
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setCanSell(data.canSell);
          setTimeRemaining(data.timeRemainingMs);
        } else {
          // Fallback to local calculation (1 minute for testing - normally 24 hours for fish)
          const placedTime = new Date(fish.placedAt).getTime();
          const now = new Date().getTime();
          const timeSincePlacement = now - placedTime;
          const TWENTY_FOUR_HOURS = 1 * 60 * 1000; // 1 minute for testing (normally 24h vs 72h for butterflies)
          const remaining = TWENTY_FOUR_HOURS - timeSincePlacement;
          
          if (remaining <= 0) {
            setCanSell(true);
            setTimeRemaining(0);
          } else {
            setCanSell(false);
            setTimeRemaining(remaining);
          }
        }
      } catch (error) {
        console.error('Failed to fetch fish sell status:', error);
      }
    };

    fetchSellStatus();
    const interval = setInterval(fetchSellStatus, 1000);

    return () => clearInterval(interval);
  }, [fish, readOnly]);

  const formatTime = (ms: number): string => {
    if (ms <= 0) return "Verkauf möglich!";
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getFishPrice = (rarity: string): number => {
    // Fish prices are 40% of butterfly prices (doubled from 20%)
    const basePrice = (() => {
      switch (rarity) {
        case 'common': return 100;
        case 'uncommon': return 300;
        case 'rare': return 800;
        case 'super-rare': return 2000;
        case 'epic': return 5000;
        case 'legendary': return 12000;
        case 'mythical': return 30000;
        default: return 100;
      }
    })();
    
    return Math.floor(basePrice * 0.4); // 40% of butterfly prices
  };

  const handleSell = async () => {
    if (!fish || !canSell || isSelling) return;

    setIsSelling(true);

    try {
      const response = await fetch('/api/aquarium/sell-fish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user?.id.toString() || '1'
        },
        body: JSON.stringify({ aquariumFishId: fish.id })
      });

      const data = await response.json();

      if (response.ok) {
        showNotification(`Fisch für ${data.creditsEarned} Credits verkauft!`, 'success');
        const creditsResponse = await fetch(`/api/user/${user?.id}/credits`);
        if (creditsResponse.ok) {
          const creditsData = await creditsResponse.json();
          setCredits(creditsData.credits);
        }
        onSold();
      } else {
        showNotification(data.message || 'Fehler beim Verkauf', 'error');
      }
    } catch (error) {
      showNotification('Netzwerkfehler beim Verkauf', 'error');
    } finally {
      setIsSelling(false);
    }
  };

  const handleSunBoost = async () => {
    if (!fish || isBoosting) return;

    const minutes = parseInt(boostMinutes);
    if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
      showNotification('Ungültige Minuten (1-1440)', 'error');
      return;
    }

    const sunCost = minutes; // 1 Sonne = 1 Minute
    if (suns < sunCost) {
      showNotification(`Nicht genügend Sonnen! Benötigt: ${sunCost}`, 'error');
      return;
    }

    setIsBoosting(true);

    try {
      const response = await fetch('/api/aquarium/sun-boost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user?.id.toString() || '1'
        },
        body: JSON.stringify({ 
          aquariumFishId: fish.id, 
          minutes: minutes 
        })
      });

      const data = await response.json();

      if (response.ok) {
        showNotification(`${minutes} Minuten abgezogen für ${sunCost} Sonnen!`, 'success');
        const sunsResponse = await fetch(`/api/user/${user?.id}/suns`);
        if (sunsResponse.ok) {
          const sunsData = await sunsResponse.json();
          setSuns(sunsData.suns);
        }
        // Refresh sell status
        setTimeRemaining(prev => Math.max(0, prev - (minutes * 60 * 1000)));
      } else {
        showNotification(data.message || 'Fehler beim Boost', 'error');
      }
    } catch (error) {
      showNotification('Netzwerkfehler beim Boost', 'error');
    } finally {
      setIsBoosting(false);
    }
  };

  if (!fish) return null;

  const price = getFishPrice(fish.fishRarity);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-blue-500/30 text-white max-w-7xl w-full shadow-2xl [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="sr-only">{fish.fishName} - Fisch Details</DialogTitle>
        </DialogHeader>

        {/* Name and Rarity Header */}
        <Card className="bg-gradient-to-br from-blue-950/50 to-teal-950/30 border-blue-500/30 shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Name and Rarity */}
              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-bold text-white">{fish.fishName}</h3>
                <Badge 
                  className="text-base font-bold px-3 py-1"
                  style={{ backgroundColor: getRarityColor(fish.fishRarity) }}
                >
                  <Fish className="h-4 w-4 mr-2" />
                  {getRarityDisplayName(fish.fishRarity)}
                </Badge>
              </div>

              {/* Navigation Controls */}
              {(totalCount !== undefined && currentIndex !== undefined) && (
                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-400">
                    Fisch {currentIndex + 1} von {totalCount}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={onPrevious}
                      disabled={currentIndex === 0 || totalCount <= 1}
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Zurück
                    </Button>
                    
                    <Button
                      onClick={onNext}
                      disabled={currentIndex === totalCount - 1 || totalCount <= 1}
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed"
                    >
                      Weiter
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content: Large Image left, Details right */}
        <div className="flex gap-6 min-h-[650px]">
          {/* Left Side - Large Fish Image (600x600) */}
          <div className="flex-shrink-0">
            <Card className="bg-gradient-to-br from-blue-950/50 to-teal-950/30 border-blue-500/30 shadow-lg relative overflow-hidden">
              <div 
                className="absolute inset-0 rounded-lg opacity-20"
                style={{ backgroundColor: getRarityColor(fish.fishRarity) }}
              />
              
              <CardContent className="p-4 relative z-10 text-center">
                <div className="relative">
                  <img 
                    src={fish.fishImageUrl}
                    alt={fish.fishName}
                    className="w-[600px] h-[600px] object-contain mx-auto border-4 rounded-lg shadow-lg"
                    style={{
                      borderColor: getRarityColor(fish.fishRarity),
                      filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))'
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling!.style.display = 'flex';
                    }}
                  />
                  <div
                    className="w-[600px] h-[600px] bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center text-8xl border-4 shadow-lg mx-auto"
                    style={{ 
                      display: 'none',
                      borderColor: getRarityColor(fish.fishRarity),
                      filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))'
                    }}
                  >
                    🐟
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Details */}
          <div className="flex-1 space-y-3">
            
            {/* Fish Info Card */}
            <Card className="bg-gradient-to-br from-blue-950/50 to-teal-950/30 border-blue-500/30 shadow-lg">
              <CardContent className="p-3">
                <div className="text-center space-y-2">
                  <div className="text-xs text-blue-200">
                    <p>Platziert: {new Date(fish.placedAt).toLocaleString('de-DE')}</p>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-blue-200">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm font-semibold">Verkaufspreis: {price.toLocaleString()} Credits</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sell Status - Only for own fish */}
            {!readOnly && (
              <Card className="bg-gradient-to-br from-blue-950/50 to-teal-950/30 border-blue-500/30 shadow-lg">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="relative">
                      <Clock className={`h-5 w-5 mr-2 ${canSell ? 'text-green-400' : 'text-orange-400'}`} />
                      {!canSell && <div className="absolute inset-0 h-5 w-5 mr-2 text-orange-400 animate-ping opacity-30"></div>}
                    </div>
                    <span className="text-sm font-semibold">
                      {canSell ? "Verkaufsbereit!" : "Verkaufs-Countdown"}
                    </span>
                  </div>
                  
                  <div className={`text-xl font-bold mb-2 ${canSell ? 'text-green-400' : 'text-orange-400'}`}>
                    {formatTime(timeRemaining)}
                  </div>
                  
                  <div className="text-xs text-slate-400 mb-3">
                    {canSell 
                      ? "Dieser Fisch kann jetzt verkauft werden!"
                      : "Fische können nach 24 Stunden verkauft werden"
                    }
                  </div>
                  
                  <Button
                    onClick={handleSell}
                    disabled={!canSell || isSelling}
                    className={`w-full py-2 text-sm font-semibold ${
                      canSell 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isSelling ? 'Verkaufe...' : canSell ? `Verkaufen für ${price.toLocaleString()} Credits` : 'Noch nicht verkaufbar'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Sonnen Boost - Only for own fish and when not sellable yet */}
            {!readOnly && !canSell && timeRemaining > 0 && (
              <Card className="bg-gradient-to-br from-blue-950/50 to-teal-950/30 border-blue-500/30 shadow-lg">
                <CardContent className="p-3 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Zap className="h-4 w-4 mr-2 text-yellow-400" />
                    <span className="text-sm font-semibold text-yellow-300">☀️ Sonnen-Boost</span>
                  </div>
                  
                  <div className="text-xs text-slate-400 mb-3">
                    Verkürze den Countdown: 1 ☀️ = 1 Minute weniger
                  </div>
                  
                  <div className="flex gap-2 items-end mb-3">
                    <div className="flex-1">
                      <Input
                        type="number"
                        value={boostMinutes}
                        onChange={(e) => setBoostMinutes(e.target.value)}
                        min="1"
                        max="1440"
                        placeholder="Min"
                        className="bg-slate-800 border-slate-600 text-white text-sm h-8"
                      />
                    </div>
                    <div className="text-xs text-slate-400">
                      Kosten: {parseInt(boostMinutes) || 0} ☀️<br/>
                      Hast: {suns} ☀️
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleSunBoost}
                    disabled={isBoosting || suns < (parseInt(boostMinutes) || 0) || !boostMinutes}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 text-sm font-semibold"
                  >
                    {isBoosting ? 'Booste...' : `${parseInt(boostMinutes) || 0} Min für ${parseInt(boostMinutes) || 0} ☀️`}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Sell Price & Button - Only show for own fish */}
            {!readOnly && (
              <Card className="bg-gradient-to-br from-blue-950/50 to-teal-950/30 border-blue-500/30 shadow-lg">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Coins className="h-4 w-4 mr-2 text-blue-400" />
                      <span className="text-sm font-semibold">Verkaufspreis:</span>
                    </div>
                    <Badge className="bg-gradient-to-r from-blue-600 to-teal-600 text-white text-sm px-2 py-1 font-bold">
                      {price} Credits
                    </Badge>
                  </div>

                  <Button
                    onClick={handleSell}
                    disabled={!canSell || isSelling}
                    className={`w-full text-sm font-bold py-3 rounded-lg transition-all duration-300 ${
                      canSell 
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg' 
                        : 'bg-gradient-to-r from-slate-600 to-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <Coins className={`h-4 w-4 mr-2 ${canSell ? 'animate-bounce' : ''}`} />
                      {isSelling 
                        ? "Verkaufe..." 
                        : canSell 
                          ? `💰 Für ${price} Credits verkaufen`
                          : "🕐 Noch nicht verkaufbar"
                      }
                    </div>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Exit Button */}
            <Card className="bg-gradient-to-br from-blue-950/50 to-teal-950/30 border-blue-500/30 shadow-lg">
              <CardContent className="p-3">
                <Button
                  onClick={onClose}
                  className="w-full text-sm font-bold py-2 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 transition-all duration-300"
                >
                  Verlassen
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};