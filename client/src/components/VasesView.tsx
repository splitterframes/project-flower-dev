import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/stores/useAuth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Heart, Lock } from 'lucide-react';

interface Vase {
  id: number;
  name: string;
  heartsRequired: number;
  collected: boolean;
  image?: string;
}

export const VasesView: React.FC = () => {
  const { user } = useAuth();
  const [userHearts, setUserHearts] = useState(0);
  const [vases, setVases] = useState<Vase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;
    
    try {
      // Get user hearts
      const heartsResponse = await fetch(`/api/user/${user.id}/hearts`);
      if (heartsResponse.ok) {
        const { hearts } = await heartsResponse.json();
        setUserHearts(hearts);
      }
      
      // Initialize vases (24 total, 6 per shelf, 4 shelves)
      const vaseList: Vase[] = [];
      for (let i = 1; i <= 24; i++) {
        vaseList.push({
          id: i,
          name: `Prächtige Vase ${i}`,
          heartsRequired: 1000 + (i * 500), // Each vase requires more hearts
          collected: false, // TODO: Load from API later
          image: `/Vasen/${i}.jpg` // Will fallback to placeholder if not exists
        });
      }
      setVases(vaseList);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch vases data:', error);
      setLoading(false);
    }
  };

  const canCollectVase = (vase: Vase) => {
    return userHearts >= vase.heartsRequired && !vase.collected;
  };

  const handleVaseClick = async (vase: Vase) => {
    if (!canCollectVase(vase)) return;
    
    // TODO: API call to collect vase
    console.log(`🏺 Collecting vase ${vase.name} for ${vase.heartsRequired} hearts`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Crown className="h-8 w-8 animate-spin mx-auto mb-2 text-yellow-500" />
          <p className="text-slate-400">Lade Vasen-Sammlung...</p>
        </div>
      </div>
    );
  }

  // Divide vases into 4 shelves of 6 each
  const shelves = [];
  for (let i = 0; i < 4; i++) {
    shelves.push(vases.slice(i * 6, (i + 1) * 6));
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Crown className="h-8 w-8 text-orange-400 animate-pulse" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-300 via-yellow-300 to-orange-300 bg-clip-text text-transparent">
            🏺 Vasen-Sammlung
          </h1>
          <Crown className="h-8 w-8 text-orange-400 animate-pulse" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Heart className="h-5 w-5 text-pink-400" />
          <span className="text-lg font-semibold text-slate-200">
            {userHearts.toLocaleString()} Schlosspark-Herzen
          </span>
        </div>
        <p className="text-slate-400 max-w-lg mx-auto">
          Sammle wunderschöne Vasen mit deinen Schlosspark-Herzen! 
          Jede Vase ist ein kostbares Sammlerstück für deine Trophäensammlung.
        </p>
      </div>

      {/* Vases Display - 4 Shelves */}
      <div className="max-w-6xl mx-auto">
        <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/80 p-6 shadow-2xl border border-orange-500/30 backdrop-blur-sm">
          <div className="space-y-6">
            {shelves.map((shelf, shelfIndex) => (
              <div key={shelfIndex} className="relative">
                {/* Shelf Background */}
                <div className="bg-gradient-to-r from-slate-700/80 to-slate-600/80 rounded-lg p-4 shadow-inner border-b-4 border-orange-400/50 backdrop-blur-sm">
                  {/* Shelf Number */}
                  <div className="text-center mb-3">
                    <Badge variant="secondary" className="bg-orange-600/80 text-orange-100 font-bold border border-orange-400/30">
                      🏺 Regal {shelfIndex + 1}
                    </Badge>
                  </div>
                  
                  {/* Vases on this shelf */}
                  <div className="grid grid-cols-6 gap-4">
                    {shelf.map((vase) => {
                      const canCollect = canCollectVase(vase);
                      const isLocked = userHearts < vase.heartsRequired;
                      
                      return (
                        <div
                          key={vase.id}
                          className={`
                            relative group cursor-pointer transition-all duration-300
                            ${canCollect ? 'hover:scale-105 hover:shadow-lg' : ''}
                            ${vase.collected ? 'opacity-100' : isLocked ? 'opacity-40' : 'opacity-70 hover:opacity-100'}
                          `}
                          onClick={() => handleVaseClick(vase)}
                        >
                          {/* Vase Container */}
                          <div className={`
                            aspect-[2/3] rounded-lg border-2 relative overflow-hidden
                            ${vase.collected ? 'border-green-400 bg-green-900/50 shadow-green-400/20 shadow-lg' : 
                              canCollect ? 'border-orange-400 bg-orange-900/30 shadow-orange-400/30 shadow-lg animate-pulse' :
                              'border-slate-500 bg-slate-800/50'
                            }
                          `}>
                            {/* Vase Image or Placeholder */}
                            <div className="w-full h-full flex items-center justify-center p-2">
                              {vase.collected ? (
                                <div className="text-center">
                                  <Crown className="h-8 w-8 text-green-400 mx-auto mb-1" />
                                  <div className="text-xs font-bold text-green-300">
                                    Gesammelt!
                                  </div>
                                </div>
                              ) : isLocked ? (
                                <div className="text-center">
                                  <Lock className="h-6 w-6 text-slate-500 mx-auto mb-1" />
                                  <div className="text-xs text-slate-400">
                                    Gesperrt
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <div className="text-4xl mb-1">🏺</div>
                                  <div className="text-xs font-semibold text-orange-300">
                                    Verfügbar
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Hearts Required Badge */}
                            {!vase.collected && (
                              <div className="absolute -top-2 -right-2">
                                <Badge className={`
                                  text-xs px-1 py-0 
                                  ${canCollect ? 'bg-green-600 text-green-100 border border-green-400/50' : 'bg-slate-600 text-slate-200 border border-slate-400/50'}
                                `}>
                                  <Heart className="h-3 w-3 mr-1" />
                                  {vase.heartsRequired.toLocaleString()}
                                </Badge>
                              </div>
                            )}

                            {/* Collect Effect */}
                            {canCollect && (
                              <div className="absolute inset-0 bg-orange-400 opacity-0 group-hover:opacity-25 transition-opacity duration-300 rounded-lg" />
                            )}
                          </div>
                          
                          {/* Vase Info */}
                          <div className="mt-1 text-center">
                            <div className="text-xs font-medium text-slate-400">
                              Vase {vase.id}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Shelf Support Beams */}
                <div className="absolute -bottom-2 left-4 right-4 h-2 bg-gradient-to-r from-slate-600 to-slate-500 rounded-full shadow-lg border-t border-slate-400/20" />
              </div>
            ))}
          </div>
        </Card>

        {/* Collection Progress */}
        <div className="mt-6 text-center">
          <Card className="inline-block bg-slate-800/60 backdrop-blur-sm border border-orange-500/20 p-4 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-orange-300">
                  {vases.filter(v => v.collected).length} / {vases.length}
                </div>
                <div className="text-xs text-slate-400">Gesammelt</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {vases.filter(v => canCollectVase(v)).length}
                </div>
                <div className="text-xs text-slate-400">Verfügbar</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-500">
                  {vases.filter(v => userHearts < v.heartsRequired && !v.collected).length}
                </div>
                <div className="text-xs text-slate-400">Gesperrt</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};