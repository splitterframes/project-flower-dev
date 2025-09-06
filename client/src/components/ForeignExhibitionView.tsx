import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/stores/useAuth';
import { useNotification } from '../hooks/useNotification';
import { RarityImage } from './RarityImage';
import { ButterflyDetailModal } from './ButterflyDetailModal';
import { ArrowLeft, Heart, Bug, ChevronLeft, ChevronRight, Fish } from 'lucide-react';
import { type RarityTier, getRarityColor, getRarityDisplayName } from '@shared/rarity';

interface ExhibitionButterfly {
  id: number;
  userId: number;
  frameId: number;
  slotIndex: number;
  butterflyId: number;
  butterflyName: string;
  butterflyRarity: string;
  butterflyImageUrl: string;
  placedAt: string;
  createdAt: string;
}

interface ExhibitionFrame {
  id: number;
  userId: number;
  frameNumber: number;
  purchasedAt: string;
  createdAt: string;
}

interface FrameLike {
  frameId: number;
  isLiked: boolean;
  totalLikes: number;
}

interface AquariumFish {
  id: number;
  userId: number;
  tankId: number;
  slotIndex: number;
  fishId: number;
  fishName: string;
  fishRarity: string;
  fishImageUrl: string;
  placedAt: string;
  createdAt: string;
}

interface AquariumTank {
  id: number;
  userId: number;
  tankNumber: number;
  purchasedAt: string;
  createdAt: string;
}

type ViewMode = 'exhibition' | 'aquarium';

interface ForeignExhibitionViewProps {
  ownerId: number;
  ownerName: string;
  onBack: () => void;
}

export const ForeignExhibitionView: React.FC<ForeignExhibitionViewProps> = ({
  ownerId,
  ownerName,
  onBack
}) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  // Exhibition data
  const [butterflies, setButterflies] = useState<ExhibitionButterfly[]>([]);
  const [vipButterflies, setVipButterflies] = useState<any[]>([]);
  const [frames, setFrames] = useState<ExhibitionFrame[]>([]);
  const [frameLikes, setFrameLikes] = useState<FrameLike[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  
  // Aquarium data
  const [aquariumFish, setAquariumFish] = useState<AquariumFish[]>([]);
  const [aquariumTanks, setAquariumTanks] = useState<AquariumTank[]>([]);
  const [currentTankIndex, setCurrentTankIndex] = useState(0);
  
  // Common state
  const [loading, setLoading] = useState(true);
  const [selectedButterfly, setSelectedButterfly] = useState<ExhibitionButterfly | null>(null);
  const [showButterflyModal, setShowButterflyModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('exhibition');

  useEffect(() => {
    loadForeignExhibition();
    loadFrameLikes();
    loadForeignAquarium();
  }, [ownerId]);

  const loadForeignExhibition = async () => {
    try {
      const response = await fetch(`/api/user/${ownerId}/foreign-exhibition`);
      const data = await response.json();
      setButterflies(data.butterflies || []);
      setVipButterflies(data.vipButterflies || []);
      setFrames(data.frames || []);
    } catch (error) {
      console.error('Failed to load foreign exhibition:', error);
    }
  };

  const loadFrameLikes = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/user/${user.id}/exhibition/${ownerId}/likes`);
      const data = await response.json();
      setFrameLikes(data.likes || []);
    } catch (error) {
      console.error('Failed to load frame likes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadForeignAquarium = async () => {
    try {
      const response = await fetch(`/api/user/${ownerId}/foreign-aquarium`);
      const data = await response.json();
      setAquariumFish(data.fish || []);
      setAquariumTanks(data.tanks || []);
    } catch (error) {
      console.error('Failed to load foreign aquarium:', error);
    }
  };

  const handleLike = async (frameId: number) => {
    if (!user) return;

    const frameButterflies = butterflyFrames.get(frameId) || [];
    const frameLike = frameLikes.find(fl => fl.frameId === frameId);
    const isCurrentlyLiked = frameLike?.isLiked || false;

    // Check if frame has 10 butterflies before allowing like
    if (!isCurrentlyLiked && frameButterflies.length < 10) {
      showNotification('Du kannst nur volle Rahmen mit 10 Schmetterlingen liken!', 'warning');
      return;
    }

    try {
      const method = isCurrentlyLiked ? 'DELETE' : 'POST';
      const response = await fetch('/api/exhibition/like', {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user?.id.toString() || '1'
        },
        body: JSON.stringify({
          likerId: user.id,
          frameOwnerId: ownerId,
          frameId
        })
      });

      if (response.ok) {
        await loadFrameLikes();
      } else {
        const errorData = await response.json();
        showNotification(errorData.message || 'Fehler beim Liken des Rahmens', 'error');
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      showNotification('Fehler beim Liken des Rahmens', 'error');
    }
  };

  // Group butterflies by frame
  const butterflyFrames = new Map<number, ExhibitionButterfly[]>();
  butterflies.forEach(butterfly => {
    if (!butterflyFrames.has(butterfly.frameId)) {
      butterflyFrames.set(butterfly.frameId, []);
    }
    butterflyFrames.get(butterfly.frameId)!.push(butterfly);
  });

  const vipButterflyFrames = new Map<number, any[]>();
  vipButterflies.forEach(butterfly => {
    if (!vipButterflyFrames.has(butterfly.frameId)) {
      vipButterflyFrames.set(butterfly.frameId, []);
    }
    vipButterflyFrames.get(butterfly.frameId)!.push(butterfly);
  });

  // Group fish by tank
  const fishTanks = new Map<number, AquariumFish[]>();
  aquariumFish.forEach(fish => {
    if (!fishTanks.has(fish.tankId)) {
      fishTanks.set(fish.tankId, []);
    }
    fishTanks.get(fish.tankId)!.push(fish);
  });

  const allFrameIds = new Set([
    ...butterflies.map(b => b.frameId),
    ...vipButterflies.map(b => b.frameId)
  ]);
  
  const sortedFrameIds = Array.from(allFrameIds).sort((a, b) => {
    const frameA = frames.find(f => f.id === a);
    const frameB = frames.find(f => f.id === b);
    return (frameA?.frameNumber || 0) - (frameB?.frameNumber || 0);
  });

  const sortedTankIds = aquariumTanks
    .map(tank => tank.id)
    .sort((a, b) => {
      const tankA = aquariumTanks.find(t => t.id === a);
      const tankB = aquariumTanks.find(t => t.id === b);
      return (tankA?.tankNumber || 0) - (tankB?.tankNumber || 0);
    });

  // Reset frame index when frames change
  useEffect(() => {
    if (currentFrameIndex >= sortedFrameIds.length && sortedFrameIds.length > 0) {
      setCurrentFrameIndex(sortedFrameIds.length - 1);
    }
  }, [sortedFrameIds.length, currentFrameIndex]);

  // Reset tank index when tanks change
  useEffect(() => {
    if (currentTankIndex >= sortedTankIds.length && sortedTankIds.length > 0) {
      setCurrentTankIndex(sortedTankIds.length - 1);
    }
  }, [sortedTankIds.length, currentTankIndex]);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="text-center text-slate-300">
          Lade {viewMode === 'exhibition' ? 'Ausstellung' : 'Aquarium'} von {ownerName}...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 border-2 border-slate-600">
          <div className="flex items-center space-x-4">
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="bg-slate-700 border-slate-500 hover:bg-slate-600 text-slate-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {viewMode === 'exhibition' ? '🦋' : '🐠'} {viewMode === 'exhibition' ? 'Ausstellung' : 'Aquarium'} von {ownerName}
              </h1>
              <p className="text-slate-300 mt-2">
                {viewMode === 'exhibition' 
                  ? 'Entdecke die Schmetterlingssammlung und vergib Likes!' 
                  : 'Betrachte die Fischsammlung im Aquarium!'}
              </p>
              
              {/* View Mode Toggle */}
              <div className="flex space-x-2 mt-4">
                <Button
                  onClick={() => setViewMode('exhibition')}
                  variant={viewMode === 'exhibition' ? 'default' : 'outline'}
                  size="sm"
                  className={viewMode === 'exhibition' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-slate-700 border-slate-500 hover:bg-slate-600 text-slate-200'}
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Ausstellung
                </Button>
                <Button
                  onClick={() => setViewMode('aquarium')}
                  variant={viewMode === 'aquarium' ? 'default' : 'outline'}
                  size="sm"
                  className={viewMode === 'aquarium' 
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                    : 'bg-slate-700 border-slate-500 hover:bg-slate-600 text-slate-200'}
                >
                  <Fish className="h-4 w-4 mr-2" />
                  Aquarium
                </Button>
              </div>
            </div>
          </div>
          <div className="text-slate-300">
            {viewMode === 'exhibition' ? (
              <>
                <Bug className="h-8 w-8 inline mr-2 text-blue-400 animate-pulse" />
                {butterflies.length} Schmetterlinge ausgestellt
              </>
            ) : (
              <>
                <Fish className="h-8 w-8 inline mr-2 text-cyan-400 animate-pulse" />
                {aquariumFish.length} Fische im Aquarium
              </>
            )}
          </div>
        </div>

        {/* Exhibition Mode */}
        {viewMode === 'exhibition' && (
          sortedFrameIds.length > 0 ? (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Navigation Controls */}
              <div className="flex items-center justify-center space-x-3 bg-slate-800/60 rounded-lg p-2 border border-slate-700">
                <Button
                  onClick={() => setCurrentFrameIndex(Math.max(0, currentFrameIndex - 1))}
                  disabled={currentFrameIndex === 0}
                  variant="outline"
                  size="sm"
                  className="bg-slate-700 border-slate-500 hover:bg-slate-600 text-slate-200 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <div className="text-lg font-semibold text-slate-300">
                  #{(frames.find(f => f.id === sortedFrameIds[currentFrameIndex])?.frameNumber || 1)} / {sortedFrameIds.length}
                </div>
                
                <Button
                  onClick={() => setCurrentFrameIndex(Math.min(sortedFrameIds.length - 1, currentFrameIndex + 1))}
                  disabled={currentFrameIndex >= sortedFrameIds.length - 1}
                  variant="outline"
                  size="sm"
                  className="bg-slate-700 border-slate-500 hover:bg-slate-600 text-slate-200 disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Current Frame */}
              {sortedFrameIds[currentFrameIndex] && (() => {
                const frameId = sortedFrameIds[currentFrameIndex];
                const frameData = frames.find(f => f.id === frameId);
                const frameNumber = frameData?.frameNumber || 1;
                const frameButterflies = butterflyFrames.get(frameId) || [];
                const frameVipButterflies = vipButterflyFrames.get(frameId) || [];
                const frameLike = frameLikes.find(fl => fl.frameId === frameId);
                
                const totalButterflies = frameButterflies.length + frameVipButterflies.length;
                const isFullFrame = totalButterflies === 10;
                const canBeLiked = isFullFrame || frameLike?.isLiked;
                
                return (
                  <Card 
                    key={frameId}
                    className={`bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 ${
                      isFullFrame 
                        ? 'border-green-500/50 hover:border-green-400/70' 
                        : 'border-slate-600 hover:border-orange-400/50'
                    } transition-all duration-300 shadow-xl max-w-2xl mx-auto`}
                  >
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl font-bold text-white flex items-center justify-between">
                        <div className="flex items-center">
                          <span>🖼️ Rahmen #{frameNumber}</span>
                          {isFullFrame && (
                            <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded-full animate-pulse">
                              Vollständig
                            </span>
                          )}
                          {!isFullFrame && (
                            <span className="ml-2 text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded-full">
                              {totalButterflies}/10
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-400">
                            {frameLike?.totalLikes || 0} <Heart className="h-4 w-4 inline text-pink-400" />
                          </span>
                          <Button
                            onClick={() => handleLike(frameId)}
                            disabled={!canBeLiked}
                            variant={frameLike?.isLiked ? "default" : "outline"}
                            size="sm"
                            className={frameLike?.isLiked 
                              ? "bg-pink-600 hover:bg-pink-700 text-white" 
                              : canBeLiked 
                                ? "bg-slate-700 border-slate-500 hover:bg-slate-600 text-slate-200 hover:border-pink-400" 
                                : "bg-slate-800 border-slate-600 text-slate-500 cursor-not-allowed"}
                          >
                            <Heart className={`h-4 w-4 mr-1 ${frameLike?.isLiked ? 'fill-current' : ''}`} />
                            {frameLike?.isLiked ? 'Geliked' : 'Liken'}
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Butterfly Display Grid */}
                      <div className="grid grid-cols-3 grid-rows-2 gap-3 h-[800px] place-items-center">
                        {[0, 1, 2, 3, 4, 5].map((slotIndex) => {
                          const butterfly = frameButterflies.find(b => b.slotIndex === slotIndex) ||
                                          frameVipButterflies.find(b => b.slotIndex === slotIndex);
                          
                          return (
                            <div 
                              key={slotIndex} 
                              className={`aspect-square border-2 rounded-lg ${
                                butterfly ? 'border-slate-400' : 'border-slate-600'
                              } bg-slate-800/50 flex items-center justify-center relative overflow-hidden transition-all duration-300 hover:border-amber-400/50`}
                            >
                              {butterfly ? (
                                <div 
                                  className="w-full h-full cursor-pointer group relative" 
                                  onClick={() => {
                                    setSelectedButterfly(butterfly);
                                    setShowButterflyModal(true);
                                  }}
                                >
                                  <div className="absolute inset-2 rounded-lg overflow-hidden bg-slate-900/80 border-2"
                                       style={{
                                         borderColor: getRarityColor(butterfly.butterflyRarity as RarityTier)
                                       }}>
                                    <RarityImage
                                      src={butterfly.butterflyImageUrl}
                                      alt={butterfly.butterflyName}
                                      rarity={butterfly.butterflyRarity as RarityTier}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                                      <div className="absolute bottom-1 left-1 right-1 text-center">
                                        <div className="text-white text-xs font-bold bg-black/60 rounded px-1 py-0.5 mb-1">
                                          {butterfly.butterflyName}
                                        </div>
                                        <div className="text-xs font-semibold"
                                             style={{
                                               color: getRarityColor(butterfly.butterflyRarity as RarityTier)
                                             }}>
                                          {getRarityDisplayName(butterfly.butterflyRarity as RarityTier)}
                                        </div>
                                        <div className="mt-2 text-green-300 font-semibold">
                                          Klicken für Details
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-slate-500 text-xs text-center">
                                  Leer
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {frameButterflies.length > 0 && (
                        <div className="mt-4 text-center">
                          <p className="text-slate-400 text-sm">
                            {frameButterflies.length} von 10 Plätzen belegt
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          ) : (
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-600">
              <CardContent className="text-center py-12">
                <Bug className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-300 mb-2">
                  Keine Ausstellung vorhanden
                </h3>
                <p className="text-slate-400">
                  {ownerName} hat noch keine Schmetterlinge ausgestellt.
                </p>
              </CardContent>
            </Card>
          )
        )}

        {/* Aquarium Mode */}
        {viewMode === 'aquarium' && (
          sortedTankIds.length > 0 ? (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Tank Navigation Controls */}
              <div className="flex items-center justify-center space-x-3 bg-cyan-800/60 rounded-lg p-2 border border-cyan-700">
                <Button
                  onClick={() => setCurrentTankIndex(Math.max(0, currentTankIndex - 1))}
                  disabled={currentTankIndex === 0}
                  variant="outline"
                  size="sm"
                  className="bg-cyan-700 border-cyan-500 hover:bg-cyan-600 text-cyan-200 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <div className="text-lg font-semibold text-cyan-300">
                  🐠 Tank #{(aquariumTanks.find(t => t.id === sortedTankIds[currentTankIndex])?.tankNumber || 1)} / {sortedTankIds.length}
                </div>
                
                <Button
                  onClick={() => setCurrentTankIndex(Math.min(sortedTankIds.length - 1, currentTankIndex + 1))}
                  disabled={currentTankIndex >= sortedTankIds.length - 1}
                  variant="outline"
                  size="sm"
                  className="bg-cyan-700 border-cyan-500 hover:bg-cyan-600 text-cyan-200 disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Current Tank */}
              {sortedTankIds[currentTankIndex] && (() => {
                const tankId = sortedTankIds[currentTankIndex];
                const tankData = aquariumTanks.find(t => t.id === tankId);
                const tankNumber = tankData?.tankNumber || 1;
                const tankFish = fishTanks.get(tankId) || [];
                
                return (
                  <Card 
                    key={tankId}
                    className="bg-gradient-to-br from-cyan-900 via-blue-900 to-slate-950 border-2 border-cyan-600/50 transition-all duration-300 shadow-xl max-w-2xl mx-auto"
                  >
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl font-bold text-white flex items-center justify-center">
                        <div className="flex items-center">
                          <span>🐠 Aquarium #{tankNumber}</span>
                          <span className="ml-2 text-xs bg-cyan-600 text-white px-2 py-1 rounded-full">
                            {tankFish.length}/10 Fische
                          </span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Fish Display Grid */}
                      <div className="grid grid-cols-3 grid-rows-2 gap-3 h-[800px] place-items-center">
                        {[0, 1, 2, 3, 4, 5].map((slotIndex) => {
                          const fish = tankFish.find(f => f.slotIndex === slotIndex);
                          
                          return (
                            <div 
                              key={slotIndex} 
                              className={`aspect-square border-2 rounded-lg ${
                                fish ? 'border-cyan-400' : 'border-slate-600'
                              } bg-slate-800/50 flex items-center justify-center relative overflow-hidden transition-all duration-300 hover:border-cyan-300/50`}
                            >
                              {fish ? (
                                <div className="w-full h-full relative group">
                                  <div className="absolute inset-2 rounded-lg overflow-hidden bg-gradient-to-b from-blue-900/80 to-slate-900/80 border-2"
                                       style={{
                                         borderColor: getRarityColor(fish.fishRarity as RarityTier)
                                       }}>
                                    <RarityImage
                                      src={fish.fishImageUrl}
                                      alt={fish.fishName}
                                      rarity={fish.fishRarity as RarityTier}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                                      <div className="absolute bottom-1 left-1 right-1 text-center">
                                        <div className="text-white text-xs font-bold bg-black/60 rounded px-1 py-0.5 mb-1">
                                          {fish.fishName}
                                        </div>
                                        <div className="text-xs font-semibold"
                                             style={{
                                               color: getRarityColor(fish.fishRarity as RarityTier)
                                             }}>
                                          {getRarityDisplayName(fish.fishRarity as RarityTier)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-slate-500 text-xs text-center">
                                  Leer
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {tankFish.length > 0 && (
                        <div className="mt-4 text-center">
                          <p className="text-cyan-300 text-sm">
                            🐠 {tankFish.length} von 10 Plätzen belegt
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          ) : (
            <Card className="bg-gradient-to-br from-cyan-900 to-slate-900 border-2 border-cyan-600">
              <CardContent className="text-center py-12">
                <Fish className="h-16 w-16 text-cyan-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-cyan-300 mb-2">
                  Kein Aquarium vorhanden
                </h3>
                <p className="text-slate-400">
                  {ownerName} hat noch keine Fische im Aquarium.
                </p>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* Butterfly Detail Modal for viewing other users' butterflies */}
      <ButterflyDetailModal
        isOpen={showButterflyModal}
        onClose={() => {
          setShowButterflyModal(false);
          setSelectedButterfly(null);
        }}
        butterfly={selectedButterfly ? {
          id: selectedButterfly.id,
          butterflyName: selectedButterfly.butterflyName,
          butterflyRarity: selectedButterfly.butterflyRarity,
          butterflyImageUrl: selectedButterfly.butterflyImageUrl,
          placedAt: selectedButterfly.placedAt,
          userId: selectedButterfly.userId
        } : null}
        onSold={() => {}} // Not used in read-only mode
        readOnly={true} // This will hide selling options
      />
    </div>
  );
};