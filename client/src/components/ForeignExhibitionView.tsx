import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/stores/useAuth';
import { useNotification } from '../hooks/useNotification';
import { RarityImage } from './RarityImage';
import { ButterflyDetailModal } from './ButterflyDetailModal';
import { FishDetailModal } from './FishDetailModal';
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
  
  // Fish modal state  
  const [selectedFish, setSelectedFish] = useState<AquariumFish | null>(null);
  const [showFishModal, setShowFishModal] = useState(false);
  const [currentFishIndex, setCurrentFishIndex] = useState<number>(0);
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
              {/* Current Frame */}
              {sortedFrameIds[currentFrameIndex] && (() => {
                const frameId = sortedFrameIds[currentFrameIndex];
                const frameData = frames.find(f => f.id === frameId);
                const frameNumber = frameData?.frameNumber || 1;
                const frameButterflies = butterflyFrames.get(frameId) || [];
                const frameVipButterflies = vipButterflyFrames.get(frameId) || [];
                const frameLike = frameLikes.find(fl => fl.frameId === frameId);
                
                const totalButterflies = frameButterflies.length + frameVipButterflies.length;
                const isFullFrame = totalButterflies === 6;
                const canBeLiked = isFullFrame || frameLike?.isLiked;
                
                return (
                  <Card 
                    key={frameId}
                    className="bg-gradient-to-br from-amber-900 to-amber-800 border-amber-700 shadow-2xl"
                  >
                    <CardHeader className="pb-4">
                      <CardTitle className="text-amber-100 text-center flex items-center justify-between text-xl">
                        <div className="flex items-center">
                          <span>🖼️ {ownerName}s Rahmen #{frameNumber}</span>
                          {isFullFrame && (
                            <span className="ml-3 text-sm bg-green-600 text-white px-3 py-1 rounded-full animate-pulse shadow-lg">
                              ✨ Vollständig
                            </span>
                          )}
                          {!isFullFrame && (
                            <span className="ml-3 text-sm bg-amber-600 text-amber-100 px-3 py-1 rounded-full">
                              {totalButterflies}/6
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          {/* Likes Display */}
                          {(frameLike?.totalLikes || 0) > 0 && (
                            <div className="flex items-center text-pink-300">
                              <Heart className="h-5 w-5 mr-2 fill-pink-300" />
                              <span className="text-base">{frameLike?.totalLikes}</span>
                            </div>
                          )}
                          
                          {/* Navigation Controls */}
                          {sortedFrameIds.length > 1 && (
                            <div className="flex items-center space-x-3 bg-amber-800/60 rounded-lg px-3 py-2 border border-amber-600">
                              <Button
                                onClick={() => setCurrentFrameIndex(Math.max(0, currentFrameIndex - 1))}
                                disabled={currentFrameIndex === 0}
                                variant="outline"
                                size="sm"
                                className="bg-amber-700 border-amber-500 hover:bg-amber-600 text-amber-100 disabled:opacity-50 h-8 w-8 p-0"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              
                              <div className="text-base font-semibold text-amber-100 px-3">
                                #{frameNumber} / {sortedFrameIds.length}
                              </div>
                              
                              <Button
                                onClick={() => setCurrentFrameIndex(Math.min(sortedFrameIds.length - 1, currentFrameIndex + 1))}
                                disabled={currentFrameIndex >= sortedFrameIds.length - 1}
                                variant="outline"
                                size="sm"
                                className="bg-amber-700 border-amber-500 hover:bg-amber-600 text-amber-100 disabled:opacity-50 h-8 w-8 p-0"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          
                          <Button
                            onClick={() => handleLike(frameId)}
                            disabled={!canBeLiked}
                            variant={frameLike?.isLiked ? "default" : "outline"}
                            size="sm"
                            className={frameLike?.isLiked 
                              ? "bg-pink-600 hover:bg-pink-700 text-white" 
                              : canBeLiked 
                                ? "bg-amber-700 border-amber-500 hover:bg-amber-600 text-amber-100 hover:border-pink-400" 
                                : "bg-amber-800 border-amber-600 text-amber-500 cursor-not-allowed"}
                          >
                            <Heart className={`h-4 w-4 mr-1 ${frameLike?.isLiked ? 'fill-current' : ''}`} />
                            {frameLike?.isLiked ? 'Geliked' : 'Liken'}
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Wood frame effect */}
                      <div className="bg-gradient-to-br from-amber-700 to-amber-900 p-8 rounded-lg border-4 border-amber-600 shadow-inner">
                        <div className="bg-slate-100 p-7 rounded grid grid-cols-3 gap-3 auto-rows-max place-items-center max-h-[800px] overflow-y-auto">
                          {Array.from({ length: 60 }, (_, slotIndex) => { // Erhöhe auf 60 Slots für Scrolling
                            const butterfly = frameButterflies.find(b => b.slotIndex === slotIndex);
                            const vipButterfly = frameVipButterflies.find(b => b.slotIndex === slotIndex);
                            const hasContent = butterfly || vipButterfly;
                            
                            return (
                              <div 
                                key={slotIndex}
                                className="aspect-square bg-white border border-slate-300 rounded flex items-center justify-center overflow-hidden shadow-md hover:shadow-lg transition-shadow min-h-0"
                              >
                                {hasContent ? (
                                  <div 
                                    className="w-full h-full cursor-pointer relative group"
                                    onClick={() => {
                                      setSelectedButterfly(butterfly || vipButterfly);
                                      setShowButterflyModal(true);
                                    }}
                                  >
                                    <RarityImage
                                      src={(butterfly || vipButterfly).butterflyImageUrl}
                                      alt={(butterfly || vipButterfly).butterflyName}
                                      rarity={(butterfly || vipButterfly).butterflyRarity as RarityTier}
                                      size="medium"
                                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded flex items-center justify-center">
                                      <div className="bg-slate-900/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        Details anzeigen
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-slate-400 text-sm text-center">
                                    Leer
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
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
              {/* Current Tank */}
              {sortedTankIds[currentTankIndex] && (() => {
                const tankId = sortedTankIds[currentTankIndex];
                const tankData = aquariumTanks.find(t => t.id === tankId);
                const tankNumber = tankData?.tankNumber || 1;
                const tankFish = fishTanks.get(tankId) || [];
                
                return (
                  <Card 
                    key={tankId}
                    className="bg-gradient-to-br from-blue-950/50 to-teal-950/30 border-blue-500/30 shadow-2xl"
                  >
                    <CardHeader className="pb-4">
                      <CardTitle className="text-blue-300 text-center flex items-center justify-between text-xl">
                        <div className="flex items-center">
                          <span>🐠 {ownerName}s Aquarium #{tankNumber}</span>
                          <span className="ml-3 text-sm bg-blue-600 text-blue-100 px-3 py-1 rounded-full">
                            {tankFish.length}/6 Fische
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {/* Navigation Controls - immer anzeigen für Konsistenz */}
                          <div className="flex items-center space-x-3 bg-blue-800/60 rounded-lg px-3 py-2 border border-blue-600">
                            <Button
                              onClick={() => setCurrentTankIndex(Math.max(0, currentTankIndex - 1))}
                              disabled={currentTankIndex === 0 || sortedTankIds.length <= 1}
                              variant="outline"
                              size="sm"
                              className="bg-blue-700 border-blue-500 hover:bg-blue-600 text-blue-100 disabled:opacity-50 h-8 w-8 p-0"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            
                            <div className="text-base font-semibold text-blue-100 px-3">
                              #{tankNumber} / {sortedTankIds.length}
                            </div>
                            
                            <Button
                              onClick={() => setCurrentTankIndex(Math.min(sortedTankIds.length - 1, currentTankIndex + 1))}
                              disabled={currentTankIndex >= sortedTankIds.length - 1 || sortedTankIds.length <= 1}
                              variant="outline"
                              size="sm"
                              className="bg-blue-700 border-blue-500 hover:bg-blue-600 text-blue-100 disabled:opacity-50 h-8 w-8 p-0"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Aquarium water effect */}
                      <div className="p-3 bg-gradient-to-br from-blue-900/20 to-teal-900/10 rounded-lg border border-blue-500/20">
                        <div className="grid grid-cols-3 gap-3 auto-rows-max place-items-center max-h-[800px] overflow-y-auto">
                          {Array.from({ length: 60 }, (_, slotIndex) => { // Erhöhe auf 60 Slots für Aquarium-Scrolling
                            const fish = tankFish.find(f => f.slotIndex === slotIndex);
                            
                            return (
                              <div 
                                key={slotIndex}
                                className="aspect-square bg-blue-950/30 border border-blue-400/30 rounded-lg flex items-center justify-center overflow-hidden shadow-md hover:shadow-lg transition-shadow min-h-0"
                              >
                                {fish ? (
                                  <div 
                                    className="w-full h-full relative group cursor-pointer"
                                    onClick={() => {
                                      console.log("🐟 Foreign Fish clicked:", fish.fishName, fish.id);
                                      const fishIndex = aquariumFish.findIndex(f => f.id === fish.id);
                                      setSelectedFish(fish);
                                      setCurrentFishIndex(fishIndex >= 0 ? fishIndex : 0);
                                      setShowFishModal(true);
                                      console.log("🐟 Foreign Fish Modal should open:", fish.fishName);
                                    }}
                                  >
                                    <RarityImage
                                      src={fish.fishImageUrl}
                                      alt={fish.fishName}
                                      rarity={fish.fishRarity as RarityTier}
                                      size="medium"
                                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded flex items-center justify-center">
                                      <div className="bg-slate-900/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {fish.fishName}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-blue-400/60 text-sm text-center">
                                    Leer
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
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

      {/* Fish Detail Modal for viewing other users' fish */}
      <FishDetailModal
        isOpen={showFishModal}
        onClose={() => {
          setShowFishModal(false);
          setSelectedFish(null);
        }}
        fish={selectedFish ? {
          id: selectedFish.id,
          fishName: selectedFish.fishName,
          fishRarity: selectedFish.fishRarity,
          fishImageUrl: selectedFish.fishImageUrl,
          placedAt: selectedFish.placedAt,
          userId: selectedFish.userId,
          tankId: selectedFish.tankId
        } : null}
        onSold={() => {}} // Not used in read-only mode
        readOnly={true} // This will hide selling options
        currentIndex={currentFishIndex}
        totalCount={aquariumFish.length}
        onNext={currentFishIndex < aquariumFish.length - 1 ? () => {
          const nextIndex = currentFishIndex + 1;
          setCurrentFishIndex(nextIndex);
          setSelectedFish(aquariumFish[nextIndex]);
        } : undefined}
        onPrevious={currentFishIndex > 0 ? () => {
          const prevIndex = currentFishIndex - 1;
          setCurrentFishIndex(prevIndex);
          setSelectedFish(aquariumFish[prevIndex]);
        } : undefined}
      />
    </div>
  );
};