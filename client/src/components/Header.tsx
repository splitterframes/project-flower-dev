import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { LogOut, User, Coins, Sprout, Flower, Package, Bug, TrendingUp, Users } from "lucide-react";
import { UserListModal } from "./UserListModal";

interface HeaderProps {
  onAuthClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAuthClick }) => {
  const { user, logout } = useAuth();
  const { credits } = useCredits();
  const [inventoryCounts, setInventoryCounts] = useState({
    seeds: 0,
    flowers: 0,
    bouquets: 0,
    butterflies: 0
  });
  const [passiveIncome, setPassiveIncome] = useState(0);
  const [showUserList, setShowUserList] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInventoryCounts();
      fetchPassiveIncome();
    }
  }, [user]);

  // Auto-refresh header data every 10 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchInventoryCounts();
      fetchPassiveIncome();
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, [user]);

  const fetchInventoryCounts = async () => {
    if (!user) return;
    
    try {
      const [seedsRes, flowersRes, bouquetsRes, butterfliesRes] = await Promise.all([
        fetch(`/api/user/${user.id}/seeds`),
        fetch(`/api/user/${user.id}/flowers`),
        fetch(`/api/user/${user.id}/bouquets`),
        fetch(`/api/user/${user.id}/butterflies`)
      ]);

      if (seedsRes.ok && flowersRes.ok && bouquetsRes.ok && butterfliesRes.ok) {
        const seedsData = await seedsRes.json();
        const flowersData = await flowersRes.json();
        const bouquetsData = await bouquetsRes.json();
        const butterfliesData = await butterfliesRes.json();

        const seedsTotal = (seedsData.seeds || []).reduce((sum: number, seed: any) => sum + seed.quantity, 0);
        const flowersTotal = (flowersData.flowers || []).reduce((sum: number, flower: any) => sum + flower.quantity, 0);
        const bouquetsTotal = (bouquetsData.bouquets || []).reduce((sum: number, bouquet: any) => sum + bouquet.quantity, 0);
        const butterfliesTotal = (butterfliesData.butterflies || []).reduce((sum: number, butterfly: any) => sum + butterfly.quantity, 0);

        setInventoryCounts({
          seeds: seedsTotal,
          flowers: flowersTotal,
          bouquets: bouquetsTotal,
          butterflies: butterfliesTotal
        });
      }
    } catch (error) {
      console.error('Failed to fetch inventory counts:', error);
    }
  };

  const fetchPassiveIncome = async () => {
    if (!user) return;
    
    try {
      const butterfliesRes = await fetch(`/api/user/${user.id}/exhibition-butterflies`);
      if (butterfliesRes.ok) {
        const butterfliesData = await butterfliesRes.json();
        
        const hourlyIncome = (butterfliesData.butterflies || []).reduce((total: number, butterfly: any) => {
          switch (butterfly.butterflyRarity) {
            case 'common': return total + 1;
            case 'uncommon': return total + 3;
            case 'rare': return total + 8;
            case 'super-rare': return total + 15;
            case 'epic': return total + 25;
            case 'legendary': return total + 50;
            case 'mythical': return total + 100;
            default: return total + 1;
          }
        }, 0);
        
        setPassiveIncome(hourlyIncome);
      }
    } catch (error) {
      console.error('Failed to fetch passive income:', error);
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo/Title */}
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-white">Mariposa</h1>
        </div>

        {/* Right side - User info or Login button */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Inventory Icons */}
              <div className="flex items-center space-x-3">
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
              </div>

              {/* Passive Income Display */}
              {passiveIncome > 0 && (
                <div className="flex items-center space-x-2 bg-slate-800 px-3 py-2 rounded-lg border border-green-500">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 font-semibold">+{passiveIncome} Cr/h</span>
                </div>
              )}

              {/* Credits Display */}
              <div className="flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-lg border border-orange-500">
                <Coins className="h-5 w-5 text-orange-400" />
                <span className="text-orange-400 font-semibold">{credits} Cr</span>
              </div>
              
              {/* User List Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUserList(true)}
                className="border-cyan-500 text-cyan-300 hover:bg-cyan-800 hover:text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                👥 User
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
      />
    </header>
  );
};
