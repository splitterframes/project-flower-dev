import React, { useState, useEffect } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AuthModal } from "./AuthModal";
import { Dashboard } from "./Dashboard";
import { GameView } from "./GameView";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { Card, CardContent } from "@/components/ui/card";

export const Layout: React.FC = () => {
  const [currentView, setCurrentView] = useState("dashboard");
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
    if (!user && currentView !== "dashboard") {
      return (
        <div className="flex-1 flex items-center justify-center">
          <Card className="bg-slate-800 border-slate-700 text-white">
            <CardContent className="pt-6">
              <p className="text-center text-slate-400">Please log in to access this feature</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    switch (currentView) {
      case "dashboard":
        return <Dashboard onViewChange={handleViewChange} />;
      case "game":
        return <GameView />;
      case "leaderboard":
        return (
          <div className="flex-1 flex items-center justify-center">
            <Card className="bg-slate-800 border-slate-700 text-white">
              <CardContent className="pt-6">
                <p className="text-center text-slate-400">Leaderboard coming soon!</p>
              </CardContent>
            </Card>
          </div>
        );
      case "profile":
        return (
          <div className="flex-1 flex items-center justify-center">
            <Card className="bg-slate-800 border-slate-700 text-white">
              <CardContent className="pt-6">
                <p className="text-center text-slate-400">Profile management coming soon!</p>
              </CardContent>
            </Card>
          </div>
        );
      case "settings":
        return (
          <div className="flex-1 flex items-center justify-center">
            <Card className="bg-slate-800 border-slate-700 text-white">
              <CardContent className="pt-6">
                <p className="text-center text-slate-400">Settings panel coming soon!</p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return <Dashboard onViewChange={handleViewChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header onAuthClick={handleAuthClick} />
      
      <main className="flex-1 overflow-auto">
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
