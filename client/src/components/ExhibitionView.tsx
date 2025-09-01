import { useState } from 'react';
import { RARITY_CONFIG } from '@shared/rarity';

export default function ExhibitionView() {
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null);

  // Placeholder exhibition frames (25 frames like garden)
  const exhibitionFrames = Array.from({ length: 25 }, (_, i) => ({
    frameIndex: i,
    butterflyId: null as number | null,
    rarity: null as number | null,
  }));

  const handleFrameClick = (frameIndex: number) => {
    setSelectedFrame(frameIndex);
    // TODO: Open butterfly selection modal
    console.log(`🖼️ Clicked exhibition frame ${frameIndex}`);
  };

  const renderFrame = (frameIndex: number) => {
    const frame = exhibitionFrames[frameIndex];
    
    if (!frame.butterflyId) {
      // Empty frame
      return (
        <button
          onClick={() => handleFrameClick(frameIndex)}
          className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 flex items-center justify-center group"
        >
          <div className="text-center">
            <div className="text-2xl group-hover:scale-110 transition-transform">🖼️</div>
            <div className="text-xs text-gray-500 mt-1">Leer</div>
          </div>
        </button>
      );
    }

    if (!frame.rarity || !frame.butterflyId) return null;
    const rarity = RARITY_CONFIG[frame.rarity as keyof typeof RARITY_CONFIG];

    return (
      <button
        onClick={() => handleFrameClick(frameIndex)}
        className="w-full aspect-square rounded-lg border-2 hover:scale-105 transition-all duration-200 flex items-center justify-center relative overflow-hidden"
        style={{ borderColor: rarity.color }}
      >
        {/* Butterfly image */}
        <div className="w-full h-full bg-gray-100 rounded">
          <img
            src={`/Schmetterlinge/${frame.butterflyId?.toString().padStart(3, '0')}.jpg`}
            alt={`Schmetterling ${frame.butterflyId}`}
            className="w-full h-full object-cover rounded"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'flex';
            }}
          />
          <div className="w-full h-full items-center justify-center text-4xl hidden">
            🦋
          </div>
        </div>

        {/* Rarity badge */}
        <div 
          className="absolute bottom-1 right-1 text-xs px-2 py-1 rounded text-white font-bold"
          style={{ backgroundColor: rarity.color }}
        >
          {rarity.name}
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🖼️ Meine Ausstellung</h2>
            <p className="text-gray-600">
              Stelle deine wertvollsten Schmetterlinge aus und verdiene passives Einkommen!
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Passives Einkommen:</div>
            <div className="text-lg font-bold text-green-600">
              0 Credits/Std
            </div>
          </div>
        </div>

        {/* 5x5 Exhibition Grid */}
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 25 }, (_, i) => (
            <div key={i}>
              {renderFrame(i)}
            </div>
          ))}
        </div>

        {/* Income Info */}
        <div className="mt-6 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">💰 Passives Einkommen</h3>
          <div className="text-sm text-gray-700 space-y-1">
            <p>• Jeder ausgestellte Schmetterling generiert Credits basierend auf seiner Seltenheit</p>
            <p>• <span className="font-semibold">Common:</span> 1 Credit/Std | <span className="font-semibold">Mythical:</span> 100 Credits/Std</p>
            <p>• Credits werden automatisch alle 10 Minuten gutgeschrieben</p>
            <p>• Sammle deine wertvollsten Schmetterlinge für maximales Einkommen!</p>
          </div>
        </div>
      </div>

      {/* Exhibition Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(RARITY_CONFIG).map(([rarity, config]) => (
          <div 
            key={rarity}
            className="bg-white/90 backdrop-blur-sm rounded-lg p-4 text-center"
            style={{ borderTop: `4px solid ${config.color}` }}
          >
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-600 mb-1">{config.name}</div>
            <div className="text-xs text-gray-500">
              {parseInt(rarity) * 10} Credits/Std
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}