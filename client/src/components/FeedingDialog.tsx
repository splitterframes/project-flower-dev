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

interface FeedingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  caterpillars: UserCaterpillar[];
  onFeedCaterpillar: (caterpillarId: number, fieldIndex: number) => void;
  fieldIndex: number;
}

export const FeedingDialog: React.FC<FeedingDialogProps> = ({
  isOpen,
  onClose,
  caterpillars,
  onFeedCaterpillar,
  fieldIndex
}) => {
  const [selectedCaterpillar, setSelectedCaterpillar] = useState<UserCaterpillar | null>(null);

  const handleFeed = () => {
    if (selectedCaterpillar) {
      onFeedCaterpillar(selectedCaterpillar.caterpillarId, fieldIndex);
      onClose();
      setSelectedCaterpillar(null);
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
            Wähle eine Raupe aus deinem Inventar zum Füttern
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-2">
          {caterpillars.map((caterpillar) => (
            <Card 
              key={caterpillar.id}
              className={`cursor-pointer transition-all border-2 hover:scale-105 ${
                selectedCaterpillar?.id === caterpillar.id 
                  ? 'border-blue-400 bg-blue-900/40' 
                  : 'border-slate-600 hover:border-blue-400/60 bg-slate-800/40'
              }`}
              onClick={() => setSelectedCaterpillar(caterpillar)}
            >
              <CardContent className="p-3 text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-lg overflow-hidden">
                  <img
                    src={caterpillar.caterpillarImageUrl}
                    alt={caterpillar.caterpillarName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-white text-sm truncate mb-1">
                  {caterpillar.caterpillarName}
                </h3>
                <Badge 
                  style={{ 
                    backgroundColor: getRarityColor(caterpillar.caterpillarRarity),
                    color: 'white' 
                  }}
                  className="text-xs mb-1"
                >
                  {getRarityDisplayName(caterpillar.caterpillarRarity)}
                </Badge>
                <p className="text-xs text-slate-300">
                  Anzahl: {caterpillar.quantity}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {caterpillars.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <p>Du hast keine Raupen im Inventar.</p>
            <p className="text-sm">Sammle erst Raupen von Grasfeldern!</p>
          </div>
        )}

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
            disabled={!selectedCaterpillar}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            🐛 Füttern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};