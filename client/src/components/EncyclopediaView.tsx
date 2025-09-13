import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RarityImage } from "./RarityImage";
import { useAuth } from "@/lib/stores/useAuth";
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";
import { BookOpen, Flower, Bug, Sparkles, Fish, Lock, Star, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

// Item distribution based on replit.md
const ITEM_RANGES = {
  flowers: { start: 1, end: 200 },
  caterpillars: { start: 1, end: 1000 }, // Using same range as butterflies for simplicity  
  butterflies: { start: 1, end: 1000 },
  fish: { start: 1, end: 100 } // Assuming reasonable range for fish
};

// Rarity distribution for flowers (from replit.md)
const FLOWER_RARITY_RANGES = {
  common: { start: 1, end: 55 },
  uncommon: { start: 56, end: 100 },
  rare: { start: 101, end: 135 },
  'super-rare': { start: 136, end: 160 },
  epic: { start: 161, end: 180 },
  legendary: { start: 181, end: 195 },
  mythical: { start: 196, end: 200 }
};

// Rarity distribution for butterflies (from replit.md)
const BUTTERFLY_RARITY_RANGES = {
  common: { start: 1, end: 443 },
  uncommon: { start: 444, end: 743 },
  rare: { start: 744, end: 843 },
  'super-rare': { start: 844, end: 918 },
  epic: { start: 919, end: 963 },
  legendary: { start: 964, end: 988 },
  mythical: { start: 989, end: 1000 }
};

// Simple rarity calculation for other items
const calculateRarity = (id: number, type: string): RarityTier => {
  if (type === 'flowers') {
    for (const [rarity, range] of Object.entries(FLOWER_RARITY_RANGES)) {
      if (id >= range.start && id <= range.end) {
        return rarity as RarityTier;
      }
    }
  } else if (type === 'butterflies') {
    for (const [rarity, range] of Object.entries(BUTTERFLY_RARITY_RANGES)) {
      if (id >= range.start && id <= range.end) {
        return rarity as RarityTier;
      }
    }
  } else {
    // Simple distribution for caterpillars and fish
    const percentage = (id / ITEM_RANGES[type as keyof typeof ITEM_RANGES].end) * 100;
    if (percentage <= 45) return 'common';
    if (percentage <= 75) return 'uncommon';  
    if (percentage <= 90) return 'rare';
    if (percentage <= 97) return 'super-rare';
    if (percentage <= 99.5) return 'epic';
    if (percentage <= 99.9) return 'legendary';
    return 'mythical';
  }
  return 'common';
};

// Generate Latin-sounding names
const generateLatinName = (id: number, type: string): string => {
  const prefixes = ['Rosa', 'Aqua', 'Luna', 'Stella', 'Flora', 'Marina', 'Bella', 'Gloria', 'Vita', 'Terra'];
  const suffixes = ['ensis', 'aria', 'icus', 'alis', 'inus', 'ella', 'osa', 'anus', 'eus', 'lis'];
  
  const typeNames = {
    flowers: 'flora',
    caterpillars: 'larva', 
    butterflies: 'papilio',
    fish: 'piscis'
  };
  
  const prefix = prefixes[id % prefixes.length];
  const suffix = suffixes[(id * 3) % suffixes.length];
  const typeName = typeNames[type as keyof typeof typeNames];
  
  return `${prefix}${suffix} ${typeName}`;
};

interface EncyclopediaItem {
  id: number;
  name: string;
  rarity: RarityTier;
  imageUrl: string;
  type: 'flowers' | 'caterpillars' | 'butterflies' | 'fish';
  collected: boolean;
  quantity?: number;
}

export const EncyclopediaView: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("flowers");
  const [rarityFilter, setRarityFilter] = useState<RarityTier | null>(null);
  const [userItems, setUserItems] = useState<{
    flowers: any[];
    caterpillars: any[];
    butterflies: any[];
    fish: any[];
  }>({
    flowers: [],
    caterpillars: [],
    butterflies: [],
    fish: []
  });

  // Fetch user's collected items
  useEffect(() => {
    const fetchUserItems = async () => {
      if (!user) return;
      
      try {
        // Fetch all user items
        const [flowersRes, caterpillarsRes, butterfliesRes, fishRes] = await Promise.all([
          fetch(`/api/user/${user.id}/flowers`),
          fetch(`/api/user/${user.id}/caterpillars`),
          fetch(`/api/user/${user.id}/butterflies`),
          fetch(`/api/user/${user.id}/fish`)
        ]);

        const results = await Promise.all([
          flowersRes.ok ? flowersRes.json() : { flowers: [] },
          caterpillarsRes.ok ? caterpillarsRes.json() : { caterpillars: [] },
          butterfliesRes.ok ? butterfliesRes.json() : { butterflies: [] },
          fishRes.ok ? fishRes.json() : { fish: [] }
        ]);

        setUserItems({
          flowers: results[0].flowers || [],
          caterpillars: results[1].caterpillars || [],
          butterflies: results[2].butterflies || [],
          fish: results[3].fish || []
        });
      } catch (error) {
        console.error('Failed to fetch user items:', error);
      }
    };

    fetchUserItems();
  }, [user]);

  // Generate all possible items for encyclopedia
  const allItems = useMemo(() => {
    const items: EncyclopediaItem[] = [];
    
    // Generate items for each type
    Object.entries(ITEM_RANGES).forEach(([type, range]) => {
      for (let id = range.start; id <= range.end; id++) {
        const rarity = calculateRarity(id, type);
        const userItem = userItems[type as keyof typeof userItems]?.find(item => {
          // Different ID fields for different types
          if (type === 'flowers') return item.flowerId === id;
          if (type === 'caterpillars') return item.caterpillarId === id;
          if (type === 'butterflies') return item.butterflyId === id;
          if (type === 'fish') return item.fishId === id;
          return false;
        });
        
        const folderMap = {
          flowers: 'Blumen',
          caterpillars: 'Raupen', 
          butterflies: 'Schmetterlinge',
          fish: 'Fische'
        };
        
        // For flowers under 100, don't use leading zeros; for others, use padStart
        let fileName: string;
        if (type === 'flowers' && id < 100) {
          fileName = `${id}.jpg`;
        } else {
          fileName = `${id.toString().padStart(3, '0')}.jpg`;
        }
        
        items.push({
          id,
          name: generateLatinName(id, type),
          rarity,
          imageUrl: `/${folderMap[type as keyof typeof folderMap]}/${fileName}`,
          type: type as any,
          collected: !!userItem,
          quantity: userItem?.quantity || 0
        });
      }
    });
    
    return items;
  }, [userItems]);

  // Filter items by search term, active tab, and rarity
  const filteredItems = useMemo(() => {
    let filtered = allItems.filter(item => item.type === activeTab);
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getRarityDisplayName(item.rarity).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (rarityFilter) {
      filtered = filtered.filter(item => item.rarity === rarityFilter);
    }
    
    // Group by rarity, then sort by ID within each group
    const groupedByRarity: { [key: string]: EncyclopediaItem[] } = {};
    filtered.forEach(item => {
      if (!groupedByRarity[item.rarity]) {
        groupedByRarity[item.rarity] = [];
      }
      groupedByRarity[item.rarity].push(item);
    });
    
    // Sort within each rarity group
    Object.values(groupedByRarity).forEach(group => {
      group.sort((a, b) => a.id - b.id);
    });
    
    // Combine back in rarity order
    const rarityOrder: RarityTier[] = ['mythical', 'legendary', 'epic', 'super-rare', 'rare', 'uncommon', 'common'];
    return rarityOrder.flatMap(rarity => groupedByRarity[rarity] || []);
  }, [allItems, searchTerm, activeTab, rarityFilter]);

  // Statistics
  const stats = useMemo(() => {
    const typeItems = allItems.filter(item => item.type === activeTab);
    const collected = typeItems.filter(item => item.collected);
    
    return {
      total: typeItems.length,
      collected: collected.length,
      percentage: Math.round((collected.length / typeItems.length) * 100)
    };
  }, [allItems, activeTab]);

  const rarityOrder: RarityTier[] = ['mythical', 'legendary', 'epic', 'super-rare', 'rare', 'uncommon', 'common'];

  const tabConfig = [
    { id: 'flowers', label: 'Blumen', icon: Flower, color: 'text-green-400' },
    { id: 'caterpillars', label: 'Raupen', icon: Bug, color: 'text-yellow-400' },
    { id: 'butterflies', label: 'Schmetterlinge', icon: Sparkles, color: 'text-purple-400' },
    { id: 'fish', label: 'Fische', icon: Fish, color: 'text-blue-400' }
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardContent className="pt-6">
            <p className="text-center text-slate-400">Bitte melde dich an, um die Enzyklopädie zu nutzen</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-full">
      {/* Header */}
      <div className="bg-slate-800/60 p-6 rounded-lg border border-blue-500/30">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 mr-3 text-blue-400" />
            <h1 className="text-3xl font-bold text-blue-300">Enzyklopädie</h1>
          </div>
          <p className="text-slate-400 mb-4">Deine komplette Sammlung aller Kreaturen</p>
          
          {/* Search */}
          <div className="relative max-w-md mx-auto mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Nach Namen oder Seltenheit suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-600">
          {tabConfig.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-400"
              >
                <Icon className={`h-4 w-4 mr-2 ${tab.color}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabConfig.map(tab => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            {/* Stats */}
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600 mb-6">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="text-slate-400">Gesammelt:</span>
                    <Badge className="bg-green-600 text-white">
                      {stats.collected} / {stats.total} ({stats.percentage}%)
                    </Badge>
                  </div>
                  <div className="text-slate-400">
                    {filteredItems.length} {searchTerm || rarityFilter ? 'gefilterte' : 'gesamt'} {tab.label.toLowerCase()}
                  </div>
                </div>
                
                {/* Rarity Filter Buttons */}
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 text-xs">Filter nach Rarität:</span>
                  <button
                    onClick={() => setRarityFilter(null)}
                    className={`px-2 py-1 text-xs rounded transition-all ${
                      rarityFilter === null 
                        ? 'bg-slate-600 text-white' 
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                    }`}
                  >
                    Alle
                  </button>
                  {rarityOrder.map(rarity => (
                    <button
                      key={rarity}
                      onClick={() => setRarityFilter(rarity)}
                      className={`px-2 py-1 text-xs rounded transition-all ${
                        rarityFilter === rarity 
                          ? getRarityColor(rarity).replace('text-', 'bg-') + ' text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                      }`}
                    >
                      {getRarityDisplayName(rarity)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-5 gap-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
              {filteredItems.map(item => (
                <Card 
                  key={`${item.type}-${item.id}`}
                  className={`bg-gradient-to-br from-slate-900 to-slate-950 border transition-all duration-300 ${
                    item.collected 
                      ? 'border-slate-600 hover:border-slate-500' 
                      : 'border-slate-800 opacity-40 hover:opacity-60'
                  }`}
                >
                  <CardContent className="p-3">
                    {/* Item Image */}
                    <div className="relative mb-3">
                      <RarityImage
                        src={item.imageUrl}
                        alt={item.name}
                        rarity={item.rarity}
                        size="small"
                        className={`w-full h-24 mx-auto ${!item.collected ? 'grayscale brightness-50' : ''}`}
                      />
                      
                      {/* Collection Status Badge */}
                      <div className="absolute top-1 right-1">
                        {item.collected ? (
                          <Badge className="bg-green-500 text-white text-xs px-1">
                            {item.quantity}x
                          </Badge>
                        ) : (
                          <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center">
                            <Lock className="h-3 w-3 text-slate-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Item Info */}
                    <div className="text-center space-y-2">
                      <h4 className={`font-medium text-xs truncate ${
                        item.collected ? 'text-white' : 'text-slate-500'
                      }`}>
                        {item.name}
                      </h4>
                      
                      <Badge 
                        variant="secondary"
                        className={`text-xs px-2 py-1 ${
                          item.collected 
                            ? getRarityColor(item.rarity)
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Star className="h-2 w-2 mr-1" />
                        {getRarityDisplayName(item.rarity)}
                      </Badge>

                      <div className={`text-xs ${item.collected ? 'text-slate-400' : 'text-slate-600'}`}>
                        #{item.id}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">
                  {searchTerm ? 'Keine Ergebnisse gefunden' : `Keine ${tab.label.toLowerCase()} verfügbar`}
                </p>
                {searchTerm && (
                  <p className="text-slate-500 text-sm mt-2">
                    Versuche einen anderen Suchbegriff
                  </p>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};