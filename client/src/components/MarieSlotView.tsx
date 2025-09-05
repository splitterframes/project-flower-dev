import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Zap, Sun, Coins, Star } from 'lucide-react';
import { useAuth } from '@/lib/stores/useAuth';
import { useSuns } from '@/lib/stores/useSuns';
import { useCredits } from '@/lib/stores/useCredits';
import { useNotification } from '../hooks/useNotification';

// Slot machine symbols with real game images
interface SlotSymbol {
  id: string;
  type: 'caterpillar' | 'flower' | 'butterfly' | 'fish' | 'sun';
  imageUrl: string;
  name: string;
}

// Create symbol pools - only 5 specific symbols for slot machine
const createSymbolPools = (): SlotSymbol[] => {
  const symbols: SlotSymbol[] = [
    // Sun symbol (new 5th symbol) - will use fallback
    {
      id: 'sun',
      type: 'sun',
      imageUrl: '/nonexistent/sun.jpg', // Intentionally use fallback
      name: 'Sonne'
    },
    // One specific caterpillar
    {
      id: 'caterpillar-1',
      type: 'caterpillar', 
      imageUrl: `/Raupen/1.jpg`,
      name: 'Raupe'
    },
    // One specific flower
    {
      id: 'flower-2',
      type: 'flower',
      imageUrl: `/Blumen/2.jpg`, 
      name: 'Blume'
    },
    // One specific butterfly
    {
      id: 'butterfly-1',
      type: 'butterfly',
      imageUrl: `/Schmetterlinge/1.jpg`,
      name: 'Schmetterling'
    },
    // One specific fish
    {
      id: 'fish-1',
      type: 'fish',
      imageUrl: `/Fische/1.jpg`,
      name: 'Fisch'
    }
  ];
  
  return symbols;
};

const SYMBOLS = createSymbolPools();
const REEL_HEIGHT = 480; // Height of visible reel area für quadratische Bilder
const SYMBOL_HEIGHT = 160; // Height of each symbol (480px / 3 = 160px)
const SYMBOLS_PER_REEL = 3; // Only show 3 symbols per reel
const SYMBOLS_PER_DRUM = 15; // Total symbols per drum (5 symbols × 3 each)

interface Reel {
  symbols: SlotSymbol[];
  position: number; // Current scroll position
  isSpinning: boolean;
  targetPosition: number;
  finalSymbol: SlotSymbol;
}

export const MarieSlotView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const { suns, setSuns } = useSuns();
  const { credits, setCredits } = useCredits();
  const { showNotification } = useNotification();
  
  const [reels, setReels] = useState<Reel[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWinMessage, setLastWinMessage] = useState('');
  const [isWinning, setIsWinning] = useState(false);
  const animationRefs = useRef<{ [key: number]: NodeJS.Timeout | null }>({});

  const spinCost = 5;

  // Create a drum with 15 symbols (each of the 5 symbols appears 3 times, shuffled)
  const createDrum = (): SlotSymbol[] => {
    const drum: SlotSymbol[] = [];
    // Add each symbol 3 times
    SYMBOLS.forEach(symbol => {
      for (let i = 0; i < 3; i++) {
        drum.push(symbol);
      }
    });
    
    // Shuffle the drum using Fisher-Yates algorithm
    for (let i = drum.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [drum[i], drum[j]] = [drum[j], drum[i]];
    }
    
    return drum;
  };

  // Initialize reels
  useEffect(() => {
    const initReels = Array(5).fill(null).map(() => {
      return {
        symbols: createDrum(),
        position: 0,
        isSpinning: false,
        targetPosition: 0,
        finalSymbol: SYMBOLS[0]
      };
    });
    
    setReels(initReels);
  }, []);

  // Get random symbol of specific type
  const getRandomSymbolOfType = (type: string): SlotSymbol => {
    const typeSymbols = SYMBOLS.filter(s => s.type === type);
    return typeSymbols[Math.floor(Math.random() * typeSymbols.length)];
  };

  // Create spinning reel with final symbol in middle
  const createSpinningReel = (finalSymbol: SlotSymbol): SlotSymbol[] => {
    // Create a new shuffled drum for spinning
    const drum = createDrum();
    
    // Find the middle position where symbol should stop (visible position)
    const middlePosition = Math.floor(drum.length / 2);
    drum[middlePosition] = finalSymbol;
    
    return drum;
  };

  // Handle spin
  const handleSpin = async () => {
    if (!user || isSpinning) return;
    
    if (suns < spinCost) {
      showNotification('Nicht genügend Sonnen! Du brauchst 5 Sonnen zum Spielen.', 'error');
      return;
    }

    setIsSpinning(true);
    setLastWinMessage('');
    setIsWinning(false);

    try {
      // Call server API
      const response = await fetch(`/api/user/${user.id}/marie-slot-play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        showNotification(data.message || 'Ein Fehler ist aufgetreten', 'error');
        setIsSpinning(false);
        return;
      }

      // Update local sun count
      setSuns(suns - spinCost);

      // Convert server response to final symbols
      const finalSymbols = data.reels.map((symbolType: string) => {
        return getRandomSymbolOfType(symbolType);
      });

      // Create new spinning reels with final symbols
      const newReels = reels.map((reel, index) => ({
        ...reel,
        symbols: createSpinningReel(finalSymbols[index]),
        isSpinning: true,
        position: 0,
        targetPosition: SYMBOL_HEIGHT * Math.floor(SYMBOLS_PER_DRUM / 2), // Position to show final symbol in middle
        finalSymbol: finalSymbols[index]
      }));

      setReels(newReels);

      // Start spinning animations - each reel stops after a delay (longer spinning)
      const spinDurations = [3000, 3500, 4000, 4500, 5000]; // Longer staggered stopping times
      
      spinDurations.forEach((duration, reelIndex) => {
        // Clear any existing timeout
        if (animationRefs.current[reelIndex]) {
          clearTimeout(animationRefs.current[reelIndex]!);
        }
        
        // Set new timeout to stop this reel
        animationRefs.current[reelIndex] = setTimeout(() => {
          setReels(prevReels => {
            const updatedReels = [...prevReels];
            updatedReels[reelIndex] = {
              ...updatedReels[reelIndex],
              isSpinning: false,
              position: updatedReels[reelIndex].targetPosition
            };
            return updatedReels;
          });

          // Check if all reels have stopped
          if (reelIndex === spinDurations.length - 1) {
            setTimeout(() => {
              setIsSpinning(false);
              
              // Handle win results
              if (data.matchCount >= 2) {
                setIsWinning(true);
                setLastWinMessage(data.message);
                
                // Update local state based on reward
                if (data.reward?.type === 'suns') {
                  setSuns(prev => prev + data.reward.amount);
                } else if (data.reward?.type === 'credits') {
                  setCredits(prev => prev + data.reward.amount);
                }
                
                showNotification(data.message, 'success');
              } else {
                setLastWinMessage(data.message);
                showNotification(data.message, 'info');
              }
            }, 500);
          }
        }, duration);
      });

    } catch (error) {
      console.error('Error spinning slot machine:', error);
      showNotification('Verbindungsfehler beim Slot-Spiel', 'error');
      setIsSpinning(false);
    }
  };

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      Object.values(animationRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  // Render individual reel
  const renderReel = (reel: Reel, index: number) => {
    const spinSpeed = reel.isSpinning ? 'animate-spin-fast' : '';
    
    return (
      <div key={index} className="relative overflow-hidden bg-slate-800 rounded-lg border-2 border-yellow-500">
        <div 
          className={`transition-transform ${reel.isSpinning ? 'duration-100 ease-linear' : 'duration-500 ease-out'}`}
          style={{
            transform: `translateY(-${reel.position}px)`,
            height: REEL_HEIGHT
          }}
        >
          <div className={reel.isSpinning ? 'animate-spin-slow' : ''}>
            {reel.symbols.map((symbol, symbolIndex) => (
              <div
                key={`${index}-${symbolIndex}`}
                className="flex items-center justify-center border-b border-slate-600"
                style={{ height: SYMBOL_HEIGHT }}
              >
                <div className="relative w-40 h-40">
                  <img
                    src={symbol.imageUrl}
                    alt={symbol.name}
                    className="w-full h-full object-contain rounded border border-gray-600"
                    onError={(e) => {
                      // Better fallback with type-specific icons
                      const target = e.target as HTMLImageElement;
                      let fallbackColor = '#374151';
                      let icon = '?';
                      
                      switch(symbol.type) {
                        case 'butterfly':
                          fallbackColor = '#7c3aed';
                          icon = '🦋';
                          break;
                        case 'fish':
                          fallbackColor = '#0ea5e9';
                          icon = '🐠';
                          break;
                        case 'caterpillar':
                          fallbackColor = '#16a34a';
                          icon = '🐛';
                          break;
                        case 'flower':
                          fallbackColor = '#dc2626';
                          icon = '🌸';
                          break;
                        case 'sun':
                          fallbackColor = '#f59e0b';
                          icon = '☀️';
                          break;
                      }
                      
                      // Special handling for sun - no background, just emoji
                      if (symbol.type === 'sun') {
                        target.src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                          <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <text x="80" y="110" text-anchor="middle" font-size="120" fill="#FFD700">☀️</text>
                          </svg>
                        `)}`;
                      } else {
                        target.src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                          <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="160" height="160" fill="${fallbackColor}" rx="20"/>
                            <text x="80" y="105" text-anchor="middle" font-size="60" fill="white">${icon}</text>
                          </svg>
                        `)}`;
                      }
                    }}
                  />
                  {/* Glow effect for spinning */}
                  {reel.isSpinning && (
                    <div className="absolute inset-0 bg-yellow-400 opacity-30 animate-pulse rounded" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Center line indicator */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-yellow-400 opacity-50 pointer-events-none transform -translate-y-1/2" />
      </div>
    );
  };

  if (reels.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Lade Marie-Slot...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
              <Coins className="h-10 w-10 text-yellow-400" />
              Marie-Slot
              <Coins className="h-10 w-10 text-yellow-400" />
            </h1>
            <p className="text-purple-200 text-lg">Echter Spielautomat mit echten Bildern!</p>
          </div>
          
          <div className="text-right text-white">
            <div className="flex items-center gap-2 mb-1">
              <Sun className="h-6 w-6 text-yellow-400" />
              <span className="font-bold text-2xl">{suns}</span>
            </div>
            <div className="text-sm text-purple-200">Sonnen</div>
          </div>
        </div>

        {/* Main Slot Machine */}
        <Card className="bg-gradient-to-b from-slate-900 to-slate-800 border-yellow-500 border-4 shadow-2xl">
          <CardHeader className="text-center pb-4">
            {/* Gewinnzeile über den Trommeln */}
            {lastWinMessage && (
              <div className={`p-4 rounded-lg ${
                isWinning 
                  ? 'bg-green-800/50 border border-green-400 text-green-200' 
                  : 'bg-blue-800/50 border border-blue-400 text-blue-200'
              }`}>
                <div className={`text-lg font-bold ${isWinning ? 'animate-pulse' : ''}`}>
                  {lastWinMessage}
                </div>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            {/* Slot Machine Reels */}
            <div className="bg-slate-900 rounded-xl p-6 mb-8 border-4 border-yellow-600 shadow-inner">
              <div className="grid grid-cols-5 gap-4" style={{ height: REEL_HEIGHT }}>
                {reels.map((reel, index) => renderReel(reel, index))}
              </div>
            </div>

            {/* Spin Button */}
            <div className="text-center">
              <Button
                onClick={handleSpin}
                disabled={isSpinning || suns < spinCost}
                className={`px-12 py-6 text-2xl font-bold rounded-xl transition-all transform hover:scale-105 ${
                  isSpinning 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : suns >= spinCost
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black shadow-lg animate-pulse'
                      : 'bg-gray-600 cursor-not-allowed text-gray-400'
                }`}
              >
                {isSpinning ? (
                  <>
                    <Zap className="h-6 w-6 mr-2 animate-spin" />
                    Dreht sich...
                  </>
                ) : suns >= spinCost ? (
                  <>
                    <Zap className="h-6 w-6 mr-2" />
                    DREHEN! (5 <Sun className="h-5 w-5 inline" />)
                  </>
                ) : (
                  'Nicht genug Sonnen'
                )}
              </Button>
              
              {/* Payout Table */}
              <div className="mt-8 bg-slate-800/50 rounded-lg p-4">
                <h3 className="text-white text-lg font-bold mb-4 text-center">Gewinnmöglichkeiten:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-white">
                  <div className="text-center">
                    <Badge className="bg-green-600 mb-2">2 Gleiche</Badge>
                    <div>5 Sonnen</div>
                  </div>
                  <div className="text-center">
                    <Badge className="bg-blue-600 mb-2">3 Gleiche</Badge>
                    <div>1 Uncommon Samen</div>
                  </div>
                  <div className="text-center">
                    <Badge className="bg-purple-600 mb-2">4 Gleiche</Badge>
                    <div>Epischer Schmetterling</div>
                  </div>
                  <div className="text-center">
                    <Badge className="bg-yellow-600 mb-2">5 Gleiche</Badge>
                    <div>1000 Credits!</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};