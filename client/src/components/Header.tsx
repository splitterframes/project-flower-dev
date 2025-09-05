import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { useSuns } from "@/lib/stores/useSuns";
import { LogOut, User, Coins, Sprout, Flower, Package, Bug, Fish, TrendingUp, Users, AlertTriangle, Sun, HelpCircle } from "lucide-react";
import { UserListModal } from "./UserListModal";
import { ForeignExhibitionView } from "./ForeignExhibitionView";
import { EmergencyDialog } from "./EmergencyDialog";
import { HelpDialog } from "./HelpDialog";
import MariePosaButton from "./MariePosaButton";

interface HeaderProps {
  onAuthClick: () => void;
  refreshTrigger?: number; // Add refresh trigger prop
}

export const Header: React.FC<HeaderProps> = ({ onAuthClick, refreshTrigger }) => {
  const { user, logout } = useAuth();
  const { credits, setCredits } = useCredits();
  const { suns, setSuns } = useSuns();
  const [inventoryCounts, setInventoryCounts] = useState({
    seeds: 0,
    flowers: 0,
    bouquets: 0,
    butterflies: 0,
    caterpillars: 0,
    fish: 0
  });
  const [passiveIncome, setPassiveIncome] = useState(0);
  const [showUserList, setShowUserList] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [foreignExhibition, setForeignExhibition] = useState<{
    ownerId: number;
    ownerName: string;
  } | null>(null);
  
  const handleVisitExhibition = (userId: number, username: string) => {
    setForeignExhibition({ ownerId: userId, ownerName: username });
  };
  
  const handleBackFromForeign = () => {
    setForeignExhibition(null);
  };

  const handleEmergencySeedsReceived = () => {
    // Refresh inventory counts after receiving emergency seeds
    fetchInventoryCounts();
  };

  const fetchCredits = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/user/${user.id}/credits`);
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  };

  const fetchSuns = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/user/${user.id}/suns`);
      if (response.ok) {
        const data = await response.json();
        setSuns(data.suns);
      }
    } catch (error) {
      console.error('Failed to fetch suns:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCredits();
      fetchSuns();
      fetchInventoryCounts();
      fetchPassiveIncome();
    }
  }, [user]);

  // Refresh header when trigger changes (view switching)
  useEffect(() => {
    if (user && refreshTrigger !== undefined) {
      fetchCredits();
      fetchSuns();
      fetchInventoryCounts();
      fetchPassiveIncome();
    }
  }, [refreshTrigger]);

  // Auto-refresh header data every 10 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchCredits();
      fetchSuns();
      fetchInventoryCounts();
      fetchPassiveIncome();
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, [user]);

  const fetchInventoryCounts = async () => {
    if (!user) return;
    
    try {
      const [seedsRes, flowersRes, bouquetsRes, butterfliesRes, caterpillarsRes, fishRes] = await Promise.all([
        fetch(`/api/user/${user.id}/seeds`),
        fetch(`/api/user/${user.id}/flowers`),
        fetch(`/api/user/${user.id}/bouquets`),
        fetch(`/api/user/${user.id}/butterflies`),
        fetch(`/api/user/${user.id}/caterpillars`),
        fetch(`/api/user/${user.id}/fish`)
      ]);

      if (seedsRes.ok && flowersRes.ok && bouquetsRes.ok && butterfliesRes.ok && caterpillarsRes.ok && fishRes.ok) {
        const seedsData = await seedsRes.json();
        const flowersData = await flowersRes.json();
        const bouquetsData = await bouquetsRes.json();
        const butterfliesData = await butterfliesRes.json();
        const caterpillarsData = await caterpillarsRes.json();
        const fishData = await fishRes.json();

        const seedsTotal = (seedsData.seeds || []).reduce((sum: number, seed: any) => sum + seed.quantity, 0);
        const flowersTotal = (flowersData.flowers || []).reduce((sum: number, flower: any) => sum + flower.quantity, 0);
        const bouquetsTotal = (bouquetsData.bouquets || []).reduce((sum: number, bouquet: any) => sum + bouquet.quantity, 0);
        const butterfliesTotal = (butterfliesData.butterflies || []).reduce((sum: number, butterfly: any) => sum + butterfly.quantity, 0);
        const caterpillarsTotal = (caterpillarsData.caterpillars || []).length;
        const fishTotal = (fishData.fish || []).length;

        setInventoryCounts({
          seeds: seedsTotal,
          flowers: flowersTotal,
          bouquets: bouquetsTotal,
          butterflies: butterfliesTotal,
          caterpillars: caterpillarsTotal,
          fish: fishTotal
        });
      }
    } catch (error) {
      console.error('Failed to fetch inventory counts:', error);
    }
  };

  const fetchPassiveIncome = async () => {
    if (!user) return;
    
    try {
      // Fetch normal butterflies
      const butterfliesRes = await fetch(`/api/user/${user.id}/exhibition-butterflies`);
      // Fetch VIP butterflies
      const vipButterfliesRes = await fetch(`/api/user/${user.id}/exhibition-vip-butterflies`);
      
      let hourlyIncome = 0;
      
      // Calculate income from normal butterflies
      if (butterfliesRes.ok) {
        const butterfliesData = await butterfliesRes.json();
        hourlyIncome += (butterfliesData.butterflies || []).reduce((total: number, butterfly: any) => {
          switch (butterfly.butterflyRarity) {
            case 'common': return total + 1;
            case 'uncommon': return total + 2;
            case 'rare': return total + 5;
            case 'super-rare': return total + 10;
            case 'epic': return total + 20;
            case 'legendary': return total + 50;
            case 'mythical': return total + 100;
            default: return total + 1;
          }
        }, 0);
      }
      
      // Calculate income from VIP butterflies (60 credits/hour each)
      if (vipButterfliesRes.ok) {
        const vipButterfliesData = await vipButterfliesRes.json();
        const vipCount = (vipButterfliesData.vipButterflies || []).length;
        hourlyIncome += vipCount * 60; // Each VIP = 60 credits/hour
      }
      
      setPassiveIncome(hourlyIncome);
    } catch (error) {
      console.error('Failed to fetch passive income:', error);
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-2 sm:px-6 py-2 sm:py-4 safe-area-top">
      <div className="flex items-center justify-between">
        {/* Logo/Title */}
        <div className="flex items-center">
          <h1 className="text-lg sm:text-2xl font-bold text-white">Mariposa</h1>
        </div>

        {/* Right side - User info or Login button */}
        <div className="flex items-center space-x-1 sm:space-x-4">
          {user ? (
            <>
              {/* Inventory Icons - Hidden on very small screens */}
              <div className="hidden md:flex items-center space-x-3">
                <div className="flex items-center space-x-1 text-slate-300">
                  <Sprout className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium">{inventoryCounts.seeds}</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-300">
                  <Flower className="h-4 w-4 text-pink-400" />
                  <span className="text-sm font-medium">{inventoryCounts.flowers}</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-300">
                  <Package className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium">{inventoryCounts.bouquets}</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-300">
                  <Bug className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium">{inventoryCounts.butterflies}</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-300">
                  <Bug className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">{inventoryCounts.caterpillars}</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-300">
                  <Fish className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium">{inventoryCounts.fish}</span>
                </div>
              </div>
              
              {/* Suns Display - Gold style like credits */}
              <div className="flex items-center space-x-2 bg-slate-800 px-2 sm:px-4 py-1 sm:py-2 rounded-lg border border-yellow-500">
                <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                <span className="text-yellow-400 font-semibold text-sm sm:text-base">{suns} ☀️</span>
              </div>

              {/* Passive Income Display */}
              {passiveIncome > 0 && (
                <div className="hidden sm:flex items-center space-x-2 bg-slate-800 px-3 py-2 rounded-lg border border-green-500">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 font-semibold">+{passiveIncome} Cr/h</span>
                </div>
              )}

              {/* Credits Display - Always visible but smaller on mobile */}
              <div className="flex items-center space-x-2 bg-slate-800 px-2 sm:px-4 py-1 sm:py-2 rounded-lg border border-orange-500">
                <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
                <span className="text-orange-400 font-semibold text-sm sm:text-base">{credits} Cr</span>
              </div>
              
              {/* Marie Posa Button - Smaller on mobile */}
              <MariePosaButton userId={user.id} />

              {/* User List Button - Smaller on mobile */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUserList(true)}
                className="border-cyan-500 text-cyan-300 hover:bg-cyan-800 hover:text-white px-2 sm:px-3"
              >
                <Users className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">👥 User</span>
              </Button>
              
              {/* User Info */}
              <div className="flex items-center space-x-2 text-slate-300">
                <User className="h-5 w-5" />
                <span>{user.username}</span>
              </div>
              
              {/* Help Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHelpDialog(true)}
                className="border-blue-500 text-blue-300 hover:bg-blue-800 hover:text-white px-2 sm:px-3"
                title="Spielanleitung"
              >
                <HelpCircle className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Hilfe</span>
              </Button>
              
              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <Button
              onClick={onAuthClick}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Login / Register
            </Button>
          )}
        </div>
      </div>
      
      {/* User List Modal */}
      <UserListModal 
        isOpen={showUserList} 
        onClose={() => setShowUserList(false)}
        onVisitExhibition={handleVisitExhibition}
      />
      
      {/* Emergency Dialog */}
      <EmergencyDialog
        isOpen={showEmergencyDialog}
        onClose={() => setShowEmergencyDialog(false)}
        onSeedsReceived={handleEmergencySeedsReceived}
      />
      
      {/* Help Dialog */}
      <HelpDialog
        isOpen={showHelpDialog}
        onClose={() => setShowHelpDialog(false)}
      />

      {/* Foreign Exhibition Modal/View */}
      {foreignExhibition && (
        <div className="fixed inset-0 z-50 bg-black/80">
          <ForeignExhibitionView
            ownerId={foreignExhibition.ownerId}
            ownerName={foreignExhibition.ownerName}
            onBack={handleBackFromForeign}
          />
        </div>
      )}
    </header>
  );
};
