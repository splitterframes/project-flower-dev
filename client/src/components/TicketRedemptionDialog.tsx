import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, Flower, Sparkles, Gem, Zap, DollarSign } from 'lucide-react';

interface TicketRedemptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userTickets: number;
  onRedeem: (itemType: string, cost: number) => Promise<{ success: boolean; message: string }>;
}

export function TicketRedemptionDialog({ isOpen, onClose, userTickets, onRedeem }: TicketRedemptionDialogProps) {
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState('');

  // Prize definitions (all 9 prizes)
  const prizes = [
    {
      id: 'seed',
      cost: 10,
      title: '1 Samen',
      description: 'Erhalte 1 zufälligen Samen',
      icon: <Flower className="h-6 w-6 text-green-400" />,
      type: 'seed'
    },
    {
      id: 'suns',
      cost: 15,
      title: '5 Sonnen',
      description: 'Sammle sofort 5 Sonnen',
      icon: <Sparkles className="h-6 w-6 text-yellow-400" />,
      type: 'suns'
    },
    {
      id: 'rare-seed',
      cost: 25,
      title: 'Seltener Samen',
      description: 'Erhalte 1 seltenen Samen',
      icon: <Gem className="h-6 w-6 text-blue-400" />,
      type: 'seed'
    },
    {
      id: 'dna',
      cost: 30,
      title: '15 DNA',
      description: 'Sammle sofort 15 DNA',
      icon: <Zap className="h-6 w-6 text-green-400" />,
      type: 'credits'
    },
    {
      id: 'flower',
      cost: 50,
      title: 'Seltene Blume',
      description: 'Erhalte eine seltene Blume',
      icon: <Flower className="h-6 w-6 text-pink-400" />,
      type: 'flower'
    },
    {
      id: 'butterfly',
      cost: 100,
      title: 'Seltener Schmetterling',
      description: 'Erhalte einen seltenen Schmetterling',
      icon: <Sparkles className="h-6 w-6 text-purple-400" />,
      type: 'butterfly'
    },
    {
      id: 'caterpillar',
      cost: 150,
      title: 'Seltene Raupe',
      description: 'Erhalte eine seltene Raupe',
      icon: <Sparkles className="h-6 w-6 text-orange-400" />,
      type: 'caterpillar'
    },
    {
      id: 'fish',
      cost: 200,
      title: 'Seltener Fisch',
      description: 'Erhalte einen seltenen Fisch',
      icon: <Sparkles className="h-6 w-6 text-cyan-400" />,
      type: 'fish'
    },
    {
      id: 'credits',
      cost: 500,
      title: '800 Credits',
      description: 'Sammle sofort 800 Credits',
      icon: <DollarSign className="h-6 w-6 text-amber-400" />,
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

    return (
      <div key={prize.id}>
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
            {/* Icon */}
            <div className="flex justify-center items-center h-20 w-20 mx-auto bg-white rounded-lg shadow-inner border">
              <div className="flex justify-center items-center">
                {prize.icon}
              </div>
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
      </div>
    );
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