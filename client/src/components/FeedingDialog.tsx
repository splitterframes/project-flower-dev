import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRarityColor, getRarityDisplayName } from "@shared/rarity";

interface UserCaterpillar {
  id: number;
  userId: number;
  caterpillarId: number;
  caterpillarName: string;
  caterpillarRarity: string;
  caterpillarImageUrl: string;
  quantity: number;
  createdAt: string;
}

interface UserButterfly {
  id: number;
  userId: number;
  butterflyId: number;
  butterflyName: string;
  butterflyRarity: string;
  butterflyImageUrl: string;
  quantity: number;
  createdAt: string;
}

// Combined item for feeding
interface FeedingItem {
  id: number;
  name: string;
  rarity: string;
  imageUrl: string;
  quantity: number;
  type: 'caterpillar' | 'butterfly';
  originalId: number; // caterpillarId or butterflyId
}

interface FeedingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  caterpillars: UserCaterpillar[];
  butterflies?: UserButterfly[]; // New: Accept butterflies from garden inventory
  onFeedCaterpillar: (caterpillarId: number, fieldIndex: number) => void;
  onFeedButterfly?: (butterflyId: number, fieldIndex: number) => void; // New: Feed butterflies (convert to caterpillars)
  fieldIndex: number;
}

export const FeedingDialog: React.FC<FeedingDialogProps> = ({
  isOpen,
  onClose,
  caterpillars,
  butterflies = [],
  onFeedCaterpillar,
  onFeedButterfly,
  fieldIndex
}) => {
  const [selectedItem, setSelectedItem] = useState<FeedingItem | null>(null);

  // Combine caterpillars and butterflies into feeding items (filter out items with 0 quantity)
  const feedingItems: FeedingItem[] = [
    // Convert caterpillars to feeding items
    ...caterpillars.filter(cat => cat.quantity > 0).map(cat => ({
      id: cat.id,
      name: cat.caterpillarName,
      rarity: cat.caterpillarRarity,
      imageUrl: cat.caterpillarImageUrl,
      quantity: cat.quantity,
      type: 'caterpillar' as const,
      originalId: cat.caterpillarId
    })),
    // Convert butterflies to feeding items (they become caterpillars in pond)
    ...butterflies.filter(butter => butter.quantity > 0).map(butter => ({
      id: butter.id + 10000, // Offset to avoid ID conflicts
      name: `${butter.butterflyName} → Raupe`,
      rarity: butter.butterflyRarity,
      imageUrl: butter.butterflyImageUrl,
      quantity: butter.quantity,
      type: 'butterfly' as const,
      originalId: butter.butterflyId
    }))
  ];

  const handleFeed = () => {
    if (selectedItem) {
      if (selectedItem.type === 'caterpillar') {
        onFeedCaterpillar(selectedItem.originalId, fieldIndex);
      } else if (selectedItem.type === 'butterfly' && onFeedButterfly) {
        onFeedButterfly(selectedItem.originalId, fieldIndex);
      }
      onClose();
      setSelectedItem(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-blue-950 to-teal-950 border border-blue-500/30">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-blue-300">
            🐟 Fische füttern
          </DialogTitle>
          <DialogDescription className="text-center text-blue-200">
            Wähle eine Raupe oder einen Schmetterling aus deinem Inventar zum Füttern
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-2">
          {feedingItems.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-blue-300 mb-2">🦋 Keine Futtermittel verfügbar</p>
              <p className="text-blue-400 text-sm">Sammle Schmetterlinge im Garten oder bereits vorhandene Raupen!</p>
            </div>
          ) : (
            feedingItems.map((item) => (
              <Card 
                key={item.id}
                className={`cursor-pointer transition-all border-2 hover:scale-105 ${
                  selectedItem?.id === item.id 
                    ? 'border-blue-400 bg-blue-900/40' 
                    : 'border-slate-600 hover:border-blue-400/60 bg-slate-800/40'
                }`}
                onClick={() => setSelectedItem(item)}
              >
                <CardContent className="p-3 text-center">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-lg overflow-hidden border-2"
                       style={{ borderColor: getRarityColor(item.rarity) }}>
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.style.display = 'flex';
                      }}
                    />
                    <div
                      className="w-full h-full bg-gradient-to-br from-blue-500 to-green-500 rounded flex items-center justify-center text-2xl"
                      style={{ display: 'none' }}
                    >
                      {item.type === 'butterfly' ? '🦋' : '🐛'}
                    </div>
                  </div>
                  <h3 className="font-semibold text-white text-xs truncate mb-1">
                    {item.name}
                  </h3>
                  <Badge 
                    className="mb-2 text-xs"
                    style={{ backgroundColor: getRarityColor(item.rarity) }}
                  >
                    {getRarityDisplayName(item.rarity)}
                  </Badge>
                  <p className="text-blue-300 text-xs">
                    {item.type === 'butterfly' ? '🦋→🐛' : '🐛'} Verfügbar: {item.quantity}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-blue-500/20">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-slate-500 text-slate-300 hover:bg-slate-700"
          >
            Abbrechen
          </Button>
          <Button 
            onClick={handleFeed}
            disabled={!selectedItem}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Füttern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};