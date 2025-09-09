import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Coins, 
  TrendingUp, 
  Sun, 
  Heart, 
  Flower, 
  Gift, 
  Bug, 
  Fish, 
  Sparkles,
  Star,
  Crown,
  Users,
  Dna,
  Zap
} from "lucide-react";
import { useAuth } from "@/lib/stores/useAuth";

type Top100Category = 
  | 'credits' 
  | 'passive-income' 
  | 'suns' 
  | 'likes' 
  | 'dna' 
  | 'seeds' 
  | 'flowers' 
  | 'hearts' 
  | 'butterflies' 
  | 'caterpillars' 
  | 'fish'
  | 'exhibition-butterflies'
  | 'exhibition-fish'
  | 'bouquet-recipes';

interface Top100Player {
  id: number;
  username: string;
  value: number;
  rank: number;
  isCurrentUser?: boolean;
}

interface Top100ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Top100Modal: React.FC<Top100ModalProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<Top100Category>('credits');
  const [players, setPlayers] = useState<Top100Player[]>([]);
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();

  const categories = [
    { id: 'credits', name: '💰 Credits', icon: Coins, color: 'from-yellow-400 to-yellow-600' },
    { id: 'passive-income', name: '📈 Passives Einkommen', icon: TrendingUp, color: 'from-green-400 to-green-600' },
    { id: 'suns', name: '☀️ Sonnen', icon: Sun, color: 'from-orange-400 to-orange-600' },
    { id: 'likes', name: '❤️ Likes', icon: Heart, color: 'from-pink-400 to-pink-600' },
    { id: 'dna', name: '🧬 DNA', icon: Dna, color: 'from-violet-400 to-purple-600' },
    { id: 'seeds', name: '🌱 Samen', icon: Sparkles, color: 'from-emerald-400 to-emerald-600' },
    { id: 'flowers', name: '🌸 Blumen', icon: Flower, color: 'from-rose-400 to-rose-600' },
    { id: 'hearts', name: '💖 Herzen', icon: Zap, color: 'from-yellow-400 to-amber-600' },
    { id: 'butterflies', name: '🦋 Schmetterlinge', icon: Bug, color: 'from-blue-400 to-blue-600' },
    { id: 'caterpillars', name: '🐛 Raupen', icon: Bug, color: 'from-lime-400 to-lime-600' },
    { id: 'fish', name: '🐟 Fische', icon: Fish, color: 'from-cyan-400 to-cyan-600' },
    { id: 'exhibition-butterflies', name: '🏛️ Ausgestellte Schmetterlinge', icon: Star, color: 'from-indigo-400 to-indigo-600' },
    { id: 'exhibition-fish', name: '🏛️ Ausgestellte Fische', icon: Crown, color: 'from-teal-400 to-teal-600' },
    { id: 'bouquet-recipes', name: '📜 Bouquet Rezepte', icon: Users, color: 'from-slate-400 to-slate-600' }
  ] as const;

  useEffect(() => {
    if (isOpen) {
      fetchTop100Data();
    }
  }, [isOpen, selectedCategory]);

  const fetchTop100Data = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    console.log(`🏆 Fetching Top 100 data for category: ${selectedCategory}`);
    try {
      // Add cache-busting timestamp to ensure fresh data
      const timestamp = Date.now();
      const response = await fetch(`/api/rankings/top100/${selectedCategory}?t=${timestamp}`, {
        headers: {
          'X-User-Id': currentUser.id.toString()
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log(`🏆 Received Top 100 data:`, data);
        setPlayers(data.players || []);
      } else {
        console.error(`🏆 Failed to fetch rankings: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('🏆 Failed to fetch top 100 data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentCategory = () => {
    return categories.find(cat => cat.id === selectedCategory);
  };

  const formatValue = (value: number, category: Top100Category) => {
    if (category === 'credits' || category === 'passive-income') {
      return `${value.toLocaleString()} Cr`;
    }
    return value.toLocaleString();
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const getRankStyle = (rank: number, isCurrentUser?: boolean) => {
    let baseStyle = "transition-all duration-300 hover:scale-105 border-2 ";
    
    if (isCurrentUser) {
      baseStyle += "border-cyan-400 bg-gradient-to-r from-cyan-800/50 to-blue-800/50 shadow-cyan-400/30";
    } else if (rank === 1) {
      baseStyle += "border-yellow-400 bg-gradient-to-r from-yellow-800/30 to-yellow-700/30";
    } else if (rank === 2) {
      baseStyle += "border-slate-300 bg-gradient-to-r from-slate-800/30 to-slate-700/30";
    } else if (rank === 3) {
      baseStyle += "border-orange-400 bg-gradient-to-r from-orange-800/30 to-orange-700/30";
    } else {
      baseStyle += "border-slate-600 bg-gradient-to-r from-slate-800 to-slate-900";
    }
    
    return baseStyle;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/30 text-white w-[95vw] max-w-sm md:max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl">
        <DialogHeader className="relative pb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-t-lg -mx-6 -my-2"></div>
          <DialogTitle className="flex items-center text-white relative z-10">
            <div className="relative">
              <Trophy className="h-10 w-10 mr-4 text-yellow-400 animate-pulse" />
              <div className="absolute inset-0 h-10 w-10 mr-4 text-yellow-400 animate-ping opacity-30"></div>
            </div>
            <span className="text-4xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              TOP 100 RANGLISTE
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Rangliste der besten Spieler mit verschiedenen Kategorien und Statistiken.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          {/* Category Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 md:gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id as Top100Category)}
                  className={`relative group p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                    isSelected 
                      ? `border-cyan-400 bg-gradient-to-br ${category.color} shadow-lg` 
                      : 'border-slate-600 bg-gradient-to-br from-slate-700 to-slate-800 hover:border-slate-400'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Icon 
                      className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-slate-300'} transition-colors`} 
                    />
                    <span className={`text-xs font-medium text-center leading-tight ${
                      isSelected ? 'text-white' : 'text-slate-300'
                    }`}>
                      {category.name.replace(/^[^\s]+\s/, '')} {/* Remove emoji for better fit */}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-xl animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Current Category Display */}
          <div className="text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              {getCurrentCategory()?.name}
            </h2>
          </div>

          {/* Players List */}
          {loading ? (
            <div className="text-center py-12 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 rounded-lg"></div>
              <div className="relative z-10">
                <div className="relative mb-6">
                  <Trophy className="h-16 w-16 text-yellow-400 mx-auto animate-spin" />
                  <div className="absolute inset-0 h-16 w-16 mx-auto text-yellow-400 animate-ping opacity-20"></div>
                </div>
                <p className="text-slate-300 text-xl">🏆 Lade Rangliste...</p>
              </div>
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-12 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 rounded-lg"></div>
              <div className="relative z-10">
                <div className="relative mb-6">
                  <Trophy className="h-16 w-16 text-yellow-400 mx-auto animate-bounce" />
                  <div className="absolute inset-0 h-16 w-16 mx-auto text-yellow-400 animate-ping opacity-20"></div>
                </div>
                <p className="text-slate-300 text-xl mb-3">🏆 Keine Daten verfügbar</p>
                <p className="text-slate-400 text-lg">Die Rangliste konnte nicht geladen werden</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((player) => (
                <Card 
                  key={player.id} 
                  className={getRankStyle(player.rank, player.isCurrentUser)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Rank */}
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-700/50 border-2 border-slate-600">
                          <span className="text-lg font-bold text-white">
                            {getRankIcon(player.rank)}
                          </span>
                        </div>
                        
                        {/* Player Info */}
                        <div>
                          <h3 className="font-bold text-white text-lg flex items-center">
                            {player.username}
                            {player.isCurrentUser && (
                              <Badge className="ml-2 bg-cyan-500/20 text-cyan-400 border-cyan-400">
                                Das bist du!
                              </Badge>
                            )}
                          </h3>
                        </div>
                      </div>
                      
                      {/* Value */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-yellow-400">
                          {formatValue(player.value, selectedCategory)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center pt-6">
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-lg px-8 py-3 font-bold transition-all duration-300 hover:scale-110 shadow-lg"
            >
              ✅ Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};