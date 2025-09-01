import { useState } from 'react';
import { RARITY_CONFIG } from '@shared/rarity';

export default function MarketView() {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

  // Mock market data - later will come from API
  const marketListings = [
    { id: 1, seedId: 1, quantity: 10, pricePerSeed: 50, sellerName: 'GardenMaster' },
    { id: 2, seedId: 2, quantity: 5, pricePerSeed: 120, sellerName: 'FlowerQueen' },
    { id: 3, seedId: 3, quantity: 3, pricePerSeed: 300, sellerName: 'RarePlanter' },
    { id: 4, seedId: 4, quantity: 2, pricePerSeed: 750, sellerName: 'LegendaryGrower' },
  ];

  const renderBuyTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">🛒 Seeds kaufen</h3>
        <div className="text-sm text-gray-500">
          {marketListings.length} Angebote verfügbar
        </div>
      </div>

      <div className="space-y-3">
        {marketListings.map((listing) => {
          const rarity = RARITY_CONFIG[listing.seedId as keyof typeof RARITY_CONFIG];
          const totalPrice = listing.quantity * listing.pricePerSeed;
          
          return (
            <div 
              key={listing.id}
              className="bg-white border-2 rounded-lg p-4 hover:shadow-md transition-all duration-200"
              style={{ borderColor: rarity.color + '40' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: rarity.color }}
                  >
                    {listing.seedId}
                  </div>
                  
                  <div>
                    <div className="font-semibold text-gray-900">
                      {rarity.name} Seeds
                    </div>
                    <div className="text-sm text-gray-600">
                      von {listing.sellerName}
                    </div>
                    <div className="text-xs text-gray-500">
                      Wachstumszeit: {rarity.growthTime}s
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {listing.quantity}x
                  </div>
                  <div className="text-sm text-gray-600">
                    {listing.pricePerSeed} Credits/Stk
                  </div>
                  <div className="text-lg font-bold text-purple-600">
                    {totalPrice.toLocaleString()} Credits
                  </div>
                </div>
                
                <button className="ml-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300">
                  Kaufen
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {marketListings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">🏪</div>
          <p>Keine Seeds im Markt verfügbar</p>
          <p className="text-sm mt-2">Schau später wieder vorbei!</p>
        </div>
      )}
    </div>
  );

  const renderSellTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">💰 Seeds verkaufen</h3>
        <div className="text-sm text-gray-500">
          Nur Seeds können verkauft werden
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="text-yellow-600 text-xl">⚠️</div>
          <div>
            <div className="font-semibold text-yellow-800">Nur Seeds verkaufbar!</div>
            <div className="text-sm text-yellow-700 mt-1">
              Im Mariposa-Markt können nur Seeds gehandelt werden. Schmetterlinge haben einen 72-Stunden Verkaufs-Countdown und werden automatisch verkauft.
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-4">🌱</div>
        <p>Seed-Verkaufsfunktion</p>
        <p className="text-sm mt-2">Bald verfügbar!</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🏪 Marktplatz</h2>
            <p className="text-gray-600">
              Kaufe und verkaufe Seeds mit anderen Spielern
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 border-b mb-6">
          <button
            onClick={() => setActiveTab('buy')}
            className={`py-2 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'buy' 
                ? 'border-purple-500 text-purple-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🛒 Seeds kaufen
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`py-2 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'sell' 
                ? 'border-purple-500 text-purple-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            💰 Seeds verkaufen
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'buy' && renderBuyTab()}
        {activeTab === 'sell' && renderSellTab()}
      </div>

      {/* Market Info */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Marktpreise</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(RARITY_CONFIG).map(([rarity, config]) => (
            <div 
              key={rarity}
              className="text-center p-3 rounded-lg"
              style={{ backgroundColor: config.color + '20' }}
            >
              <div 
                className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: config.color }}
              >
                {rarity}
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {config.name}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                ~{parseInt(rarity) * 50} Credits
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}