import React from "react";
import { Button } from "@/components/ui/button";
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
  Dna
} from "lucide-react";

interface FooterProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ activeView, onViewChange }) => {
  const navigationItems = [
    { id: "garten", label: "Garten", icon: Flower },
    { id: "teich", label: "Teich", icon: Waves },
    { id: "markt", label: "Markt", icon: Store },
    { id: "inventar", label: "Inventar", icon: Package },
    { id: "dna", label: "DNA", icon: Dna },
    { id: "bouquets", label: "Bouquets", icon: Flower2 },
    { id: "flowerpower", label: "Flowerpower", icon: Zap },
    { id: "ausstellung", label: "Ausstellung", icon: Trophy },
    { id: "aquarium", label: "Aquarium", icon: Fish },
    { id: "marie-slot", label: "Marie-Slot", icon: Coins },
  ];

  return (
    <footer className="bg-slate-900 border-t border-slate-700 px-2 sm:px-6 py-2 sm:py-4 flex-shrink-0 safe-area-bottom">
      <div className="flex justify-center">
        <div className="flex space-x-1 sm:space-x-2 w-full max-w-md justify-between sm:justify-center">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange(item.id)}
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
