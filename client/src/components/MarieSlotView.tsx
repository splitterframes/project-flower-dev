import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/lib/stores/useAuth";
import { useSuns } from "@/lib/stores/useSuns";
import { useCredits } from "@/lib/stores/useCredits";
import { useNotification } from "../hooks/useNotification";
import { 
  Zap, 
  Sun, 
  ArrowLeft, 
  Star, 
  Gift,
  Sparkles,
  Trophy,
  Coins,
  Bug,
  Fish,
  Flower,
  Sprout
} from "lucide-react";

// Symbol types for the slot machine
interface SlotSymbol {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  type: 'caterpillar' | 'flower' | 'butterfly' | 'fish';
}

// Slot machine symbols (12 total - 3 of each type)
const SLOT_SYMBOLS: SlotSymbol[] = [
  // Caterpillars (green tones)
  { id: 'cat1', name: 'Grüne Raupe', icon: Bug, color: 'text-green-400', type: 'caterpillar' },
  { id: 'cat2', name: 'Gelbe Raupe', icon: Bug, color: 'text-yellow-400', type: 'caterpillar' },
  { id: 'cat3', name: 'Rote Raupe', icon: Bug, color: 'text-red-400', type: 'caterpillar' },
  
  // Flowers (pink/purple tones)
  { id: 'flow1', name: 'Rosa Blume', icon: Flower, color: 'text-pink-400', type: 'flower' },
  { id: 'flow2', name: 'Lila Blume', icon: Flower, color: 'text-purple-400', type: 'flower' },
  { id: 'flow3', name: 'Weiße Blume', icon: Flower, color: 'text-white', type: 'flower' },
  
  // Butterflies (blue tones)
  { id: 'but1', name: 'Blauer Falter', icon: Bug, color: 'text-blue-400', type: 'butterfly' },
  { id: 'but2', name: 'Türkiser Falter', icon: Bug, color: 'text-cyan-400', type: 'butterfly' },
  { id: 'but3', name: 'Violetter Falter', icon: Bug, color: 'text-violet-400', type: 'butterfly' },
  
  // Fish (water tones)
  { id: 'fish1', name: 'Silber Fisch', icon: Fish, color: 'text-gray-300', type: 'fish' },
  { id: 'fish2', name: 'Gold Fisch', icon: Fish, color: 'text-yellow-500', type: 'fish' },
  { id: 'fish3', name: 'Blau Fisch', icon: Fish, color: 'text-blue-500', type: 'fish' },
];

interface ReelState {
  symbols: SlotSymbol[];
  spinning: boolean;
  finalPosition: number;
}

interface WinResult {
  type: 'none' | 'small' | 'medium' | 'large' | 'jackpot';
  count: number;
  symbol: SlotSymbol | null;
  reward: string;
  amount: number;
}

export const MarieSlotView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const { suns, setSuns } = useSuns();
  const { credits, setCredits } = useCredits();
  const { showNotification } = useNotification();
  
  const [reels, setReels] = useState<ReelState[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<WinResult | null>(null);
  const [spinCost] = useState(5);
  const [showWinAnimation, setShowWinAnimation] = useState(false);

  // Initialize reels
  useEffect(() => {
    const initialReels: ReelState[] = Array(5).fill(null).map(() => ({
      symbols: [
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
      ],
      spinning: false,
      finalPosition: 0,
    }));
    setReels(initialReels);
  }, []);

  // Generate random symbols for a reel
  const generateReelSymbols = (): SlotSymbol[] => {
    return Array(3).fill(null).map(() => 
      SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
    );
  };

  // Check for winning combinations (middle row only)
  const checkWin = (reelResults: ReelState[]): WinResult => {
    const middleSymbols = reelResults.map(reel => reel.symbols[1]); // Middle position (index 1)
    const symbolCounts = new Map<string, number>();
    
    middleSymbols.forEach(symbol => {
      symbolCounts.set(symbol.id, (symbolCounts.get(symbol.id) || 0) + 1);
    });

    let maxCount = 0;
    let winningSymbol: SlotSymbol | null = null;
    
    symbolCounts.forEach((count, symbolId) => {
      if (count >= 2 && count > maxCount) {
        maxCount = count;
        winningSymbol = SLOT_SYMBOLS.find(s => s.id === symbolId) || null;
      }
    });

    if (maxCount >= 2) {
      switch (maxCount) {
        case 2:
          return { 
            type: 'small', 
            count: 2, 
            symbol: winningSymbol, 
            reward: '5 Sonnen',
            amount: 5
          };
        case 3:
          return { 
            type: 'medium', 
            count: 3, 
            symbol: winningSymbol, 
            reward: '3 Super-Rare Samen',
            amount: 3
          };
        case 4:
          return { 
            type: 'large', 
            count: 4, 
            symbol: winningSymbol, 
            reward: 'Epischer Schmetterling',
            amount: 1
          };
        case 5:
          return { 
            type: 'jackpot', 
            count: 5, 
            symbol: winningSymbol, 
            reward: '1000 Credits',
            amount: 1000
          };
        default:
          return { 
            type: 'none', 
            count: 0, 
            symbol: null, 
            reward: '',
            amount: 0
          };
      }
    }

    return { 
      type: 'none', 
      count: 0, 
      symbol: null, 
      reward: '',
      amount: 0
    };
  };

  // Handle slot machine spin
  const handleSpin = async () => {
    if (!user) return;
    
    if (suns < spinCost) {
      showNotification('Nicht genügend Sonnen! Du brauchst 5 Sonnen zum Spielen.', 'error');
      return;
    }

    if (isSpinning) return;

    setIsSpinning(true);
    setLastWin(null);
    setShowWinAnimation(false);

    // Start spinning animation
    const newReels = reels.map(reel => ({
      ...reel,
      spinning: true,
    }));
    setReels(newReels);

    try {
      // Call the unified slot machine API
      const response = await fetch(`/api/user/${user.id}/marie-slot-play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        showNotification(data.message || 'Ein Fehler ist aufgetreten', 'error');
        setIsSpinning(false);
        setReels(reels.map(reel => ({ ...reel, spinning: false })));
        return;
      }

      // Update suns count from response
      setSuns(suns - spinCost);

      // Convert server symbols to our symbols
      const symbolTypeMap: { [key: string]: SlotSymbol[] } = {
        'caterpillar': SLOT_SYMBOLS.filter(s => s.type === 'caterpillar'),
        'flower': SLOT_SYMBOLS.filter(s => s.type === 'flower'),
        'butterfly': SLOT_SYMBOLS.filter(s => s.type === 'butterfly'),
        'fish': SLOT_SYMBOLS.filter(s => s.type === 'fish'),
      };

      // Simulate spinning time with staggered stops
      const spinDurations = [1000, 1200, 1400, 1600, 1800];
      const finalReels: ReelState[] = [];

      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          // Get the symbol type from server response
          const serverSymbol = data.reels[i];
          const possibleSymbols = symbolTypeMap[serverSymbol] || SLOT_SYMBOLS.slice(0, 3);
          const selectedSymbol = possibleSymbols[Math.floor(Math.random() * possibleSymbols.length)];
          
          // Create reel with the selected symbol in center position
          const reelSymbols = generateReelSymbols();
          reelSymbols[1] = selectedSymbol; // Middle position is the result
          
          finalReels[i] = {
            symbols: reelSymbols,
            spinning: false,
            finalPosition: 0,
          };

          setReels(prevReels => {
            const updatedReels = [...prevReels];
            updatedReels[i] = finalReels[i];
            return updatedReels;
          });

          // Check win when all reels have stopped
          if (i === 4) {
            setTimeout(() => {
              if (data.matchCount >= 2) {
                // Create win result based on server response
                const winResult: WinResult = {
                  type: data.matchCount === 2 ? 'small' : 
                        data.matchCount === 3 ? 'medium' :
                        data.matchCount === 4 ? 'large' : 'jackpot',
                  count: data.matchCount,
                  symbol: possibleSymbols[0], // Use first symbol of winning type
                  reward: data.reward?.type === 'suns' ? `${data.reward.amount} Sonnen` :
                         data.reward?.type === 'seeds' ? `${data.reward.amount} Super-Rare Samen` :
                         data.reward?.type === 'butterfly' ? 'Epischer Schmetterling' :
                         data.reward?.type === 'credits' ? `${data.reward.amount} Credits` : '',
                  amount: data.reward?.amount || 0
                };
                
                setLastWin(winResult);
                setShowWinAnimation(true);
                
                // Update local state based on reward type
                if (data.reward?.type === 'suns') {
                  setSuns(suns - spinCost + data.reward.amount);
                } else if (data.reward?.type === 'credits') {
                  setCredits(credits + data.reward.amount);
                }
                
                showNotification(data.message, 'success');
              } else {
                showNotification(data.message, 'info');
              }
              
              setIsSpinning(false);
            }, 300);
          }
        }, spinDurations[i]);
      }

    } catch (error) {
      console.error('Error spinning slot machine:', error);
      showNotification('Verbindungsfehler beim Slot-Spiel', 'error');
      setIsSpinning(false);
      setReels(reels.map(reel => ({ ...reel, spinning: false })));
    }
  };

  // Process win rewards
  const processWin = async (win: WinResult) => {
    if (!user || win.type === 'none') return;

    try {
      switch (win.type) {
        case 'small': // 5 suns
          setSuns(suns + win.amount);
          await fetch(`/api/user/${user.id}/add-suns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: win.amount })
          });
          showNotification(`🎉 Gewinn! +${win.amount} Sonnen!`, 'success');
          break;
          
        case 'medium': // 3 super-rare seeds
          await fetch(`/api/user/${user.id}/add-seeds`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              seedId: Math.floor(Math.random() * 200) + 1, // Random seed ID
              rarity: 'super-rare',
              quantity: win.amount 
            })
          });
          showNotification(`🎉 Großer Gewinn! +${win.amount} Super-Rare Samen!`, 'success');
          break;
          
        case 'large': // Epic butterfly
          await fetch(`/api/user/${user.id}/add-butterfly`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              butterflyId: Math.floor(Math.random() * 1000) + 1, // Random butterfly ID
              rarity: 'epic'
            })
          });
          showNotification(`🎉 Epischer Gewinn! Epischer Schmetterling erhalten!`, 'success');
          break;
          
        case 'jackpot': // 1000 credits
          setCredits(credits + win.amount);
          await fetch(`/api/user/${user.id}/add-credits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: win.amount })
          });
          showNotification(`🎰 JACKPOT! +${win.amount} Credits!`, 'success');
          break;
      }
    } catch (error) {
      console.error('Failed to process win:', error);
      showNotification('Fehler beim Auszahlen des Gewinns', 'error');
    }
  };

  if (reels.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white">Lade Marie-Slot...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Garten
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="h-8 w-8 text-yellow-400" />
              Marie-Slot
            </h1>
            <p className="text-purple-200">Viel Glück beim Spielen!</p>
          </div>
          
          <div className="text-right text-white">
            <div className="flex items-center gap-2 mb-1">
              <Sun className="h-5 w-5 text-yellow-400" />
              <span className="font-bold text-lg">{suns}</span>
            </div>
            <div className="text-sm text-purple-200">Sonnen</div>
          </div>
        </div>

        {/* Main Slot Machine */}
        <Card className="bg-gradient-to-b from-gray-900 to-gray-800 border-yellow-500 border-2">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-yellow-400 text-2xl flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6" />
              Slot Machine
              <Sparkles className="h-6 w-6" />
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {/* Slot Machine Display */}
            <div className="bg-black rounded-lg p-6 mb-6 border-2 border-yellow-600">
              <div className="grid grid-cols-5 gap-2 mb-4">
                {reels.map((reel, reelIndex) => (
                  <div
                    key={reelIndex}
                    className={`bg-gray-800 rounded-lg p-4 border-2 ${
                      reel.spinning 
                        ? 'border-yellow-400 animate-pulse' 
                        : 'border-gray-600'
                    }`}
                  >
                    <div className={`space-y-2 ${reel.spinning ? 'animate-spin' : ''}`}>
                      {reel.symbols.map((symbol, symbolIndex) => {
                        const Icon = symbol.icon;
                        const isMiddle = symbolIndex === 1;
                        return (
                          <div
                            key={symbolIndex}
                            className={`
                              flex items-center justify-center h-12 w-12 mx-auto rounded-lg
                              ${isMiddle 
                                ? 'bg-yellow-400/20 border-2 border-yellow-400 ring-2 ring-yellow-400/50' 
                                : 'bg-gray-700'
                              }
                              ${showWinAnimation && isMiddle && lastWin?.symbol?.id === symbol.id 
                                ? 'animate-bounce' 
                                : ''
                              }
                            `}
                          >
                            <Icon className={`h-8 w-8 ${symbol.color}`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Win Line Indicator */}
              <div className="text-center text-yellow-400 text-sm font-bold mb-2">
                ← GEWINNLINIE →
              </div>
            </div>

            {/* Controls */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-4 text-white">
                <Sun className="h-5 w-5 text-yellow-400" />
                <span className="text-lg">Einsatz: {spinCost} Sonnen</span>
              </div>
              
              <Button
                onClick={handleSpin}
                disabled={isSpinning || suns < spinCost}
                className={`
                  px-8 py-4 text-xl font-bold rounded-lg transition-all
                  ${isSpinning
                    ? 'bg-gray-600 cursor-not-allowed'
                    : suns >= spinCost
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black animate-pulse'
                    : 'bg-gray-600 cursor-not-allowed'
                  }
                `}
              >
                {isSpinning ? (
                  <div className="flex items-center gap-2">
                    <Zap className="h-6 w-6 animate-spin" />
                    DREHT...
                  </div>
                ) : suns >= spinCost ? (
                  <div className="flex items-center gap-2">
                    <Star className="h-6 w-6" />
                    DREHEN
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sun className="h-6 w-6" />
                    MEHR SONNEN BENÖTIGT
                  </div>
                )}
              </Button>
            </div>

            {/* Win Display */}
            {lastWin && lastWin.type !== 'none' && (
              <div className={`
                mt-6 p-4 rounded-lg text-center
                ${showWinAnimation ? 'animate-bounce' : ''}
                ${lastWin.type === 'jackpot' 
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                }
              `}>
                <div className="text-2xl font-bold mb-2">
                  🎉 GEWINN! 🎉
                </div>
                <div className="text-lg">
                  {lastWin.count} x {lastWin.symbol?.name}
                </div>
                <div className="text-xl font-bold">
                  {lastWin.reward}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Win Table */}
        <Card className="mt-6 bg-gray-900 border-yellow-500 border">
          <CardHeader>
            <CardTitle className="text-yellow-400 text-center flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5" />
              Gewinn-Tabelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
              <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                <span>2 Gleiche</span>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-yellow-400" />
                  <span className="text-yellow-400 font-bold">5 Sonnen</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                <span>3 Gleiche</span>
                <div className="flex items-center gap-2">
                  <Sprout className="h-4 w-4 text-purple-400" />
                  <span className="text-purple-400 font-bold">3 Super-Rare Samen</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                <span>4 Gleiche</span>
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4 text-orange-400" />
                  <span className="text-orange-400 font-bold">Epischer Schmetterling</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded">
                <span className="text-black font-bold">5 Gleiche</span>
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-black" />
                  <span className="text-black font-bold">1000 Credits</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};