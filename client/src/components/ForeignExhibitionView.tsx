import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/stores/useAuth';
import { RarityImage } from './RarityImage';
import { ButterflyDetailModal } from './ButterflyDetailModal';
import { ArrowLeft, Heart, Bug, Info } from 'lucide-react';
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

interface FrameLike {
  frameId: number;
  isLiked: boolean;
  totalLikes: number;
}

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
  const [butterflies, setButterflies] = useState<ExhibitionButterfly[]>([]);
  const [frameLikes, setFrameLikes] = useState<FrameLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedButterfly, setSelectedButterfly] = useState<ExhibitionButterfly | null>(null);
  const [showButterflyDialog, setShowButterflyDialog] = useState(false);

  useEffect(() => {
    loadForeignExhibition();
    loadFrameLikes();
  }, [ownerId]);

  const loadForeignExhibition = async () => {
    try {
      const response = await fetch(`/api/user/${ownerId}/foreign-exhibition`);
      const data = await response.json();
      setButterflies(data.butterflies || []);
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

  const handleLike = async (frameId: number) => {
    if (!user) return;

    const frameButterflies = frames.get(frameId) || [];
    const frameLike = frameLikes.find(fl => fl.frameId === frameId);
    const isCurrentlyLiked = frameLike?.isLiked || false;

    // Check if frame has 6 butterflies before allowing like
    if (!isCurrentlyLiked && frameButterflies.length < 6) {
      alert('Du kannst nur volle Rahmen mit 6 Schmetterlingen liken!');
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
        // Update local state optimistically
        setFrameLikes(prev => prev.map(fl => 
          fl.frameId === frameId 
            ? { 
                ...fl, 
                isLiked: !isCurrentlyLiked,
                totalLikes: isCurrentlyLiked ? fl.totalLikes - 1 : fl.totalLikes + 1
              }
            : fl
        ));
      } else {
        // Handle server error
        const errorData = await response.json();
        alert(errorData.message || 'Fehler beim Liken des Rahmens');
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      alert('Fehler beim Liken des Rahmens');
    }
  };

  const handleButterflyClick = (butterfly: ExhibitionButterfly) => {
    setSelectedButterfly(butterfly);
    setShowButterflyDialog(true);
  };

  const handleButterflyModalClose = () => {
    setShowButterflyDialog(false);
    setSelectedButterfly(null);
  };

  const handleButterflySold = () => {
    // Refresh the exhibition data after selling
    loadForeignExhibition();
    handleButterflyModalClose();
  };

  // Group butterflies by frame
  const frames = new Map<number, ExhibitionButterfly[]>();
  butterflies.forEach(butterfly => {
    const frameButterflies = frames.get(butterfly.frameId) || [];
    frameButterflies.push(butterfly);
    frames.set(butterfly.frameId, frameButterflies);
  });

  const sortedFrameIds = Array.from(frames.keys()).sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="text-center text-slate-300">
          Lade Ausstellung von {ownerName}...
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
                🦋 Ausstellung von {ownerName}
              </h1>
              <p className="text-slate-300 mt-2">
                Entdecke die Schmetterlingssammlung und vergib Likes!
              </p>
            </div>
          </div>
          <div className="text-slate-300">
            <Bug className="h-8 w-8 inline mr-2 text-blue-400 animate-pulse" />
            {butterflies.length} Schmetterlinge ausgestellt
          </div>
        </div>

        {/* Exhibition Frames */}
        {sortedFrameIds.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {sortedFrameIds.map(frameId => {
              const frameButterflies = frames.get(frameId) || [];
              const frameLike = frameLikes.find(fl => fl.frameId === frameId);
              
              const isFullFrame = frameButterflies.length === 6;
              const canBeLiked = isFullFrame || frameLike?.isLiked;
              
              return (
                <Card 
                  key={frameId}
                  className={`bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 ${
                    isFullFrame 
                      ? 'border-green-500/50 hover:border-green-400/70' 
                      : 'border-slate-600 hover:border-orange-400/50'
                  } transition-all duration-300 shadow-xl`}
                >
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl font-bold text-white flex items-center justify-between">
                      <div className="flex items-center">
                        <span>🖼️ Rahmen #{frameId}</span>
                        {isFullFrame && (
                          <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded-full animate-pulse">
                            Vollständig
                          </span>
                        )}
                        {!isFullFrame && (
                          <span className="ml-2 text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded-full">
                            {frameButterflies.length}/6
                          </span>
                        )}
                      </div>
                      <Button
                        onClick={() => handleLike(frameId)}
                        variant="outline"
                        size="sm"
                        disabled={!canBeLiked}
                        className={`${
                          frameLike?.isLiked 
                            ? 'bg-pink-600 border-pink-500 text-white hover:bg-pink-700' 
                            : canBeLiked
                              ? 'bg-slate-700 border-slate-500 text-slate-200 hover:bg-slate-600'
                              : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                        } transition-all duration-300`}
                        title={!canBeLiked ? 'Nur vollständige Rahmen (6 Schmetterlinge) können geliked werden' : ''}
                      >
                        <Heart 
                          className={`h-4 w-4 mr-2 ${
                            frameLike?.isLiked ? 'fill-white animate-pulse' : ''
                          }`} 
                        />
                        {frameLike?.totalLikes || 0}
                        {(frameLike?.totalLikes || 0) > 0 && isFullFrame && (
                          <span className="ml-1 text-xs text-green-300">(-{frameLike?.totalLikes}min)</span>
                        )}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-3 grid-rows-2 gap-4 aspect-[3/2] bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg p-4 border border-slate-700">
                      {[0, 1, 2, 3, 4, 5].map(slotIndex => {
                        const butterfly = frameButterflies.find(b => b.slotIndex === slotIndex);
                        
                        return (
                          <div
                            key={slotIndex}
                            className="aspect-square border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center bg-slate-800/50 hover:border-orange-400/50 transition-all duration-300"
                          >
                            {butterfly ? (
                              <div 
                                className="relative w-full h-full group cursor-pointer"
                                onClick={() => handleButterflyClick(butterfly)}
                              >
                                <RarityImage
                                  src={butterfly.butterflyImageUrl}
                                  alt={butterfly.butterflyName}
                                  rarity={butterfly.butterflyRarity as RarityTier}
                                  size="large"
                                  className="w-full h-full object-cover rounded transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded flex items-center justify-center">
                                  <div className="text-center text-white">
                                    <Info className="h-6 w-6 mx-auto mb-1" />
                                    <div className="text-xs font-bold">{butterfly.butterflyName}</div>
                                    <div className={`text-xs ${getRarityColor(butterfly.butterflyRarity as RarityTier)}`}>
                                      {getRarityDisplayName(butterfly.butterflyRarity as RarityTier)}
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
                          {frameButterflies.length} von 6 Plätzen belegt
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
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
        )}
      </div>
      
      {/* Butterfly Detail Modal */}
      <ButterflyDetailModal
        isOpen={showButterflyDialog}
        onClose={handleButterflyModalClose}
        butterfly={selectedButterfly ? {
          id: selectedButterfly.id,
          butterflyName: selectedButterfly.butterflyName,
          butterflyRarity: selectedButterfly.butterflyRarity,
          butterflyImageUrl: selectedButterfly.butterflyImageUrl,
          placedAt: selectedButterfly.placedAt,
          userId: selectedButterfly.userId
        } : null}
        onSold={handleButterflySold}
      />
    </div>
  );
};