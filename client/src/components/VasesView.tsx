import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/stores/useAuth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Crown, Heart, Lock } from 'lucide-react';

interface Vase {
  id: number;
  name: string;
  heartsRequired: number;
  collected: boolean;
  image?: string;
}

interface VaseWithImage extends Vase {
  gifPath: string;
  jpgPath: string;
}

// Component for handling vase images with fallback logic
function VaseImage({ vase, onClick }: { vase: VaseWithImage; onClick?: () => void }) {
  const [imageState, setImageState] = useState<{
    src: string;
    type: 'gif' | 'jpg' | 'placeholder';
    loading: boolean;
  }>({ 
    src: vase.gifPath, // Try GIF first
    type: 'gif',
    loading: true 
  });

  const handleImageError = () => {
    if (imageState.type === 'gif') {
      // GIF failed, try JPG
      setImageState({ src: vase.jpgPath, type: 'jpg', loading: true });
    } else if (imageState.type === 'jpg') {
      // JPG failed, use placeholder
      setImageState({ src: '', type: 'placeholder', loading: false });
    }
  };

  const handleImageLoad = () => {
    setImageState(prev => ({ ...prev, loading: false }));
  };

  if (imageState.type === 'placeholder') {
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
        src={imageState.src}
        alt={vase.name}
        className="w-full h-full object-contain rounded-md"
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
      {/* Format badge for identification */}
      {!imageState.loading && (
        <div className="absolute top-1 left-1">
          <Badge 
            variant="secondary" 
            className={`
              text-xs px-1 py-0 
              ${imageState.type === 'gif' ? 'bg-purple-600 text-purple-100 animate-pulse' : 'bg-blue-600 text-blue-100'}
              opacity-70 hover:opacity-100 transition-opacity
            `}
          >
            {imageState.type.toUpperCase()}
          </Badge>
        </div>
      )}
    </div>
  );
}

export const VasesView: React.FC = () => {
  const { user } = useAuth();
  const [userHearts, setUserHearts] = useState(0);
  const [vases, setVases] = useState<VaseWithImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVase, setSelectedVase] = useState<VaseWithImage | null>(null);
  const [showVaseModal, setShowVaseModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;
    
    try {
      // Get user hearts
      const heartsResponse = await fetch(`/api/user/${user.id}/hearts`);
      if (heartsResponse.ok) {
        const { hearts } = await heartsResponse.json();
        setUserHearts(hearts);
      }
      
      // Initialize vases (24 total, 6 per shelf, 4 shelves)
      // Exponentially weighted heart requirements: 1.000 to 100.000
      const vaseList: VaseWithImage[] = [];
      
      for (let i = 1; i <= 24; i++) {
        // Exponential scaling: starts at 1000, ends at 100000
        const heartsRequired = Math.round(1000 + Math.pow((i - 1) / 23, 2.2) * 99000);
        
        vaseList.push({
          id: i,
          name: `Prächtige Vase ${i}`,
          heartsRequired: heartsRequired,
          collected: false, // TODO: Load from API later
          image: `/Vasen/${i}.jpg`, // Default fallback
          gifPath: `/Vasen/${i}.gif`,
          jpgPath: `/Vasen/${i}.jpg`
        });
      }
      
      setVases(vaseList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching vases data:', error);
      setLoading(false);
    }
  };

  const handleVaseClick = (vase: VaseWithImage) => {
    const canCollect = userHearts >= vase.heartsRequired && !vase.collected;
    
    if (canCollect) {
      console.log(`🏺 Collecting vase ${vase.name} for ${vase.heartsRequired} hearts`);
      // TODO: Implement vase collection API call
    } else if (vase.collected) {
      // If vase is collected, open modal for large view
      setSelectedVase(vase);
      setShowVaseModal(true);
    } else {
      console.log(`🏺 Need ${vase.heartsRequired - userHearts} more hearts for ${vase.name}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
        <div className="container mx-auto py-8">
          <div className="text-center">
            <div className="text-4xl mb-4">🏺</div>
            <div className="text-slate-300">Lade Vasen-Sammlung...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="container mx-auto py-8">
        {/* Header with animated title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-6 flex justify-center items-center space-x-2 leading-tight py-4">
            <span className="animate-pulse">👑</span>
            <span className="bg-gradient-to-r from-orange-400 via-yellow-500 to-orange-600 bg-clip-text text-transparent font-bold">
              Vasen-Sammlung
            </span>
            <span className="animate-pulse">👑</span>
          </div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Sammle exquisite Vasen mit deinen Herzen! Jede Vase ist einzigartig und wartet darauf, in deine Sammlung aufgenommen zu werden.
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
                {vases
                  .slice(shelfIndex * 6, (shelfIndex + 1) * 6)
                  .map((vase) => {
                    const canCollect = userHearts >= vase.heartsRequired && !vase.collected;
                    const isLocked = userHearts < vase.heartsRequired && !vase.collected;

                    return (
                      <div
                        key={vase.id}
                        className={`
                          relative group cursor-pointer transition-all duration-300
                          ${canCollect ? 'hover:scale-105 hover:shadow-lg' : ''}
                          ${vase.collected ? 'opacity-100' : isLocked ? 'opacity-40' : 'opacity-70 hover:opacity-100'}
                        `}
                        onClick={() => handleVaseClick(vase)}
                        style={{
                          animationDelay: `${(vase.id * 0.3)}s`, // Random staggered delays
                        }}
                      >
                        {/* Vase Container */}
                        <div className={`
                          aspect-[2/3] rounded-lg border-2 relative overflow-hidden transition-all duration-500
                          ${vase.collected ? 'border-green-400 bg-green-900/50 shadow-green-400/20 shadow-lg' : 
                            canCollect ? 'border-orange-400 bg-orange-900/30 shadow-orange-400/30 shadow-lg animate-pulse' :
                            'border-slate-500 bg-slate-800/50'
                          }
                          animate-gold-glow-random
                        `}
                        style={{
                          animationDelay: `${Math.random() * 5}s`, // Random gold glow timing
                          animationDuration: `${3 + Math.random() * 2}s`, // Vary duration 3-5s
                        }}>
                          {/* Vase Image or Placeholder */}
                          <div className="w-full h-full flex items-center justify-center p-2">
                            {vase.collected ? (
                              <div className="text-center">
                                <Crown className="h-8 w-8 text-green-400 mx-auto mb-1" />
                                <div className="text-xs font-bold text-green-300">
                                  Gesammelt!
                                </div>
                              </div>
                            ) : isLocked ? (
                              <div className="text-center">
                                <Lock className="h-6 w-6 text-slate-500 mx-auto mb-1" />
                                <div className="text-xs text-slate-400">
                                  Gesperrt
                                </div>
                              </div>
                            ) : (
                              <VaseImage 
                                vase={vase} 
                                onClick={() => {
                                  setSelectedVase(vase);
                                  setShowVaseModal(true);
                                }}
                              />
                            )}
                          </div>

                          {/* Vase Info */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-2 rounded-b-lg">
                            <div className="text-xs font-medium text-slate-400">
                              Vase {vase.id}
                            </div>
                            {canCollect && (
                              <div className="absolute inset-0 bg-orange-400 opacity-0 group-hover:opacity-25 transition-opacity duration-300 rounded-lg" />
                            )}
                          </div>

                          {/* Hearts Badge */}
                          <div className="absolute top-2 right-2">
                            <Badge className={`
                              text-xs px-1 py-0 
                              ${canCollect ? 'bg-green-600 text-green-100 border border-green-400/50' : 'bg-slate-600 text-slate-200 border border-slate-400/50'}
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
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-lg font-bold text-orange-300">
                  {vases.filter(v => v.collected).length} / {vases.length}
                </div>
                <div className="text-xs text-slate-400">Gesammelt</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-300">
                  {vases.filter(v => userHearts >= v.heartsRequired && !v.collected).length}
                </div>
                <div className="text-xs text-slate-400">Verfügbar</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-400">
                  {vases.filter(v => userHearts < v.heartsRequired).length}
                </div>
                <div className="text-xs text-slate-400">Gesperrt</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-300">
                  <Heart className="h-4 w-4 inline mr-1" />
                  {userHearts.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400">Deine Herzen</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Vase Detail Modal */}
      {selectedVase && (
        <Dialog open={showVaseModal} onOpenChange={setShowVaseModal}>
          <DialogContent className="max-w-md bg-slate-900 border-orange-500/30">
            <DialogTitle className="text-xl font-bold text-orange-300 text-center">
              {selectedVase.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-center">
              Betrachte diese wunderschöne Vase aus deiner Sammlung
            </DialogDescription>
            <div className="text-center space-y-4">
              
              {/* Large Vase Image - 250x750 pixels */}
              <div className="flex justify-center">
                <div className="w-[500px] h-[750px] relative border-2 border-orange-400/50 rounded-lg overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
                  <img 
                    src={selectedVase.image}
                    alt={selectedVase.name}
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

              {/* Vase Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-orange-300">
                  <Heart className="h-5 w-5" />
                  <span>{selectedVase.heartsRequired.toLocaleString()} Herzen erforderlich</span>
                </div>
                
                <div className="flex items-center justify-center gap-2">
                  <Crown className="h-5 w-5 text-green-400" />
                  <span className="text-green-300 font-semibold">Gesammelt</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default VasesView;