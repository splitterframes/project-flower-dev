import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/stores/useAuth';
import { Badge } from '@/components/ui/badge';
import { Ticket, Coins, Sun, Sprout, Flower2, Bug, Fish, Sparkles } from 'lucide-react';

interface TicketRedemptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userTickets: number;
  onTicketsChange: () => void;
}

interface DailyItems {
  flower: { id: number; name: string; rarity: number };
  butterfly: { id: number; name: string; rarity: number };
  caterpillar: { id: number; name: string; rarity: number };
  fish: { id: number; name: string; rarity: number };
}

interface Prize {
  id: string;
  cost: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: 'seed' | 'suns' | 'flower' | 'butterfly' | 'caterpillar' | 'fish' | 'credits';
  rarity?: number;
}

const rarityColors: Record<number, string> = {
  0: '#FFD700', // Common - Yellow
  1: '#00FF00', // Uncommon - Green 
  2: '#0080FF', // Rare - Blue
  3: '#00FFFF', // Super-rare - Turquoise
  4: '#8B5CF6', // Epic - Purple
  5: '#FF8000', // Legendary - Orange
  6: '#FF0000', // Mythical - Red
};

const rarityNames: Record<number, string> = {
  0: 'Gewöhnlich',
  1: 'Ungewöhnlich', 
  2: 'Rar',
  3: 'Super-Rar',
  4: 'Episch',
  5: 'Legendär',
  6: 'Mythical',
};

export function TicketRedemptionDialog({ isOpen, onClose, userTickets, onTicketsChange }: TicketRedemptionDialogProps) {
  const { user } = useAuth();
  const [dailyItems, setDailyItems] = useState<DailyItems | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const fetchDailyItems = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/daily-items`);
      if (response.ok) {
        const data = await response.json();
        setDailyItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch daily items:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDailyItems();
    }
  }, [isOpen, user]);

  const handleRedeem = async (prizeType: string, cost: number) => {
    if (!user || userTickets < cost || isRedeeming) return;
    
    setIsRedeeming(true);
    
    try {
      const response = await fetch(`/api/user/${user.id}/redeem-tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizeType, cost })
      });
      
      if (response.ok) {
        onTicketsChange();
        // Optional: Show success message
      }
    } catch (error) {
      console.error('Failed to redeem prize:', error);
    } finally {
      setIsRedeeming(false);
    }
  };

  const prizes: Prize[] = [
    {
      id: 'common-seed',
      cost: 10,
      title: 'Gewöhnlicher Samen',
      description: 'Ein einfacher Samen zum Pflanzen',
      icon: <img src="/Blumen/0.jpg" alt="Samen" className="h-12 w-12 object-cover rounded border-2" style={{ borderColor: rarityColors[0] }} />,
      type: 'seed',
      rarity: 0
    },
    {
      id: 'suns',
      cost: 15,
      title: '7 Sonnen',
      description: 'Sammle sofort 7 Sonnen',
      icon: <Sun className="h-12 w-12 text-yellow-400" />,
      type: 'suns'
    },
    {
      id: 'rare-seed',
      cost: 25,
      title: 'Rarer Samen',
      description: 'Ein seltener Samen mit besonderen Eigenschaften',
      icon: <img src="/Blumen/0.jpg" alt="Samen" className="h-12 w-12 object-cover rounded border-2" style={{ borderColor: rarityColors[2] }} />,
      type: 'seed',
      rarity: 2
    },
    {
      id: 'daily-flower',
      cost: 50,
      title: 'Tägliche Rare Blume',
      description: `${dailyItems?.flower?.name || 'Lade...'} (${rarityNames[dailyItems?.flower?.rarity || 2]})`,
      icon: <Flower2 className="h-6 w-6" style={{ color: rarityColors[dailyItems?.flower?.rarity || 2] }} />,
      type: 'flower'
    },
    {
      id: 'daily-butterfly',
      cost: 100,
      title: 'Täglicher Rarer Schmetterling',
      description: `${dailyItems?.butterfly?.name || 'Lade...'} (${rarityNames[dailyItems?.butterfly?.rarity || 2]})`,
      icon: <Sparkles className="h-6 w-6" style={{ color: rarityColors[dailyItems?.butterfly?.rarity || 2] }} />,
      type: 'butterfly'
    },
    {
      id: 'daily-caterpillar',
      cost: 150,
      title: 'Tägliche Rare Raupe',
      description: `${dailyItems?.caterpillar?.name || 'Lade...'} (${rarityNames[dailyItems?.caterpillar?.rarity || 2]})`,
      icon: <Bug className="h-6 w-6" style={{ color: rarityColors[dailyItems?.caterpillar?.rarity || 2] }} />,
      type: 'caterpillar'
    },
    {
      id: 'daily-fish',
      cost: 200,
      title: 'Täglicher Rarer Fisch',
      description: `${dailyItems?.fish?.name || 'Lade...'} (${rarityNames[dailyItems?.fish?.rarity || 2]})`,
      icon: <Fish className="h-6 w-6" style={{ color: rarityColors[dailyItems?.fish?.rarity || 2] }} />,
      type: 'fish'
    },
    {
      id: 'credits',
      cost: 500,
      title: '800 Credits',
      description: 'Erhalte sofort 800 Credits',
      icon: <Coins className="h-6 w-6 text-orange-400" />,
      type: 'credits'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-purple-100">
            <Ticket className="h-8 w-8 text-purple-400" />
            Lose-Einlösung
            <Badge variant="outline" className="ml-auto text-purple-200 border-purple-400">
              {userTickets} 🎫
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Shelf/Regal Design */}
        <div className="relative">
          {/* Shelf Background */}
          <div className="bg-gradient-to-b from-amber-800 to-amber-900 rounded-lg p-6 shadow-2xl">
            {/* Shelf Edges */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 rounded-t-lg shadow-inner" />
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 rounded-b-lg" />
            
            {/* Prize Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {prizes.map((prize) => {
                const canAfford = userTickets >= prize.cost;
                const isDaily = ['daily-flower', 'daily-butterfly', 'daily-caterpillar', 'daily-fish'].includes(prize.id);
                
                return (
                  <div
                    key={prize.id}
                    className={`
                      relative bg-gradient-to-b from-slate-100 to-slate-200 rounded-lg p-4 
                      shadow-lg border-2 transition-all duration-200 hover:scale-105
                      ${canAfford ? 'border-purple-400 hover:border-purple-300' : 'border-gray-400'}
                    `}
                  >
                    {/* Price Tag */}
                    <div className="absolute -top-2 -right-2 bg-purple-600 text-white rounded-full px-2 py-1 text-xs font-bold shadow-lg">
                      {prize.cost} 🎫
                    </div>
                    
                    {/* Item Display */}
                    <div className="text-center space-y-2">
                      {/* Icon/Image */}
                      <div className="flex justify-center items-center h-20 w-20 mx-auto bg-white rounded-lg shadow-inner border">
                        {isDaily && dailyItems ? (
                          <img
                            src={`/${
                              prize.type === 'flower' ? 'Blumen' : 
                              prize.type === 'butterfly' ? 'Schmetterlinge' : 
                              prize.type === 'caterpillar' ? 'Caterpillars' : 'Fish'
                            }/${
                              prize.type === 'flower' ? dailyItems.flower.id : 
                              prize.type === 'butterfly' ? String(dailyItems.butterfly.id).padStart(3, '0') : 
                              prize.type === 'caterpillar' ? dailyItems.caterpillar.id : dailyItems.fish.id
                            }.jpg`}
                            alt={prize.title}
                            className="h-18 w-18 object-cover rounded border-2"
                            style={{ borderColor: rarityColors[
                              prize.type === 'flower' ? dailyItems.flower.rarity : 
                              prize.type === 'butterfly' ? dailyItems.butterfly.rarity : 
                              prize.type === 'caterpillar' ? dailyItems.caterpillar.rarity : dailyItems.fish.rarity
                            ] }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={isDaily ? 'hidden' : 'flex justify-center items-center'}>
                          {prize.icon}
                        </div>
                      </div>
                      
                      {/* Title */}
                      <h3 className="font-bold text-sm text-gray-800">{prize.title}</h3>
                      
                      {/* Description */}
                      <p className="text-xs text-gray-600 line-clamp-2">{prize.description}</p>
                      
                      {/* Redeem Button */}
                      <Button
                        size="sm"
                        disabled={!canAfford || isRedeeming}
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
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-6">
          <div className="text-center text-purple-200 text-sm flex-1">
            Tägliche Gegenstände werden um Mitternacht aktualisiert
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-purple-700 hover:bg-purple-600 text-purple-100 border-purple-500"
          >
            Ich komme wieder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}