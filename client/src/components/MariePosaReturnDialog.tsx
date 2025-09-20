import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Clock, Calendar, Sparkles } from 'lucide-react';

interface MariePosaReturnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  nextAvailableAt: Date;
}

export default function MariePosaReturnDialog({ isOpen, onClose, nextAvailableAt }: MariePosaReturnDialogProps) {
  const timeLeft = nextAvailableAt.getTime() - Date.now();
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  
  const formattedTime = nextAvailableAt.toLocaleTimeString('de-DE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-amber-900/20 to-yellow-900/20 border-2 border-yellow-500/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold text-yellow-200">
            <Crown className="h-6 w-6 mr-3 text-yellow-400" />
            👑 Marie Posa
          </DialogTitle>
          <DialogDescription className="text-yellow-300/80">
            Die exklusive Händlerin ist momentan nicht verfügbar
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Status */}
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-yellow-200 mb-2">
              Marie ist auf Handelsreise
            </h3>
            <p className="text-yellow-300/80 text-sm">
              Sie durchsucht die Welt nach wertvollen Schätzen und kehrt bald zurück!
            </p>
          </div>

          {/* Countdown */}
          <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-4">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-yellow-200">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Rückkehr in:</span>
              </div>
              
              <div className="text-2xl font-bold text-yellow-300">
                {hours > 0 && (
                  <span>{hours}h </span>
                )}
                {minutes}min
              </div>
              
              <div className="flex items-center justify-center gap-2 text-yellow-400/80 text-sm">
                <Calendar className="h-3 w-3" />
                <span>Verfügbar um {formattedTime}</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="text-center text-yellow-300/70 text-sm">
            Marie Posa ist alle 3 Stunden verfügbar und bietet dir 50% des Marktwertes für deine wertvollen Items.
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-2">
          <Button 
            onClick={onClose}
            className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium px-6"
          >
            Verstanden
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}