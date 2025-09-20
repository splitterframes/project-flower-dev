import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNotification } from '../hooks/useNotification';
import { getRarityColor, getRarityDisplayName, getRarityFromAssetId, type RarityTier } from '@shared/rarity';

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

// Helper function to map RarityTier to number
const mapRarityTierToNumber = (tier: RarityTier): number => {
  const tierMap: Record<RarityTier, number> = {
    'common': 0,
    'uncommon': 1,
    'rare': 2,
    'super-rare': 3,
    'epic': 4,
    'legendary': 5,
    'mythical': 6,
    'vip': 7  // VIP hinzugefügt
  };
  return tierMap[tier] || 0;
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

// Preise basierend auf echten Detaildialog-Preisen
const getItemPrice = (type: string, rarity: number): number => {
  const rarityTier = mapRarityNumberToTier(rarity);
  
  switch (type) {
    case 'butterfly': {
      // FIXED: Must match Exhibition system prices exactly!
      const butterflyPrices = {
        'common': 10,
        'uncommon': 25,
        'rare': 50,
        'super-rare': 100,
        'epic': 200,
        'legendary': 500,
        'mythical': 1000
      };
      return butterflyPrices[rarityTier as keyof typeof butterflyPrices] || 10;
    }
    case 'fish': {
      const fishPrices = {
        'common': 80,
        'uncommon': 200,
        'rare': 450,
        'super-rare': 940,
        'epic': 1500,
        'legendary': 2200,
        'mythical': 4000
      };
      return fishPrices[rarityTier as keyof typeof fishPrices] || 80;
    }
    case 'flower': {
      // FIXED: Use correct Exhibition-based butterfly prices!
      const butterflyPrices = {
        'common': 10,
        'uncommon': 25,
        'rare': 50,
        'super-rare': 100,
        'epic': 200,
        'legendary': 500,
        'mythical': 1000
      };
      // Blumenpreise = 30% der Schmetterlingspreise
      return Math.floor((butterflyPrices[rarityTier as keyof typeof butterflyPrices] || 10) * 0.3);
    }
    case 'caterpillar': {
      // Raupenpreise = 40% der Fischpreise
      const fishPrices = {
        'common': 80,
        'uncommon': 200,
        'rare': 450,
        'super-rare': 940,
        'epic': 1500,
        'legendary': 2200,
        'mythical': 4000
      };
      return Math.floor((fishPrices[rarityTier as keyof typeof fishPrices] || 80) * 0.4);
    }
    default:
      return 50;
  }
};

export default function MariePosaDialog({ isOpen, onClose, user, onPurchaseComplete }: MariePosaDialogProps) {
  const { showNotification } = useNotification();
  const [availableItems, setAvailableItems] = useState<SellableItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  
  // Collapsible state für Kategorien - alle eingeklappt starten
  const [expandedCategories, setExpandedCategories] = useState({
    flower: false,
    butterfly: false, 
    caterpillar: false,
    fish: false
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
        // Calculate rarity dynamically from flowerId
        const rarityTier = getRarityFromAssetId('flower', flower.flowerId || 0);
        const rarity = mapRarityTierToNumber(rarityTier);
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
        // Use stored rarity first, fall back to calculation if missing
        let rarity = 0;
        if (butterfly.butterflyRarity && butterfly.butterflyRarity !== null) {
          // Use stored rarity tier from database
          const rarityTier = butterfly.butterflyRarity as RarityTier;
          rarity = mapRarityTierToNumber(rarityTier);
        } else {
          // Fallback: Calculate rarity dynamically from butterflyId
          const butterflyId = butterfly.butterflyId || 0;
          const rarityTier = getRarityFromAssetId('butterfly', butterflyId);
          rarity = mapRarityTierToNumber(rarityTier);
        }
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
        // Calculate rarity dynamically from fishId
        const rarityTier = getRarityFromAssetId('butterfly', fishItem.fishId || 0); // Fish use butterfly ranges
        const rarity = mapRarityTierToNumber(rarityTier);
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
        // Calculate rarity dynamically from caterpillarId
        const rarityTier = getRarityFromAssetId('butterfly', caterpillar.caterpillarId || 0); // Caterpillars use butterfly ranges
        const rarity = mapRarityTierToNumber(rarityTier);
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
    const existingItem = selectedItems.find(selected => selected.id === item.id);
    
    if (existingItem) {
      // Item abwählen
      setSelectedItems(prev => prev.filter(selected => selected.id !== item.id));
    } else {
      // Item auswählen
      if (selectedItems.length >= 4) {
        showNotification('Marie Posa kauft maximal 4 Items pro Besuch!', 'warning');
        return;
      }
      setSelectedItems(prev => [...prev, { ...item, quantity: 1 }]);
    }
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
      case 'flower': return <span className="text-lg">🌸</span>;
      case 'butterfly': return <span className="text-lg">🦋</span>;
      case 'caterpillar': return <span className="text-lg">🐛</span>;
      case 'fish': return <span className="text-lg">🐟</span>;
      default: return <span className="text-lg">✨</span>;
    }
  };

  const getCategoryTitle = (type: string) => {
    switch (type) {
      case 'flower': return 'Blumen';
      case 'butterfly': return 'Schmetterlinge';
      case 'caterpillar': return 'Raupen';
      case 'fish': return 'Fische';
      default: return type;
    }
  };
  
  // Prüfe ob eine Kategorie ausgewählte Items hat
  const categoryHasSelectedItems = (categoryType: string): boolean => {
    return selectedItems.some(item => item.type === categoryType);
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
      <DialogContent 
        className="bg-gradient-to-br from-amber-900/20 to-yellow-900/20 border-2 border-yellow-500/30 text-white max-w-5xl max-h-[90vh] overflow-hidden"
        aria-describedby="marie-posa-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl font-bold text-yellow-200">
            <span className="text-3xl mr-3 animate-pulse">👑</span>
            Marie Posa - Exklusive Händlerin
          </DialogTitle>
          <div id="marie-posa-description" className="sr-only">
            Marie Posa Handelsdialog zum Verkauf von Items für Credits
          </div>
          <p className="text-yellow-300/80 text-sm">
            Ich kaufe deine wertvollen Items zum halben Marktpreis - sofortige Bezahlung garantiert!
          </p>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Info Panel */}
          <Card className="bg-yellow-900/30 border-yellow-500/30">
            <CardContent className="p-4">
              <h3 className="font-bold text-yellow-200 mb-2 flex items-center">
                <span className="text-lg mr-2">🛒</span>
                Handelsbedingungen
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
                        <div className={`flex items-center justify-between p-3 transition-colors ${
                          categoryHasSelectedItems(categoryType) 
                            ? 'bg-gradient-to-r from-yellow-600/20 to-yellow-800/20 hover:from-yellow-600/30 hover:to-yellow-800/30' 
                            : 'hover:bg-yellow-800/20'
                        }`}>
                          <div className="flex items-center gap-3">
                            {getItemIcon(categoryType)}
                            <span className={`font-medium ${
                              categoryHasSelectedItems(categoryType) ? 'text-yellow-300' : 'text-yellow-200'
                            }`}>{getCategoryTitle(categoryType)}</span>
                            <Badge variant="secondary" className={`${
                              categoryHasSelectedItems(categoryType) 
                                ? 'bg-yellow-600/40 text-yellow-100 border-yellow-400/50' 
                                : 'bg-yellow-700/30 text-yellow-200'
                            }`}>
                              {items.length}
                            </Badge>
                          </div>
                          {isExpanded ? (
                            <span className={`text-lg ${
                              categoryHasSelectedItems(categoryType) ? 'text-yellow-300' : 'text-yellow-200'
                            }`}>⬇️</span>
                          ) : (
                            <span className={`text-lg ${
                              categoryHasSelectedItems(categoryType) ? 'text-yellow-300' : 'text-yellow-200'
                            }`}>▶️</span>
                          )}
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="px-3 pb-3">
                          <div className="grid grid-cols-2 gap-2">
                            {items.map(item => (
                            <Card 
                              key={item.id} 
                              className={`cursor-pointer transition-all duration-300 ${
                                selectedItems.some(selected => selected.id === item.id)
                                  ? 'bg-gradient-to-br from-yellow-600/30 to-yellow-800/30 border-yellow-400 shadow-lg shadow-yellow-400/20 scale-[1.01]'
                                  : 'bg-slate-800/50 border-slate-600 hover:bg-yellow-800/10 hover:border-yellow-500/50'
                              }`}
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
                                <div className="text-right relative">
                                  {selectedItems.some(selected => selected.id === item.id) && (
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                                      <span className="text-xs font-bold text-black">✓</span>
                                    </div>
                                  )}
                                  <div className={`text-sm font-medium ${
                                    selectedItems.some(selected => selected.id === item.id) 
                                      ? 'text-yellow-300' 
                                      : 'text-green-400'
                                  }`}>
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
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })
            )}
          </div>

          {/* Kurze Zusammenfassung nur wenn Items ausgewählt */}
          {selectedItems.length > 0 && (
            <div className="border-t border-yellow-500/30 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-yellow-200 font-medium flex items-center gap-2">
                  <span className="text-lg">🛒</span>
                  {selectedItems.length} Item{selectedItems.length > 1 ? 's' : ''} ausgewählt (max. 4)
                </span>
                <span className="text-lg text-yellow-300 font-bold">
                  Gesamt: {totalValue} Cr
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
            className={`font-medium flex items-center gap-2 transition-all ${
              selectedItems.length > 0 
                ? 'bg-yellow-600 hover:bg-yellow-700 text-black shadow-lg shadow-yellow-400/30' 
                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSelling ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Verkaufe...
              </>
            ) : selectedItems.length > 0 ? (
              <>
                <span className="text-lg">👑</span>
                An Marie Posa verkaufen ({totalValue} Cr)
              </>
            ) : (
              <>
                <span className="text-lg">👑</span>
                Items auswählen zum Verkaufen
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}