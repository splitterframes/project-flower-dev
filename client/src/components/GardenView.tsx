import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/auth';
import { useGameStore } from '../stores/game';
import { RARITY_CONFIG, PlantedField } from '../types';
import SeedSelectionModal from './SeedSelectionModal';

export default function GardenView() {
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [fieldTimes, setFieldTimes] = useState<Record<number, number>>({});
  
  const { user } = useAuthStore();
  const { plantedFields, seeds, plantSeed, harvestFlower } = useGameStore();

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

  const handleFieldClick = (fieldIndex: number) => {
    const field = getFieldData(fieldIndex);
    
    if (!field) {
      // Empty field - show seed selection
      setSelectedField(fieldIndex);
      setShowSeedModal(true);
    } else if (isFieldReady(field)) {
      // Ready to harvest
      handleHarvest(fieldIndex);
    }
    // Growing fields don't respond to clicks
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
    const field = getFieldData(fieldIndex);
    const timeRemaining = fieldTimes[fieldIndex];
    
    if (!field) {
      // Empty field
      return (
        <button
          onClick={() => handleFieldClick(fieldIndex)}
          className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 flex items-center justify-center group"
        >
          <div className="text-center">
            <div className="text-2xl group-hover:scale-110 transition-transform">🌱</div>
            <div className="text-xs text-gray-500 mt-1">Pflanzen</div>
          </div>
        </button>
      );
    }

    const rarity = RARITY_CONFIG[field.seedId as keyof typeof RARITY_CONFIG];
    const isReady = isFieldReady(field);

    return (
      <button
        onClick={() => handleFieldClick(fieldIndex)}
        className={`w-full h-24 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center relative overflow-hidden ${
          isReady 
            ? 'border-green-400 bg-green-100 hover:bg-green-200 cursor-pointer' 
            : 'border-orange-300 bg-orange-50 cursor-default'
        }`}
        style={{ borderColor: rarity.color + '40' }}
        disabled={!isReady}
      >
        {/* Background gradient for rarity */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{ background: `linear-gradient(45deg, ${rarity.color}20, transparent)` }}
        />
        
        <div className="text-center relative z-10">
          {/* Seed image - for now using emoji, later actual seed image */}
          <div className="text-xl mb-1">
            {isReady ? '🌸' : '🌱'}
          </div>
          
          {/* Status text */}
          <div className="text-xs font-medium">
            {isReady ? 'Ernten!' : timeRemaining ? formatTime(timeRemaining) : 'Wächst...'}
          </div>
          
          {/* Rarity indicator */}
          <div 
            className="text-xs px-2 py-1 rounded mt-1"
            style={{ backgroundColor: rarity.color + '20', color: rarity.color }}
          >
            {rarity.name}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🌱 Mein Garten</h2>
            <p className="text-gray-600">
              Pflanze Seeds und sammle wunderschöne Blumen! {plantedFields.length}/25 Felder belegt
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Verfügbare Seeds:</div>
            <div className="text-lg font-bold text-purple-600">
              {seeds.reduce((total, seed) => total + seed.quantity, 0)}
            </div>
          </div>
        </div>

        {/* 5x5 Garden Grid */}
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 25 }, (_, i) => (
            <div key={i} className="aspect-square">
              {renderField(i)}
            </div>
          ))}
        </div>

        {/* Growth Time Legend */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Wachstumszeiten:</h3>
          <div className="grid grid-cols-7 gap-2 text-xs">
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
                  {config.growthTime}s
                </div>
              </div>
            ))}
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