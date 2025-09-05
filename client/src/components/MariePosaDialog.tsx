import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Crown, Sparkles, ShoppingCart, Fish, Flower2, Bug } from 'lucide-react';
import { useNotification } from '../hooks/useNotification';
import { getRarityColor, getRarityDisplayName } from '@shared/rarity';

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

export default function MariePosaDialog({ isOpen, onClose, user, onPurchaseComplete }: MariePosaDialogProps) {
  const { showNotification } = useNotification();
  const [availableItems, setAvailableItems] = useState<SellableItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelling, setIsSelling] = useState(false);

  const fetchAvailableItems = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [flowersRes, butterfliesRes, fishRes] = await Promise.all([
        fetch(`/api/user/${user.id}/flowers`),
        fetch(`/api/user/${user.id}/butterflies`),
        fetch(`/api/user/${user.id}/fish`)
      ]);

      const flowers = await flowersRes.json();
      const butterflies = await butterfliesRes.json();
      const fish = await fishRes.json();

      const items: SellableItem[] = [];

      // Add flowers
      flowers.flowers?.forEach((flower: any) => {
        const basePrice = Math.pow(2, flower.flowerRarity) * 50; // Standard flower pricing
        items.push({
          id: `flower-${flower.id}`,
          type: 'flower',
          name: flower.flowerName || `Blume ${flower.flowerId}`,
          rarity: flower.flowerRarity,
          normalPrice: basePrice,
          sellPrice: Math.floor(basePrice * 0.5),
          imageUrl: flower.flowerImageUrl,
          originalId: flower.id
        });
      });

      // Add butterflies
      butterflies.butterflies?.forEach((butterfly: any) => {
        const basePrice = Math.pow(2, butterfly.butterflyRarity) * 100; // Standard butterfly pricing
        items.push({
          id: `butterfly-${butterfly.id}`,
          type: 'butterfly',
          name: butterfly.butterflyName || `Schmetterling ${butterfly.butterflyId}`,
          rarity: butterfly.butterflyRarity,
          normalPrice: basePrice,
          sellPrice: Math.floor(basePrice * 0.5),
          imageUrl: butterfly.butterflyImageUrl,
          originalId: butterfly.id
        });
      });

      // Add fish
      fish.fish?.forEach((fishItem: any) => {
        const basePrice = Math.pow(2, fishItem.fishRarity) * 150; // Standard fish pricing
        items.push({
          id: `fish-${fishItem.id}`,
          type: 'fish',
          name: fishItem.fishName || `Fisch ${fishItem.fishId}`,
          rarity: fishItem.fishRarity,
          normalPrice: basePrice,
          sellPrice: Math.floor(basePrice * 0.5),
          imageUrl: fishItem.fishImageUrl,
          originalId: fishItem.id
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
      // Remove if already selected
      setSelectedItems(prev => prev.filter(selected => selected.id !== item.id));
    } else {
      // Add new item
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

  const getTotalValue = () => {
    return selectedItems.reduce((sum, item) => sum + item.sellPrice, 0);
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'flower': return <Flower2 className="h-4 w-4" />;
      case 'butterfly': return <Bug className="h-4 w-4" />;
      case 'fish': return <Fish className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchAvailableItems();
    }
  }, [isOpen, user]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-amber-900/20 to-yellow-900/20 border-2 border-yellow-500/30 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl font-bold text-yellow-200">
            <Crown className="h-8 w-8 mr-3 text-yellow-400 animate-pulse" />
            👑 Marie Posa - Exklusive Händlerin
          </DialogTitle>
          <p className="text-yellow-300/80 text-sm">
            Ich kaufe deine wertvollen Items zum halben Marktpreis - sofortige Bezahlung garantiert!
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
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

          {/* Available Items */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-yellow-200">Lade deine Items...</p>
            </div>
          ) : (
            <>
              <div>
                <h3 className="font-bold text-yellow-200 mb-4 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  🎁 Verfügbare Items ({availableItems.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-80 overflow-y-auto">
                  {availableItems.map((item) => {
                    const isSelected = selectedItems.some(selected => selected.id === item.id);
                    return (
                      <Card 
                        key={item.id}
                        className={`cursor-pointer transition-all hover:scale-105 ${
                          isSelected 
                            ? 'border-yellow-400 bg-yellow-500/20 shadow-lg shadow-yellow-400/20' 
                            : 'border-slate-600 bg-slate-800/50 hover:border-yellow-500/50'
                        }`}
                        onClick={() => handleItemSelect(item)}
                      >
                        <CardContent className="p-3 text-center">
                          <div className="flex items-center justify-center mb-2">
                            {getItemIcon(item.type)}
                          </div>
                          <p className="text-xs font-medium text-white truncate">{item.name}</p>
                          <Badge 
                            style={{ backgroundColor: getRarityColor(item.rarity as any) }}
                            className="text-xs mt-1"
                          >
                            {getRarityDisplayName(item.rarity as any)}
                          </Badge>
                          <div className="mt-2">
                            <p className="text-xs text-gray-400 line-through">{item.normalPrice} Cr</p>
                            <p className="text-sm font-bold text-yellow-300">{item.sellPrice} Cr</p>
                          </div>
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-black">✓</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Selected Items Summary */}
              {selectedItems.length > 0 && (
                <>
                  <Separator className="bg-yellow-500/30" />
                  <div>
                    <h3 className="font-bold text-yellow-200 mb-3 flex items-center">
                      <Crown className="h-5 w-5 mr-2" />
                      💎 Ausgewählte Items ({selectedItems.length}/4)
                    </h3>
                    <div className="space-y-2 mb-4">
                      {selectedItems.map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30"
                        >
                          <div className="flex items-center space-x-3">
                            {getItemIcon(item.type)}
                            <span className="font-medium text-yellow-100">{item.name}</span>
                            <Badge 
                              style={{ backgroundColor: getRarityColor(item.rarity as any) }}
                              className="text-xs"
                            >
                              {getRarityDisplayName(item.rarity as any)}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-yellow-300">{item.sellPrice} Cr</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center p-4 bg-yellow-800/20 rounded-lg border border-yellow-400/50">
                      <span className="text-xl font-bold text-yellow-200">Gesamtsumme:</span>
                      <span className="text-2xl font-bold text-yellow-300">{getTotalValue()} Credits</span>
                    </div>

                    <Button
                      onClick={handleSell}
                      disabled={isSelling || selectedItems.length === 0}
                      className="w-full mt-4 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-3 text-lg"
                    >
                      {isSelling ? (
                        <>
                          <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                          Verkaufe...
                        </>
                      ) : (
                        <>
                          <Crown className="h-5 w-5 mr-2" />
                          👑 An Marie Posa verkaufen - {getTotalValue()} Cr
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}

              {availableItems.length === 0 && (
                <div className="text-center py-8">
                  <Crown className="h-16 w-16 text-yellow-400/50 mx-auto mb-4" />
                  <p className="text-yellow-200 text-lg font-medium">Keine Items zum Verkauf verfügbar</p>
                  <p className="text-yellow-300/60 text-sm mt-2">
                    Sammle Blumen, Schmetterlinge und Fische, um sie an Marie Posa zu verkaufen!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}