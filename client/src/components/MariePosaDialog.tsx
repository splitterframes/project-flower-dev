import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Crown, Sparkles, ShoppingCart, Fish, Flower2, Bug, ChevronDown, ChevronRight } from 'lucide-react';
import { useNotification } from '../hooks/useNotification';
import { getRarityColor, getRarityDisplayName, type RarityTier } from '@shared/rarity';

// Helper function to map rarity number to RarityTier
const mapRarityNumberToTier = (rarity: number): RarityTier => {
  const rarityMap: Record<number, RarityTier> = {
    0: 'common',
    1: 'uncommon', 
    2: 'rare',
    3: 'super-rare',
    4: 'epic',
    5: 'legendary',
    6: 'mythical'
  };
  return rarityMap[rarity] || 'common';
};

interface MariePosaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onPurchaseComplete: () => void;
}

interface SellableItem {
  id: string;
  type: 'flower' | 'butterfly' | 'caterpillar' | 'fish';
  name: string;
  rarity: number;
  normalPrice: number;
  sellPrice: number; // 50% of normal price
  imageUrl?: string;
  originalId: number;
}

interface SelectedItem extends SellableItem {
  quantity: number;
}

// Preise basierend auf Rarität (exponentiell ansteigend)
const getItemPrice = (type: string, rarity: number): number => {
  const basePrices = {
    flower: 25,      // Blumen günstiger
    butterfly: 100,  // Standard Schmetterlingspreise
    caterpillar: 50, // Raupen mittlerer Preis
    fish: 150       // Fische teurer
  };
  
  const basePrice = basePrices[type as keyof typeof basePrices] || 50;
  return Math.floor(Math.pow(2, rarity) * basePrice);
};

export default function MariePosaDialog({ isOpen, onClose, user, onPurchaseComplete }: MariePosaDialogProps) {
  const { showNotification } = useNotification();
  const [availableItems, setAvailableItems] = useState<SellableItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  
  // Collapsible state für Kategorien
  const [expandedCategories, setExpandedCategories] = useState({
    flower: true,
    butterfly: true, 
    caterpillar: true,
    fish: true
  });

  const fetchAvailableItems = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [flowersRes, butterfliesRes, fishRes, caterpillarsRes] = await Promise.all([
        fetch(`/api/user/${user.id}/flowers`),
        fetch(`/api/user/${user.id}/butterflies`),
        fetch(`/api/user/${user.id}/fish`),
        fetch(`/api/user/${user.id}/caterpillars`)
      ]);

      const flowers = await flowersRes.json();
      const butterflies = await butterfliesRes.json();
      const fish = await fishRes.json();
      const caterpillars = await caterpillarsRes.json();

      const items: SellableItem[] = [];

      // Add flowers with robust rarity handling
      flowers.flowers?.forEach((flower: any) => {
        const rarity = flower.flowerRarity ?? flower.rarity ?? 0; // Fallback für undefined
        const normalPrice = getItemPrice('flower', rarity);
        items.push({
          id: `flower-${flower.id}`,
          type: 'flower',
          name: flower.flowerName || `Blume ${flower.flowerId || flower.id}`,
          rarity: rarity,
          normalPrice: normalPrice,
          sellPrice: Math.floor(normalPrice * 0.5),
          imageUrl: flower.flowerImageUrl,
          originalId: flower.id
        });
      });

      // Add butterflies with robust rarity handling
      butterflies.butterflies?.forEach((butterfly: any) => {
        const rarity = butterfly.butterflyRarity ?? butterfly.rarity ?? 0;
        const normalPrice = getItemPrice('butterfly', rarity);
        items.push({
          id: `butterfly-${butterfly.id}`,
          type: 'butterfly',
          name: butterfly.butterflyName || `Schmetterling ${butterfly.butterflyId || butterfly.id}`,
          rarity: rarity,
          normalPrice: normalPrice,
          sellPrice: Math.floor(normalPrice * 0.5),
          imageUrl: butterfly.butterflyImageUrl,
          originalId: butterfly.id
        });
      });

      // Add fish with robust rarity handling
      fish.fish?.forEach((fishItem: any) => {
        const rarity = fishItem.fishRarity ?? fishItem.rarity ?? 0;
        const normalPrice = getItemPrice('fish', rarity);
        items.push({
          id: `fish-${fishItem.id}`,
          type: 'fish',
          name: fishItem.fishName || `Fisch ${fishItem.fishId || fishItem.id}`,
          rarity: rarity,
          normalPrice: normalPrice,
          sellPrice: Math.floor(normalPrice * 0.5),
          imageUrl: fishItem.fishImageUrl,
          originalId: fishItem.id
        });
      });

      // Add caterpillars with robust rarity handling  
      caterpillars.caterpillars?.forEach((caterpillar: any) => {
        const rarity = caterpillar.caterpillarRarity ?? caterpillar.rarity ?? 0;
        const normalPrice = getItemPrice('caterpillar', rarity);
        items.push({
          id: `caterpillar-${caterpillar.id}`,
          type: 'caterpillar', 
          name: caterpillar.caterpillarName || `Raupe ${caterpillar.caterpillarId || caterpillar.id}`,
          rarity: rarity,
          normalPrice: normalPrice,
          sellPrice: Math.floor(normalPrice * 0.5),
          imageUrl: caterpillar.caterpillarImageUrl,
          originalId: caterpillar.id
        });
      });

      setAvailableItems(items);
    } catch (error) {
      console.error('Error fetching items:', error);
      showNotification('Fehler beim Laden der verfügbaren Items', 'error');
    }
    setIsLoading(false);
  };

  const handleItemSelect = (item: SellableItem) => {
    if (selectedItems.length >= 4) {
      showNotification('Marie Posa kauft maximal 4 Items pro Besuch!', 'warning');
      return;
    }

    const existingItem = selectedItems.find(selected => selected.id === item.id);
    if (existingItem) {
      showNotification('Dieses Item ist bereits ausgewählt!', 'warning');
    } else {
      setSelectedItems(prev => [...prev, { ...item, quantity: 1 }]);
    }
  };

  const removeSelectedItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSell = async () => {
    if (!user || selectedItems.length === 0) return;

    setIsSelling(true);
    try {
      const sellData = {
        items: selectedItems.map(item => ({
          type: item.type,
          originalId: item.originalId,
          sellPrice: item.sellPrice
        }))
      };

      const response = await fetch(`/api/user/${user.id}/marie-posa-sell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify(sellData)
      });

      if (response.ok) {
        const result = await response.json();
        const totalEarned = selectedItems.reduce((sum, item) => sum + item.sellPrice, 0);
        
        showNotification(
          `Marie Posa hat deine Items für ${totalEarned} Credits gekauft! 💰✨`, 
          'success'
        );
        
        setSelectedItems([]);
        onPurchaseComplete();
        onClose();
      } else {
        const error = await response.json();
        showNotification(error.message || 'Verkauf fehlgeschlagen', 'error');
      }
    } catch (error) {
      console.error('Error selling items:', error);
      showNotification('Fehler beim Verkauf', 'error');
    }
    setIsSelling(false);
  };

  const totalValue = selectedItems.reduce((sum, item) => sum + item.sellPrice, 0);

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'flower': return <Flower2 className="h-4 w-4" />;
      case 'butterfly': return <Bug className="h-4 w-4" />;
      case 'caterpillar': return <Bug className="h-4 w-4 text-green-500" />;
      case 'fish': return <Fish className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getCategoryTitle = (type: string) => {
    switch (type) {
      case 'flower': return 'Blumen 🌸';
      case 'butterfly': return 'Schmetterlinge 🦋';
      case 'caterpillar': return 'Raupen 🐛';
      case 'fish': return 'Fische 🐟';
      default: return type;
    }
  };
  
  const toggleCategory = (type: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [type]: !prev[type as keyof typeof prev]
    }));
  };
  
  // Gruppiere Items nach Typ
  const groupedItems = availableItems.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, SellableItem[]>);

  useEffect(() => {
    if (isOpen && user) {
      fetchAvailableItems();
      setSelectedItems([]);
    }
  }, [isOpen, user]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-amber-900/20 to-yellow-900/20 border-2 border-yellow-500/30 text-white max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl font-bold text-yellow-200">
            <Crown className="h-8 w-8 mr-3 text-yellow-400 animate-pulse" />
            👑 Marie Posa - Exklusive Händlerin
          </DialogTitle>
          <p className="text-yellow-300/80 text-sm">
            Ich kaufe deine wertvollen Items zum halben Marktpreis - sofortige Bezahlung garantiert!
          </p>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Info Panel */}
          <Card className="bg-yellow-900/30 border-yellow-500/30">
            <CardContent className="p-4">
              <h3 className="font-bold text-yellow-200 mb-2 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                📋 Handelsbedingungen
              </h3>
              <ul className="text-yellow-100/80 text-sm space-y-1">
                <li>• Maximal 4 Items pro Besuch</li>
                <li>• 50% des Marktwertes - sofort ausgezahlt</li>
                <li>• Alle 3 Stunden verfügbar</li>
                <li>• Keine Rückgabe möglich</li>
              </ul>
            </CardContent>
          </Card>

          {/* Items List mit Kategorien */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-yellow-200">Marie Posa durchsucht ihre Ware...</p>
              </div>
            ) : availableItems.length === 0 ? (
              <div className="text-center py-8 text-yellow-200">
                Du hast keine Items zum Verkauf.
              </div>
            ) : (
              Object.keys(groupedItems).map(categoryType => {
                const items = groupedItems[categoryType];
                const isExpanded = expandedCategories[categoryType as keyof typeof expandedCategories];
                
                return (
                  <div key={categoryType} className="border border-yellow-500/30 rounded-lg bg-yellow-900/20">
                    <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(categoryType)}>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-3 hover:bg-yellow-800/20 transition-colors">
                          <div className="flex items-center gap-3">
                            {getItemIcon(categoryType)}
                            <span className="font-medium text-yellow-200">{getCategoryTitle(categoryType)}</span>
                            <Badge variant="secondary" className="bg-yellow-700/30 text-yellow-200">
                              {items.length}
                            </Badge>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-yellow-200" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-yellow-200" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="px-3 pb-3 space-y-2">
                          {items.map(item => (
                            <Card 
                              key={item.id} 
                              className="cursor-pointer hover:bg-yellow-800/20 transition-colors bg-slate-800/50 border-slate-600"
                              onClick={() => handleItemSelect(item)}
                            >
                              <CardContent className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {/* 80x80px Bild */}
                                  <div className="w-20 h-20 bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden">
                                    {item.imageUrl ? (
                                      <img 
                                        src={item.imageUrl} 
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="text-slate-400">
                                        {getItemIcon(item.type)}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium text-sm text-white">{item.name}</span>
                                    <Badge 
                                      className={`text-xs w-fit ${getRarityColor(mapRarityNumberToTier(item.rarity))} border`}
                                      variant="outline"
                                    >
                                      {getRarityDisplayName(mapRarityNumberToTier(item.rarity))}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-green-400">
                                    {item.sellPrice} Cr
                                  </div>
                                  <div className="text-xs text-slate-400 line-through">
                                    Normal: {item.normalPrice} Cr
                                  </div>
                                  <div className="text-xs text-amber-400 font-medium">
                                    50% Rabatt
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Items Summary */}
          {selectedItems.length > 0 && (
            <div className="border-t border-yellow-500/30 pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2 text-yellow-200">
                <ShoppingCart className="h-4 w-4" />
                Ausgewählte Items ({selectedItems.length}/4)
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-900/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      {/* 80x80px Bild für ausgewählte Items */}
                      <div className="w-20 h-20 bg-slate-700 rounded-md flex items-center justify-center overflow-hidden">
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-slate-400">
                            {getItemIcon(item.type)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{item.name}</span>
                        <Badge 
                          className={`text-xs w-fit ${getRarityColor(mapRarityNumberToTier(item.rarity))} border`}
                          variant="outline"
                        >
                          {getRarityDisplayName(mapRarityNumberToTier(item.rarity))}
                        </Badge>
                      </div>
                      <span className="text-xs bg-yellow-700 text-yellow-100 px-2 py-1 rounded">
                        x{item.quantity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-green-400">
                        {item.sellPrice * item.quantity} Cr
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSelectedItem(item.id)}
                        className="h-6 w-6 p-0 hover:bg-red-500/20 text-red-400"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator className="my-3 bg-yellow-500/30" />
              
              <div className="flex justify-between items-center font-medium">
                <span className="text-yellow-200">Gesamt:</span>
                <span className="text-lg text-green-400 font-bold">
                  {totalValue} Cr
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-3 pt-4 border-t border-yellow-500/30">
          <Button 
            onClick={onClose}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Abbrechen
          </Button>
          
          <Button
            onClick={handleSell}
            disabled={selectedItems.length === 0 || isSelling}
            className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium flex items-center gap-2"
          >
            {isSelling ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Verkaufe...
              </>
            ) : (
              <>
                <Crown className="h-4 w-4" />
                An Marie Posa verkaufen ({totalValue} Cr)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}