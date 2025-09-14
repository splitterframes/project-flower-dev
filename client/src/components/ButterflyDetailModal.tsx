import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RarityImage } from "./RarityImage";
import { X, Clock, Coins, Star, Timer, ChevronLeft, ChevronRight, Sun, Zap } from "lucide-react";
import { getRarityColor, getRarityDisplayName, getRarityBadgeStyle, type RarityTier } from "@shared/rarity";
import { toast } from "sonner";
import { useSuns } from "@/lib/stores/useSuns";

interface ButterflyDetailProps {
  id: number;
  butterflyName: string;
  butterflyRarity: string;
  butterflyImageUrl: string;
  placedAt: string;
  userId: number;
  frameId?: number; // Add frameId to get likes information
  isVip?: boolean; // Flag to distinguish VIP butterflies
}

interface ButterflyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  butterfly: ButterflyDetailProps | null;
  onSold: () => void;
  readOnly?: boolean; // For viewing other users' butterflies without selling options
  // Navigation props
  currentIndex?: number;
  totalCount?: number;
  onNext?: () => void;
  onPrevious?: () => void;
}

export const ButterflyDetailModal: React.FC<ButterflyDetailModalProps> = ({
  isOpen,
  onClose,
  butterfly,
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
  const [frameLikes, setFrameLikes] = useState<number>(0);
  
  // Sonnen-Boost state
  const [boostMinutes, setBoostMinutes] = useState<string>('1');
  const [isBoosting, setIsBoosting] = useState<boolean>(false);
  const { suns, setSuns } = useSuns();

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

  // Calculate countdown every second (using server data with like reduction)
  useEffect(() => {
    if (!butterfly || readOnly) return;

    let currentButterflyId = butterfly.id; // Capture current butterfly ID
    let isCancelled = false; // Flag to prevent race conditions

    const fetchSellStatus = async () => {
      if (isCancelled || butterfly.id !== currentButterflyId) return; // Prevent outdated calls
      
      try {
        // Use different endpoint for VIP butterflies
        const isVipButterfly = butterfly.isVip || butterfly.butterflyRarity === 'vip';
        
        const endpoint = isVipButterfly 
          ? `/api/exhibition/vip-butterfly/${butterfly.id}/sell-status`
          : `/api/exhibition/butterfly/${butterfly.id}/sell-status`;
          
        const response = await fetch(endpoint, {
          headers: { 
            'X-User-Id': butterfly.userId.toString()
          }
        });
        
        // Check again after async operation
        if (isCancelled || butterfly.id !== currentButterflyId) return;
        
        if (response.ok) {
          const data = await response.json();
          setCanSell(data.canSell);
          setTimeRemaining(data.timeRemainingMs);
          setFrameLikes(data.likesCount || 0);
        } else {
          // Fallback to local calculation
          const placedTime = new Date(butterfly.placedAt).getTime();
          const now = new Date().getTime();
          const timeSincePlacement = now - placedTime;
          const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000;
          const remaining = SEVENTY_TWO_HOURS - timeSincePlacement;
          
          if (remaining <= 0) {
            setCanSell(true);
            setTimeRemaining(0);
          } else {
            setCanSell(false);
            setTimeRemaining(remaining);
          }
        }
      } catch (error) {
        if (isCancelled || butterfly.id !== currentButterflyId) return;
        
        console.error('Failed to fetch sell status:', error);
        // Fallback to local calculation
        const placedTime = new Date(butterfly.placedAt).getTime();
        const now = new Date().getTime();
        const timeSincePlacement = now - placedTime;
        const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000;
        const remaining = SEVENTY_TWO_HOURS - timeSincePlacement;
        
        if (remaining <= 0) {
          setCanSell(true);
          setTimeRemaining(0);
        } else {
          setCanSell(false);
          setTimeRemaining(remaining);
        }
      }
    };

    // Fetch immediately
    fetchSellStatus();

    // OPTIMIZED: Update every 30 seconds (reduced from 1 second for better performance)
    const interval = setInterval(fetchSellStatus, 30000);

    return () => {
      isCancelled = true; // Cancel any pending operations
      clearInterval(interval);
    };
  }, [butterfly, readOnly]);

  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds <= 0) return "Verkaufbar!";

    // Round to nearest minute to prevent flickering between values
    const roundedMs = Math.ceil(milliseconds / (1000 * 60)) * (1000 * 60);
    const hours = Math.floor(roundedMs / (1000 * 60 * 60));
    const minutes = Math.floor((roundedMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((roundedMs % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getSellPrice = (rarity: string, isVip?: boolean): number => {
    if (isVip || rarity === 'vip') return 2500; // VIP butterflies are extra valuable!
    // Must match server-side rarityValues in sellExhibitionButterfly
    const prices = {
      'common': 10,
      'uncommon': 25,
      'rare': 50,
      'super-rare': 100,
      'epic': 200,
      'legendary': 500,
      'mythical': 1000
    };
    return prices[rarity as keyof typeof prices] || 10;
  };

  // Calculate current Cr/h based on degradation over 72 hours with like bonus
  const getCurrentCrPerHour = (rarity: string, isVip?: boolean, placedAt?: string): number => {
    let baseValue: number;
    
    if (isVip || rarity === 'vip') {
      // VIP butterflies: 60 Cr/h → 6 Cr/h over 72 hours
      const startValue = 60;
      const minValue = 6;
      baseValue = calculateDegradedValue(startValue, minValue, placedAt);
    } else {
      const rarityValues = {
        'common': { start: 1, min: 1 },       // No degradation for Common
        'uncommon': { start: 2, min: 1 },     // 2 → 1 Cr/h
        'rare': { start: 5, min: 1 },         // 5 → 1 Cr/h  
        'super-rare': { start: 10, min: 1 },  // 10 → 1 Cr/h
        'epic': { start: 20, min: 2 },        // 20 → 2 Cr/h
        'legendary': { start: 50, min: 5 },   // 50 → 5 Cr/h
        'mythical': { start: 100, min: 10 }   // 100 → 10 Cr/h
      };

      const values = rarityValues[rarity as keyof typeof rarityValues] || { start: 1, min: 1 };
      baseValue = calculateDegradedValue(values.start, values.min, placedAt);
    }
    
    // Apply like bonus: 2% per like for 72 hours
    if (butterfly?.frameId && frameLikes) {
      const frameWithLikes = frameLikes.find(f => f.frameId === butterfly.frameId);
      const likesCount = frameWithLikes ? frameWithLikes.totalLikes : 0;
      const likeBonus = 1 + (likesCount * 0.02); // 2% per like
      baseValue = Math.round(baseValue * likeBonus);
    }
    
    return baseValue;
  };

  // Calculate degraded value over 72 hours
  const calculateDegradedValue = (startValue: number, minValue: number, placedAt?: string): number => {
    if (!placedAt) return startValue;

    const placedTime = new Date(placedAt).getTime();
    const now = new Date().getTime();
    const timeSincePlacement = now - placedTime;
    const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000;

    // If less than 72 hours have passed, calculate degradation
    if (timeSincePlacement < SEVENTY_TWO_HOURS) {
      const degradationProgress = timeSincePlacement / SEVENTY_TWO_HOURS; // 0 to 1
      const valueRange = startValue - minValue;
      const currentValue = startValue - (valueRange * degradationProgress);
      return Math.max(Math.round(currentValue), minValue);
    }

    // After 72 hours, return minimum value
    return minValue;
  };

  const handleSell = async () => {
    if (!butterfly || !canSell) return;

    setIsSelling(true);
    try {
      // Use different endpoint for VIP butterflies
      const isVipButterfly = butterfly.isVip || butterfly.butterflyRarity === 'vip';
      
      const endpoint = isVipButterfly ? '/api/exhibition/sell-vip-butterfly' : '/api/exhibition/sell-butterfly';
      const bodyData = isVipButterfly 
        ? { userId: butterfly.userId, exhibitionVipButterflyId: butterfly.id }
        : { userId: butterfly.userId, exhibitionButterflyId: butterfly.id };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': butterfly.userId.toString() || '1'
        },
        body: JSON.stringify(bodyData)
      });

      if (response.ok) {
        const result = await response.json();
        const butterflyType = butterfly.isVip ? "VIP-Schmetterling" : "Schmetterling";
        toast.success(`${butterflyType} verkauft!`, {
          description: `Du hast ${result.creditsEarned} Credits erhalten! 💰`,
          duration: 4000,
          className: "border-l-4 border-l-green-500",
        });
        onSold();
        onClose();
      } else {
        const error = await response.json();
        toast.error("Verkauf fehlgeschlagen", {
          description: error.message || 'Unbekannter Fehler',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error selling butterfly:', error);
      toast.error("Verbindungsfehler", {
        description: 'Schmetterling konnte nicht verkauft werden',
        duration: 4000,
      });
    } finally {
      setIsSelling(false);
    }
  };

  const handleSunBoost = async () => {
    if (!butterfly || canSell) return;

    const minutes = parseInt(boostMinutes);
    if (isNaN(minutes) || minutes <= 0 || minutes > 720) {
      toast.error("Ungültige Eingabe", {
        description: 'Bitte gib eine gültige Anzahl Minuten ein (1-720)',
        duration: 4000,
      });
      return;
    }

    const sunsCost = minutes * 10;
    if (suns < sunsCost) {
      toast.error("Nicht genug Sonnen", {
        description: `Du brauchst ${sunsCost} Sonnen für ${minutes} Minuten Boost`,
        duration: 4000,
      });
      return;
    }

    setIsBoosting(true);
    try {
      const response = await fetch('/api/exhibition/butterfly-sun-boost', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': butterfly.userId.toString() || '1'
        },
        body: JSON.stringify({
          exhibitionButterflyId: butterfly.id,
          minutes: minutes
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("☀️ Sonnen-Boost erfolgreich!", {
          description: `Countdown um ${minutes} Minuten für ${sunsCost} Sonnen verkürzt!`,
          duration: 4000,
          className: "border-l-4 border-l-yellow-500",
        });
        // Refresh suns to show updated amount
        const sunsResponse = await fetch(`/api/user/${butterfly.userId}/suns`);
        if (sunsResponse.ok) {
          const sunsData = await sunsResponse.json();
          setSuns(sunsData.suns);
        }
        // Reset input
        setBoostMinutes('1');
      } else {
        const error = await response.json();
        toast.error("Boost fehlgeschlagen", {
          description: error.message || 'Unbekannter Fehler',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error applying sun boost:', error);
      toast.error("Verbindungsfehler", {
        description: 'Sonnen-Boost konnte nicht angewendet werden',
        duration: 4000,
      });
    } finally {
      setIsBoosting(false);
    }
  };

  if (!butterfly) return null;

  const sellPrice = getSellPrice(butterfly.butterflyRarity);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-orange-500/30 text-white max-w-7xl w-full shadow-2xl [&>button]:hidden">
        <DialogHeader className="relative mb-4">
          {/* Enhanced Header Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-t-lg -mx-6 -my-2"></div>
          
          <DialogTitle className="flex items-center text-white relative z-10">
            <div className="relative">
              <Star className="h-6 w-6 mr-3 text-purple-400 animate-pulse" />
              <div className="absolute inset-0 h-6 w-6 mr-3 text-purple-400 animate-ping opacity-30"></div>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              🦋 Schmetterling-Details
            </span>
          </DialogTitle>
          
        </DialogHeader>

        {/* Top Section: Name/Rarity left, Navigation right */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Name and Rarity */}
              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-bold text-white">{butterfly.butterflyName}</h3>
                <Badge className={`${getRarityBadgeStyle(butterfly.butterflyRarity as RarityTier)} text-base font-bold px-3 py-1`}>
                  <Star className="h-4 w-4 mr-2" />
                  {getRarityDisplayName(butterfly.butterflyRarity as RarityTier)}
                </Badge>
              </div>

              {/* Navigation Controls */}
              {(totalCount !== undefined && totalCount > 1 && currentIndex !== undefined) && (
                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-400">
                    Schmetterling {currentIndex + 1} von {totalCount}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={onPrevious}
                      disabled={currentIndex === 0}
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Zurück
                    </Button>
                    
                    <Button
                      onClick={onNext}
                      disabled={currentIndex === totalCount - 1}
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed"
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
        <div className="flex gap-8 min-h-[800px]">
          {/* Left Side - Large Butterfly Image (800x800) */}
          <div className="flex-shrink-0">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg relative overflow-hidden">
              <div className={`absolute inset-0 rounded-lg opacity-20 ${getRarityColor(butterfly.butterflyRarity as RarityTier).replace('text-', 'bg-')}`}></div>
              
              <CardContent className="p-6 relative z-10 text-center">
                <div className="relative">
                  <img 
                    src={butterfly.butterflyImageUrl}
                    alt={butterfly.butterflyName}
                    className={`w-[700px] h-[700px] object-contain mx-auto border-4 rounded-lg shadow-lg ${getRarityColor(butterfly.butterflyRarity as RarityTier).replace('text-', 'border-')}`}
                    style={{
                      filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))'
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Details */}
          <div className="flex-1 space-y-6">
            {/* Countdown Timer - Only show for own butterflies */}
            {!readOnly && (
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative">
                      <Timer className={`h-6 w-6 mr-3 ${canSell ? 'text-green-400' : 'text-orange-400'}`} />
                      {!canSell && <div className="absolute inset-0 h-6 w-6 mr-3 text-orange-400 animate-ping opacity-30"></div>}
                    </div>
                    <span className="text-lg font-semibold">
                      {canSell ? "Verkaufsbereit!" : "Verkaufs-Countdown"}
                    </span>
                  </div>

                  <div className={`text-3xl font-bold mb-2 ${canSell ? 'text-green-400' : 'text-orange-400'}`}>
                    {formatTimeRemaining(timeRemaining)}
                  </div>

                  {frameLikes > 0 && !canSell && (
                    <div className="text-lg text-pink-300 mb-2 flex items-center justify-center">
                      <Star className="h-4 w-4 mr-1 fill-pink-300" />
                      <span>{frameLikes} Likes</span>
                      <span className="ml-2 text-green-300">(+{frameLikes * 2}% Einkommen)</span>
                    </div>
                  )}

                  {canSell && (
                    <div className="text-sm text-slate-400 mb-4">
                      Dieser Schmetterling kann jetzt verkauft werden!
                    </div>
                  )}

                  {/* Sonnen-Boost Panel */}
                  {!canSell && (
                    <div className="border-t border-slate-600 pt-4">
                      <div className="flex items-center mb-3">
                        <Sun className="h-5 w-5 mr-2 text-yellow-400" />
                        <span className="text-lg font-semibold text-yellow-300">Sonnen-Boost</span>
                      </div>
                      
                      <div className="text-sm text-slate-400 mb-3">
                        Verkürze den Countdown: 10 ☀️ = 1 Minute weniger
                      </div>

                      <div className="flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="text-sm text-slate-300 mb-1 block">Minuten</label>
                          <Input
                            type="number"
                            value={boostMinutes}
                            onChange={(e) => setBoostMinutes(e.target.value)}
                            min="1"
                            max="720"
                            className="bg-slate-800 border-slate-600 text-white"
                            placeholder="1"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="text-sm text-slate-300 mb-1">Kosten</div>
                          <div className="bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-center">
                            <span className="text-yellow-400 font-bold">
                              {parseInt(boostMinutes) * 10 || 0} ☀️
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={handleSunBoost}
                          disabled={isBoosting || parseInt(boostMinutes) <= 0 || parseInt(boostMinutes) > 720 || suns < (parseInt(boostMinutes) * 10)}
                          className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 disabled:from-slate-600 disabled:to-slate-700 text-white px-4 py-2"
                        >
                          <div className="flex items-center">
                            <Zap className="h-4 w-4 mr-2" />
                            {isBoosting ? "Boost..." : "Boost!"}
                          </div>
                        </Button>
                      </div>

                      <div className="text-xs text-slate-500 mt-2 text-center">
                        Du hast {suns} ☀️ Sonnen
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sell Price & Button - Only show for own butterflies */}
            {!readOnly && (
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Coins className="h-6 w-6 mr-3 text-yellow-400" />
                      <span className="text-lg font-semibold">Verkaufspreis:</span>
                    </div>
                    <Badge className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-lg px-4 py-2 font-bold">
                      {sellPrice} Credits
                    </Badge>
                  </div>

                  {/* Passive Income Display */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-lg">
                    <div className="flex items-center">
                      <Timer className="h-5 w-5 mr-3 text-purple-400" />
                      <span className="text-base font-semibold text-purple-200">Passives Einkommen:</span>
                    </div>
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-base px-3 py-1 font-bold">
                      {getCurrentCrPerHour(butterfly.butterflyRarity, butterfly.isVip, butterfly.placedAt)} Cr/h
                    </Badge>
                  </div>

                  <Button
                    onClick={handleSell}
                    disabled={!canSell || isSelling}
                    className={`w-full text-lg font-bold py-6 rounded-xl transition-all duration-300 ${
                      canSell 
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:scale-105 shadow-lg' 
                        : 'bg-gradient-to-r from-slate-600 to-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <Coins className={`h-6 w-6 mr-3 ${canSell ? 'animate-bounce' : ''}`} />
                      {isSelling 
                        ? "Verkaufe..." 
                        : canSell 
                          ? `💰 Für ${sellPrice} Credits verkaufen`
                          : "Noch nicht verkaufbar"
                      }
                    </div>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Exit Button */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
              <CardContent className="p-6">
                <Button
                  onClick={onClose}
                  className="w-full text-lg font-bold py-4 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 transition-all duration-300"
                >
                  <X className="h-5 w-5 mr-3" />
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