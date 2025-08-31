import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { ButterflyHoverPreview } from "./ButterflyHoverPreview";
import { ButterflyDetailModal } from "./ButterflyDetailModal";
import { RarityImage } from "./RarityImage";
import { Trophy, Plus, DollarSign, Clock, Star, Info } from "lucide-react";
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";
import type { ExhibitionFrame, ExhibitionButterfly, UserButterfly } from "@shared/schema";


export const ExhibitionView: React.FC = () => {
  const { user } = useAuth();
  const { credits, setCredits } = useCredits();
  const [frames, setFrames] = useState<ExhibitionFrame[]>([]);
  const [exhibitionButterflies, setExhibitionButterflies] = useState<ExhibitionButterfly[]>([]);
  const [userButterflies, setUserButterflies] = useState<UserButterfly[]>([]);
  const [selectedButterfly, setSelectedButterfly] = useState<ExhibitionButterfly | null>(null);
  const [showButterflyDialog, setShowButterflyDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{frameId: number, slotIndex: number} | null>(null);
  const [showInventoryDialog, setShowInventoryDialog] = useState(false);

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

  const handleEmptySlotClick = (frameId: number, slotIndex: number) => {
    setSelectedSlot({ frameId, slotIndex });
    setShowInventoryDialog(true);
  };

  const placeButterflyInSlot = async (butterflyId: number) => {
    if (!selectedSlot || !user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/exhibition/place-butterfly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          frameId: selectedSlot.frameId, 
          slotIndex: selectedSlot.slotIndex, 
          butterflyId 
        })
      });
      
      if (response.ok) {
        await fetchExhibitionData();
        await fetchUserButterflies();
        setShowInventoryDialog(false);
        setSelectedSlot(null);
      } else {
        const error = await response.json();
        alert(error.message || 'Fehler beim Platzieren des Schmetterlings');
      }
    } catch (error) {
      console.error('Failed to place butterfly:', error);
      alert('Fehler beim Platzieren des Schmetterlings');
    }
    setIsLoading(false);
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
                      <div 
                        className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => handleEmptySlotClick(frame.id, slotIndex)}
                      >
                        <div className="text-slate-400 text-4xl hover:text-slate-600">+</div>
                      </div>
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
    <div className="p-6 space-y-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-full">
      {/* Enhanced Exhibition Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 rounded-2xl blur-xl"></div>
        <div className="relative bg-gradient-to-r from-slate-800/80 to-slate-900/80 p-8 rounded-2xl border border-purple-500/30 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Trophy className="h-12 w-12 mr-4 text-amber-400 animate-pulse" />
              <div className="absolute inset-0 h-12 w-12 mr-4 text-amber-400 animate-ping opacity-20"></div>
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-300 via-indigo-300 to-blue-300 bg-clip-text text-transparent">
                Schmetterlingsausstellung 🦋
              </h1>
            </div>
          </div>
          <p className="text-slate-300 text-xl">Stelle deine schönsten Schmetterlinge aus und verdiene passives Einkommen</p>
        </div>
      </div>

      {/* Enhanced Income Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-800/40 to-emerald-800/40 border-2 border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:scale-105 shadow-xl group">
          <CardHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-t-lg -mx-6 -my-2"></div>
            <div className="relative flex flex-row items-center justify-between space-y-0 pb-2 z-10">
              <CardTitle className="text-lg font-bold text-green-300">
                Stündliches Einkommen
              </CardTitle>
              <div className="relative">
                <DollarSign className="h-8 w-8 text-green-400 group-hover:animate-pulse" />
                <div className="absolute inset-0 h-8 w-8 text-green-400 animate-ping opacity-20"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-400 mb-2">{getTotalHourlyIncome()} Cr/Std</div>
            <div className="text-slate-400 text-sm">💰 Passives Einkommen</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-800/40 to-indigo-800/40 border-2 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-105 shadow-xl group">
          <CardHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-t-lg -mx-6 -my-2"></div>
            <div className="relative flex flex-row items-center justify-between space-y-0 pb-2 z-10">
              <CardTitle className="text-lg font-bold text-blue-300">
                Ausgestellte Schmetterlinge
              </CardTitle>
              <div className="relative">
                <Star className="h-8 w-8 text-blue-400 group-hover:animate-pulse" />
                <div className="absolute inset-0 h-8 w-8 text-blue-400 animate-ping opacity-20"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-400 mb-2">{exhibitionButterflies.length}</div>
            <div className="text-slate-400 text-sm">🦋 Aktive Exponate</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-800/40 to-orange-800/40 border-2 border-amber-500/30 hover:border-amber-400/50 transition-all duration-300 hover:scale-105 shadow-xl group">
          <CardHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-t-lg -mx-6 -my-2"></div>
            <div className="relative flex flex-row items-center justify-between space-y-0 pb-2 z-10">
              <CardTitle className="text-lg font-bold text-amber-300">
                Rahmen im Besitz
              </CardTitle>
              <div className="relative">
                <Trophy className="h-8 w-8 text-amber-400 group-hover:animate-pulse" />
                <div className="absolute inset-0 h-8 w-8 text-amber-400 animate-ping opacity-20"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-amber-400 mb-2">{frames.length}</div>
            <div className="text-slate-400 text-sm">🖼️ Ausstellungsrahmen</div>
          </CardContent>
        </Card>
      </div>

      {/* Frames */}
      <div className="space-y-6">
        {frames.map((frame, index) => renderFrame(frame, index))}
        
        {/* Enhanced Purchase New Frame Button */}
        <Card className="bg-gradient-to-br from-purple-800/40 to-indigo-800/40 border-2 border-purple-500/30 border-dashed hover:border-purple-400/50 transition-all duration-300 hover:scale-105 shadow-xl">
          <CardContent className="pt-6">
            <div className="text-center py-8 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-lg"></div>
              <div className="relative z-10">
                <div className="relative mb-6">
                  <Trophy className="h-16 w-16 text-amber-400 mx-auto animate-bounce" />
                  <div className="absolute inset-0 h-16 w-16 mx-auto text-amber-400 animate-ping opacity-30"></div>
                </div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent mb-3">
                  {frames.length === 0 ? '🎆 Erster Rahmen kostenlos!' : `🖼️ Neuer Rahmen - ${getFrameCost()} Credits`}
                </h3>
                <p className="text-slate-300 mb-6 text-lg">
                  {frames.length === 0 
                    ? 'Beginne deine Ausstellung mit einem kostenlosen Rahmen'
                    : 'Erweitere deine Ausstellung mit einem weiteren Rahmen'
                  }
                </p>
                <Button 
                  onClick={purchaseFrame}
                  disabled={isLoading || (frames.length > 0 && credits < getFrameCost())}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 px-8 rounded-xl text-lg transition-all duration-300 hover:scale-110 shadow-lg"
                >
                  <Plus className="h-5 w-5 mr-3" />
                  {frames.length === 0 ? '🎁 Kostenlosen Rahmen holen' : `💰 Rahmen kaufen (${getFrameCost()} Cr)`}
                </Button>
                {frames.length > 0 && credits < getFrameCost() && (
                  <p className="text-red-400 text-lg mt-4 font-semibold">⚠️ Nicht genügend Credits</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Butterfly Detail Modal */}
      <ButterflyDetailModal
        butterfly={selectedButterfly ? {
          id: selectedButterfly.id,
          butterflyName: selectedButterfly.butterflyName,
          butterflyRarity: selectedButterfly.butterflyRarity,
          butterflyImageUrl: selectedButterfly.butterflyImageUrl,
          placedAt: selectedButterfly.placedAt,
          userId: selectedButterfly.userId
        } : null}
        isOpen={showButterflyDialog}
        onClose={() => setShowButterflyDialog(false)}
        onSold={() => {
          fetchExhibitionData();
          fetchUserButterflies();
        }}
      />

      {/* Butterfly Inventory Dialog */}
      <Dialog open={showInventoryDialog} onOpenChange={setShowInventoryDialog}>
        <DialogContent className="bg-slate-900 border-slate-600 text-white max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">
              Schmetterling auswählen
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {userButterflies.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                Keine Schmetterlinge im Inventar
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userButterflies.map((butterfly) => (
                  <Card
                    key={butterfly.id}
                    className="bg-slate-800 border-slate-600 cursor-pointer hover:bg-slate-700 transition-colors"
                    onClick={() => placeButterflyInSlot(butterfly.id)}
                  >
                    <CardContent className="p-4">
                      <ButterflyHoverPreview
                        butterflyImageUrl={butterfly.butterflyImageUrl}
                        butterflyName={butterfly.butterflyName}
                        rarity={butterfly.butterflyRarity as RarityTier}
                      >
                        <div className="text-center">
                          <RarityImage 
                            src={butterfly.butterflyImageUrl}
                            alt={butterfly.butterflyName}
                            rarity={butterfly.butterflyRarity as RarityTier}
                            size="large"
                            className="w-16 h-16 mx-auto mb-2"
                          />
                          <div className="text-sm font-semibold text-white mb-1">
                            {butterfly.butterflyName}
                          </div>
                          <div className={`text-xs ${getRarityColor(butterfly.butterflyRarity as RarityTier)} mb-1`}>
                            {getRarityDisplayName(butterfly.butterflyRarity as RarityTier)}
                          </div>
                          <div className="text-xs text-slate-400">
                            Anzahl: {butterfly.quantity}
                          </div>
                        </div>
                      </ButterflyHoverPreview>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};