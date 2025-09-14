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
import { CastleGardenView } from "./CastleGardenView";
import { VasesView } from "./VasesView";
import { EncyclopediaView } from "./EncyclopediaView";
import { DonateDialog } from "./DonateDialog";
import { ImpressumDialog } from "./ImpressumDialog";
import { DatenschutzDialog } from "./DatenschutzDialog";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { useActivityDetection } from "@/hooks/useActivityDetection";
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
  awardLoot: (type: 'credit' | 'sun' | 'dna' | 'ticket', amount: number, balloonId: string) => void;
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
      awardLoot(lootType, 1, balloon.id);
      
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
      awardLoot('ticket', 1, balloon.id);
      
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
        animation: isPopped ? 'none' : 'balloon-float 8s ease-in-out forwards'
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
  const [showDonateDialog, setShowDonateDialog] = useState(false);
  const [showImpressumDialog, setShowImpressumDialog] = useState(false);
  const [showDatenschutzDialog, setShowDatenschutzDialog] = useState(false);
  const [headerRefreshTrigger, setHeaderRefreshTrigger] = useState(0);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [confettiParticles, setConfettiParticles] = useState<Confetti[]>([]);
  const [lootDrops, setLootDrops] = useState<Loot[]>([]);
  const { user } = useAuth();
  const { setCredits } = useCredits();
  
  // Initialize activity detection for performance optimization
  useActivityDetection();

  // Award loot function with balloon validation
  const awardLoot = async (type: 'credit' | 'sun' | 'dna' | 'ticket', amount: number, balloonId: string) => {
    if (!user || !balloonId) {
      console.error('Missing user or balloon ID for loot collection');
      return;
    }
    
    try {
      console.log(`🎈 Collecting balloon ${balloonId} for ${amount} ${type}(s)`);
      
      const response = await fetch('/api/balloon/collect', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString()
        },
        body: JSON.stringify({ 
          balloonId,
          lootType: type,
          amount 
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error(`Balloon collection failed: ${result.message}`);
        // Still refresh header in case of partial failure
        setHeaderRefreshTrigger(prev => prev + 1);
        return;
      }
      
      if (result.success) {
        console.log(`🎈 SUCCESS: ${result.message}`);
        // Refresh header to show updated values
        setHeaderRefreshTrigger(prev => prev + 1);
      } else {
        console.error(`Balloon collection failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Failed to collect balloon loot:', error);
      // Refresh header anyway in case of network issues
      setHeaderRefreshTrigger(prev => prev + 1);
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

  // Balloon spawning system with proper spawn/pause phases  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Use unique keys to prevent multiple timers
    const spawnTimerKey = 'balloon-spawn-timer';
    const phaseTimerKey = 'balloon-phase-timer';
    
    // Clear any existing timers
    if ((window as any)[spawnTimerKey]) {
      clearInterval((window as any)[spawnTimerKey]);
    }
    if ((window as any)[phaseTimerKey]) {
      clearTimeout((window as any)[phaseTimerKey]);
    }

    const spawnBalloon = () => {
      // Only disable balloons if we're in castle garden AND toggle is disabled
      if (currentView === 'schlossgarten' && (window as any).balloonsDisabledInCastle) {
        return; // Exit early if balloons are disabled in castle garden
      }
      
      // Determine how many balloons to spawn
      const randomChance = Math.random();
      let balloonCount: number;
      
      if (randomChance < 0.85) {
        balloonCount = 1; // 85% chance for 1 balloon
      } else if (randomChance < 0.95) {
        balloonCount = 2; // 10% chance for 2 balloons
      } else {
        balloonCount = 3; // 5% chance for 3 balloons
      }
      
      console.log(`🎈 Spawning ${balloonCount} balloon${balloonCount > 1 ? 's' : ''}`);
      
      const newBalloons: Balloon[] = [];
      
      for (let i = 0; i < balloonCount; i++) {
        const newBalloon: Balloon = {
          id: `balloon-${Date.now()}-${Math.random()}-${i}`,
          x: Math.random() * 90 + 5, // 5% to 95% to avoid edges
          color: balloonColors[Math.floor(Math.random() * balloonColors.length)],
          startTime: Date.now() + (i * 100), // Slight delay to avoid same exact time
          hasCard: Math.random() < 0.3 // 30% chance for a card
        };
        newBalloons.push(newBalloon);
      }
      
      setBalloons(prev => [...prev, ...newBalloons]);

      // Remove balloons after 8 seconds (animation duration)
      newBalloons.forEach(balloon => {
        setTimeout(() => {
          setBalloons(prev => prev.filter(b => b.id !== balloon.id));
        }, 8000);
      });
    };

    const startSpawningPhase = () => {
      console.log('🎈 SPAWN PHASE started (90 seconds)');
      
      // Spawn balloons every 7 seconds (middle of 5-10 seconds)
      (window as any)[spawnTimerKey] = setInterval(spawnBalloon, 7000);
      
      // Stop spawning after 90 seconds and start pause
      (window as any)[phaseTimerKey] = setTimeout(() => {
        if ((window as any)[spawnTimerKey]) {
          clearInterval((window as any)[spawnTimerKey]);
          delete (window as any)[spawnTimerKey];
        }
        startPausePhase();
      }, 90000); // 90 seconds spawn phase
    };

    const startPausePhase = () => {
      console.log('🎈 PAUSE PHASE started (40 seconds)');
      
      // Pause for 40 seconds, then restart spawning
      (window as any)[phaseTimerKey] = setTimeout(() => {
        startSpawningPhase();
      }, 40000); // 40 seconds pause phase
    };

    // Start first spawning phase after 3 seconds
    setTimeout(() => {
      startSpawningPhase();
    }, 3000);

    return () => {
      if ((window as any)[spawnTimerKey]) {
        clearInterval((window as any)[spawnTimerKey]);
        delete (window as any)[spawnTimerKey];
      }
      if ((window as any)[phaseTimerKey]) {
        clearTimeout((window as any)[phaseTimerKey]);
        delete (window as any)[phaseTimerKey];
      }
    };
  }, []); // No dependencies to avoid HMR restarts

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
      case "schlossgarten":
        return <CastleGardenView />;
      case "vasen":
        return <VasesView />;
      case "encyclopedia":
        return <EncyclopediaView />;
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
      
      {/* Legal Footer with Copyright and Donate Button */}
      <div className="bg-slate-950 border-t border-slate-800 px-6 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowImpressumDialog(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Impressum
            </button>
            <button 
              onClick={() => setShowDatenschutzDialog(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Datenschutz
            </button>
            <span>Copyright © Mariposa 2025</span>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => handleViewChange('encyclopedia')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold px-4 py-2 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
            >
              📚 Enzyklopädie
            </button>
            <button 
              onClick={() => setShowDonateDialog(true)}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black font-bold px-6 py-2 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 animate-slow-pulse hover:animate-none"
            >
              ✨ DONATE ✨
            </button>
          </div>
        </div>
      </div>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* Donate Dialog */}
      <DonateDialog
        open={showDonateDialog}
        onOpenChange={setShowDonateDialog}
        recipientName="Mariposa"
      />

      {/* Impressum Dialog */}
      <ImpressumDialog
        open={showImpressumDialog}
        onOpenChange={setShowImpressumDialog}
      />

      {/* Datenschutz Dialog */}
      <DatenschutzDialog
        open={showDatenschutzDialog}
        onOpenChange={setShowDatenschutzDialog}
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
            animationName: `confettiExplosion-${index % 8}`,
            animationDuration: '1s',
            animationTimingFunction: 'ease-out',
            animationFillMode: 'forwards',
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
              transform: translateX(-50%) rotate(-3deg);
            }
            12% {
              transform: translateX(calc(-50% + 35px)) rotate(4deg);
            }
            25% {
              transform: translateX(calc(-50% + 45px)) rotate(2deg);
            }
            37% {
              transform: translateX(calc(-50% + 20px)) rotate(-1deg);
            }
            50% {
              transform: translateX(calc(-50% - 30px)) rotate(-4deg);
            }
            62% {
              transform: translateX(calc(-50% - 40px)) rotate(-2deg);
            }
            75% {
              transform: translateX(calc(-50% + 15px)) rotate(3deg);
            }
            87% {
              transform: translateX(calc(-50% + 25px)) rotate(1deg);
            }
            100% {
              bottom: calc(100vh + 50px);
              transform: translateX(-50%) rotate(-1deg);
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
