import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RarityImage } from "./RarityImage";
import { X, Clock, Coins, Timer, ChevronLeft, ChevronRight } from "lucide-react";
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";
import { toast } from "sonner";

interface CaterpillarDetailProps {
  id: number;
  caterpillarName: string;
  caterpillarRarity: string;
  caterpillarImageUrl: string;
  placedAt?: string;
  userId: number;
}

interface CaterpillarDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  caterpillar: CaterpillarDetailProps | null;
  onSold: () => void;
  readOnly?: boolean;
  // Navigation props
  currentIndex?: number;
  totalCount?: number;
  onNext?: () => void;
  onPrevious?: () => void;
}

export const CaterpillarDetailModal: React.FC<CaterpillarDetailModalProps> = ({
  isOpen,
  onClose,
  caterpillar,
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

    const dialogElement = document.querySelector('[role="dialog"]');
    if (dialogElement) {
      dialogElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => dialogElement.removeEventListener('wheel', handleWheel);
    }
  }, [isOpen, onNext, onPrevious, currentIndex, totalCount]);

  // Calculate countdown every second (12 hours for caterpillars)
  useEffect(() => {
    if (!caterpillar || readOnly) return;

    const fetchSellStatus = async () => {
      try {
        const response = await fetch(`/api/caterpillars/${caterpillar.id}/sell-status`, {
          headers: { 
            'X-User-Id': caterpillar.userId.toString()
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setCanSell(data.canSell);
          setTimeRemaining(data.timeRemainingMs);
        } else {
          // Fallback to local calculation (12 hours for caterpillars)
          if (caterpillar.placedAt) {
            const placedTime = new Date(caterpillar.placedAt).getTime();
            const now = new Date().getTime();
            const timeSincePlacement = now - placedTime;
            const TWELVE_HOURS = 12 * 60 * 60 * 1000; // 12h vs 72h for butterflies, 24h for fish
            const remaining = TWELVE_HOURS - timeSincePlacement;
            
            if (remaining <= 0) {
              setCanSell(true);
              setTimeRemaining(0);
            } else {
              setCanSell(false);
              setTimeRemaining(remaining);
            }
          } else {
            // No placement time means it's a regular caterpillar from garden, immediately sellable
            setCanSell(true);
            setTimeRemaining(0);
          }
        }
      } catch (error) {
        console.error('Failed to fetch caterpillar sell status:', error);
        // For regular caterpillars (not from pond), they're immediately sellable
        if (!caterpillar.placedAt) {
          setCanSell(true);
          setTimeRemaining(0);
        }
      }
    };

    fetchSellStatus();
    const interval = setInterval(fetchSellStatus, 1000);

    return () => clearInterval(interval);
  }, [caterpillar, readOnly]);

  const formatTime = (ms: number): string => {
    if (ms <= 0) return "Verkauf möglich!";
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getCaterpillarPrice = (rarity: string): number => {
    // Caterpillar prices are 85% of butterfly prices
    const basePrice = (() => {
      switch (rarity.toLowerCase()) {
        case 'common': return 50;
        case 'uncommon': return 100;
        case 'rare': return 200;
        case 'super-rare': return 400;
        case 'epic': return 600;
        case 'legendary': return 800;
        case 'mythical': return 1000;
        default: return 50;
      }
    })();
    return Math.floor(basePrice * 0.85); // 85% of butterfly price
  };

  const handleSell = async () => {
    if (!caterpillar || !canSell || isSelling) return;

    setIsSelling(true);
    try {
      const response = await fetch('/api/caterpillars/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': caterpillar.userId.toString()
        },
        body: JSON.stringify({
          caterpillarId: caterpillar.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Raupe verkauft!`, {
          description: `Du hast ${result.creditsEarned} Credits erhalten.`
        });
        onSold();
        onClose();
      } else {
        const errorData = await response.json();
        toast.error('Verkauf fehlgeschlagen', {
          description: errorData.message || 'Die Raupe konnte nicht verkauft werden.'
        });
      }
    } catch (error) {
      console.error('Failed to sell caterpillar:', error);
      toast.error('Verkauf fehlgeschlagen', {
        description: 'Ein Netzwerkfehler ist aufgetreten.'
      });
    } finally {
      setIsSelling(false);
    }
  };

  if (!caterpillar) return null;

  const price = getCaterpillarPrice(caterpillar.caterpillarRarity);
  const rarityColor = getRarityColor(caterpillar.caterpillarRarity as RarityTier);
  const rarityDisplayName = getRarityDisplayName(caterpillar.caterpillarRarity as RarityTier);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-full max-w-[95vw] max-h-[90vh] overflow-y-auto bg-slate-900 text-slate-50 border-slate-700">
        <div className="flex justify-between items-center">
          <DialogHeader className="flex-1">
            <DialogTitle className="text-xl font-bold text-slate-50 pr-8">
              Raupe Details
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center space-x-2">
            {/* Navigation arrows */}
            {onPrevious && currentIndex !== undefined && currentIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrevious}
                className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            
            {/* Counter */}
            {currentIndex !== undefined && totalCount !== undefined && (
              <div className="text-sm text-slate-400 px-2 min-w-[4rem] text-center">
                {currentIndex + 1}/{totalCount}
              </div>
            )}
            
            {onNext && currentIndex !== undefined && totalCount !== undefined && currentIndex < totalCount - 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Caterpillar Image and Basic Info */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <RarityImage
                  src={caterpillar.caterpillarImageUrl}
                  alt={caterpillar.caterpillarName}
                  rarity={caterpillar.caterpillarRarity as RarityTier}
                  size="xl"
                  className="w-32 h-32"
                />
                
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-slate-50">
                    {caterpillar.caterpillarName}
                  </h3>
                  <Badge 
                    variant="outline" 
                    className="text-sm font-medium border-2"
                    style={{ 
                      borderColor: rarityColor,
                      color: rarityColor,
                      backgroundColor: `${rarityColor}20`
                    }}
                  >
                    {rarityDisplayName}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Information */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Coins className="h-5 w-5 text-yellow-400" />
                  <span className="text-slate-300">Verkaufspreis:</span>
                </div>
                <div className="text-2xl font-bold text-yellow-400">
                  {price.toLocaleString()} Credits
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selling Controls */}
          {!readOnly && (
            <div className="space-y-4">
              {!canSell && (
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-orange-400" />
                      <div className="flex-1">
                        <p className="text-slate-300 font-medium">Verkauf verfügbar in:</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Timer className="h-4 w-4 text-orange-400" />
                          <span className="text-lg font-mono text-orange-400">
                            {formatTime(timeRemaining)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleSell}
                disabled={!canSell || isSelling}
                className={`w-full h-12 text-lg font-semibold transition-all ${
                  canSell 
                    ? 'bg-green-600 hover:bg-green-500 text-white' 
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isSelling ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Verkaufe...</span>
                  </div>
                ) : canSell ? (
                  `Für ${price.toLocaleString()} Credits verkaufen`
                ) : (
                  'Noch nicht verkaufbar'
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};