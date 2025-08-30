import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { ButterflyHoverPreview } from "./ButterflyHoverPreview";
import { RarityImage } from "./RarityImage";
import { Trophy, Plus, DollarSign, Clock, Star, Info } from "lucide-react";
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";
import type { ExhibitionFrame, ExhibitionButterfly, UserButterfly } from "@shared/schema";

interface ButterflyDetailDialogProps {
  butterfly: ExhibitionButterfly | null;
  isOpen: boolean;
  onClose: () => void;
}

const ButterflyDetailDialog: React.FC<ButterflyDetailDialogProps> = ({ butterfly, isOpen, onClose }) => {
  if (!butterfly) return null;

  const getHourlyRate = (rarity: string): number => {
    switch (rarity) {
      case 'common': return 1;
      case 'uncommon': return 3;
      case 'rare': return 8;
      case 'super-rare': return 15;
      case 'epic': return 25;
      case 'legendary': return 50;
      case 'mythical': return 100;
      default: return 1;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-600 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {butterfly.butterflyName}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-6">
          {/* Large butterfly image */}
          <div className="w-96 h-96 rounded-lg overflow-hidden border-4" 
               style={{ borderColor: getRarityColor(butterfly.butterflyRarity as RarityTier) }}>
            <img
              src={butterfly.butterflyImageUrl}
              alt={butterfly.butterflyName}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Butterfly details */}
          <div className="text-center space-y-3">
            <div className={`text-lg font-semibold ${getRarityColor(butterfly.butterflyRarity as RarityTier)}`}>
              {getRarityDisplayName(butterfly.butterflyRarity as RarityTier)}
            </div>
            
            <div className="flex items-center justify-center space-x-2 text-green-400">
              <DollarSign className="h-5 w-5" />
              <span className="text-lg font-bold">{getHourlyRate(butterfly.butterflyRarity)} Cr/Std</span>
            </div>
            
            <div className="flex items-center justify-center space-x-2 text-slate-400">
              <Clock className="h-4 w-4" />
              <span>Platziert: {new Date(butterfly.placedAt).toLocaleDateString('de-DE')}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ExhibitionView: React.FC = () => {
  const { user } = useAuth();
  const { credits, setCredits } = useCredits();
  const [frames, setFrames] = useState<ExhibitionFrame[]>([]);
  const [exhibitionButterflies, setExhibitionButterflies] = useState<ExhibitionButterfly[]>([]);
  const [userButterflies, setUserButterflies] = useState<UserButterfly[]>([]);
  const [selectedButterfly, setSelectedButterfly] = useState<ExhibitionButterfly | null>(null);
  const [showButterflyDialog, setShowButterflyDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchExhibitionData();
      fetchUserButterflies();
    }
  }, [user]);

  const fetchExhibitionData = async () => {
    if (!user) return;
    try {
      const [framesRes, butterfliesRes] = await Promise.all([
        fetch(`/api/user/${user.id}/exhibition-frames`),
        fetch(`/api/user/${user.id}/exhibition-butterflies`)
      ]);
      
      if (framesRes.ok && butterfliesRes.ok) {
        const framesData = await framesRes.json();
        const butterfliesData = await butterfliesRes.json();
        setFrames(framesData.frames || []);
        setExhibitionButterflies(butterfliesData.butterflies || []);
      }
    } catch (error) {
      console.error('Failed to fetch exhibition data:', error);
    }
  };

  const fetchUserButterflies = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/${user.id}/butterflies`);
      if (response.ok) {
        const data = await response.json();
        setUserButterflies(data.butterflies || []);
      }
    } catch (error) {
      console.error('Failed to fetch user butterflies:', error);
    }
  };

  const purchaseFrame = async () => {
    if (!user || isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/exhibition/purchase-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCredits(data.newCredits);
        await fetchExhibitionData();
      } else {
        const error = await response.json();
        alert(error.message || 'Fehler beim Kauf des Rahmens');
      }
    } catch (error) {
      console.error('Failed to purchase frame:', error);
      alert('Fehler beim Kauf des Rahmens');
    }
    setIsLoading(false);
  };

  const getFrameCost = (): number => {
    const frameCount = frames.length;
    if (frameCount === 0) return 0; // First frame is free
    return Math.round(500 * Math.pow(1.2, frameCount - 1));
  };

  const getTotalHourlyIncome = (): number => {
    return exhibitionButterflies.reduce((total, butterfly) => {
      switch (butterfly.butterflyRarity) {
        case 'common': return total + 1;
        case 'uncommon': return total + 3;
        case 'rare': return total + 8;
        case 'super-rare': return total + 15;
        case 'epic': return total + 25;
        case 'legendary': return total + 50;
        case 'mythical': return total + 100;
        default: return total + 1;
      }
    }, 0);
  };

  const handleButterflyClick = (butterfly: ExhibitionButterfly) => {
    setSelectedButterfly(butterfly);
    setShowButterflyDialog(true);
  };

  const renderFrame = (frame: ExhibitionFrame, index: number) => {
    const frameButterflies = exhibitionButterflies.filter(b => b.frameId === frame.id);
    
    return (
      <Card key={frame.id} className="bg-gradient-to-br from-amber-900 to-amber-800 border-amber-700 shadow-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-amber-100 text-center flex items-center justify-center">
            <Trophy className="h-5 w-5 mr-2 text-amber-300" />
            Rahmen #{frame.frameNumber}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Wood frame effect */}
          <div className="bg-gradient-to-br from-amber-700 to-amber-900 p-6 rounded-lg border-4 border-amber-600 shadow-inner">
            <div className="bg-slate-100 p-4 rounded grid grid-cols-3 grid-rows-2 gap-4 min-h-[500px]">
              {Array.from({ length: 6 }, (_, slotIndex) => {
                const butterfly = frameButterflies.find(b => b.slotIndex === slotIndex);
                
                return (
                  <div 
                    key={slotIndex}
                    className="aspect-square bg-white border-2 border-slate-300 rounded-lg flex items-center justify-center overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                  >
                    {butterfly ? (
                      <ButterflyHoverPreview
                        butterflyImageUrl={butterfly.butterflyImageUrl}
                        butterflyName={butterfly.butterflyName}
                        rarity={butterfly.butterflyRarity as RarityTier}
                      >
                        <div 
                          className="w-full h-full cursor-pointer relative group"
                          onClick={() => handleButterflyClick(butterfly)}
                        >
                          <img
                            src={butterfly.butterflyImageUrl}
                            alt={butterfly.butterflyName}
                            className="w-full h-full object-cover rounded transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded flex items-center justify-center">
                            <Info className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </ButterflyHoverPreview>
                    ) : (
                      <div className="text-slate-400 text-4xl">+</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardContent className="pt-6">
            <p className="text-center text-slate-400">Bitte melde dich an, um die Ausstellung zu besuchen</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
          <Trophy className="h-8 w-8 mr-3 text-amber-400" />
          Schmetterlingsausstellung
        </h1>
        <p className="text-slate-400">Stelle deine schönsten Schmetterlinge aus und verdiene passives Einkommen</p>
      </div>

      {/* Income Stats */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">{getTotalHourlyIncome()} Cr/Std</div>
              <div className="text-slate-400 text-sm">Stündliches Einkommen</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{exhibitionButterflies.length}</div>
              <div className="text-slate-400 text-sm">Ausgestellte Schmetterlinge</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-400">{frames.length}</div>
              <div className="text-slate-400 text-sm">Rahmen im Besitz</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Frames */}
      <div className="space-y-6">
        {frames.map((frame, index) => renderFrame(frame, index))}
        
        {/* Purchase new frame button */}
        <Card className="bg-slate-800 border-slate-700 border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                {frames.length === 0 ? 'Erster Rahmen kostenlos!' : `Neuer Rahmen - ${getFrameCost()} Credits`}
              </h3>
              <p className="text-slate-400 mb-4">
                {frames.length === 0 
                  ? 'Beginne deine Ausstellung mit einem kostenlosen Rahmen'
                  : 'Erweitere deine Ausstellung mit einem weiteren Rahmen'
                }
              </p>
              <Button 
                onClick={purchaseFrame}
                disabled={isLoading || (frames.length > 0 && credits < getFrameCost())}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {frames.length === 0 ? 'Kostenlosen Rahmen holen' : `Rahmen kaufen (${getFrameCost()} Cr)`}
              </Button>
              {frames.length > 0 && credits < getFrameCost() && (
                <p className="text-red-400 text-sm mt-2">Nicht genügend Credits</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Butterfly Detail Dialog */}
      <ButterflyDetailDialog
        butterfly={selectedButterfly}
        isOpen={showButterflyDialog}
        onClose={() => setShowButterflyDialog(false)}
      />
    </div>
  );
};