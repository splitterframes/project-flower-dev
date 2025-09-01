import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/auth';
import { useGameStore } from '../stores/game';
import GardenView from './GardenView';
import InventoryView from './InventoryView';
import ExhibitionView from './ExhibitionView';
import MarketView from './MarketView';

type Tab = 'garden' | 'inventory' | 'exhibition' | 'market';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('garden');
  const { user, logout } = useAuthStore();
  const { fetchGameData, loading, seeds, flowers, butterflies } = useGameStore();

  useEffect(() => {
    if (user) {
      fetchGameData(user.id);
      
      // Refresh data every 30 seconds
      const interval = setInterval(() => {
        fetchGameData(user.id);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user, fetchGameData]);

  if (!user) return null;

  const tabs = [
    { id: 'garden' as Tab, label: '🌱 Garten', count: 0 },
    { id: 'inventory' as Tab, label: '🎒 Inventar', count: seeds.length + flowers.length },
    { id: 'exhibition' as Tab, label: '🖼️ Ausstellung', count: butterflies.length },
    { id: 'market' as Tab, label: '🏪 Markt', count: 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">🦋</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mariposa</h1>
                <p className="text-sm text-gray-600">Willkommen, {user.username}!</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-semibold">
                💰 {user.credits.toLocaleString()} Credits
              </div>
              
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 whitespace-nowrap font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin text-4xl">🦋</div>
            <span className="ml-4 text-white font-semibold">Lädt...</span>
          </div>
        ) : (
          <>
            {activeTab === 'garden' && <GardenView />}
            {activeTab === 'inventory' && <InventoryView />}
            {activeTab === 'exhibition' && <ExhibitionView />}
            {activeTab === 'market' && <MarketView />}
          </>
        )}
      </main>
    </div>
  );
}