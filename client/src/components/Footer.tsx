import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Flower,
  Package,
  Flower2,
  Trophy
} from "lucide-react";

interface FooterProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ activeView, onViewChange }) => {
  const navigationItems = [
    { id: "garten", label: "Garten", icon: Flower },
    { id: "inventar", label: "Inventar", icon: Package },
    { id: "bouquets", label: "Bouquets", icon: Flower2 },
    { id: "ausstellung", label: "Ausstellung", icon: Trophy },
  ];

  return (
    <footer className="bg-slate-900 border-t border-slate-700 px-6 py-4 flex-shrink-0">
      <div className="flex justify-center">
        <div className="flex space-x-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 ${
                  isActive 
                    ? "bg-orange-600 hover:bg-orange-700 text-white" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </footer>
  );
};
