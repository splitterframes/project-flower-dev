import { useGameStore } from '../stores/game';
import { RARITY_CONFIG } from '../types';

export default function InventoryView() {
  const { seeds, flowers, butterflies } = useGameStore();

  const renderSeedsSection = () => (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">🌱 Meine Seeds</h3>
        <div className="text-sm text-gray-500">
          {seeds.reduce((total, seed) => total + seed.quantity, 0)} insgesamt
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {seeds.map((seed) => {
          const rarity = RARITY_CONFIG[seed.seedId as keyof typeof RARITY_CONFIG];
          
          return (
            <div
              key={seed.id}
              className="p-4 border-2 rounded-lg text-center"
              style={{ borderColor: rarity.color + '40', backgroundColor: rarity.color + '10' }}
            >
              <div 
                className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: rarity.color }}
              >
                {seed.seedId}
              </div>
              <div className="font-semibold text-gray-900 mb-1">
                {rarity.name}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {seed.quantity}
              </div>
              <div className="text-xs text-gray-500">
                {rarity.growthTime}s Wachstum
              </div>
            </div>
          );
        })}
      </div>
      
      {seeds.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">🌱</div>
          <p>Keine Seeds vorhanden</p>
          <p className="text-sm mt-2">Gehe zum Markt, um Seeds zu kaufen!</p>
        </div>
      )}
    </div>
  );

  const renderFlowersSection = () => (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">🌸 Meine Blumen</h3>
        <div className="text-sm text-gray-500">
          {flowers.reduce((total, flower) => total + flower.quantity, 0)} insgesamt
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {flowers.map((flower) => {
          const rarity = RARITY_CONFIG[flower.rarity as keyof typeof RARITY_CONFIG];
          
          return (
            <div
              key={flower.id}
              className="p-4 border-2 rounded-lg text-center"
              style={{ borderColor: rarity.color + '40', backgroundColor: rarity.color + '10' }}
            >
              {/* Flower image - using flowerId to get correct image */}
              <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-lg flex items-center justify-center">
                <img
                  src={`/Blumen/${flower.flowerId}.jpg`}
                  alt={`Blume ${flower.flowerId}`}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    // Fallback to emoji if image doesn't load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling!.style.display = 'flex';
                  }}
                />
                <div className="w-full h-full items-center justify-center text-2xl hidden">
                  🌸
                </div>
              </div>
              
              <div className="font-semibold text-gray-900 mb-1">
                Blume #{flower.flowerId}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {flower.quantity}
              </div>
              <div 
                className="text-xs px-2 py-1 rounded"
                style={{ backgroundColor: rarity.color + '20', color: rarity.color }}
              >
                {rarity.name}
              </div>
            </div>
          );
        })}
      </div>
      
      {flowers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">🌸</div>
          <p>Keine Blumen gesammelt</p>
          <p className="text-sm mt-2">Pflanze Seeds im Garten und ernte sie!</p>
        </div>
      )}
    </div>
  );

  const renderButterfliesSection = () => (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">🦋 Meine Schmetterlinge</h3>
        <div className="text-sm text-gray-500">
          {butterflies.reduce((total, butterfly) => total + butterfly.quantity, 0)} insgesamt
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {butterflies.map((butterfly) => {
          const rarity = RARITY_CONFIG[butterfly.rarity as keyof typeof RARITY_CONFIG];
          
          return (
            <div
              key={butterfly.id}
              className="p-4 border-2 rounded-lg text-center"
              style={{ borderColor: rarity.color + '40', backgroundColor: rarity.color + '10' }}
            >
              {/* Butterfly image - using butterflyId to get correct image */}
              <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-lg flex items-center justify-center">
                <img
                  src={`/Schmetterlinge/${butterfly.butterflyId.toString().padStart(3, '0')}.jpg`}
                  alt={`Schmetterling ${butterfly.butterflyId}`}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    // Fallback to emoji if image doesn't load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling!.style.display = 'flex';
                  }}
                />
                <div className="w-full h-full items-center justify-center text-2xl hidden">
                  🦋
                </div>
              </div>
              
              <div className="font-semibold text-gray-900 mb-1">
                Schmetterling #{butterfly.butterflyId}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {butterfly.quantity}
              </div>
              <div 
                className="text-xs px-2 py-1 rounded"
                style={{ backgroundColor: rarity.color + '20', color: rarity.color }}
              >
                {rarity.name}
              </div>
            </div>
          );
        })}
      </div>
      
      {butterflies.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">🦋</div>
          <p>Keine Schmetterlinge gefangen</p>
          <p className="text-sm mt-2">Warte darauf, dass Schmetterlinge in deinem Garten spawnen!</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {renderSeedsSection()}
      {renderFlowersSection()}
      {renderButterfliesSection()}
    </div>
  );
}