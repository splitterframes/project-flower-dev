import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/stores/useAuth";
import { Badge } from "@/components/ui/badge";
import { 
  Flower,
  Package,
  Flower2,
  Trophy,
  Store,
  Zap,
  Waves,
  Fish,
  Coins,
  Dna,
  Castle,
  Lock
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface FooterProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ activeView, onViewChange }) => {
  const { user } = useAuth();
  const [unlockedFeatures, setUnlockedFeatures] = useState<string[]>([]);
  const [userCredits, setUserCredits] = useState(0);

  // Feature costs
  const featureCosts: { [key: string]: number } = {
    'marie-slot': 1000,
    'dna': 3500,
    'schlossgarten': 8000
  };

  // Get unlocked features and user credits
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        // Get unlocked features
        const unlockedResponse = await fetch(`/api/user/${user.id}/unlocked-features`);
        if (unlockedResponse.ok) {
          const { unlockedFeatures: features } = await unlockedResponse.json();
          setUnlockedFeatures(features);
        }

        // Get user credits
        const creditsResponse = await fetch(`/api/user/${user.id}/credits`);
        if (creditsResponse.ok) {
          const { credits } = await creditsResponse.json();
          setUserCredits(credits);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchData();
  }, [user?.id]);

  const unlockFeature = async (featureName: string) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/user/${user.id}/unlock-feature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureName })
      });

      if (response.ok) {
        const result = await response.json();
        setUnlockedFeatures(prev => [...prev, featureName]);
        setUserCredits(result.newCredits);
        console.log(`🔓 Feature ${featureName} unlocked!`);
      } else {
        const error = await response.json();
        console.error('Failed to unlock feature:', error.error);
      }
    } catch (error) {
      console.error('Failed to unlock feature:', error);
    }
  };

  const isFeatureLocked = (featureId: string) => {
    return featureCosts[featureId] && !unlockedFeatures.includes(featureId);
  };

  const canAffordFeature = (featureId: string) => {
    const cost = featureCosts[featureId];
    return cost && userCredits >= cost;
  };

  const handleItemClick = (item: any) => {
    if (isFeatureLocked(item.id)) {
      return; // Don't navigate, show unlock dialog instead
    }
    onViewChange(item.id);
  };

  const navigationItems = [
    { id: "garten", label: "Garten", icon: Flower },
    { id: "teich", label: "Teich", icon: Waves },
    { id: "markt", label: "Markt", icon: Store },
    { id: "inventar", label: "Inventar", icon: Package },
    { id: "dna", label: "DNA", icon: Dna, lockable: true },
    { id: "bouquets", label: "Bouquets", icon: Flower2 },
    { id: "flowerpower", label: "Flowerpower", icon: Zap },
    { id: "ausstellung", label: "Ausstellung", icon: Trophy },
    { id: "aquarium", label: "Aquarium", icon: Fish },
    { id: "marie-slot", label: "Marie-Slot", icon: Coins, lockable: true },
    { id: "schlossgarten", label: "Schlossgarten", icon: Castle, lockable: true },
  ];

  return (
    <footer className="bg-slate-900 border-t border-slate-700 px-2 sm:px-6 py-2 sm:py-4 flex-shrink-0 safe-area-bottom">
      <div className="flex justify-center">
        <div className="flex space-x-1 sm:space-x-2 w-full max-w-md justify-between sm:justify-center">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const locked = isFeatureLocked(item.id);
            const canAfford = canAffordFeature(item.id);
            const cost = featureCosts[item.id];
            
            if (locked) {
              return (
                <AlertDialog key={item.id}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 px-2 sm:px-4 py-3 sm:py-2 touch-target min-h-[44px] text-slate-500 hover:text-slate-400 hover:bg-slate-800 flex-1 sm:flex-none relative"
                    >
                      <Lock className="h-3 w-3 absolute -top-1 -right-1" />
                      <Icon className="h-4 w-4 opacity-50" />
                      <span className="text-xs sm:text-sm opacity-50">{item.label}</span>
                      {cost && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {cost.toLocaleString()} Credits
                        </Badge>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        🔒 Feature freischalten: {item.label}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Möchtest du <strong>{item.label}</strong> für <strong>{cost?.toLocaleString()} Credits</strong> freischalten?
                        <br />
                        <br />
                        Deine aktuellen Credits: <strong>{userCredits.toLocaleString()}</strong>
                        {!canAfford && (
                          <p className="text-red-500 font-bold mt-2">
                            ⚠️ Du hast nicht genügend Credits!
                          </p>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => unlockFeature(item.id)}
                        disabled={!canAfford}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        🔓 Freischalten ({cost?.toLocaleString()} Credits)
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              );
            }
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => handleItemClick(item)}
                className={`flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 px-2 sm:px-4 py-3 sm:py-2 touch-target min-h-[44px] ${
                  isActive 
                    ? "bg-orange-600 hover:bg-orange-700 text-white" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                } flex-1 sm:flex-none`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs sm:text-sm">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </footer>
  );
};
