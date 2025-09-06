import React from "react";
import { Button } from "@/components/ui/button";

interface FooterProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ activeView, onViewChange }) => {
  const navigationItems = [
    { id: "garten", label: "Garten", emoji: "🌻" },
    { id: "teich", label: "Teich", emoji: "🌊" },
    { id: "markt", label: "Markt", emoji: "🏪" },
    { id: "inventar", label: "Inventar", emoji: "📦" },
    { id: "bouquets", label: "Bouquets", emoji: "💐" },
    { id: "flowerpower", label: "Flowerpower", emoji: "⚡" },
    { id: "ausstellung", label: "Ausstellung", emoji: "🏆" },
    { id: "aquarium", label: "Aquarium", emoji: "🐠" },
    { id: "marie-slot", label: "Marie-Slot", emoji: "🪙" },
  ];

  return (
    <footer className="bg-slate-900 border-t border-slate-700 px-2 sm:px-6 py-2 sm:py-4 flex-shrink-0 safe-area-bottom">
      <div className="flex justify-center">
        <div className="flex space-x-1 sm:space-x-2 w-full max-w-md justify-between sm:justify-center">
          {navigationItems.map((item) => {
            const isActive = activeView === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 px-2 sm:px-4 py-2 touch-target ${
                  isActive 
                    ? "bg-orange-600 hover:bg-orange-700 text-white" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                } flex-1 sm:flex-none`}
              >
                <span className="text-lg">{item.emoji}</span>
                <span className="text-xs sm:text-sm">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </footer>
  );
};
