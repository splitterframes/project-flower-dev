import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RarityImage } from "./RarityImage";
import { X, Clock, Coins, Star, Timer } from "lucide-react";
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";
import { toast } from "sonner";

interface ButterflyDetailProps {
  id: number;
  butterflyName: string;
  butterflyRarity: string;
  butterflyImageUrl: string;
  placedAt: string;
  userId: number;
}

interface ButterflyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  butterfly: ButterflyDetailProps | null;
  onSold: () => void;
}

export const ButterflyDetailModal: React.FC<ButterflyDetailModalProps> = ({
  isOpen,
  onClose,
  butterfly,
  onSold
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [canSell, setCanSell] = useState<boolean>(false);
  const [isSelling, setIsSelling] = useState<boolean>(false);

  // Calculate countdown every second
  useEffect(() => {
    if (!butterfly) return;

    const calculateTimeRemaining = () => {
      const placedTime = new Date(butterfly.placedAt).getTime();
      const now = new Date().getTime();
      const timeSincePlacement = now - placedTime;
      const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000; // 72 hours in milliseconds
      const remaining = SEVENTY_TWO_HOURS - timeSincePlacement;
      
      if (remaining <= 0) {
        setCanSell(true);
        setTimeRemaining(0);
      } else {
        setCanSell(false);
        setTimeRemaining(remaining);
      }
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [butterfly]);

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
      'mythical': 1000
    };
    return prices[rarity as keyof typeof prices] || 50;
  };

  const handleSell = async () => {
    if (!butterfly || !canSell) return;

    setIsSelling(true);
    try {
      const response = await fetch('/api/exhibition/sell-butterfly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      <DialogContent className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-orange-500/30 text-white max-w-md shadow-2xl">
        <DialogHeader className="relative">
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

        <div className="space-y-6">
          {/* Butterfly Display */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg relative overflow-hidden">
            <div className={`absolute inset-0 rounded-lg opacity-20 ${getRarityColor(butterfly.butterflyRarity as RarityTier).replace('text-', 'bg-')}`}></div>
            
            <CardContent className="p-6 relative z-10 text-center">
              <div className="relative mb-4">
                <RarityImage 
                  src={butterfly.butterflyImageUrl}
                  alt={butterfly.butterflyName}
                  rarity={butterfly.butterflyRarity as RarityTier}
                  size="large"
                  className="mx-auto"
                />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{butterfly.butterflyName}</h3>
              
              <Badge className={`${getRarityColor(butterfly.butterflyRarity as RarityTier)} text-sm font-bold px-3 py-1 mb-4`}>
                <Star className="h-3 w-3 mr-1" />
                {getRarityDisplayName(butterfly.butterflyRarity as RarityTier)}
              </Badge>
            </CardContent>
          </Card>

          {/* Countdown Timer */}
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

              <div className={`text-3xl font-bold mb-4 ${canSell ? 'text-green-400' : 'text-orange-400'}`}>
                {formatTimeRemaining(timeRemaining)}
              </div>

              <div className="text-sm text-slate-400">
                {canSell 
                  ? "Dieser Schmetterling kann jetzt verkauft werden!"
                  : "Schmetterlinge können nach 72 Stunden verkauft werden"
                }
              </div>
            </CardContent>
          </Card>

          {/* Sell Price & Button */}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};