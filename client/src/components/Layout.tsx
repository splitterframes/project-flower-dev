import React, { useState, useEffect } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AuthModal } from "./AuthModal";
import { Dashboard } from "./Dashboard";
import { GameView } from "./GameView";
import { GardenView } from "./GardenView";
import { TeichView } from "./TeichView";
import { MarketView } from "./MarketView";
import { InventoryView } from "./InventoryView";
import { DNAView } from "./DNAView";
import { BouquetsView } from "./BouquetsView";
import { FlowerpowerView } from "./FlowerpowerView";
import { ExhibitionView } from "./ExhibitionView";
import { AquariumView } from "./AquariumView";
import { MarieSlotView } from "./MarieSlotView";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { Card, CardContent } from "@/components/ui/card";

// Balloon interface
interface Balloon {
  id: string;
  x: number; // X position (0-100%)
  color: string;
  startTime: number;
}

// Balloon component
const BalloonComponent: React.FC<{ 
  balloon: Balloon; 
  onPop: (id: string) => void; 
}> = ({ balloon, onPop }) => {
  const [isPopped, setIsPopped] = useState(false);

  const handleClick = () => {
    setIsPopped(true);
    // Add a small delay for pop animation
    setTimeout(() => onPop(balloon.id), 150);
  };

  return (
    <div
      className={`fixed balloon ${isPopped ? 'balloon-popped' : ''}`}
      style={{
        left: `${balloon.x}%`,
        bottom: isPopped ? '50%' : '-100px',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        cursor: 'pointer',
        transition: isPopped ? 'all 0.15s ease-out' : 'none',
        animation: isPopped ? 'none' : 'balloon-float 8s linear forwards'
      }}
      onClick={handleClick}
    >
      <div 
        className={`balloon-body ${isPopped ? 'scale-0' : ''}`}
        style={{
          width: '40px',
          height: '50px',
          backgroundColor: balloon.color,
          borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
          position: 'relative',
          transition: 'transform 0.15s ease-out',
          boxShadow: `inset -5px -5px 0 rgba(0,0,0,0.1), 
                      0 2px 8px rgba(0,0,0,0.3)`,
          border: '1px solid rgba(255,255,255,0.3)'
        }}
      >
        {/* Balloon string */}
        <div 
          style={{
            position: 'absolute',
            bottom: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '1px',
            height: '20px',
            backgroundColor: '#8B4513',
            opacity: isPopped ? 0 : 1,
            transition: 'opacity 0.15s ease-out'
          }}
        />
        {/* Balloon highlight */}
        <div 
          style={{
            position: 'absolute',
            top: '8px',
            left: '12px',
            width: '8px',
            height: '12px',
            backgroundColor: 'rgba(255,255,255,0.6)',
            borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
            opacity: isPopped ? 0 : 1,
            transition: 'opacity 0.15s ease-out'
          }}
        />
      </div>
    </div>
  );
};

export const Layout: React.FC = () => {
  const [currentView, setCurrentView] = useState("garten");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [headerRefreshTrigger, setHeaderRefreshTrigger] = useState(0);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const { user } = useAuth();
  const { setCredits } = useCredits();

  // Balloon colors
  const balloonColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#FF9F43', '#00B894',
    '#FDA7DF', '#74B9FF', '#A29BFE', '#6C5CE7'
  ];

  // Set initial credits when user logs in
  useEffect(() => {
    if (user) {
      setCredits(user.credits);
    }
  }, [user, setCredits]);

  // Balloon spawning system
  useEffect(() => {
    const spawnBalloon = () => {
      const newBalloon: Balloon = {
        id: `balloon-${Date.now()}-${Math.random()}`,
        x: Math.random() * 90 + 5, // 5% to 95% to avoid edges
        color: balloonColors[Math.floor(Math.random() * balloonColors.length)],
        startTime: Date.now()
      };
      
      setBalloons(prev => [...prev, newBalloon]);

      // Remove balloon after 8 seconds (animation duration)
      setTimeout(() => {
        setBalloons(prev => prev.filter(b => b.id !== newBalloon.id));
      }, 8000);
    };

    // Spawn first balloon after 2 seconds
    const initialTimeout = setTimeout(spawnBalloon, 2000);

    // Then spawn every 10-20 seconds
    const spawnInterval = setInterval(() => {
      spawnBalloon();
    }, Math.random() * 10000 + 10000); // 10-20 seconds

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(spawnInterval);
    };
  }, [balloonColors]);

  // Function to pop balloon
  const popBalloon = (balloonId: string) => {
    setBalloons(prev => prev.filter(b => b.id !== balloonId));
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    // Trigger header refresh when switching views
    setHeaderRefreshTrigger(prev => prev + 1);
  };

  const handleAuthClick = () => {
    setShowAuthModal(true);
  };

  const renderContent = () => {
    switch (currentView) {
      case "garten":
        return <GardenView />;
      case "teich":
        return <TeichView />;
      case "markt":
        return <MarketView />;
      case "inventar":
        return <InventoryView />;
      case "dna":
        return <DNAView />;
      case "bouquets":
        return <BouquetsView />;
      case "flowerpower":
        return <FlowerpowerView />;
      case "ausstellung":
        return <ExhibitionView />;
      case "aquarium":
        return <AquariumView />;
      case "marie-slot":
        return <MarieSlotView onBack={() => handleViewChange('garten')} />;
      case "dashboard":
        return <Dashboard onViewChange={handleViewChange} />;
      case "game":
        return <GameView />;
      default:
        return <GardenView />;
    }
  };

  return (
    <div className="layout-container h-screen bg-slate-950 flex flex-col">
      <Header onAuthClick={handleAuthClick} refreshTrigger={headerRefreshTrigger} />
      
      <main className="layout-main flex-1 overflow-y-auto">
        {renderContent()}
      </main>
      
      <Footer activeView={currentView} onViewChange={handleViewChange} />
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* Floating Balloons */}
      {balloons.map(balloon => (
        <BalloonComponent 
          key={balloon.id} 
          balloon={balloon} 
          onPop={popBalloon}
        />
      ))}

      {/* Global CSS for Balloon Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes balloon-float {
            0% {
              bottom: -100px;
              transform: translateX(-50%) rotate(-2deg);
            }
            25% {
              transform: translateX(-50%) rotate(2deg);
            }
            50% {
              transform: translateX(-50%) rotate(-1deg);
            }
            75% {
              transform: translateX(-50%) rotate(1deg);
            }
            100% {
              bottom: calc(100vh + 50px);
              transform: translateX(-50%) rotate(-2deg);
            }
          }
          
          .balloon:hover .balloon-body {
            transform: scale(1.1) !important;
          }
          
          .balloon-popped .balloon-body {
            transform: scale(0) !important;
          }
        `
      }} />
    </div>
  );
};
