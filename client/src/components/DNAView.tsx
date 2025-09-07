import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/stores/useAuth";
import { useDna } from "@/lib/stores/useDna";
import { useNotification } from "../hooks/useNotification";
import { HelpButton } from './HelpButton';
import { 
  Dna, 
  Zap, 
  ArrowUp, 
  Clock, 
  Sparkles, 
  TestTube, 
  TrendingUp,
  Plus,
  Minus,
  RotateCcw,
  X,
  Package
} from "lucide-react";
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";

// Types for DNA system
interface InventoryItem {
  id: number;
  type: 'seed' | 'flower' | 'butterfly' | 'caterpillar' | 'fish';
  name: string;
  rarity: RarityTier;
  imageUrl: string;
  quantity: number;
}

interface GridSlot {
  item: InventoryItem | null;
  position: { row: number; col: number };
}

// DNA calculation constants based on the requirements
const RARITY_MULTIPLIERS = {
  'common': 1,
  'uncommon': 2,
  'rare': 3,
  'super-rare': 4,
  'epic': 5,
  'legendary': 6,
  'mythical': 7
} as const;

type DnaRarityTier = keyof typeof RARITY_MULTIPLIERS;

// Item base values for DNA calculation based on ranking position (1-35)
const ITEM_BASE_VALUES = {
  'seed': {
    'common': 1, 'uncommon': 4, 'rare': 8, 'super-rare': 13, 'epic': 18, 'legendary': 24, 'mythical': 28
  },
  'flower': {
    'common': 2, 'uncommon': 7, 'rare': 12, 'super-rare': 16, 'epic': 21, 'legendary': 27, 'mythical': 31
  },
  'butterfly': {
    'common': 3, 'uncommon': 9, 'rare': 14, 'super-rare': 19, 'epic': 23, 'legendary': 29, 'mythical': 33
  },
  'caterpillar': {
    'common': 5, 'uncommon': 10, 'rare': 15, 'super-rare': 20, 'epic': 25, 'legendary': 30, 'mythical': 34
  },
  'fish': {
    'common': 6, 'uncommon': 11, 'rare': 17, 'super-rare': 22, 'epic': 26, 'legendary': 32, 'mythical': 35
  }
};

// 3x3 Grid neighbor mapping (orthogonal only)
const GRID_NEIGHBORS = {
  0: [1, 3],        // Top-left: 2 neighbors
  1: [0, 2, 4],     // Top-center: 3 neighbors
  2: [1, 5],        // Top-right: 2 neighbors
  3: [0, 4, 6],     // Middle-left: 3 neighbors
  4: [1, 3, 5, 7],  // Center: 4 neighbors
  5: [2, 4, 8],     // Middle-right: 3 neighbors
  6: [3, 7],        // Bottom-left: 2 neighbors
  7: [4, 6, 8],     // Bottom-center: 3 neighbors
  8: [5, 7]         // Bottom-right: 2 neighbors
};

const BASE_DNA_COSTS = {
  'uncommon': 20,
  'rare': 50,
  'super-rare': 150,
  'epic': 350,
  'legendary': 750,
  'mythical': 2000
};

export const DNAView: React.FC = () => {
  const { user } = useAuth();
  const { dna, setDna } = useDna();
  const { showNotification } = useNotification();
  
  // DNA Sequencer state (left side)
  const [sequencerGrid, setSequencerGrid] = useState<GridSlot[][]>(() => 
    Array(3).fill(null).map((_, row) => 
      Array(3).fill(null).map((_, col) => ({
        item: null,
        position: { row, col }
      }))
    )
  );
  const [isSequencing, setIsSequencing] = useState(false);
  const [sequenceProgress, setSequenceProgress] = useState(0);
  const [dnaToGenerate, setDnaToGenerate] = useState(0);
  
  // Item selection modal state
  const [showItemSelection, setShowItemSelection] = useState(false);
  const [selectedGridPosition, setSelectedGridPosition] = useState<{row: number, col: number} | null>(null);
  
  // D-Nator state (right side)
  const [selectedUpgradeItem, setSelectedUpgradeItem] = useState<InventoryItem | null>(null);
  const [targetRarity, setTargetRarity] = useState<RarityTier>('uncommon');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeProgress, setUpgradeProgress] = useState(0);
  const [upgradeCost, setUpgradeCost] = useState(0);
  
  // Inventory state
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'seed' | 'flower' | 'butterfly' | 'caterpillar' | 'fish'>('all');

  useEffect(() => {
    if (user) {
      loadInventory();
    }
  }, [user]);

  // Update DNA calculation when grid changes
  useEffect(() => {
    calculateDnaGeneration();
  }, [sequencerGrid]);

  // Update upgrade cost when selection changes
  useEffect(() => {
    if (selectedUpgradeItem) {
      calculateUpgradeCost();
    }
  }, [selectedUpgradeItem, targetRarity]);

  const loadInventory = async () => {
    if (!user) return;
    
    try {
      // Load all inventory items from different endpoints
      const [seeds, flowers, butterflies, caterpillars, fish] = await Promise.all([
        fetch(`/api/user/${user.id}/seeds`).then(r => r.json()),
        fetch(`/api/user/${user.id}/flowers`).then(r => r.json()),
        fetch(`/api/user/${user.id}/butterflies`).then(r => r.json()),
        fetch(`/api/user/${user.id}/caterpillars`).then(r => r.json()),
        fetch(`/api/user/${user.id}/fish`).then(r => r.json())
      ]);

      const allItems: InventoryItem[] = [];
      
      // Convert seeds
      seeds.seeds?.forEach((seed: any) => {
        allItems.push({
          id: seed.id,
          type: 'seed',
          name: seed.seedName,
          rarity: seed.seedRarity as RarityTier,
          imageUrl: '/Blumen/0.jpg', // Universal seed image wie im Inventar
          quantity: seed.quantity
        });
      });

      // Convert flowers
      flowers.flowers?.forEach((flower: any) => {
        allItems.push({
          id: flower.id,
          type: 'flower',
          name: flower.flowerName,
          rarity: flower.flowerRarity as RarityTier,
          imageUrl: flower.flowerImageUrl,
          quantity: flower.quantity || 1
        });
      });

      // Convert butterflies
      butterflies.butterflies?.forEach((butterfly: any) => {
        allItems.push({
          id: butterfly.id,
          type: 'butterfly',
          name: butterfly.butterflyName,
          rarity: butterfly.butterflyRarity as RarityTier,
          imageUrl: butterfly.butterflyImageUrl,
          quantity: butterfly.quantity || 1
        });
      });

      // Convert caterpillars
      caterpillars.caterpillars?.forEach((caterpillar: any) => {
        allItems.push({
          id: caterpillar.id,
          type: 'caterpillar',
          name: caterpillar.caterpillarName,
          rarity: caterpillar.caterpillarRarity as RarityTier,
          imageUrl: caterpillar.caterpillarImageUrl,
          quantity: caterpillar.quantity || 1
        });
      });

      // Convert fish
      fish.fish?.forEach((fishItem: any) => {
        allItems.push({
          id: fishItem.id,
          type: 'fish',
          name: fishItem.fishName,
          rarity: fishItem.fishRarity as RarityTier,
          imageUrl: fishItem.fishImageUrl,
          quantity: fishItem.quantity || 1
        });
      });

      setInventory(allItems);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      showNotification('Fehler beim Laden des Inventars', 'error');
    }
  };

  const calculateDnaGeneration = () => {
    let totalDna = 0;
    const flatGrid = sequencerGrid.flat();
    
    // Calculate DNA for each occupied slot based on neighbors
    flatGrid.forEach((slot, index) => {
      if (slot.item) {
        // Get base value for this item type and rarity
        const baseValue = ITEM_BASE_VALUES[slot.item.type]?.[slot.item.rarity as DnaRarityTier] || 10;
        
        // Count neighbors that have items
        const neighborIndices = GRID_NEIGHBORS[index] || [];
        const occupiedNeighbors = neighborIndices.filter(neighborIndex => 
          flatGrid[neighborIndex]?.item !== null
        ).length;
        
        // Calculate DNA: BaseValue × (1 + OccupiedNeighbors)
        // +1 ensures single items still give their base value
        const itemDna = baseValue * (1 + occupiedNeighbors);
        totalDna += itemDna;
        
        console.log(`🧬 Slot ${index}: ${slot.item.name} (${slot.item.type}/${slot.item.rarity}) = ${baseValue} × ${1 + occupiedNeighbors} = ${itemDna} DNA`);
      }
    });
    
    console.log(`🧬 Total DNA Generation: ${totalDna}`);
    setDnaToGenerate(Math.floor(totalDna));
  };

  const calculateUpgradeCost = () => {
    if (!selectedUpgradeItem) return;
    
    const currentRarityIndex = Object.keys(RARITY_MULTIPLIERS).indexOf(selectedUpgradeItem.rarity);
    const targetRarityIndex = Object.keys(RARITY_MULTIPLIERS).indexOf(targetRarity);
    
    if (targetRarityIndex <= currentRarityIndex) {
      setUpgradeCost(0);
      return;
    }
    
    // Calculate cost using the formula: DNA-Kosten = (Platz-Differenz)² × Rarität-Faktor + Grundwert
    const placeDifference = targetRarityIndex - currentRarityIndex;
    const rarityFactor = RARITY_MULTIPLIERS[targetRarity as DnaRarityTier] || 1;
    const baseCost = BASE_DNA_COSTS[targetRarity as keyof typeof BASE_DNA_COSTS] || 0;
    
    const cost = Math.pow(placeDifference, 2) * rarityFactor + baseCost;
    setUpgradeCost(cost);
  };

  const handleGridSlotClick = (row: number, col: number) => {
    if (isSequencing) return;
    
    const newGrid = [...sequencerGrid];
    
    // If slot is occupied, remove item
    if (newGrid[row][col].item) {
      newGrid[row][col].item = null;
      setSequencerGrid(newGrid);
      return;
    }
    
    // Open item selection modal for empty slots
    setSelectedGridPosition({ row, col });
    setShowItemSelection(true);
  };
  
  const handleItemSelection = (selectedItem: InventoryItem) => {
    if (!selectedGridPosition || selectedItem.quantity <= 0) return;
    
    const newGrid = [...sequencerGrid];
    newGrid[selectedGridPosition.row][selectedGridPosition.col].item = { ...selectedItem };
    setSequencerGrid(newGrid);
    
    // Close modal
    setShowItemSelection(false);
    setSelectedGridPosition(null);
  };

  const handleStartSequencing = async () => {
    if (isSequencing || dnaToGenerate === 0) return;
    
    setIsSequencing(true);
    setSequenceProgress(0);
    
    // Simulate sequencing process
    const interval = setInterval(() => {
      setSequenceProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          completeSequencing();
          return 100;
        }
        return prev + 2; // 5 second process (100/2 * 100ms)
      });
    }, 100);
  };

  const completeSequencing = async () => {
    try {
      // Collect all items from the sequencer grid
      const placedItems = [];
      for (const row of sequencerGrid) {
        for (const slot of row) {
          if (slot.item) {
            placedItems.push({
              id: slot.item.id,
              type: slot.item.type,
              name: slot.item.name,
              rarity: slot.item.rarity
            });
          }
        }
      }
      
      // Call new sequencing API that consumes items
      const response = await fetch(`/api/user/${user!.id}/dna/sequence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: placedItems,
          dnaAmount: dnaToGenerate 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setDna(data.dna);
        showNotification(`🧬 ${dnaToGenerate} DNA generiert! ${data.itemsConsumed} Items verbraucht.`, 'success');
        
        // Clear grid and reload inventory
        setSequencerGrid(Array(3).fill(null).map((_, row) => 
          Array(3).fill(null).map((_, col) => ({
            item: null,
            position: { row, col }
          }))
        ));
        loadInventory();
      } else {
        const error = await response.json();
        showNotification(error.message || 'Fehler beim Generieren von DNA', 'error');
      }
    } catch (error) {
      showNotification('Fehler beim Generieren von DNA', 'error');
    } finally {
      setIsSequencing(false);
      setSequenceProgress(0);
    }
  };

  const handleStartUpgrade = async () => {
    if (!selectedUpgradeItem || isUpgrading || dna < upgradeCost) return;
    
    setIsUpgrading(true);
    setUpgradeProgress(0);
    
    // Simulate upgrade process
    const interval = setInterval(() => {
      setUpgradeProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          completeUpgrade();
          return 100;
        }
        return prev + 1.5; // ~7 second process
      });
    }, 100);
  };

  const completeUpgrade = async () => {
    try {
      if (!selectedUpgradeItem) return;
      
      // Call upgrade API
      const response = await fetch(`/api/user/${user!.id}/items/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedUpgradeItem.id,
          itemType: selectedUpgradeItem.type,
          targetRarity: targetRarity,
          dnaCost: upgradeCost
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setDna(data.remainingDna);
        showNotification(`✨ Item zu ${getRarityDisplayName(targetRarity)} aufgewertet!`, 'success');
        
        // Clear selection and reload inventory
        setSelectedUpgradeItem(null);
        loadInventory();
      } else {
        const error = await response.json();
        showNotification(error.message || 'Fehler beim Upgraden des Items', 'error');
      }
    } catch (error) {
      showNotification('Fehler beim Upgraden des Items', 'error');
    } finally {
      setIsUpgrading(false);
      setUpgradeProgress(0);
    }
  };

  const filteredInventory = selectedCategory === 'all' 
    ? inventory 
    : inventory.filter(item => item.type === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-950 p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Dna className="h-6 w-6 text-teal-400" />
            <h1 className="text-2xl font-bold text-white">DNA-Labor</h1>
          </div>
          <Badge variant="secondary" className="bg-teal-900 text-teal-100">
            🧬 {dna} DNA
          </Badge>
        </div>
        <HelpButton 
          helpText="DNA-Sequenzer: Platziere Items im 3x3 Grid um DNA zu generieren. D-Nator: Verwende DNA um Items zu upgraden. Upgrade-Kosten: DNA-Kosten = (Platz-Differenz)² × Rarität-Faktor + Grundwert"
          viewType="garden"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DNA Sequencer (Left Side) */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <TestTube className="h-5 w-5 text-teal-400" />
              <span>DNA-Sequenzer</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 3x3 Grid */}
            <div className="grid grid-cols-3 gap-1.5 p-3 bg-slate-800 rounded-lg">
              {sequencerGrid.map((row, rowIndex) =>
                row.map((slot, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleGridSlotClick(rowIndex, colIndex)}
                    className={`
                      aspect-square border-2 border-dashed rounded-lg cursor-pointer
                      flex items-center justify-center relative
                      ${slot.item 
                        ? 'bg-slate-900/30' 
                        : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                      }
                      ${isSequencing ? 'cursor-not-allowed opacity-50' : ''}
                    `}
                    style={slot.item ? {
                      borderColor: slot.item.rarity === 'common' ? '#fbbf24' :
                                 slot.item.rarity === 'uncommon' ? '#10b981' :
                                 slot.item.rarity === 'rare' ? '#3b82f6' :
                                 slot.item.rarity === 'super-rare' ? '#06b6d4' :
                                 slot.item.rarity === 'epic' ? '#8b5cf6' :
                                 slot.item.rarity === 'legendary' ? '#f97316' :
                                 slot.item.rarity === 'mythical' ? '#ef4444' : '#6b7280'
                    } : undefined}
                  >
                    {slot.item ? (
                      <div className="w-full h-full p-1">
                        <img 
                          src={slot.item.imageUrl} 
                          alt={slot.item.name}
                          className="w-full h-full object-cover rounded border-2"
                          style={{ borderColor: getRarityColor(slot.item.rarity) }}
                        />
                      </div>
                    ) : (
                      <Plus className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* DNA Generation Display */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300">DNA-Generation:</span>
                <span className="text-teal-400 font-bold">{dnaToGenerate} DNA</span>
              </div>
              
              {isSequencing && (
                <div className="space-y-2">
                  <Progress value={sequenceProgress} className="h-2" />
                  <div className="text-xs text-slate-400 text-center">
                    Sequenzierung läuft... {Math.round(sequenceProgress)}%
                  </div>
                </div>
              )}
            </div>

            {/* Sequencing Button */}
            <Button 
              onClick={handleStartSequencing}
              disabled={isSequencing || dnaToGenerate === 0}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isSequencing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Sequenzierung...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  DNA Sequenzieren
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* D-Nator (Right Side) */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              <span>D-Nator</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Item Selection */}
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Item auswählen:</label>
              <div className="bg-slate-800/50 rounded-lg p-3 mb-4 border border-slate-700">
                <div className="flex justify-center gap-2 flex-wrap">
                  {(['all', 'seed', 'flower', 'butterfly', 'caterpillar', 'fish'] as const).map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={`text-xs px-3 py-2 transition-all ${
                        selectedCategory === category 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500' 
                          : 'hover:bg-slate-700 text-slate-300 border-slate-600'
                      }`}
                    >
                      {category === 'all' ? 'Alle' : 
                       category === 'seed' ? 'Samen' :
                       category === 'flower' ? 'Blumen' :
                       category === 'butterfly' ? 'Schmetterlinge' :
                       category === 'caterpillar' ? 'Raupen' : 'Fische'}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 max-h-[31rem] overflow-y-auto bg-slate-800 rounded p-3">
                {filteredInventory.slice(0, 24).map(item => (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => setSelectedUpgradeItem(item)}
                    className={`
                      cursor-pointer p-3 rounded border-3 flex flex-col items-center text-sm transition-all
                      ${selectedUpgradeItem?.id === item.id && selectedUpgradeItem?.type === item.type
                        ? 'border-purple-400 bg-purple-900/30 shadow-lg shadow-purple-400/30' 
                        : 'border-slate-600 hover:border-slate-500 hover:shadow-md'
                      }
                    `}
                  >
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg mb-2 border-4"
                      style={{ 
                        borderColor: item.rarity === 'common' ? '#fbbf24' :
                                   item.rarity === 'uncommon' ? '#10b981' :
                                   item.rarity === 'rare' ? '#3b82f6' :
                                   item.rarity === 'super-rare' ? '#06b6d4' :
                                   item.rarity === 'epic' ? '#8b5cf6' :
                                   item.rarity === 'legendary' ? '#f97316' :
                                   item.rarity === 'mythical' ? '#ef4444' : '#6b7280'
                      }}
                    />
                    <div className="text-center w-full">
                      <div 
                        className="font-medium truncate w-full mb-1" 
                        style={{ color: getRarityColor(item.rarity) }}
                      >
                        {item.name}
                      </div>
                      <div className="text-slate-400 text-xs mb-2">Anzahl: {item.quantity}</div>
                      <div 
                        className="inline-block text-xs font-bold px-2 py-1 rounded-full text-white text-center min-w-[70px]"
                        style={{ 
                          backgroundColor: item.rarity === 'common' ? '#fbbf24' :
                                         item.rarity === 'uncommon' ? '#10b981' :
                                         item.rarity === 'rare' ? '#3b82f6' :
                                         item.rarity === 'super-rare' ? '#06b6d4' :
                                         item.rarity === 'epic' ? '#8b5cf6' :
                                         item.rarity === 'legendary' ? '#f97316' :
                                         item.rarity === 'mythical' ? '#ef4444' : '#6b7280',
                          color: 'white'
                        }}
                      >
                        {getRarityDisplayName(item.rarity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Rarity Selection */}
            {selectedUpgradeItem && (
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Ziel-Rarität:</label>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  {(['uncommon', 'rare', 'super-rare', 'epic', 'legendary', 'mythical'] as RarityTier[]).map(rarity => {
                    const currentIndex = Object.keys(RARITY_MULTIPLIERS).indexOf(selectedUpgradeItem.rarity);
                    const targetIndex = Object.keys(RARITY_MULTIPLIERS).indexOf(rarity);
                    const isAvailable = targetIndex > currentIndex;
                    
                    return (
                      <Button
                        key={rarity}
                        variant={targetRarity === rarity ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setTargetRarity(rarity)}
                        disabled={!isAvailable}
                        className="text-xs px-1 py-1"
                        style={{ 
                          color: isAvailable ? getRarityColor(rarity) : undefined,
                          opacity: isAvailable ? 1 : 0.3
                        }}
                      >
                        {getRarityDisplayName(rarity)}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upgrade Cost Display */}
            {selectedUpgradeItem && upgradeCost > 0 && (
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300">Upgrade-Kosten:</span>
                  <span className={`font-bold ${dna >= upgradeCost ? 'text-purple-400' : 'text-red-400'}`}>
                    {upgradeCost} DNA
                  </span>
                </div>
                
                {isUpgrading && (
                  <div className="space-y-2">
                    <Progress value={upgradeProgress} className="h-2" />
                    <div className="text-xs text-slate-400 text-center">
                      Upgrade läuft... {Math.round(upgradeProgress)}%
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upgrade Button */}
            <Button 
              onClick={handleStartUpgrade}
              disabled={!selectedUpgradeItem || isUpgrading || dna < upgradeCost || upgradeCost === 0}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isUpgrading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Upgrading...
                </>
              ) : (
                <>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Item Upgraden
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Item Selection Modal */}
      <Dialog open={showItemSelection} onOpenChange={setShowItemSelection}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <Package className="h-5 w-5 text-teal-400" />
              <span>Item für Sequenzer auswählen</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-1">
              {(['all', 'seed', 'flower', 'butterfly', 'caterpillar', 'fish'] as const).map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="text-xs px-3 py-1"
                >
                  {category === 'all' ? 'Alle' : 
                   category === 'seed' ? 'Samen' :
                   category === 'flower' ? 'Blumen' :
                   category === 'butterfly' ? 'Schmetterlinge' :
                   category === 'caterpillar' ? 'Raupen' : 'Fische'}
                </Button>
              ))}
            </div>
            
            {/* Item Grid */}
            <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto bg-slate-800 rounded p-4">
              {filteredInventory.filter(item => item.quantity > 0).map(item => {
                const baseValue = ITEM_BASE_VALUES[item.type]?.[item.rarity as DnaRarityTier] || 10;
                
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleItemSelection(item)}
                    className="cursor-pointer p-3 rounded border-4 hover:border-teal-400 transition-all flex flex-col items-center text-xs space-y-2"
                    style={{
                      backgroundColor: '#374151',
                      borderColor: '#6b7280'
                    }}
                  >
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                      style={{ borderColor: getRarityColor(item.rarity), borderWidth: '2px' }}
                    />
                    <div className="text-center space-y-1">
                      <div 
                        className="font-medium truncate w-full" 
                        style={{ color: getRarityColor(item.rarity) }}
                      >
                        {item.name}
                      </div>
                      <div className="text-slate-400">Anzahl: {item.quantity}</div>
                      <div 
                        className="inline-block text-xs font-bold px-2 py-1 rounded-full text-white text-center min-w-[60px]"
                        style={{ 
                          backgroundColor: item.rarity === 'common' ? '#fbbf24' :
                                         item.rarity === 'uncommon' ? '#10b981' :
                                         item.rarity === 'rare' ? '#3b82f6' :
                                         item.rarity === 'super-rare' ? '#06b6d4' :
                                         item.rarity === 'epic' ? '#8b5cf6' :
                                         item.rarity === 'legendary' ? '#f97316' :
                                         item.rarity === 'mythical' ? '#ef4444' : '#6b7280',
                          color: 'white'
                        }}
                      >
                        {getRarityDisplayName(item.rarity)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {filteredInventory.filter(item => item.quantity > 0).length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Keine Items in dieser Kategorie verfügbar</p>
              </div>
            )}
            
            {/* Close Button */}
            <div className="flex justify-end pt-4">
              <Button
                variant="ghost"
                onClick={() => setShowItemSelection(false)}
                className="flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Abbrechen</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};