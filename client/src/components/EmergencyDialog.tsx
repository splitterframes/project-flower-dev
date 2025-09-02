import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { AlertTriangle, Sparkles, Sprout } from "lucide-react";

interface EmergencyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSeedsReceived: () => void;
}

export const EmergencyDialog: React.FC<EmergencyDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSeedsReceived 
}) => {
  const { user } = useAuth();
  const { credits } = useCredits();
  const [isLoading, setIsLoading] = useState(false);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [eligibilityReason, setEligibilityReason] = useState<string>("");

  const checkEligibility = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/user/${user.id}/emergency-seeds`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        }
      });
      
      if (response.ok) {
        setIsEligible(true);
      } else {
        const error = await response.json();
        setIsEligible(false);
        setEligibilityReason(error.message || "Du bist nicht berechtigt für Notfall-Samen");
      }
    } catch (error) {
      setIsEligible(false);
      setEligibilityReason("Fehler beim Prüfen der Berechtigung");
    }
  };

  const requestEmergencySeeds = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/${user.id}/emergency-seeds`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Check if SOS was activated
        if (data.sosActivated) {
          alert(`🆘 ${data.message}`);
        } else {
          alert(data.message || "Du hast 3 Notfall-Samen erhalten! 🌱");
        }
        
        onSeedsReceived();
        onClose(); // Always close dialog on success
      } else {
        const error = await response.json();
        alert(error.message || "Fehler beim Empfangen der Notfall-Samen");
      }
    } catch (error) {
      alert("Fehler beim Empfangen der Notfall-Samen");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && user) {
      checkEligibility();
    }
  }, [isOpen, user]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-red-500/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl font-bold text-red-300">
            <AlertTriangle className="h-8 w-8 mr-3 text-red-400 animate-pulse" />
            🚨 Notfall-Hilfe
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
            <h3 className="font-bold text-red-300 mb-2">
              🆘 Feststecken vermeiden
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Mariposa sorgt dafür, dass kein Spieler jemals feststeckt! 
              Wenn du keine Ressourcen mehr hast, können wir dir helfen.
            </p>
          </div>

          {isEligible === null && (
            <div className="text-center py-4">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-slate-400">Prüfe deine Berechtigung...</p>
            </div>
          )}

          {isEligible === true && (
            <div className="space-y-4">
              <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                <h3 className="font-bold text-green-300 mb-2 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  🎁 Du bist berechtigt!
                </h3>
                <p className="text-slate-300 text-sm mb-3">
                  Du erfüllst alle Voraussetzungen für Notfall-Samen:
                </p>
                <ul className="text-slate-400 text-xs space-y-1">
                  <li>✅ Keine Credits verfügbar</li>
                  <li>✅ Keine Samen im Inventar</li>
                  <li>✅ Weniger als 3 Blumen</li>
                  <li>✅ Keine Bouquets</li>
                  <li>✅ Kein passives Einkommen</li>
                </ul>
              </div>

              <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-4">
                <h4 className="font-bold text-yellow-300 mb-2 flex items-center">
                  <Sprout className="h-5 w-5 mr-2" />
                  🌱 Notfall-Paket
                </h4>
                <p className="text-slate-300 text-sm">
                  Du erhältst <strong className="text-yellow-300">3 gewöhnliche Samen</strong> kostenlos, 
                  um wieder ins Spiel einsteigen zu können!
                </p>
              </div>

              <Button
                onClick={requestEmergencySeeds}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 text-lg"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Empfange Samen...
                  </div>
                ) : (
                  "🎁 3 Notfall-Samen empfangen"
                )}
              </Button>
            </div>
          )}

          {isEligible === false && (
            <div className="space-y-4">
              <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4">
                <h3 className="font-bold text-orange-300 mb-2">
                  ℹ️ Nicht berechtigt
                </h3>
                <p className="text-slate-300 text-sm mb-2">
                  {eligibilityReason}
                </p>
                <p className="text-slate-400 text-xs">
                  Notfall-Samen sind nur verfügbar wenn du komplett ohne Ressourcen bist.
                </p>
              </div>

              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                <h4 className="font-bold text-blue-300 mb-2">
                  💡 Alternativen
                </h4>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>🏪 Kaufe Samen im Mariposa Shop (50 Cr/Stück)</li>
                  <li>🦋 Nutze passives Einkommen aus der Ausstellung</li>
                  <li>🌱 Verwende vorhandene Samen oder Blumen</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-slate-500 text-slate-300 hover:border-slate-400"
            >
              Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};