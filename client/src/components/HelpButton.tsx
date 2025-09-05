import React from 'react';
import { HelpCircle, Info } from 'lucide-react';

interface HelpButtonProps {
  helpText: string;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ helpText }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="ml-3 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-medium rounded-full shadow-lg border border-orange-400/50 transition-all duration-200 animate-pulse hover:animate-none flex items-center gap-1.5"
        title={helpText}
      >
        <Info className="h-4 w-4" />
        <span className="hidden sm:inline">Das machst du hier...</span>
        
        {/* Leucht-Effekt */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/40 to-orange-600/40 rounded-full blur-md -z-10 animate-pulse"></div>
      </button>
      
      {/* Tooltip für mobile Geräte */}
      {showTooltip && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl border border-slate-600 max-w-xs z-50">
          {helpText}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-slate-800"></div>
        </div>
      )}
    </div>
  );
};