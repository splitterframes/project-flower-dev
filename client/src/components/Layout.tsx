import React, { useState, useEffect } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AuthModal } from "./AuthModal";
import { Dashboard } from "./Dashboard";
import { GameView } from "./GameView";
import { GardenView } from "./GardenView";
import { MarketView } from "./MarketView";
import { InventoryView } from "./InventoryView";
import { BouquetsView } from "./BouquetsView";
import { ExhibitionView } from "./ExhibitionView";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { Card, CardContent } from "@/components/ui/card";

export const Layout: React.FC = () => {
  const [currentView, setCurrentView] = useState("garten");
  const [showAuthModal, setShowAuthModal] = useState(false);
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
  };

  const handleAuthClick = () => {
    setShowAuthModal(true);
  };

  const renderContent = () => {
    switch (currentView) {
      case "garten":
        return <GardenView />;
      case "markt":
        return <MarketView />;
      case "inventar":
        return <InventoryView />;
      case "bouquets":
        return <BouquetsView />;
      case "ausstellung":
        return <ExhibitionView />;
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
      <Header onAuthClick={handleAuthClick} />
      
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
