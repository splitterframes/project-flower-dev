import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/stores/useAuth';
import { useNotification } from '../hooks/useNotification';
import { RarityImage } from './RarityImage';
import { ButterflyDetailModal } from './ButterflyDetailModal';
import { FishDetailModal } from './FishDetailModal';
import { ArrowLeft, Heart, Bug, ChevronLeft, ChevronRight, Fish, Crown, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
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

interface UserVase {
  id: number;
  name: string;
  heartsRequired: number;
  collected: boolean;
  image: string;
}

// Vase Image Component without JPG Badge
function VaseImage({ vase, onClick }: { vase: UserVase; onClick?: () => void }) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  if (imageError) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-1">🏺</div>
        <div className="text-xs font-semibold text-orange-300">
          Verfügbar
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative cursor-pointer" onClick={onClick}>
      <img 
        src={vase.image}
        alt={vase.name}
        className="w-full h-full object-contain rounded-md hover:scale-105 transition-transform"
        onError={handleImageError}
      />
    </div>
  );
}

// Vase Detail Modal Component
function VaseDetailModal({ 
  isOpen, 
  onClose, 
  vase 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  vase: UserVase | null; 
}) {
  if (!vase) return null;

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'flex' : 'hidden'} items-center justify-center`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-orange-500/30 rounded-xl shadow-2xl max-w-sm mx-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full p-2 transition-colors"
        >
          ✕
        </button>
        
        {/* Header */}
        <div className="text-center p-4 border-b border-orange-500/20">
          <h3 className="text-xl font-bold text-orange-300">
            {vase.name}
          </h3>
          <div className="flex items-center justify-center space-x-2 mt-2">
            <Heart className="h-4 w-4 text-red-400" />
            <span className="text-slate-300">{vase.heartsRequired.toLocaleString()} Herzen</span>
          </div>
        </div>
        
        {/* Image */}
        <div className="p-4">
          <div className="w-[500px] h-[750px] mx-auto bg-slate-800 rounded-lg border border-orange-500/20 flex items-center justify-center">
            <img 
              src={vase.image}
              alt={vase.name}
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
                const nextElement = target.nextElementSibling as HTMLElement;
                if (nextElement) nextElement.style.display = 'block';
              }}
            />
            <div className="text-center text-6xl hidden">🏺</div>
          </div>
        </div>
        
        {/* Status */}
        <div className="text-center p-4 border-t border-orange-500/20">
          {vase.collected ? (
            <div className="flex items-center justify-center space-x-2 text-green-400">
              <Crown className="h-5 w-5" />
              <span className="font-semibold">Gesammelt!</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-slate-400">
              <Lock className="h-5 w-5" />
              <span>Noch nicht gesammelt</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type ViewMode = 'exhibition' | 'aquarium' | 'vases';

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
  
  // Vases data
  const [userVases, setUserVases] = useState<UserVase[]>([]);
  const [selectedVase, setSelectedVase] = useState<UserVase | null>(null);
  const [showVaseModal, setShowVaseModal] = useState(false);
  const [currentUserHearts, setCurrentUserHearts] = useState(0);
  const [foreignUserHearts, setForeignUserHearts] = useState(0);
  
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
    loadForeignVases();
  }, [ownerId, user?.id]);

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

  const loadForeignVases = async () => {
    try {
      if (!user?.id) return;
      
      // Load hearts for both users
      const [currentUserHeartsResponse, foreignUserHeartsResponse] = await Promise.all([
        fetch(`/api/user/${user.id}/hearts`),
        fetch(`/api/user/${ownerId}/hearts`)
      ]);
      
      let currentHearts = 0;
      let foreignHearts = 0;
      
      if (currentUserHeartsResponse.ok) {
        const data = await currentUserHeartsResponse.json();
        currentHearts = data.hearts;
        setCurrentUserHearts(currentHearts);
      }
      
      if (foreignUserHeartsResponse.ok) {
        const data = await foreignUserHeartsResponse.json();
        foreignHearts = data.hearts;
        setForeignUserHearts(foreignHearts);
      }
      
      // Generate vases with proper visibility logic
      const vaseList: UserVase[] = [];
      
      for (let i = 1; i <= 24; i++) {
        // Same heart calculation as in VasesView
        const heartsRequired = Math.round(1000 + Math.pow((i - 1) / 23, 2.2) * 99000);
        
        // Visibility logic: ONLY show vases that BOTH users have unlocked
        const currentUserUnlocked = currentHearts >= heartsRequired;
        const foreignUserUnlocked = foreignHearts >= heartsRequired;
        
        // Only add vase to list if BOTH users have unlocked it
        if (currentUserUnlocked && foreignUserUnlocked) {
          vaseList.push({
            id: i,
            name: `Prächtige Vase ${i}`,
            heartsRequired: heartsRequired,
            collected: true, // Both users have it, so it's "collected" for display
            image: `/Vasen/${i}.jpg`
          });
        }
        // If not both users have unlocked it, don't add to list (= not visible)
      }
      
      setUserVases(vaseList);
    } catch (error) {
      console.error('Failed to load foreign vases:', error);
    }
  };

  const handleLike = async (frameId: number) => {
    if (!user) return;

    const frameButterflies = butterflyFrames.get(frameId) || [];
    const frameLike = frameLikes.find(fl => fl.frameId === frameId);
    const isCurrentlyLiked = frameLike?.isLiked || false;

    // Check if frame has 6 butterflies before allowing like
    if (!isCurrentlyLiked && frameButterflies.length < 6) {
      showNotification('Du kannst nur volle Rahmen mit 6 Schmetterlingen liken!', 'warning');
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
                {viewMode === 'exhibition' ? '🦋' : viewMode === 'aquarium' ? '🐠' : '🏺'} {viewMode === 'exhibition' ? 'Ausstellung' : viewMode === 'aquarium' ? 'Aquarium' : 'Vasen'} von {ownerName}
              </h1>
              <p className="text-slate-300 mt-2">
                {viewMode === 'exhibition' 
                  ? 'Entdecke die Schmetterlingssammlung und vergib Likes!' 
                  : viewMode === 'aquarium'
                    ? 'Betrachte die Fischsammlung im Aquarium!'
                    : 'Betrachte die Vasen-Sammlung!'}
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
                <Button
                  onClick={() => setViewMode('vases')}
                  variant={viewMode === 'vases' ? 'default' : 'outline'}
                  size="sm"
                  className={viewMode === 'vases' 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                    : 'bg-slate-700 border-slate-500 hover:bg-slate-600 text-slate-200'}
                >
                  <span className="h-4 w-4 mr-2">🏺</span>
                  Vasen
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
            ) : viewMode === 'aquarium' ? (
              <>
                <Fish className="h-8 w-8 inline mr-2 text-cyan-400 animate-pulse" />
                {aquariumFish.length} Fische im Aquarium
              </>
            ) : (
              <>
                <span className="text-3xl mr-2">🏺</span>
                {userVases.filter(v => v.collected).length} / {userVases.length} Vasen gesammelt
              </>
            )}
          </div>
        </div>

        {/* Exhibition Mode */}
        {viewMode === 'exhibition' && (
          sortedFrameIds.length > 0 ? (
            <div className="space-y-6 max-w-7xl mx-auto max-h-[85vh] overflow-y-auto pr-2">
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
                        <div className="bg-slate-100 p-7 rounded grid grid-cols-3 grid-rows-2 gap-3 h-[800px] place-items-center">
                          {Array.from({ length: 6 }, (_, slotIndex) => {
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
            <div className="space-y-6 max-w-7xl mx-auto max-h-[85vh] overflow-y-auto pr-2">
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
                        <div className="grid grid-cols-3 grid-rows-2 gap-3 h-[800px] place-items-center">
                          {Array.from({ length: 6 }, (_, slotIndex) => {
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

        {/* Vases Mode */}
        {viewMode === 'vases' && (
          <div className="space-y-6 max-w-7xl mx-auto max-h-[85vh] overflow-y-auto pr-2">
            {/* Header with animated title */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-6 flex justify-center items-center space-x-2 leading-tight py-4">
                <span className="animate-pulse">👑</span>
                <span className="bg-gradient-to-r from-orange-400 via-yellow-500 to-orange-600 bg-clip-text text-transparent font-bold">
                  {ownerName}s Vasen-Sammlung
                </span>
                <span className="animate-pulse">👑</span>
              </div>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Betrachte {ownerName}s exquisite Vasen-Sammlung! Jede Vase wurde mit Herzen gesammelt.
              </p>
            </div>

            {/* Gallery - 4 Shelves with 6 Vases each */}
            <div className="space-y-12 mb-12">
              {[0, 1, 2, 3].map((shelfIndex) => (
                <div key={shelfIndex} className="relative">
                  {/* Shelf Background */}
                  <div className="absolute inset-0 -top-4 -bottom-8 bg-gradient-to-b from-slate-800/40 to-slate-900/60 rounded-xl backdrop-blur-sm border border-orange-500/10 shadow-2xl" />
                  
                  {/* Shelf Label */}
                  <div className="relative text-center mb-6 z-10">
                    <Badge 
                      variant="outline" 
                      className="bg-slate-800/60 text-orange-300 border-orange-500/30 px-4 py-2 text-lg font-semibold shadow-lg"
                    >
                      Regal {shelfIndex + 1}
                    </Badge>
                  </div>

                  {/* Vases Grid */}
                  <div className="relative grid grid-cols-6 gap-4 p-6 z-10">
                    {userVases
                      .slice(shelfIndex * 6, (shelfIndex + 1) * 6)
                      .map((vase) => {
                        const isLocked = !vase.collected;

                        return (
                          <div
                            key={vase.id}
                            className={`
                              relative group transition-all duration-300
                              opacity-100
                            `}
                            style={{
                              animationDelay: `${(vase.id * 0.3)}s`, // Random staggered delays
                            }}
                          >
                            {/* Vase Container */}
                            <div className={`
                              aspect-[2/3] rounded-lg border-2 relative overflow-hidden transition-all duration-500
                              border-orange-400 bg-orange-900/30 shadow-orange-400/30 shadow-lg
                              animate-gold-glow-random
                            `}
                            style={{
                              animationDelay: `${Math.random() * 5}s`, // Random gold glow timing
                              animationDuration: `${3 + Math.random() * 2}s`, // Vary duration 3-5s
                            }}>
                              {/* Vase Image or Placeholder */}
                              <div className="w-full h-full flex items-center justify-center p-2">
                                <VaseImage 
                                  vase={vase} 
                                  onClick={() => {
                                    setSelectedVase(vase);
                                    setShowVaseModal(true);
                                  }}
                                />
                              </div>

                              {/* Vase Info */}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-2 rounded-b-lg">
                                <div className="text-xs font-medium text-slate-400">
                                  Vase {vase.id}
                                </div>
                              </div>

                              {/* Hearts Badge */}
                              <div className="absolute top-2 right-2">
                                <Badge className={`
                                  text-xs px-1 py-0 
                                  bg-orange-600 text-orange-100 border border-orange-400/50
                                `}>
                                  <Heart className="h-3 w-3 mr-1" />
                                  {vase.heartsRequired.toLocaleString()}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Shelf Support Beams */}
                  <div className="absolute -bottom-2 left-4 right-4 h-2 bg-gradient-to-r from-slate-600 to-slate-500 rounded-full shadow-lg border-t border-slate-400/20" />
                </div>
              ))}
            </div>

            {/* Statistics Card */}
            <div className="text-center">
              <Card className="inline-block bg-slate-800/60 backdrop-blur-sm border border-orange-500/20 p-4 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">
                        {userVases.filter(v => v.collected).length}
                      </div>
                      <div className="text-xs text-slate-400">Gesammelt</div>
                    </div>
                    <div className="text-slate-500">/</div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-300">
                        {userVases.length}
                      </div>
                      <div className="text-xs text-slate-400">Gesamt</div>
                    </div>
                    <div className="text-slate-500">•</div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {((userVases.filter(v => v.collected).length / userVases.length) * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-400">Vollständigkeit</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
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

      {/* Vase Detail Modal */}
      <VaseDetailModal
        isOpen={showVaseModal}
        onClose={() => {
          setShowVaseModal(false);
          setSelectedVase(null);
        }}
        vase={selectedVase}
      />
    </div>
  );
};