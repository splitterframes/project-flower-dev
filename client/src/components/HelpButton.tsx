import React from 'react';
import { HelpCircle, Info } from 'lucide-react';
import { HelpDialog } from './HelpDialog';

interface HelpButtonProps {
  helpText: string;
  viewType: 'garden' | 'pond' | 'market' | 'inventory' | 'bouquets' | 'aquarium' | 'flowerpower' | 'exhibition' | 'marie-slot';
}

export const HelpButton: React.FC<HelpButtonProps> = ({ helpText, viewType }) => {
  const [showDialog, setShowDialog] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-medium rounded-full shadow-lg border border-orange-400/50 transition-all duration-300 hover:scale-105 flex items-center gap-1.5 relative"
        title="Ausführliche Hilfe für diesen Bereich öffnen"
      >
        <Info className="h-4 w-4" />
        <span className="hidden sm:inline">Das machst du hier...</span>
        
        {/* Sanfter Leucht-Effekt - wie Marie-Posa Button */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 to-orange-600/30 rounded-full blur-sm -z-10 animate-pulse" style={{animationDuration: '2s'}}></div>
      </button>
      
      <HelpDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        viewType={viewType}
      />
    </>
  );
};