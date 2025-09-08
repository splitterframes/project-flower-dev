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
  hasCard: boolean; // Some balloons have small cards
}

// Confetti interface
interface Confetti {
  id: string;
  x: number;
  y: number;
  color: string;
  delay: number;
}

// Loot interface
interface Loot {
  id: string;
  x: number;
  y: number;
  type: 'credit' | 'sun' | 'dna' | 'ticket';
  amount: number;
}

// Balloon component
const BalloonComponent: React.FC<{ 
  balloon: Balloon; 
  onPop: (id: string) => void;
  setConfettiParticles: React.Dispatch<React.SetStateAction<Confetti[]>>;
  setLootDrops: React.Dispatch<React.SetStateAction<Loot[]>>;
  awardLoot: (type: 'credit' | 'sun' | 'dna', amount: number) => void;
}> = ({ balloon, onPop, setConfettiParticles, setLootDrops, awardLoot }) => {
  const [isPopped, setIsPopped] = useState(false);

  const handleClick = (event: React.MouseEvent) => {
    setIsPopped(true);
    
    // Get exact balloon position from click event
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const balloonCenterX = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
    const balloonCenterY = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
    
    // Create confetti explosion
    const newConfetti: Confetti[] = [];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    
    for (let i = 0; i < 25; i++) {
      newConfetti.push({
        id: `confetti-${balloon.id}-${i}`,
        x: balloonCenterX,
        y: balloonCenterY,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.3
      });
    }
    
    // Add confetti to global state
    setConfettiParticles(prev => [...prev, ...newConfetti]);
    
    // Remove confetti after animation
    setTimeout(() => {
      setConfettiParticles(prev => 
        prev.filter(confetti => !confetti.id.includes(balloon.id))
      );
    }, 1000);
    
    // Loot system for balloons without cards (75% chance)
    if (!balloon.hasCard && Math.random() < 0.75) {
      const lootTypes = ['credit', 'sun', 'dna'] as const;
      const lootType = lootTypes[Math.floor(Math.random() * lootTypes.length)];
      
      const newLoot: Loot = {
        id: `loot-${balloon.id}`,
        x: balloonCenterX,
        y: balloonCenterY,
        type: lootType,
        amount: 1
      };
      
      setLootDrops(prev => [...prev, newLoot]);
      
      // Award the loot
      awardLoot(lootType, 1);
      
      // Remove loot display after 2 seconds
      setTimeout(() => {
        setLootDrops(prev => prev.filter(loot => loot.id !== newLoot.id));
      }, 2000);
    }
    
    // Ticket system for balloons WITH cards (always gives 1 ticket)
    if (balloon.hasCard) {
      const ticketLoot: Loot = {
        id: `ticket-${balloon.id}`,
        x: balloonCenterX,
        y: balloonCenterY,
        type: 'ticket',
        amount: 1
      };
      
      setLootDrops(prev => [...prev, ticketLoot]);
      
      // Award the ticket
      awardLoot('ticket', 1);
      
      // Remove loot display after 2 seconds
      setTimeout(() => {
        setLootDrops(prev => prev.filter(loot => loot.id !== ticketLoot.id));
      }, 2000);
    }
    
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
      {/* Balloon string - BEHIND balloon */}
      <div 
        style={{
          position: 'absolute',
          bottom: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1px',
          height: balloon.hasCard ? '35px' : '20px',
          backgroundColor: '#8B4513',
          opacity: isPopped ? 0 : 1,
          transition: 'opacity 0.15s ease-out'
        }}
      />
      
      {/* Small card hanging from string - BEHIND balloon */}
      {balloon.hasCard && (
        <div 
          style={{
            position: 'absolute',
            bottom: '-40px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '24px',
            height: '18px',
            backgroundColor: '#FFE4E1',
            border: '1px solid #DDD',
            borderRadius: '2px',
            opacity: isPopped ? 0 : 1,
            transition: 'opacity 0.15s ease-out',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            fontSize: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666'
          }}
        >
          🎁
        </div>
      )}

      <div 
        className={`balloon-body ${isPopped ? 'scale-0' : ''} ${
          isPopped ? '' : 
          parseInt(balloon.id.slice(-1)) % 3 === 0 ? 'balloon-wobble' :
          parseInt(balloon.id.slice(-1)) % 3 === 1 ? 'balloon-wobble-2' : 'balloon-wobble-3'
        }`}
        style={{
          width: '50px',
          height: '60px',
          backgroundColor: balloon.color,
          borderRadius: '50% 50% 50% 50% / 35% 35% 65% 65%',
          position: 'relative',
          transition: 'transform 0.15s ease-out',
          boxShadow: `inset -5px -5px 0 rgba(0,0,0,0.1), 
                      0 2px 8px rgba(0,0,0,0.3)`,
          border: '1px solid rgba(255,255,255,0.3)'
        }}
      >
        {/* Balloon highlight */}
        <div 
          style={{
            position: 'absolute',
            top: '8px',
            left: '12px',
            width: '8px',
            height: '12px',
            backgroundColor: 'rgba(255,255,255,0.6)',
            borderRadius: '50% 50% 50% 50% / 35% 35% 65% 65%',
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
  const [confettiParticles, setConfettiParticles] = useState<Confetti[]>([]);
  const [lootDrops, setLootDrops] = useState<Loot[]>([]);
  const { user } = useAuth();
  const { setCredits } = useCredits();

  // Award loot function
  const awardLoot = async (type: 'credit' | 'sun' | 'dna' | 'ticket', amount: number) => {
    if (!user) return;
    
    try {
      if (type === 'credit') {
        await fetch(`/api/user/${user.id}/credits`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount })
        });
      } else if (type === 'sun') {
        await fetch(`/api/user/${user.id}/suns`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount })
        });
      } else if (type === 'dna') {
        await fetch(`/api/user/${user.id}/dna`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount })
        });
      } else if (type === 'ticket') {
        await fetch(`/api/user/${user.id}/tickets`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount })
        });
      }
      
      // Refresh header for all loot types
      setHeaderRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Failed to award loot:', error);
    }
  };

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
        startTime: Date.now(),
        hasCard: Math.random() < 0.3 // 30% chance for a card
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
          setConfettiParticles={setConfettiParticles}
          setLootDrops={setLootDrops}
          awardLoot={awardLoot}
        />
      ))}

      {/* Confetti Particles */}
      {confettiParticles.map((confetti, index) => (
        <div
          key={confetti.id}
          className="confetti-particle"
          style={{
            position: 'fixed',
            left: `${confetti.x}%`,
            top: `${confetti.y}%`,
            width: '8px',
            height: '8px',
            backgroundColor: confetti.color,
            borderRadius: '2px',
            zIndex: 1001,
            animation: `confettiExplosion-${index % 8} 1s ease-out forwards`,
            animationDelay: `${confetti.delay}s`
          }}
        />
      ))}

      {/* Loot Drops */}
      {lootDrops.map((loot) => (
        <div
          key={loot.id}
          className="loot-drop"
          style={{
            position: 'fixed',
            left: `${loot.x}%`,
            top: `${loot.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 1002,
            animation: 'lootPop 2s ease-out forwards',
            backgroundColor: loot.type === 'credit' ? '#FFD700' : loot.type === 'sun' ? '#FFA500' : loot.type === 'dna' ? '#9B59B6' : '#8B5CF6',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '2px solid rgba(255,255,255,0.3)',
            pointerEvents: 'none'
          }}
        >
          {loot.type === 'credit' && '💰'}
          {loot.type === 'sun' && '☀️'}
          {loot.type === 'dna' && '🧬'}
          {loot.type === 'ticket' && '🎫'}
          +{loot.amount}
        </div>
      ))}

      {/* Global CSS for Balloon Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes balloon-float {
            0% {
              bottom: -100px;
              transform: translateX(-50%) rotate(-2deg);
            }
            20% {
              transform: translateX(calc(-50% + 20px)) rotate(2deg);
            }
            40% {
              transform: translateX(calc(-50% - 15px)) rotate(-1deg);
            }
            60% {
              transform: translateX(calc(-50% + 25px)) rotate(3deg);
            }
            80% {
              transform: translateX(calc(-50% - 10px)) rotate(-2deg);
            }
            100% {
              bottom: calc(100vh + 50px);
              transform: translateX(-50%) rotate(1deg);
            }
          }
          
          .balloon:hover .balloon-body {
            transform: scale(1.1) !important;
          }
          
          .balloon-popped .balloon-body {
            transform: scale(0) !important;
          }
          
          @keyframes balloonWobble {
            0%, 100% { transform: translateX(0px) rotate(0deg); }
            25% { transform: translateX(6px) rotate(1.5deg); }
            50% { transform: translateX(-6px) rotate(-1.5deg); }
            75% { transform: translateX(3px) rotate(0.8deg); }
          }
          .balloon-wobble {
            animation: balloonWobble 2.5s ease-in-out infinite;
          }
          .balloon-wobble-2 {
            animation: balloonWobble 3s ease-in-out infinite;
            animation-delay: 0.5s;
          }
          .balloon-wobble-3 {
            animation: balloonWobble 2.8s ease-in-out infinite;
            animation-delay: 1s;
          }
          
          @keyframes confettiExplosion-0 {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
            100% { transform: translate(-60px, -80px) rotate(180deg); opacity: 0; }
          }
          @keyframes confettiExplosion-1 {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
            100% { transform: translate(80px, -60px) rotate(270deg); opacity: 0; }
          }
          @keyframes confettiExplosion-2 {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
            100% { transform: translate(-40px, -100px) rotate(90deg); opacity: 0; }
          }
          @keyframes confettiExplosion-3 {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
            100% { transform: translate(100px, -40px) rotate(360deg); opacity: 0; }
          }
          @keyframes confettiExplosion-4 {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
            100% { transform: translate(-80px, -60px) rotate(180deg); opacity: 0; }
          }
          @keyframes confettiExplosion-5 {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
            100% { transform: translate(60px, -90px) rotate(270deg); opacity: 0; }
          }
          @keyframes confettiExplosion-6 {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
            100% { transform: translate(-100px, -30px) rotate(90deg); opacity: 0; }
          }
          @keyframes confettiExplosion-7 {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
            100% { transform: translate(70px, -70px) rotate(360deg); opacity: 0; }
          }
          
          @keyframes lootPop {
            0% { 
              transform: translate(-50%, -50%) scale(0) rotate(0deg); 
              opacity: 0;
            }
            20% { 
              transform: translate(-50%, -50%) scale(1.2) rotate(5deg); 
              opacity: 1;
            }
            80% { 
              transform: translate(-50%, -50%) scale(1) rotate(-2deg); 
              opacity: 1;
            }
            100% { 
              transform: translate(-50%, -50%) scale(0.8) rotate(0deg); 
              opacity: 0;
            }
          }
        `
      }} />
    </div>
  );
};
