import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, Sprout, Sun, Zap, Coins, Flower, Sparkles } from 'lucide-react';
import { RarityImage } from './RarityImage';
import { FlowerHoverPreview } from './FlowerHoverPreview';
import { ButterflyHoverPreview } from './ButterflyHoverPreview';
import { CaterpillarHoverPreview } from './CaterpillarHoverPreview';
import { FishHoverPreview } from './FishHoverPreview';
import { getRarityColor, getRarityDisplayName, getRarityFromAssetId } from '@shared/rarity';

// Helper function to convert integer rarity to RarityTier string
const convertIntegerRarityToTier = (rarityInt: number): any => {
  switch (rarityInt) {
    case 0: return 'common';
    case 1: return 'uncommon';
    case 2: return 'rare';
    case 3: return 'super-rare';
    case 4: return 'epic';
    case 5: return 'legendary';
    case 6: return 'mythical';
    default: return 'common';
  }
};

// Helper function for rarity borders (same as RarityImage component)
const getBorderColor = (rarity: any): string => {
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

interface TicketRedemptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userTickets: number;
  onRedeem: (itemType: string, cost: number) => Promise<{ success: boolean; message: string }>;
}

interface DailyItems {
  id: number;
  date: string;
  flowerId: number;
  flowerRarity: string;
  butterflyId: number;
  butterflyRarity: string;
  caterpillarId: number;
  caterpillarRarity: string;
  fishId: number;
  fishRarity: string;
}

export function TicketRedemptionDialog({ isOpen, onClose, userTickets, onRedeem }: TicketRedemptionDialogProps) {
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState('');
  const [dailyItems, setDailyItems] = useState<DailyItems | null>(null);

  // Fetch daily items
  useEffect(() => {
    if (isOpen) {
      fetch('/api/daily-items')
        .then(res => res.json())
        .then(data => setDailyItems(data))
        .catch(error => console.error('Failed to fetch daily items:', error));
    }
  }, [isOpen]);

  // Prize definitions (all 9 prizes)
  const prizes = [
    {
      id: 'seed',
      cost: 10,
      title: '1 Samen',
      description: 'Erhalte 1 zufälligen Samen',
      icon: <Sprout className="h-6 w-6 text-green-400" />,
      type: 'seed'
    },
    {
      id: 'suns',
      cost: 15,
      title: '5 Sonnen',
      description: 'Sammle sofort 5 Sonnen',
      icon: <span className="text-4xl">☀️</span>,
      type: 'suns'
    },
    {
      id: 'rare-seed',
      cost: 25,
      title: 'Seltener Samen',
      description: 'Erhalte 1 seltenen Samen',
      icon: <Sparkles className="h-6 w-6 text-blue-400" />,
      type: 'rare-seed'
    },
    {
      id: 'dna',
      cost: 30,
      title: '15 DNA',
      description: 'Sammle sofort 15 DNA',
      icon: <span className="text-4xl">🧬</span>,
      type: 'dna'
    },
    {
      id: 'flower',
      cost: 50,
      title: 'Seltene Blume',
      description: 'Erhalte eine seltene Blume',
      icon: <Flower className="h-6 w-6 text-pink-400" />,
      type: 'daily-flower'
    },
    {
      id: 'butterfly',
      cost: 100,
      title: 'Seltener Schmetterling',
      description: 'Erhalte einen seltenen Schmetterling',
      icon: <Sparkles className="h-6 w-6 text-purple-400" />,
      type: 'daily-butterfly'
    },
    {
      id: 'caterpillar',
      cost: 150,
      title: 'Seltene Raupe',
      description: 'Erhalte eine seltene Raupe',
      icon: <Sparkles className="h-6 w-6 text-orange-400" />,
      type: 'daily-caterpillar'
    },
    {
      id: 'fish',
      cost: 200,
      title: 'Seltener Fisch',
      description: 'Erhalte einen seltenen Fisch',
      icon: <Sparkles className="h-6 w-6 text-cyan-400" />,
      type: 'daily-fish'
    },
    {
      id: 'credits',
      cost: 500,
      title: '800 Credits',
      description: 'Sammle sofort 800 Credits',
      icon: <Coins className="h-6 w-6 text-amber-400" />,
      type: 'credits'
    }
  ];

  const handleRedeem = async (itemType: string, cost: number) => {
    if (userTickets < cost || isRedeeming) return;

    setIsRedeeming(true);
    setRedeemMessage('');

    try {
      const result = await onRedeem(itemType, cost);
      setRedeemMessage(result.message);
      
      setTimeout(() => {
        setRedeemMessage('');
      }, 3000);
    } catch (error) {
      setRedeemMessage('Fehler beim Einlösen. Versuche es erneut.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const renderPrizeCard = (prize: typeof prizes[0]) => {
    const canAfford = userTickets >= prize.cost;
    const isDisabled = !canAfford || isRedeeming;

    const cardContent = (
      <div
        className={`
          relative bg-gradient-to-b from-slate-100 to-slate-200 rounded-lg p-4 
          shadow-lg border-2 transition-all duration-200 h-52
          ${canAfford ? 'border-purple-400 hover:border-purple-300 hover:scale-105' : 'border-gray-400'}
        `}
      >
        {/* Price Tag */}
        <div className="absolute -top-2 -right-2 bg-purple-600 text-white rounded-full px-2 py-1 text-xs font-bold shadow-lg">
          {prize.cost} 🎫
        </div>
        
        {/* Item Display */}
        <div className="text-center space-y-2 h-full flex flex-col justify-between">
          {/* Icon/Image */}
          <div className="flex justify-center items-center h-20 w-20 mx-auto bg-white rounded-lg shadow-inner border">
            {prize.type === 'flower' && dailyItems ? (
              <div className="w-18 h-18 relative">
                <img
                  src={`/Blumen/${dailyItems.flowerId}.jpg`}
                  alt={prize.title}
                  className="w-full h-full object-cover rounded border-4"
                  style={{ borderColor: getBorderColor(convertIntegerRarityToTier(Number(dailyItems.flowerRarity))) }}
                />
              </div>
            ) : prize.type === 'butterfly' && dailyItems ? (
              <div className="w-18 h-18 relative">
                <img
                  src={`/Schmetterlinge/${String(dailyItems.butterflyId).padStart(3, '0')}.jpg`}
                  alt={prize.title}
                  className="w-full h-full object-cover rounded border-4"
                  style={{ borderColor: getBorderColor(convertIntegerRarityToTier(Number(dailyItems.butterflyRarity))) }}
                />
              </div>
            ) : prize.type === 'caterpillar' && dailyItems ? (
              <div className="w-18 h-18 relative">
                <img
                  src={`/Raupen/${dailyItems.caterpillarId}.jpg`}
                  alt={prize.title}
                  className="w-full h-full object-cover rounded border-4"
                  style={{ borderColor: getBorderColor(convertIntegerRarityToTier(Number(dailyItems.caterpillarRarity))) }}
                />
              </div>
            ) : prize.type === 'fish' && dailyItems ? (
              <div className="w-18 h-18 relative">
                <img
                  src={`/Fische/${dailyItems.fishId}.jpg`}
                  alt={prize.title}
                  className="w-full h-full object-cover rounded border-4"
                  style={{ borderColor: getBorderColor(convertIntegerRarityToTier(Number(dailyItems.fishRarity))) }}
                />
              </div>
            ) : prize.type === 'seed' && (prize.id === 'seed' || prize.id === 'rare-seed') ? (
              <div className="w-18 h-18 relative">
                <img
                  src="/Blumen/0.jpg"
                  alt={prize.title}
                  className="w-full h-full object-cover rounded border-4"
                  style={{ borderColor: getBorderColor(prize.id === 'rare-seed' ? 'rare' : 'common') }}
                />
              </div>
            ) : (
              <div className="flex justify-center items-center">
                {prize.icon}
              </div>
            )}
          </div>
          
          {/* Title & Description */}
          <div>
            <h3 className="font-bold text-sm text-gray-800">{prize.title}</h3>
            <p className="text-xs text-gray-600 mt-1">{prize.description}</p>
          </div>
          
          {/* Redeem Button */}
          <Button
            size="sm"
            disabled={isDisabled}
            onClick={() => handleRedeem(prize.id, prize.cost)}
            className={`
              w-full text-xs
              ${canAfford 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }
            `}
          >
            {isRedeeming ? 'Einlösen...' : 'Einlösen'}
          </Button>
        </div>
      </div>
    );

    // Wrap with hover preview for daily items
    if (prize.type === 'daily-flower' && dailyItems?.flowerId) {
      return (
        <FlowerHoverPreview
          key={prize.id}
          flowerImageUrl={`/Blumen/${dailyItems.flowerId}.jpg`}
          flowerName="Seltene Blume des Tages"
          rarity={convertIntegerRarityToTier(Number(dailyItems.flowerRarity))}
        >
          {cardContent}
        </FlowerHoverPreview>
      );
    } else if (prize.type === 'daily-butterfly' && dailyItems?.butterflyId) {
      return (
        <ButterflyHoverPreview
          key={prize.id}
          butterflyImageUrl={`/Schmetterlinge/${String(dailyItems.butterflyId).padStart(3, '0')}.jpg`}
          butterflyName="Seltener Schmetterling des Tages"
          rarity={convertIntegerRarityToTier(Number(dailyItems.butterflyRarity))}
        >
          {cardContent}
        </ButterflyHoverPreview>
      );
    } else if (prize.type === 'daily-caterpillar' && dailyItems?.caterpillarId) {
      return (
        <CaterpillarHoverPreview
          key={prize.id}
          caterpillarImageUrl={`/Raupen/${dailyItems.caterpillarId}.jpg`}
          caterpillarName="Seltene Raupe des Tages"
          rarity={convertIntegerRarityToTier(Number(dailyItems.caterpillarRarity))}
        >
          {cardContent}
        </CaterpillarHoverPreview>
      );
    } else if (prize.type === 'daily-fish' && dailyItems?.fishId) {
      return (
        <FishHoverPreview
          key={prize.id}
          fishImageUrl={`/Fische/${dailyItems.fishId}.jpg`}
          fishName="Seltener Fisch des Tages"
          rarity={convertIntegerRarityToTier(Number(dailyItems.fishRarity))}
        >
          {cardContent}
        </FishHoverPreview>
      );
    } else {
      return (
        <div key={prize.id}>
          {cardContent}
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-6xl max-h-[95vh] bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900"
        style={{ zIndex: 9999, overflow: 'visible' }}
        aria-describedby="ticket-redemption-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-purple-100">
            <Ticket className="h-8 w-8 text-purple-400" />
            Lose-Einlösung
            <Badge variant="outline" className="ml-auto text-purple-200 border-purple-400">
              {userTickets} 🎫
            </Badge>
          </DialogTitle>
          <div id="ticket-redemption-description" className="sr-only">
            Dialog zum Einlösen von Losen gegen verschiedene Preise
          </div>
        </DialogHeader>

        {/* Shelf/Regal Design */}
        <div className="relative">
          {/* Shelf Background */}
          <div className="bg-gradient-to-b from-amber-800 to-amber-900 rounded-lg p-6 shadow-2xl">
            {/* Shelf Edges */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 rounded-t-lg shadow-inner" />
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 rounded-b-lg" />
            
            {/* Prize Layout */}
            <div className="pt-2 space-y-4">
              {/* First Row - First 4 Prizes (10-30 Tickets) */}
              <div className="grid grid-cols-4 gap-4">
                {prizes.slice(0, 4).map(renderPrizeCard)}
              </div>
              
              {/* Second Row - Next 4 Prizes (50-200 Tickets) */}
              <div className="grid grid-cols-4 gap-4">
                {prizes.slice(4, 8).map(renderPrizeCard)}
              </div>
              
              {/* Third Row - 500 Credits + Info Container */}
              <div className="flex gap-4">
                {/* Left: 500 Credits Prize */}
                <div className="w-64">
                  {renderPrizeCard(prizes[8])}
                </div>
                
                {/* Right: Info Container */}
                <div className="flex-1 space-y-4">
                  {/* Success/Error Message */}
                  <div className={`text-center p-4 rounded-lg transition-all duration-200 ${
                    redeemMessage 
                      ? (redeemMessage.includes('erfolgreich') || redeemMessage.includes('🎉') 
                          ? 'bg-green-100 text-green-800 border border-green-300' 
                          : 'bg-red-100 text-red-800 border border-red-300')
                      : 'bg-gray-50 text-gray-400 border border-gray-200'
                  }`}>
                    {redeemMessage || 'Wähle einen Preis zum Einlösen'}
                  </div>

                  {/* Info Footer */}
                  <div className="bg-purple-800/20 rounded-lg p-4 border border-purple-500/30">
                    <div className="text-center text-purple-200 text-sm mb-3">
                      Tausche deine Lose gegen wertvolle Belohnungen ein!
                    </div>
                    <Button
                      onClick={onClose}
                      variant="outline"
                      className="w-full bg-purple-700 hover:bg-purple-600 text-purple-100 border-purple-500"
                    >
                      Ich komme wieder
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}