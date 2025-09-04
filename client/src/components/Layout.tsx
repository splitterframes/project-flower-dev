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
import { BouquetsView } from "./BouquetsView";
import { FlowerpowerView } from "./FlowerpowerView";
import { ExhibitionView } from "./ExhibitionView";
import { AquariumView } from "./AquariumView";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { Card, CardContent } from "@/components/ui/card";

export const Layout: React.FC = () => {
  const [currentView, setCurrentView] = useState("garten");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [headerRefreshTrigger, setHeaderRefreshTrigger] = useState(0);
  const { user } = useAuth();
  const { setCredits } = useCredits();

  // Set initial credits when user logs in
  useEffect(() => {
    if (user) {
      setCredits(user.credits);
    }
  }, [user, setCredits]);

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
      case "bouquets":
        return <BouquetsView />;
      case "flowerpower":
        return <FlowerpowerView />;
      case "ausstellung":
        return <ExhibitionView />;
      case "aquarium":
        return <AquariumView />;
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
    </div>
  );
};
