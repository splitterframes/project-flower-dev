import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/stores/useAuth";
import { Trophy, Crown, Medal, Award } from "lucide-react";

export const ExhibitionView: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardContent className="pt-6">
            <p className="text-center text-slate-400">Bitte melde dich an, um die Ausstellung zu besuchen</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Exhibition Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
          <Trophy className="h-8 w-8 mr-3 text-gold-400" />
          Ausstellung
        </h1>
        <p className="text-slate-400">Zeige deine schönsten Kreationen und gewinne Preise</p>
      </div>

      {/* Exhibition Halls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Exhibition */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Crown className="h-5 w-5 mr-2 text-yellow-400" />
              Aktuelle Ausstellung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <h3 className="text-xl font-bold text-yellow-400 mb-2">Frühlings Blütenpracht</h3>
              <p className="text-slate-400 mb-4">Zeige deine schönsten Frühlingsblumen</p>
              <div className="bg-slate-900 rounded-lg p-4">
                <p className="text-slate-500">Noch keine Teilnahmen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Medal className="h-5 w-5 mr-2 text-bronze-400" />
              Rangliste
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">Top Aussteller</p>
              <div className="space-y-2">
                <div className="bg-slate-900 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-yellow-400">🥇 Blumen_Meister</span>
                  <span className="text-slate-400">2,450 Punkte</span>
                </div>
                <div className="bg-slate-900 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-gray-300">🥈 GartenFee</span>
                  <span className="text-slate-400">1,890 Punkte</span>
                </div>
                <div className="bg-slate-900 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-amber-600">🥉 BlütenZauber</span>
                  <span className="text-slate-400">1,234 Punkte</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Achievements */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Award className="h-5 w-5 mr-2 text-purple-400" />
            Meine Erfolge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-900 rounded-lg opacity-50">
              <div className="text-2xl mb-2">🌸</div>
              <div className="text-sm text-slate-400">Erste Blume</div>
              <div className="text-xs text-slate-500">Nicht freigeschaltet</div>
            </div>
            <div className="text-center p-4 bg-slate-900 rounded-lg opacity-50">
              <div className="text-2xl mb-2">🦋</div>
              <div className="text-sm text-slate-400">Schmetterlings Freund</div>
              <div className="text-xs text-slate-500">Nicht freigeschaltet</div>
            </div>
            <div className="text-center p-4 bg-slate-900 rounded-lg opacity-50">
              <div className="text-2xl mb-2">💐</div>
              <div className="text-sm text-slate-400">Bouquet Künstler</div>
              <div className="text-xs text-slate-500">Nicht freigeschaltet</div>
            </div>
            <div className="text-center p-4 bg-slate-900 rounded-lg opacity-50">
              <div className="text-2xl mb-2">👑</div>
              <div className="text-sm text-slate-400">Garten König</div>
              <div className="text-xs text-slate-500">Nicht freigeschaltet</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};