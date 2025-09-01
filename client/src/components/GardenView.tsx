import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/auth';
import { useGameStore } from '../stores/game';
import { PlantedField } from '../types';
import { RARITY_CONFIG } from '@shared/rarity';
import SeedSelectionModal from './SeedSelectionModal.tsx';

// Field states
type FieldState = 'locked' | 'unlockable' | 'empty' | 'planted' | 'ready';

export default function GardenView() {
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [fieldTimes, setFieldTimes] = useState<Record<number, number>>({});
  
  const { user } = useAuthStore();
  const { plantedFields, seeds, unlockedFields, nextUnlockCost, plantSeed, harvestFlower, unlockField } = useGameStore();
  
  // Debug log
  console.log('🔍 GardenView - unlockedFields:', unlockedFields);

  // Timer for growth countdown
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newTimes: Record<number, number> = {};
      
      plantedFields.forEach((field) => {
        if (!field.isReady) {
          const harvestTime = new Date(field.harvestAt).getTime();
          const remaining = Math.max(0, harvestTime - now);
          newTimes[field.fieldIndex] = remaining;
        }
      });
      
      setFieldTimes(newTimes);
    }, 1000);

    return () => clearInterval(interval);
  }, [plantedFields]);

  // Helper functions
  const isFieldUnlocked = (fieldIndex: number): boolean => {
    return unlockedFields.some(f => f.fieldIndex === fieldIndex);
  };
  
  const isFieldUnlockable = (fieldIndex: number): boolean => {
    if (isFieldUnlocked(fieldIndex)) return false;
    
    // Check if field is adjacent to any unlocked field (10x5 grid)
    const row = Math.floor(fieldIndex / 10);
    const col = fieldIndex % 10;
    const adjacentIndices = [
      (row - 1) * 10 + col, // above
      (row + 1) * 10 + col, // below  
      row * 10 + (col - 1), // left
      row * 10 + (col + 1), // right
    ].filter(idx => idx >= 0 && idx < 50); // Valid field range
    
    return adjacentIndices.some(idx => isFieldUnlocked(idx));
  };
  
  const getFieldState = (fieldIndex: number): FieldState => {
    if (!isFieldUnlocked(fieldIndex)) {
      return isFieldUnlockable(fieldIndex) ? 'unlockable' : 'locked';
    }
    
    const field = getFieldData(fieldIndex);
    if (!field) return 'empty';
    
    return isFieldReady(field) ? 'ready' : 'planted';
  };

  const handleFieldClick = async (fieldIndex: number) => {
    if (!user) return;
    
    const state = getFieldState(fieldIndex);
    
    switch (state) {
      case 'unlockable':
        await handleUnlockField(fieldIndex);
        break;
      case 'empty':
        setSelectedField(fieldIndex);
        setShowSeedModal(true);
        break;
      case 'ready':
        await handleHarvest(fieldIndex);
        break;
      default:
        // locked or planted fields don't respond
        break;
    }
  };
  
  const handleUnlockField = async (fieldIndex: number) => {
    if (!user) return;
    
    const success = await unlockField(user.id, fieldIndex);
    if (success) {
      console.log(`🔓 Field ${fieldIndex} unlocked for ${nextUnlockCost} credits`);
    } else {
      console.error('❌ Failed to unlock field');
    }
  };

  const handlePlantSeed = async (seedId: number) => {
    if (selectedField === null || !user) return;
    
    const success = await plantSeed(user.id, selectedField, seedId);
    if (success) {
      console.log(`🌱 Seed ${seedId} planted in field ${selectedField}`);
    } else {
      console.error('❌ Failed to plant seed');
    }
    
    setShowSeedModal(false);
    setSelectedField(null);
  };

  const handleHarvest = async (fieldIndex: number) => {
    if (!user) return;
    
    const success = await harvestFlower(user.id, fieldIndex);
    if (success) {
      console.log(`🌸 Flower harvested from field ${fieldIndex}`);
    } else {
      console.error('❌ Failed to harvest flower');
    }
  };

  const getFieldData = (fieldIndex: number): PlantedField | undefined => {
    return plantedFields.find(f => f.fieldIndex === fieldIndex);
  };

  const isFieldReady = (field: PlantedField): boolean => {
    return new Date(field.harvestAt) <= new Date();
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}s`;
  };

  const renderField = (fieldIndex: number) => {
    const state = getFieldState(fieldIndex);
    const field = getFieldData(fieldIndex);
    const timeRemaining = fieldTimes[fieldIndex];
    
    // Locked field
    if (state === 'locked') {
      return (
        <div className="w-full aspect-square bg-gray-800/80 rounded-lg border border-gray-600 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg text-gray-500">🔒</div>
            <div className="text-xs text-gray-400 mt-1">Gesperrt</div>
          </div>
        </div>
      );
    }
    
    // Unlockable field
    if (state === 'unlockable') {
      return (
        <button
          onClick={() => handleFieldClick(fieldIndex)}
          className="w-full aspect-square bg-yellow-100/90 border-2 border-yellow-400 border-dashed rounded-lg hover:bg-yellow-200 hover:border-yellow-500 transition-all duration-200 flex items-center justify-center group"
        >
          <div className="text-center">
            <div className="text-lg group-hover:scale-110 transition-transform">💰</div>
            <div className="text-xs text-yellow-700 font-medium mt-1">Freischalten</div>
            <div className="text-xs text-yellow-600">{nextUnlockCost.toLocaleString()}cr</div>
          </div>
        </button>
      );
    }
    
    // Empty unlocked field
    if (state === 'empty') {
      return (
        <button
          onClick={() => handleFieldClick(fieldIndex)}
          className="w-full aspect-square bg-white/90 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 flex items-center justify-center group"
        >
          <div className="text-center">
            <img
              src="/Blumen/0.jpg"
              alt="Seed"
              className="w-8 h-8 mx-auto mb-1 rounded group-hover:scale-110 transition-transform"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'block';
              }}
            />
            <div className="text-lg hidden group-hover:scale-110 transition-transform">🌱</div>
            <div className="text-xs text-gray-500 mt-1">Pflanzen</div>
          </div>
        </button>
      );
    }
    
    // Planted or ready field
    if (field) {
      const rarity = RARITY_CONFIG[field.seedId as keyof typeof RARITY_CONFIG];
      const isReady = state === 'ready';
      
      return (
        <button
          onClick={() => handleFieldClick(fieldIndex)}
          className={`w-full aspect-square rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center relative overflow-hidden ${
            isReady 
              ? 'border-green-400 bg-green-100 hover:bg-green-200 cursor-pointer hover:scale-105' 
              : 'border-orange-300 bg-orange-50 cursor-default'
          }`}
          style={{ borderColor: rarity.color + '60' }}
          disabled={!isReady}
        >
          {/* Background gradient for rarity */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{ background: `linear-gradient(45deg, ${rarity.color}30, transparent)` }}
          />
          
          <div className="text-center relative z-10">
            {/* Seed/Flower image */}
            <div className="mb-1">
              {isReady ? (
                <div className="text-xl animate-pulse">🌸</div>
              ) : (
                <img
                  src="/Blumen/0.jpg"
                  alt="Growing seed"
                  className="w-6 h-6 mx-auto rounded opacity-75"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'block';
                  }}
                />
              )}
              <div className="text-sm hidden">🌱</div>
            </div>
            
            {/* Status text */}
            <div className="text-xs font-medium text-gray-800">
              {isReady ? 'Ernten!' : timeRemaining ? formatTime(timeRemaining) : 'Wächst...'}
            </div>
            
            {/* Rarity indicator */}
            <div 
              className="text-xs px-1 py-0.5 rounded mt-1 font-medium"
              style={{ backgroundColor: rarity.color + '40', color: rarity.color }}
            >
              {rarity.name}
            </div>
          </div>
        </button>
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🌱 Mein Garten</h2>
            <p className="text-gray-600">
              Pflanze Seeds und sammle wunderschöne Blumen! {unlockedFields.length}/50 Felder freigeschaltet
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Verfügbare Seeds:</div>
            <div className="text-lg font-bold text-purple-600">
              {seeds.reduce((total, seed) => total + seed.quantity, 0)}
            </div>
            <div className="text-sm text-gray-500 mt-2">Nächstes Feld freischalten:</div>
            <div className="text-lg font-bold text-green-600">
              {nextUnlockCost.toLocaleString()} Credits
            </div>
          </div>
        </div>

        {/* 10x5 Garden Grid with grass background */}
        <div 
          className="grid grid-cols-10 gap-2 p-4 rounded-xl"
          style={{
            backgroundImage: 'url(/Landschaft/gras.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat'
          }}
        >
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i} className="aspect-square">
              {renderField(i)}
            </div>
          ))}
        </div>

        {/* Field Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Growth Time Legend */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Wachstumszeiten:</h3>
            <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
              {Object.entries(RARITY_CONFIG).map(([rarity, config]) => (
                <div 
                  key={rarity}
                  className="text-center p-2 rounded"
                  style={{ backgroundColor: config.color + '20' }}
                >
                  <div className="font-medium" style={{ color: config.color }}>
                    {config.name}
                  </div>
                  <div className="text-gray-600 mt-1">
                    {Math.floor(config.growthTime / 1000)}s
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Field Status Legend */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Feldstatus:</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-800 rounded border"></div>
                <span className="text-gray-600">🔒 Gesperrt</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-400 border-dashed rounded"></div>
                <span className="text-gray-600">💰 Freischaltbar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border-2 border-dashed border-gray-300 rounded"></div>
                <span className="text-gray-600">🌱 Leer (pflanzbar)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-50 border-2 border-orange-300 rounded"></div>
                <span className="text-gray-600">⏰ Wächst</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border-2 border-green-400 rounded"></div>
                <span className="text-gray-600">🌸 Bereit zur Ernte</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seed Selection Modal */}
      <SeedSelectionModal
        isOpen={showSeedModal}
        onClose={() => {
          setShowSeedModal(false);
          setSelectedField(null);
        }}
        onSelectSeed={handlePlantSeed}
        availableSeeds={seeds}
      />
    </div>
  );
}