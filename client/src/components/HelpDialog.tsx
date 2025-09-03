import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Flower, 
  Bug, 
  Coins, 
  Sun, 
  Gem, 
  Heart, 
  Star, 
  Sparkles, 
  Package, 
  ShoppingCart, 
  Sprout,
  Trophy,
  Gift,
  Zap,
  Clock,
  X
} from 'lucide-react';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpDialog: React.FC<HelpDialogProps> = ({ isOpen, onClose }) => {
  const rarityColors = {
    common: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    uncommon: 'bg-green-500/20 text-green-300 border-green-500/30',
    rare: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'super-rare': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    epic: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    legendary: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    mythical: 'bg-red-500/20 text-red-300 border-red-500/30'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="
        bg-gradient-to-br from-slate-800 to-slate-900 
        border-2 border-blue-500/30 
        text-white 
        max-w-4xl 
        max-h-[80vh]
        shadow-2xl
        p-0
      ">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-600/30">
          <DialogTitle className="flex items-center text-2xl font-bold text-blue-300">
            <Sparkles className="h-8 w-8 mr-3 text-blue-400" />
            🌸 Mariposa - Spielanleitung
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] px-6">
          <div className="space-y-8 py-4">
            
            {/* Einführung */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-blue-300 flex items-center">
                <Flower className="h-6 w-6 mr-2" />
                🌻 Willkommen in Mariposa!
              </h2>
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                <p className="text-slate-300 leading-relaxed">
                  Mariposa ist ein bezauberndes Garten-Spiel, in dem du Blumen anbaust, Schmetterlinge sammelst 
                  und wunderschöne Bouquets erstellst. Entdecke seltene Arten, handle mit anderen Spielern 
                  und erschaffe deine eigene Schmetterlings-Ausstellung!
                </p>
              </div>
            </section>

            {/* Ressourcen System */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-yellow-300 flex items-center">
                <Coins className="h-6 w-6 mr-2" />
                💰 Ressourcen System
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-300 flex items-center mb-2">
                    <Coins className="h-5 w-5 mr-2" />
                    Credits (Cr)
                  </h3>
                  <p className="text-slate-300 text-sm">
                    Hauptwährung zum Freischalten von Feldern, Kaufen von Samen und Handeln. 
                    Erhalte Credits durch passive Einkommen aus deiner Schmetterlings-Ausstellung.
                  </p>
                </div>
                <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-300 flex items-center mb-2">
                    <Sun className="h-5 w-5 mr-2" />
                    Sonnen (☀️)
                  </h3>
                  <p className="text-slate-300 text-sm">
                    Besondere Ressource für Premium-Samen. Spawnt zufällig auf inaktiven Feldern 
                    und kann verkauft werden für Credits oder Schmetterlinge.
                  </p>
                </div>
              </div>
            </section>

            {/* Garten System */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-green-300 flex items-center">
                <Sprout className="h-6 w-6 mr-2" />
                🌱 Garten & Anbau
              </h2>
              <div className="space-y-4">
                <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                  <h3 className="font-semibold text-green-300 mb-2">Felder freischalten</h3>
                  <p className="text-slate-300 text-sm mb-2">
                    Starte mit 4 freien Feldern. Schalte angrenzende Felder für steigende Credits-Kosten frei.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-green-300 border-green-500/30">Feld 1-4: 50 Cr</Badge>
                    <Badge variant="outline" className="text-green-300 border-green-500/30">Feld 5-8: 100 Cr</Badge>
                    <Badge variant="outline" className="text-green-300 border-green-500/30">und so weiter...</Badge>
                  </div>
                </div>
                
                <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                  <h3 className="font-semibold text-green-300 mb-2">Samen pflanzen</h3>
                  <p className="text-slate-300 text-sm">
                    Klicke auf ein freies Feld → Wähle einen Samen → Die Blume wächst automatisch! 
                    Wachstumszeit hängt von der Seltenheit ab (75s bis 10 Minuten).
                  </p>
                </div>
              </div>
            </section>

            {/* Seltenheitssystem */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-purple-300 flex items-center">
                <Star className="h-6 w-6 mr-2" />
                ⭐ Seltenheitssystem
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(rarityColors).map(([rarity, classes]) => (
                  <div key={rarity} className={`border rounded-lg p-3 ${classes}`}>
                    <div className="text-center">
                      <div className="font-semibold text-sm capitalize mb-1">
                        {rarity === 'super-rare' ? 'Super-Rare' : rarity}
                      </div>
                      <div className="text-xs opacity-80">
                        {rarity === 'common' ? '45%' : 
                         rarity === 'uncommon' ? '30%' :
                         rarity === 'rare' ? '15%' :
                         rarity === 'super-rare' ? '7%' :
                         rarity === 'epic' ? '2.5%' :
                         rarity === 'legendary' ? '0.4%' : '0.1%'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
                <p className="text-slate-300 text-sm">
                  Je seltener die Samen/Blumen, desto länger die Wachstumszeit, aber auch desto wertvoller! 
                  Mythische Blumen sind extrem selten und sehr begehrt.
                </p>
              </div>
            </section>

            {/* Bouquets */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-pink-300 flex items-center">
                <Heart className="h-6 w-6 mr-2" />
                💐 Bouquets & Schmetterlinge
              </h2>
              <div className="space-y-4">
                <div className="bg-pink-900/30 border border-pink-500/30 rounded-lg p-4">
                  <h3 className="font-semibold text-pink-300 mb-2">Bouquets erstellen</h3>
                  <p className="text-slate-300 text-sm mb-2">
                    Kombiniere 3 verschiedene Blumen zu einem Bouquet! Die Seltenheit wird automatisch 
                    aus den verwendeten Blumen berechnet.
                  </p>
                  <Badge variant="outline" className="text-pink-300 border-pink-500/30">
                    Beispiel: 2 Common + 1 Rare = Uncommon Bouquet
                  </Badge>
                </div>
                
                <div className="bg-pink-900/30 border border-pink-500/30 rounded-lg p-4">
                  <h3 className="font-semibold text-pink-300 mb-2">Schmetterlinge anlocken</h3>
                  <p className="text-slate-300 text-sm">
                    Platziere Bouquets auf Felder → Schmetterlinge spawnen automatisch alle paar Minuten! 
                    Sammle sie für deine Ausstellung oder verkaufe sie für Sonnen.
                  </p>
                </div>
              </div>
            </section>

            {/* Markt */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-emerald-300 flex items-center">
                <ShoppingCart className="h-6 w-6 mr-2" />
                🛒 Markt & Handel
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-lg p-4">
                  <h3 className="font-semibold text-emerald-300 mb-2">Server-Shop</h3>
                  <p className="text-slate-300 text-sm">
                    Kaufe garantierte Samen mit Credits oder Sonnen. Immer verfügbar, 
                    aber teurer als Spieler-Handel.
                  </p>
                </div>
                <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-lg p-4">
                  <h3 className="font-semibold text-emerald-300 mb-2">Spieler-Markt</h3>
                  <p className="text-slate-300 text-sm">
                    Erstelle eigene Verkaufsangebote oder kaufe günstige Samen von anderen Spielern.
                  </p>
                </div>
              </div>
            </section>

            {/* Ausstellung */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-indigo-300 flex items-center">
                <Trophy className="h-6 w-6 mr-2" />
                🏆 Schmetterlings-Ausstellung
              </h2>
              <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-300 mb-2">Passives Einkommen</h3>
                <p className="text-slate-300 text-sm mb-3">
                  Platziere Schmetterlinge in deiner Ausstellung um automatisch Credits zu verdienen! 
                  Je mehr und seltener deine Schmetterlinge, desto höher das Einkommen.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Normale Schmetterlinge:</span>
                    <span className="text-green-300">10 Cr/h pro Schmetterling</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">VIP Schmetterlinge:</span>
                    <span className="text-purple-300">30 Cr/h pro Schmetterling</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Flowerpower */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-orange-300 flex items-center">
                <Zap className="h-6 w-6 mr-2" />
                ⚡ Flowerpower Challenge
              </h2>
              <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4">
                <p className="text-slate-300 text-sm">
                  Wöchentliche Community-Challenge! Spende spezielle Blumen und konkurriere 
                  mit anderen Spielern um die Spitzenplätze im Leaderboard.
                </p>
              </div>
            </section>

            {/* Notfall-Hilfe */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-red-300 flex items-center">
                <Gift className="h-6 w-6 mr-2" />
                🆘 Notfall-Hilfe
              </h2>
              <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
                <p className="text-slate-300 text-sm">
                  Festgesteckt ohne Ressourcen? Klicke auf "Notfall" im Inventar! 
                  Mariposa sorgt dafür, dass du nie komplett blockiert bist.
                </p>
              </div>
            </section>

            {/* Tipps */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-cyan-300 flex items-center">
                <Sparkles className="h-6 w-6 mr-2" />
                💡 Profi-Tipps
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-cyan-900/30 border border-cyan-500/30 rounded-lg p-4">
                  <h3 className="font-semibold text-cyan-300 mb-2">💰 Credits sparen</h3>
                  <p className="text-slate-300 text-sm">
                    Schmetterlinge bringen passives Einkommen! Baue erst deine Ausstellung auf, 
                    bevor du teure Felder freischaltest.
                  </p>
                </div>
                <div className="bg-cyan-900/30 border border-cyan-500/30 rounded-lg p-4">
                  <h3 className="font-semibold text-cyan-300 mb-2">🌺 Seltene Blumen</h3>
                  <p className="text-slate-300 text-sm">
                    Seltene Samen sind teuer, aber bringen bessere Bouquets und wertvollere Schmetterlinge. 
                    Investiere klug!
                  </p>
                </div>
                <div className="bg-cyan-900/30 border border-cyan-500/30 rounded-lg p-4">
                  <h3 className="font-semibold text-cyan-300 mb-2">☀️ Sonnen sammeln</h3>
                  <p className="text-slate-300 text-sm">
                    Sonnen spawnen zufällig und sind wertvoll! Sammle sie schnell, 
                    bevor sie wieder verschwinden.
                  </p>
                </div>
                <div className="bg-cyan-900/30 border border-cyan-500/30 rounded-lg p-4">
                  <h3 className="font-semibold text-cyan-300 mb-2">🦋 Timing beachten</h3>
                  <p className="text-slate-300 text-sm">
                    Bouquets haben eine begrenzte Lebensdauer. Sammle Schmetterlinge regelmäßig 
                    und erneuere deine Bouquets rechtzeitig.
                  </p>
                </div>
              </div>
            </section>

          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-600/30 bg-slate-800/50">
          <div className="flex justify-between items-center">
            <div className="text-slate-400 text-sm">
              Viel Spaß beim Gärtnern und Schmetterlinge sammeln! 🌸🦋
            </div>
            <Button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6"
            >
              <X className="h-4 w-4 mr-2" />
              Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};