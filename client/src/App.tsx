import { useState } from 'react';
import { useAuthStore } from './stores/auth';
import Dashboard from './components/Dashboard';
import AuthModal from './components/AuthModal';
import './App.css';

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  if (isAuthenticated && user) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 max-w-md text-center shadow-2xl">
        <div className="animate-bounce text-6xl mb-6">🦋</div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Mariposa
        </h1>
        <p className="text-gray-600 mb-8">
          Das magische Garten-Management-Spiel mit 960 Schmetterlingen, 200 Blumen und 7 Seltenheitsstufen
        </p>
        
        <div className="space-y-4 mb-8">
          <div className="flex items-center space-x-3 text-left">
            <div className="text-2xl">🌱</div>
            <div>
              <div className="font-semibold">Pflanze & Ernte</div>
              <div className="text-sm text-gray-600">Seeds mit verschiedenen Wachstumszeiten</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 text-left">
            <div className="text-2xl">🦋</div>
            <div>
              <div className="font-semibold">Sammle Schmetterlinge</div>
              <div className="text-sm text-gray-600">960 einzigartige Arten über 7 Seltenheitsstufen</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 text-left">
            <div className="text-2xl">🖼️</div>
            <div>
              <div className="font-semibold">Ausstellung & Einkommen</div>
              <div className="text-sm text-gray-600">Verdiene passives Einkommen mit deiner Collection</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 text-left">
            <div className="text-2xl">🏪</div>
            <div>
              <div className="font-semibold">Handel & Markt</div>
              <div className="text-sm text-gray-600">Tausche Seeds und verkaufe Schmetterlinge</div>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setShowAuthModal(true)}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-4 rounded-full font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg"
        >
          Jetzt spielen! 🚀
        </button>
        
        <div className="mt-6 text-xs text-gray-500">
          Kostenlos • 1000 Starter-Credits • 15 Starter-Seeds
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
}

export default App;