import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RarityImage } from "./RarityImage";
import { X, Clock, Coins, Star, Timer, ChevronLeft, ChevronRight } from "lucide-react";
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";
import { toast } from "sonner";

interface ButterflyDetailProps {
  id: number;
  butterflyName: string;
  butterflyRarity: string;
  butterflyImageUrl: string;
  placedAt: string;
  userId: number;
  frameId?: number; // Add frameId to get likes information
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

  // Calculate countdown every second (using server data with like reduction)
  useEffect(() => {
    if (!butterfly || readOnly) return;

    const fetchSellStatus = async () => {
      try {
        const response = await fetch(`/api/exhibition/butterfly/${butterfly.id}/sell-status`, {
          headers: { 
            'X-User-Id': butterfly.userId.toString()
          }
        });
        
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

    // Update every second
    const interval = setInterval(fetchSellStatus, 1000);

    return () => clearInterval(interval);
  }, [butterfly, readOnly]);

  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds <= 0) return "Verkaufbar!";

    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getSellPrice = (rarity: string): number => {
    const prices = {
      'common': 50,
      'uncommon': 100,
      'rare': 200,
      'super-rare': 400,
      'epic': 600,
      'legendary': 800,
      'mythical': 1000,
      'vip': 2500  // VIP butterflies are extra valuable!
    };
    return prices[rarity as keyof typeof prices] || 50;
  };

  const handleSell = async () => {
    if (!butterfly || !canSell) return;

    setIsSelling(true);
    try {
      const response = await fetch('/api/exhibition/sell-butterfly', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': butterfly.userId.toString() || '1'
        },
        body: JSON.stringify({
          userId: butterfly.userId,
          exhibitionButterflyId: butterfly.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Schmetterling verkauft!", {
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

  if (!butterfly) return null;

  const sellPrice = getSellPrice(butterfly.butterflyRarity);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-orange-500/30 text-white max-w-7xl w-full shadow-2xl">
        <DialogHeader className="relative mb-6">
          {/* Enhanced Header Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-t-lg -mx-6 -my-2"></div>
          
          <DialogTitle className="flex items-center text-white relative z-10">
            <div className="relative">
              <Star className="h-7 w-7 mr-3 text-purple-400 animate-pulse" />
              <div className="absolute inset-0 h-7 w-7 mr-3 text-purple-400 animate-ping opacity-30"></div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              🦋 Schmetterling-Details
            </span>
          </DialogTitle>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-full transition-all duration-200 z-10"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        {/* Horizontal Layout: Image Left, Details Right */}
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
                    className={`w-[800px] h-[800px] object-contain mx-auto border-4 rounded-lg shadow-lg ${getRarityColor(butterfly.butterflyRarity as RarityTier).replace('text-', 'border-')}`}
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
            {/* Butterfly Name and Rarity */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
              <CardContent className="p-6 text-center">
                <h3 className="text-3xl font-bold text-white mb-4">{butterfly.butterflyName}</h3>
                
                <Badge className={`${getRarityColor(butterfly.butterflyRarity as RarityTier)} text-lg font-bold px-4 py-2`}>
                  <Star className="h-4 w-4 mr-2" />
                  {getRarityDisplayName(butterfly.butterflyRarity as RarityTier)}
                </Badge>
              </CardContent>
            </Card>

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
                      <span className="ml-2 text-green-300">(-{frameLikes} min)</span>
                    </div>
                  )}

                  <div className="text-sm text-slate-400">
                    {canSell 
                      ? "Dieser Schmetterling kann jetzt verkauft werden!"
                      : frameLikes > 0 
                        ? `Countdown reduziert durch ${frameLikes} Likes auf diesem Rahmen!`
                        : "Schmetterlinge können nach 72 Stunden verkauft werden"
                    }
                  </div>
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
                          : "🕐 Noch nicht verkaufbar"
                      }
                    </div>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Navigation Controls - Only show if navigation is available */}
            {(totalCount !== undefined && totalCount > 1 && currentIndex !== undefined) && (
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
                <CardContent className="p-4">
                  <div className="text-center mb-4">
                    <span className="text-sm text-slate-400">
                      Schmetterling {currentIndex + 1} von {totalCount}
                    </span>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={onPrevious}
                      disabled={currentIndex === 0}
                      className="flex-1 text-base font-semibold py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      <ChevronLeft className="h-5 w-5 mr-2" />
                      Vorheriger
                    </Button>
                    
                    <Button
                      onClick={onNext}
                      disabled={currentIndex === totalCount - 1}
                      className="flex-1 text-base font-semibold py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      Nächster
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
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