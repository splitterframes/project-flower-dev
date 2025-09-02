import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/stores/useAuth";
import { Sparkles, Flower, Zap, Star, Heart } from "lucide-react";

export const FlowerpowerView: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 p-8">
          <CardContent className="text-center">
            <Sparkles className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Anmeldung erforderlich</h2>
            <p className="text-slate-400">Bitte melde dich an, um Flowerpower zu nutzen.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-950 text-white overflow-y-auto">
      <div className="container mx-auto px-4 py-6 space-y-6">
        
        {/* Header Section */}
        <Card className="bg-gradient-to-r from-orange-900/50 to-pink-900/50 border-orange-600/30">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Zap className="h-8 w-8 text-orange-400 animate-pulse" />
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                Flowerpower
              </CardTitle>
              <Zap className="h-8 w-8 text-pink-400 animate-pulse" />
            </div>
            <p className="text-slate-300 text-lg">
              Entdecke die magische Kraft deiner Blumen
            </p>
          </CardHeader>
        </Card>

        {/* Power Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Flower className="h-6 w-6 text-green-400" />
                <CardTitle className="text-lg">Blüten-Power</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">0</div>
              <p className="text-slate-400 text-sm">Gesammelte Energie</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Star className="h-6 w-6 text-yellow-400" />
                <CardTitle className="text-lg">Level</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">1</div>
              <p className="text-slate-400 text-sm">Flowerpower Level</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Heart className="h-6 w-6 text-pink-400" />
                <CardTitle className="text-lg">Combo</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-400">0x</div>
              <p className="text-slate-400 text-sm">Power Multiplier</p>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Section */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-purple-400" />
              <span>Magische Fähigkeiten</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🌸✨</div>
              <h3 className="text-2xl font-bold mb-2">Bald verfügbar!</h3>
              <p className="text-slate-400 mb-6">
                Hier wird die magische Welt der Flowerpower freigeschaltet.
                <br />
                Sammle Blumen und entdecke ihre geheimen Kräfte!
              </p>
              
              <div className="space-y-3">
                <Badge variant="outline" className="border-green-500 text-green-400 px-4 py-2">
                  🌱 Wachstums-Boost
                </Badge>
                <Badge variant="outline" className="border-blue-500 text-blue-400 px-4 py-2 ml-2">
                  🦋 Schmetterlings-Magnet
                </Badge>
                <Badge variant="outline" className="border-purple-500 text-purple-400 px-4 py-2">
                  ⭐ Seltenheits-Bonus
                </Badge>
                <Badge variant="outline" className="border-orange-500 text-orange-400 px-4 py-2 ml-2">
                  💫 Zeitreise
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="text-center text-slate-400 text-sm space-y-2">
              <p>💡 <strong>Tipp:</strong> Sammle verschiedene Blumen-Seltenheiten für mehr Power!</p>
              <p>🎯 <strong>Ziel:</strong> Erreiche Level 10 für die ersten magischen Fähigkeiten.</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};