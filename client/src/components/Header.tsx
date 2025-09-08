import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { useSuns } from "@/lib/stores/useSuns";
import { useDna } from "@/lib/stores/useDna";
import { LogOut, User, Coins, Sprout, Flower, Package, Bug, Fish, TrendingUp, Users, AlertTriangle, Sun, Zap, Ticket, Heart } from "lucide-react";
import { UserListModal } from "./UserListModal";
import { ForeignExhibitionView } from "./ForeignExhibitionView";
import { EmergencyDialog } from "./EmergencyDialog";
import MariePosaButton from "./MariePosaButton";
import { TicketRedemptionDialog } from "./TicketRedemptionDialog";
import { DonateDialog } from "./DonateDialog";

interface HeaderProps {
  onAuthClick: () => void;
  refreshTrigger?: number; // Add refresh trigger prop
}

export const Header: React.FC<HeaderProps> = ({ onAuthClick, refreshTrigger }) => {
  const { user, logout } = useAuth();
  const { credits, setCredits } = useCredits();
  const { suns, setSuns } = useSuns();
  const { dna, setDna } = useDna();
  const [inventoryCounts, setInventoryCounts] = useState({
    seeds: 0,
    flowers: 0,
    bouquets: 0,
    butterflies: 0,
    caterpillars: 0,
    fish: 0
  });
  const [tickets, setTickets] = useState(0);
  const [passiveIncome, setPassiveIncome] = useState(0);
  const [showUserList, setShowUserList] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [foreignExhibition, setForeignExhibition] = useState<{
    ownerId: number;
    ownerName: string;
  } | null>(null);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [showDonateDialog, setShowDonateDialog] = useState(false);
  
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

  const fetchDna = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/user/${user.id}/dna`);
      if (response.ok) {
        const data = await response.json();
        setDna(data.dna);
      }
    } catch (error) {
      console.error('Failed to fetch DNA:', error);
    }
  };

  const fetchTickets = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/user/${user.id}/tickets`);
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCredits();
      fetchSuns();
      fetchDna();
      fetchTickets();
      fetchInventoryCounts();
      fetchPassiveIncome();
    }
  }, [user]);

  // Refresh header when trigger changes (view switching)
  useEffect(() => {
    if (user && refreshTrigger !== undefined) {
      fetchCredits();
      fetchSuns();
      fetchDna();
      fetchTickets();
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
      fetchDna();
      fetchTickets();
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

  // Calculate current Cr/h based on degradation over 72 hours
  const getCurrentCrPerHour = (rarity: string, isVip?: boolean, placedAt?: string): number => {
    if (isVip || rarity === 'vip') {
      // VIP butterflies: 60 Cr/h → 6 Cr/h over 72 hours
      const startValue = 60;
      const minValue = 6;
      return calculateDegradedValue(startValue, minValue, placedAt);
    }

    const rarityValues = {
      'common': { start: 1, min: 1 },       // No degradation for Common
      'uncommon': { start: 2, min: 1 },     // 2 → 1 Cr/h
      'rare': { start: 5, min: 1 },         // 5 → 1 Cr/h  
      'super-rare': { start: 10, min: 1 },  // 10 → 1 Cr/h
      'epic': { start: 20, min: 2 },        // 20 → 2 Cr/h
      'legendary': { start: 50, min: 5 },   // 50 → 5 Cr/h
      'mythical': { start: 100, min: 10 }   // 100 → 10 Cr/h
    };

    const values = rarityValues[rarity as keyof typeof rarityValues] || { start: 1, min: 1 };
    return calculateDegradedValue(values.start, values.min, placedAt);
  };

  // Calculate degraded value over 72 hours
  const calculateDegradedValue = (startValue: number, minValue: number, placedAt?: string): number => {
    if (!placedAt) return startValue;

    const placedTime = new Date(placedAt).getTime();
    const now = new Date().getTime();
    const timeSincePlacement = now - placedTime;
    const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000;

    // If less than 72 hours have passed, calculate degradation
    if (timeSincePlacement < SEVENTY_TWO_HOURS) {
      const degradationProgress = timeSincePlacement / SEVENTY_TWO_HOURS; // 0 to 1
      const valueRange = startValue - minValue;
      const currentValue = startValue - (valueRange * degradationProgress);
      return Math.max(Math.round(currentValue), minValue);
    }

    // After 72 hours, return minimum value
    return minValue;
  };

  const fetchPassiveIncome = async () => {
    if (!user) return;
    
    try {
      // Fetch normal butterflies
      const butterfliesRes = await fetch(`/api/user/${user.id}/exhibition-butterflies`);
      // Fetch VIP butterflies
      const vipButterfliesRes = await fetch(`/api/user/${user.id}/exhibition-vip-butterflies`);
      
      let hourlyIncome = 0;
      
      // Calculate income from normal butterflies with time-based degradation
      if (butterfliesRes.ok) {
        const butterfliesData = await butterfliesRes.json();
        hourlyIncome += (butterfliesData.butterflies || []).reduce((total: number, butterfly: any) => {
          return total + getCurrentCrPerHour(butterfly.butterflyRarity, false, butterfly.placedAt);
        }, 0);
      }
      
      // Calculate income from VIP butterflies with time-based degradation
      if (vipButterfliesRes.ok) {
        const vipButterfliesData = await vipButterfliesRes.json();
        hourlyIncome += (vipButterfliesData.vipButterflies || []).reduce((total: number, vipButterfly: any) => {
          return total + getCurrentCrPerHour('vip', true, vipButterfly.placedAt);
        }, 0);
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
          <h1 className="text-base sm:text-lg md:text-2xl font-bold text-white">Mariposa</h1>
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

              {/* DNA Display - Turquoise style */}
              <div className="flex items-center space-x-2 bg-slate-800 px-2 sm:px-4 py-1 sm:py-2 rounded-lg border border-teal-500">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-teal-400" />
                <span className="text-teal-400 font-semibold text-sm sm:text-base">{dna} 🧬</span>
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

              {/* Tickets Button - Purple style */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTicketDialog(true)}
                className="border-purple-500 text-purple-300 hover:bg-purple-800 hover:text-white shadow-lg shadow-purple-400/20 px-2 sm:px-3"
                title="Lose einlösen"
              >
                <Ticket className="h-4 w-4 sm:mr-2 text-purple-400" />
                <span className="hidden sm:inline font-semibold">{tickets}</span>
                <span className="sm:hidden text-xs">🎫</span>
              </Button>

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

      {/* Ticket Redemption Dialog */}
      <TicketRedemptionDialog
        isOpen={showTicketDialog}
        onClose={() => setShowTicketDialog(false)}
        userTickets={tickets}
        onRedeem={async (itemType: string, cost: number) => {
          try {
            const response = await fetch(`/api/user/${user?.id}/redeem-tickets`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-User-Id': user?.id?.toString() || '1'
              },
              body: JSON.stringify({
                prizeType: itemType,
                cost: cost
              })
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
              // Refresh user data immediately
              fetchTickets();
              fetchCredits();
              fetchSuns();
              fetchDna();
              
              // Multiple attempts to ensure inventory update
              setTimeout(() => {
                fetchInventoryCounts();
              }, 100);
              
              // Force second update after longer delay
              setTimeout(() => {
                fetchInventoryCounts();
                
                // Trigger inventory view refresh
                window.dispatchEvent(new CustomEvent('refreshInventory'));
              }, 500);
              
              return { success: true, message: data.message || "Preis erfolgreich eingelöst!" };
            } else {
              return { success: false, message: data.message || "Fehler beim Einlösen" };
            }
          } catch (error) {
            console.error('Redemption error:', error);
            return { success: false, message: "Fehler beim Einlösen" };
          }
        }}
      />

      {/* Donate Dialog */}
      <DonateDialog
        open={showDonateDialog}
        onOpenChange={setShowDonateDialog}
        recipientName={user?.username || "dem Spieler"}
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
