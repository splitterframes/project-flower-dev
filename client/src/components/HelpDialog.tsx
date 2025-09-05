import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  Sprout, Droplets, ShoppingCart, Package, Heart, Fish, Zap,
  Trophy, Coins, Info, Star, Clock, TrendingUp, Users, Target,
  Sparkles, Sun, Flower, Gift, DollarSign, ArrowRight,
  CheckCircle, AlertCircle, HelpCircle
} from 'lucide-react';
import { getRarityColor } from '@shared/rarity';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  viewType: 'garden' | 'pond' | 'market' | 'inventory' | 'bouquets' | 'aquarium' | 'flowerpower' | 'exhibition' | 'marie-slot';
}

export const HelpDialog: React.FC<HelpDialogProps> = ({ isOpen, onClose, viewType }) => {
  const getViewInfo = () => {
    switch (viewType) {
      case 'garden':
        return {
          title: '🌱 Mariposa Garten',
          subtitle: 'Dein Zentrum für Blumenzucht und Bouquet-Erstellung',
          icon: <Sprout className="h-8 w-8 text-green-400" />,
          gradient: 'from-green-500/20 to-emerald-500/20',
          border: 'border-green-400/30',
          sections: [
            {
              title: '🌱 Samen pflanzen',
              icon: <Sprout className="h-6 w-6 text-green-400" />,
              content: [
                'Links-Klick auf ein Feld zum Samen pflanzen',
                'Verschiedene Samen haben unterschiedliche Wachszeiten',
                'Seltene Samen wachsen länger, bringen aber wertvollere Blumen',
                'Du brauchst Credits um neue Felder freizuschalten'
              ]
            },
            {
              title: '🌸 Blumen ernten',
              icon: <Flower className="h-6 w-6 text-pink-400" />,
              content: [
                'Gewachsene Blumen automatisch harvesten durch Anklicken',
                'Jede Blume hat eine Seltenheit (Common bis Mythical)',
                'Seltenheitssystem: Gelb=Common, Grün=Uncommon, Blau=Rare, Türkis=Super-rare, Lila=Epic, Orange=Legendary, Rot=Mythical',
                'Seltene Blumen sind wertvoller für Bouquets',
                'Blumen werden in deinem Inventar gesammelt'
              ]
            },
            {
              title: '💐 Bouquets platzieren',
              icon: <Heart className="h-6 w-6 text-pink-400" />,
              content: [
                'Rechts-Klick auf ein Feld zum Bouquet platzieren',
                'Bouquets locken Schmetterlinge an',
                'Jedes Bouquet spawnt 1-4 Schmetterlinge in 21 Minuten',
                'Bouquet-Qualität beeinflusst Schmetterlings-Seltenheit'
              ]
            },
            {
              title: '☀️ Sonnen sammeln',
              icon: <Sun className="h-6 w-6 text-yellow-400" />,
              content: [
                'Goldene Sonnen spawnen zufällig auf Feldern',
                'Sonnen sind die Premium-Währung des Spiels',
                'Verwende Sonnen für Marie-Posa Handel, Slot Machine und Ausstellung',
                'Sonnen verschwinden nach 30 Sekunden - schnell sammeln!'
              ]
            }
          ],
          tips: [
            'Beginne mit günstigen Samen und arbeite dich hoch',
            'Platziere mehrere Bouquets für mehr Schmetterlinge',
            'Sammle Sonnen sofort - sie verschwinden schnell!',
            'Plane deine Felder strategisch für optimalen Ertrag'
          ]
        };

      case 'pond':
        return {
          title: '🌊 Mariposa Teich',
          subtitle: 'Fütterungsplatz für Schmetterlinge und Raupen-System',
          icon: <Droplets className="h-8 w-8 text-blue-400" />,
          gradient: 'from-blue-500/20 to-cyan-500/20',
          border: 'border-blue-400/30',
          sections: [
            {
              title: '🦋 Schmetterlinge platzieren',
              icon: <Sparkles className="h-6 w-6 text-purple-400" />,
              content: [
                'Platziere Schmetterlinge auf Grasfeldern',
                'Jeder Schmetterling produziert eine Raupe',
                'Produktionszeit abhängig von Schmetterlings-Seltenheit',
                '3 Raupen werden für die Fischzucht benötigt'
              ]
            },
            {
              title: '🐛 Raupen-System',
              icon: <Target className="h-6 w-6 text-green-400" />,
              content: [
                'Sammle Raupen von deinen Schmetterlingen',
                'Jede Raupe hat die gleiche Seltenheit wie der Schmetterling',
                'Strategisch wichtig: 3 Raupen = 1 Fisch',
                'Durchschnittliche Raupe-Seltenheit bestimmt Fisch-Qualität'
              ]
            },
            {
              title: '🐟 Fisch-Zucht System',
              icon: <Fish className="h-6 w-6 text-blue-400" />,
              content: [
                'Füttere 3 Raupen an ein Teichfeld',
                'Fisch-Seltenheit = Durchschnitt der 3 Raupen-Seltenheiten',
                'Beispiel: Common(0) + Rare(2) + Legendary(5) = Rare Fisch',
                'Strategie: Füttere gleichwertige Raupen für vorhersagbare Ergebnisse'
              ]
            },
            {
              title: '⏱️ Timing & Effizienz',
              icon: <Clock className="h-6 w-6 text-orange-400" />,
              content: [
                'Seltene Schmetterlinge brauchen länger für Raupen-Produktion',
                'Plane voraus: 3 Schmetterlinge = 1 kompletter Fisch-Zyklus',
                'Aquarium-Plätze sind begrenzt - wähle die besten Fische'
              ]
            }
          ],
          tips: [
            'Verwende 3 Schmetterlinge gleicher Seltenheit für vorhersagbare Fische',
            'Seltene Schmetterlinge lohnen sich trotz längerer Wartezeit',
            'Plane deine Teich-Felder für kontinuierliche Produktion',
            'Behalte immer genug Raupen für die nächste Fisch-Generation'
          ]
        };

      case 'market':
        return {
          title: '🛒 Samen Markt',
          subtitle: 'Handelszentrum für Samen und Ressourcen',
          icon: <ShoppingCart className="h-8 w-8 text-purple-400" />,
          gradient: 'from-purple-500/20 to-pink-500/20',
          border: 'border-purple-400/30',
          sections: [
            {
              title: '🌱 Samen kaufen',
              icon: <Sprout className="h-6 w-6 text-green-400" />,
              content: [
                'Kaufe Samen von anderen Spielern',
                'Preise variieren basierend auf Seltenheit und Angebot',
                'Seltene Samen sind teurer, bringen aber wertvollere Blumen',
                'Überprüfe Wachszeiten vor dem Kauf'
              ]
            },
            {
              title: '💰 Deine Samen verkaufen',
              icon: <DollarSign className="h-6 w-6 text-yellow-400" />,
              content: [
                'Verkaufe überschüssige Samen für Credits',
                'Setze competitive Preise für schnelleren Verkauf',
                'Seltene Samen erzielen höhere Preise',
                'Markt-Nachfrage schwankt - beobachte Trends'
              ]
            },
            {
              title: '📊 Markt-Analyse',
              icon: <TrendingUp className="h-6 w-6 text-blue-400" />,
              content: [
                'Beobachte Preistrends für optimale Kauf-/Verkaufszeiten',
                'Beliebte Samen haben höhere Nachfrage',
                'Saisonale Schwankungen beeinflussen Preise',
                'Investiere in unterbewertet Samen'
              ]
            },
            {
              title: '💡 Trading-Strategien',
              icon: <Star className="h-6 w-6 text-orange-400" />,
              content: [
                'Kaufe günstig, verkaufe teuer',
                'Bevorre seltene Samen für langfristige Gewinne',
                'Nutze Credits geschickt für Feld-Erweiterungen',
                'Diversifiziere dein Samen-Portfolio'
              ]
            }
          ],
          tips: [
            'Vergleiche Preise vor dem Kauf - Angebote variieren',
            'Verkaufe gewöhnliche Samen günstig für schnellen Umsatz',
            'Investiere früh in seltene Samen für langfristige Gewinne',
            'Behalte immer genug Credits für neue Felder'
          ]
        };

      case 'inventory':
        return {
          title: '🎒 Inventar',
          subtitle: 'Übersicht aller deiner gesammelten Ressourcen',
          icon: <Package className="h-8 w-8 text-slate-400" />,
          gradient: 'from-slate-500/20 to-gray-500/20',
          border: 'border-slate-400/30',
          sections: [
            {
              title: '🌱 Samen-Übersicht',
              icon: <Sprout className="h-6 w-6 text-green-400" />,
              content: [
                'Alle deine Samen nach Seltenheit sortiert',
                'Mengen und Wachszeiten auf einen Blick',
                'Direkter Zugang zum Markt für Verkauf',
                'Farbkodierung nach Seltenheits-System'
              ]
            },
            {
              title: '🌸 Blumen-Sammlung',
              icon: <Flower className="h-6 w-6 text-pink-400" />,
              content: [
                'Komplette Blumen-Kollektion mit Bildern',
                'Seltenheits-Filter für bessere Übersicht',
                'Verwendung für Bouquet-Erstellung',
                'Verkauf an Marie-Posa möglich'
              ]
            },
            {
              title: '🦋 Schmetterlinge & Raupen',
              icon: <Sparkles className="h-6 w-6 text-purple-400" />,
              content: [
                'Alle gefangenen Schmetterlinge verwalten',
                'Raupen-Status und Produktions-Timer',
                'Teich-Platzierung und Ausstellungs-Optionen',
                'Seltenheits-basierte Organisation'
              ]
            },
            {
              title: '🐟 Fische & Aquarium',
              icon: <Fish className="h-6 w-6 text-blue-400" />,
              content: [
                'Gezüchtete Fische und Aquarium-Management',
                'Tank-Platzierung und Verkaufs-Timer',
                'Passive Einkommens-Übersicht',
                'Fisch-Qualität und Wert-Informationen'
              ]
            }
          ],
          tips: [
            'Nutze Filter für schnellere Navigation durch große Sammlungen',
            'Verkaufe doppelte Items regelmäßig für Credits',
            'Behalte seltene Items für strategische Verwendung',
            'Plane Inventar-Platz für neue Sammel-Sessions'
          ]
        };

      case 'bouquets':
        return {
          title: '💐 Bouquet Kollektion',
          subtitle: 'Erstelle wunderschöne Bouquets für Schmetterlinge',
          icon: <Heart className="h-8 w-8 text-pink-400" />,
          gradient: 'from-pink-500/20 to-rose-500/20',
          border: 'border-pink-400/30',
          sections: [
            {
              title: '🌸 Bouquet-Erstellung',
              icon: <Heart className="h-6 w-6 text-pink-400" />,
              content: [
                'Kombiniere 3 Blumen zu einem Bouquet',
                'Bouquet-Seltenheit = Durchschnitt der 3 Blumen',
                'Benenne dein Bouquet individuell',
                'Jedes Bouquet ist ein Unikat'
              ]
            },
            {
              title: '🦋 Schmetterlings-Anziehung',
              icon: <Sparkles className="h-6 w-6 text-purple-400" />,
              content: [
                'Bouquets im Garten platzieren lockt Schmetterlinge an',
                'Alle 21 Minuten spawnen 1-4 Schmetterlinge pro Bouquet',
                'Bouquet-Qualität beeinflusst Schmetterlings-Seltenheit',
                'Seltene Bouquets = seltenere Schmetterlinge'
              ]
            },
            {
              title: '📚 Rezept-System',
              icon: <Star className="h-6 w-6 text-yellow-400" />,
              content: [
                'Deine erstellten Bouquets werden als Rezepte gespeichert',
                'Andere Spieler können deine Rezepte nachbauen',
                'Teile erfolgreiche Kombinationen mit der Community',
                'Experimentiere mit verschiedenen Blumen-Mischungen'
              ]
            },
            {
              title: '💡 Optimierungs-Tipps',
              icon: <TrendingUp className="h-6 w-6 text-green-400" />,
              content: [
                'Verwende Blumen ähnlicher Seltenheit für vorhersagbare Ergebnisse',
                'Plane mehrere Bouquets für kontinuierlichen Schmetterlings-Spawn',
                'Benenne Bouquets beschreibend für einfache Wiedererkennung',
                'Behalte erfolgreiche Rezepte für zukünftige Verwendung'
              ]
            }
          ],
          tips: [
            'Experimentiere mit verschiedenen Blumen-Kombinationen',
            'Seltene Bouquets sind langfristig profitabler',
            'Platziere mehrere Bouquets für maximalen Schmetterlings-Ertrag',
            'Teile erfolgreiche Rezepte mit anderen Spielern'
          ]
        };

      case 'aquarium':
        return {
          title: '🐟 Aquarium',
          subtitle: 'Präsentiere deine wertvollsten Fische',
          icon: <Fish className="h-8 w-8 text-blue-400" />,
          gradient: 'from-blue-500/20 to-teal-500/20',
          border: 'border-blue-400/30',
          sections: [
            {
              title: '🏆 Fisch-Präsentation',
              icon: <Trophy className="h-6 w-6 text-yellow-400" />,
              content: [
                'Zeige deine schönsten Fische in Aquarium-Tanks',
                'Sammle deine wertvollsten Exemplare',
                'Präsentiere seltene Fische für andere Spieler',
                'Begrenzte Tank-Plätze - wähle weise!'
              ]
            },
            {
              title: '💰 Verkaufs-System',
              icon: <Coins className="h-6 w-6 text-yellow-400" />,
              content: [
                'Fische können nach 24 Stunden verkauft werden',
                'Verkaufspreis basiert nur auf Seltenheit',
                '☀️ Sonnen-Boost verkürzt Wartezeit',
                'Plane Verkaufs-Timing für optimalen Gewinn'
              ]
            },
            {
              title: '🔄 Tank-Management',
              icon: <Clock className="h-6 w-6 text-orange-400" />,
              content: [
                'Tausche Fische strategisch aus',
                'Neue Fische ersetzen alte nach Verkauf',
                'Behalte deine wertvollsten Exemplare',
                'Kontinuierliche Optimierung für bessere Präsentation'
              ]
            },
          ],
          tips: [
            'Sammle deine seltensten Fische für die Präsentation',
            'Nutze Sonnen-Boost nur bei sehr wertvollen Fischen',
            'Verkaufe regelmäßig für Platz für bessere Exemplare',
            'Plane Tank-Platzierung für optimale Ästhetik'
          ]
        };

      case 'flowerpower':
        return {
          title: '⚡ Flowerpower Challenge',
          subtitle: 'Wöchentliche Community-Challenge',
          icon: <Zap className="h-8 w-8 text-yellow-400" />,
          gradient: 'from-yellow-500/20 to-orange-500/20',
          border: 'border-yellow-400/30',
          sections: [
            {
              title: '🏆 Wöchentliche Challenge',
              icon: <Trophy className="h-6 w-6 text-yellow-400" />,
              content: [
                'Jede Woche neue Challenge mit 6 spezifischen Blumen',
                'Spende passende Blumen für Punkte',
                'Community arbeitet zusammen für gemeinsames Ziel',
                'Große Belohnungen bei Challenge-Erfolg'
              ]
            },
            {
              title: '🌸 Spende-System',
              icon: <Gift className="h-6 w-6 text-pink-400" />,
              content: [
                'Spende nur die 6 Challenge-Blumen der Woche',
                'Blumen-Seltenheit bestimmt Punkte-Wert',
                'Seltene Blumen geben mehr Punkte',
                'Jede Spende zählt zum Community-Fortschritt'
              ]
            },
            {
              title: '🎁 Belohnungs-System',
              icon: <Star className="h-6 w-6 text-purple-400" />,
              content: [
                'Belohnungen basieren auf Community-Leistung',
                'Alle Spieler teilen sich die Belohnungen',
                'Höhere Challenge-Level = bessere Belohnungen',
                'Seltene Samen und Credits als Hauptpreise'
              ]
            },
            {
              title: '👥 Community-Aspekt',
              icon: <Users className="h-6 w-6 text-blue-400" />,
              content: [
                'Arbeite mit anderen Spielern zusammen',
                'Jeder Beitrag hilft der gesamten Community',
                'Challenge-Fortschritt für alle sichtbar',
                'Gemeinsame Ziele stärken die Spieler-Gemeinschaft'
              ]
            }
          ],
          tips: [
            'Züchte gezielt die Challenge-Blumen der aktuellen Woche',
            'Seltene Challenge-Blumen sind besonders wertvoll',
            'Spende regelmäßig für kontinuierlichen Community-Fortschritt',
            'Behalte einige Challenge-Blumen für nächste Woche'
          ]
        };

      case 'exhibition':
        return {
          title: '🦋 Schmetterlingsausstellung',
          subtitle: 'Präsentiere deine schönsten Schmetterlinge',
          icon: <Trophy className="h-8 w-8 text-purple-400" />,
          gradient: 'from-purple-500/20 to-pink-500/20',
          border: 'border-purple-400/30',
          sections: [
            {
              title: '🖼️ Schmetterlings-Rahmen',
              icon: <Trophy className="h-6 w-6 text-yellow-400" />,
              content: [
                'Stelle Schmetterlinge in eleganten Rahmen aus',
                'Jeder Rahmen generiert passives Einkommen',
                'Schmetterlings-Seltenheit bestimmt Credits pro Stunde',
                'VIP-Schmetterlinge bringen zusätzliche Boni'
              ]
            },
            {
              title: '💎 VIP-System',
              icon: <Star className="h-6 w-6 text-orange-400" />,
              content: [
                'VIP-Schmetterlinge sind besonders wertvoll',
                'Deutlich höhere Einkommens-Rate als normale',
                'Seltene VIPs können extremes passives Einkommen generieren',
                'Begrenzte VIP-Plätze - wähle die wertvollsten!'
              ]
            },
            {
              title: '⏰ Verkaufs-Mechanik',
              icon: <Clock className="h-6 w-6 text-blue-400" />,
              content: [
                'Schmetterlinge können nach 72 Stunden verkauft werden',
                '❤️ Likes von anderen Spielern verkürzen Wartezeit',
                '☀️ Sonnen-Boost für sofortige Zeit-Reduktion',
                'Strategisches Timing maximiert Gewinne'
              ]
            },
            {
              title: '💰 Einkommens-Optimierung',
              icon: <TrendingUp className="h-6 w-6 text-green-400" />,
              content: [
                'Höhere Seltenheit = mehr Credits pro Stunde',
                'VIP-Boni multiplizieren das Grundeinkommen',
                'Regelmäßiges Ersetzen alter Schmetterlinge',
                'Langfristige Sammler-Strategie entwickeln'
              ]
            }
          ],
          tips: [
            'Priorisiere VIP-Schmetterlinge für maximales Einkommen',
            'Nutze Likes strategisch für wertvollste Exemplare',
            'Tausche regelmäßig gegen bessere Schmetterlinge',
            'Behalte deine seltensten Exemplare dauerhaft'
          ]
        };

      case 'marie-slot':
        return {
          title: '🎰 Marie-Slot',
          subtitle: 'Glücksspiel mit echten Spiel-Bildern',
          icon: <Coins className="h-8 w-8 text-yellow-400" />,
          gradient: 'from-yellow-500/20 to-orange-500/20',
          border: 'border-yellow-400/30',
          sections: [
            {
              title: '🎲 Spielmechanik',
              icon: <Sparkles className="h-6 w-6 text-purple-400" />,
              content: [
                'Kosten: 5 Sonnen pro Spin',
                '5 vertikale Rollen mit echten Blumen-Bildern',
                'Nur die mittlere Reihe (Payline) zählt für Gewinne',
                'Realistische Slot-Animation mit Rollen-Stopp'
              ]
            },
            {
              title: '🏆 Gewinn-Tabelle',
              icon: <Trophy className="h-6 w-6 text-yellow-400" />,
              content: [
                '2 gleiche Symbole = 3 Sonnen zurück',
                '3 Sonnen-Symbole = 50 Credits (Spezial-Gewinn)',
                '3 andere gleiche Symbole = 1 seltener Samen',
                '4 gleiche = legendärer Schmetterling',
                '5 gleiche = 1000 Credits (Jackpot!)'
              ]
            },
            {
              title: '🎰 Slot-Features',
              icon: <Star className="h-6 w-6 text-blue-400" />,
              content: [
                'Mechanischer Rückstoß-Effekt vor dem Stoppen',
                'Gestaffelte Rollen-Stopps für Spannung',
                'Echte Spiel-Bilder auf den Rollen',
                'Realistische Casino-Atmosphäre'
              ]
            },
            {
              title: '💡 Spiel-Strategie',
              icon: <TrendingUp className="h-6 w-6 text-green-400" />,
              content: [
                'Sonnen sind wertvoll - spiele nur wenn du viele hast',
                'Große Gewinne sind selten aber sehr wertvoll',
                'Budget deine Sonnen für nachhaltiges Spielen',
                'Betrachte es als Unterhaltung, nicht als Einkommens-Quelle'
              ]
            }
          ],
          tips: [
            'Sammle viele Sonnen bevor du spielst',
            'Setze dir ein Limit und halte dich daran',
            'Große Gewinne sind möglich aber selten',
            'Genieße das Spiel - Glück kommt und geht!'
          ]
        };

      default:
        return {
          title: '❓ Hilfe',
          subtitle: 'Informationen über das Spiel',
          icon: <HelpCircle className="h-8 w-8 text-slate-400" />,
          gradient: 'from-slate-500/20 to-gray-500/20',
          border: 'border-slate-400/30',
          sections: [],
          tips: []
        };
    }
  };

  const viewInfo = getViewInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-orange-500/30 text-white max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <DialogHeader className="relative">
          {/* Enhanced Header Background */}
          <div className={`absolute inset-0 bg-gradient-to-r ${viewInfo.gradient} rounded-t-lg -mx-6 -my-2`}></div>
          
          <DialogTitle className="flex items-center text-white relative z-10">
            <div className="relative">
              {viewInfo.icon}
              <div className="absolute inset-0 animate-ping opacity-30">{viewInfo.icon}</div>
            </div>
            <div className="ml-4">
              <span className="text-3xl font-bold bg-gradient-to-r from-orange-300 to-yellow-300 bg-clip-text text-transparent">
                {viewInfo.title}
              </span>
              <p className="text-lg text-slate-300 mt-1">{viewInfo.subtitle}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Main Content Sections */}
          <div className="grid gap-6">
            {viewInfo.sections.map((section, index) => (
              <Card key={index} className={`bg-slate-800/60 border ${viewInfo.border} shadow-lg hover:shadow-xl transition-all duration-300`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-white">
                    <div className="relative mr-3">
                      {section.icon}
                      <div className="absolute inset-0 animate-pulse opacity-50">{section.icon}</div>
                    </div>
                    <span className="text-xl font-bold">{section.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start text-slate-300">
                        <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-lg">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tips Section */}
          {viewInfo.tips.length > 0 && (
            <Card className="bg-gradient-to-r from-orange-800/20 to-yellow-800/20 border-2 border-orange-500/30 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <div className="relative mr-3">
                    <Star className="h-6 w-6 text-yellow-400 animate-pulse" />
                    <div className="absolute inset-0 h-6 w-6 text-yellow-400 animate-ping opacity-30"></div>
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                    💡 Profi-Tipps
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {viewInfo.tips.map((tip, index) => (
                    <div key={index} className="flex items-start bg-slate-800/50 rounded-lg p-4 border border-orange-400/20">
                      <Sparkles className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-slate-300 text-lg">{tip}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rarität-System Info für relevante Views */}
          {(['garden', 'pond', 'market', 'inventory', 'bouquets', 'exhibition'] as const).includes(viewType) && (
            <Card className="bg-gradient-to-r from-purple-800/20 to-pink-800/20 border-2 border-purple-500/30 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <div className="relative mr-3">
                    <Trophy className="h-6 w-6 text-purple-400 animate-pulse" />
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                    🌟 Seltenheits-System
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { tier: 'common', name: 'Common', bgColor: 'bg-yellow-500/20 border-yellow-400/40' },
                    { tier: 'uncommon', name: 'Uncommon', bgColor: 'bg-green-500/20 border-green-400/40' },
                    { tier: 'rare', name: 'Rare', bgColor: 'bg-blue-500/20 border-blue-400/40' },
                    { tier: 'super-rare', name: 'Super-Rare', bgColor: 'bg-cyan-500/20 border-cyan-400/40' },
                    { tier: 'epic', name: 'Epic', bgColor: 'bg-purple-500/20 border-purple-400/40' },
                    { tier: 'legendary', name: 'Legendary', bgColor: 'bg-orange-500/20 border-orange-400/40' },
                    { tier: 'mythical', name: 'Mythical', bgColor: 'bg-red-500/20 border-red-400/40' }
                  ].map((rarity) => (
                    <div key={rarity.tier} className={`${rarity.bgColor} rounded-lg p-3 border-2 transition-all duration-300 hover:scale-105`}>
                      <Badge className={`${getRarityColor(rarity.tier as any)} text-white font-bold text-sm px-3 py-1 w-full justify-center`}>
                        {rarity.name}
                      </Badge>
                    </div>
                  ))}
                </div>
                <p className="text-slate-300 text-lg mt-4">
                  Höhere Seltenheit = bessere Belohnungen, längere Wachszeiten, wertvollere Items
                </p>
              </CardContent>
            </Card>
          )}

          {/* Close Button */}
          <div className="flex justify-center pt-6 pb-2">
            <Button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white font-bold text-lg rounded-full shadow-lg border-2 border-orange-400/50 transition-all duration-300 hover:scale-105"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Verstanden!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};