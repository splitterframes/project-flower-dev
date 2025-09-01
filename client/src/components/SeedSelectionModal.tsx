import { Seed } from '../types';
import { RARITY_CONFIG } from '@shared/rarity';

interface SeedSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSeed: (seedId: number) => void;
  availableSeeds: Seed[];
}

export default function SeedSelectionModal({ 
  isOpen, 
  onClose, 
  onSelectSeed, 
  availableSeeds 
}: SeedSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">🌱 Seed wählen</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          {availableSeeds.map((seed) => {
            const rarity = RARITY_CONFIG[seed.seedId as keyof typeof RARITY_CONFIG];
            
            return (
              <button
                key={seed.id}
                onClick={() => onSelectSeed(seed.seedId)}
                className="w-full p-4 border-2 rounded-lg hover:bg-gray-50 transition-all duration-200 text-left"
                style={{ borderColor: rarity.color + '40' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: rarity.color }}
                    >
                      {seed.seedId}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {rarity.name} Seed
                      </div>
                      <div className="text-sm text-gray-600">
                        Wachstumszeit: {rarity.growthTime}s
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {seed.quantity}
                    </div>
                    <div className="text-xs text-gray-500">
                      verfügbar
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {availableSeeds.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">🌱</div>
            <p>Keine Seeds verfügbar!</p>
            <p className="text-sm mt-2">Kaufe Seeds im Markt.</p>
          </div>
        )}
      </div>
    </div>
  );
}