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
    <div className="w-full h-full bg-gradient-to-b from-amber-50 to-orange-100 dark:from-slate-900 dark:to-slate-800 p-4 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Crown className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            🏺 Vasen-Sammlung
          </h1>
          <Crown className="h-8 w-8 text-yellow-500" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Heart className="h-5 w-5 text-pink-500" />
          <span className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            {userHearts.toLocaleString()} Schlosspark-Herzen
          </span>
        </div>
        <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
          Sammle wunderschöne Vasen mit deinen Schlosspark-Herzen! 
          Jede Vase ist ein kostbares Sammlerstück für deine Trophäensammlung.
        </p>
      </div>

      {/* Vases Display - 4 Shelves */}
      <div className="max-w-6xl mx-auto">
        <Card className="bg-gradient-to-br from-amber-100 to-orange-200 dark:from-slate-800 dark:to-slate-700 p-6 shadow-lg border-2 border-amber-300 dark:border-yellow-600">
          <div className="space-y-6">
            {shelves.map((shelf, shelfIndex) => (
              <div key={shelfIndex} className="relative">
                {/* Shelf Background */}
                <div className="bg-gradient-to-r from-amber-200 to-amber-300 dark:from-slate-600 dark:to-slate-500 rounded-lg p-4 shadow-inner border-b-4 border-amber-400 dark:border-yellow-700">
                  {/* Shelf Number */}
                  <div className="text-center mb-3">
                    <Badge variant="secondary" className="bg-amber-300 text-amber-800 dark:bg-yellow-600 dark:text-yellow-100 font-bold">
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
                            ${vase.collected ? 'border-green-400 bg-green-50 dark:bg-green-900' : 
                              canCollect ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900 shadow-yellow-300 shadow-sm' :
                              'border-slate-400 bg-slate-100 dark:bg-slate-700'
                            }
                          `}>
                            {/* Vase Image or Placeholder */}
                            <div className="w-full h-full flex items-center justify-center p-2">
                              {vase.collected ? (
                                <div className="text-center">
                                  <Crown className="h-8 w-8 text-yellow-500 mx-auto mb-1" />
                                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Gesammelt!
                                  </div>
                                </div>
                              ) : isLocked ? (
                                <div className="text-center">
                                  <Lock className="h-6 w-6 text-slate-500 mx-auto mb-1" />
                                  <div className="text-xs text-slate-600 dark:text-slate-400">
                                    Gesperrt
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <div className="text-4xl mb-1">🏺</div>
                                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                                  ${canCollect ? 'bg-green-500 text-white' : 'bg-slate-500 text-white'}
                                `}>
                                  <Heart className="h-3 w-3 mr-1" />
                                  {vase.heartsRequired.toLocaleString()}
                                </Badge>
                              </div>
                            )}

                            {/* Collect Effect */}
                            {canCollect && (
                              <div className="absolute inset-0 bg-yellow-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-lg" />
                            )}
                          </div>
                          
                          {/* Vase Info */}
                          <div className="mt-1 text-center">
                            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                              Vase {vase.id}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Shelf Support Beams */}
                <div className="absolute -bottom-2 left-4 right-4 h-2 bg-gradient-to-r from-amber-700 to-amber-600 rounded-full shadow-md" />
              </div>
            ))}
          </div>
        </Card>

        {/* Collection Progress */}
        <div className="mt-6 text-center">
          <Card className="inline-block bg-white/80 dark:bg-slate-800/80 p-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {vases.filter(v => v.collected).length} / {vases.length}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Gesammelt</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {vases.filter(v => canCollectVase(v)).length}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Verfügbar</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-500">
                  {vases.filter(v => userHearts < v.heartsRequired && !v.collected).length}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Gesperrt</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};