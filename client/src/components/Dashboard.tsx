import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { 
  Gamepad2, 
  Trophy, 
  Coins, 
  TrendingUp, 
  Clock,
  Star 
} from "lucide-react";

interface DashboardProps {
  onViewChange: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const { user } = useAuth();
  const { credits } = useCredits();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardContent className="pt-6">
            <p className="text-center text-slate-400">Please log in to access the dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-full">
      {/* Enhanced Welcome Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>
        <div className="relative bg-gradient-to-r from-slate-800/80 to-slate-900/80 p-8 rounded-2xl border border-blue-500/30 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Star className="h-12 w-12 mr-4 text-blue-400 animate-pulse" />
              <div className="absolute inset-0 h-12 w-12 mr-4 text-blue-400 animate-ping opacity-20"></div>
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
                Willkommen zurück, {user.username}! 🎆
              </h1>
            </div>
          </div>
          <p className="text-slate-300 text-xl">Bereit für ein neues Garten-Abenteuer?</p>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-orange-800/40 to-yellow-800/40 border-2 border-orange-500/30 hover:border-orange-400/50 transition-all duration-300 hover:scale-105 shadow-xl group">
          <CardHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-t-lg -mx-6 -my-2"></div>
            <div className="relative flex flex-row items-center justify-between space-y-0 pb-2 z-10">
              <CardTitle className="text-lg font-bold text-orange-300">
                Total Credits
              </CardTitle>
              <div className="relative">
                <Coins className="h-8 w-8 text-orange-400 group-hover:animate-pulse" />
                <div className="absolute inset-0 h-8 w-8 text-orange-400 animate-ping opacity-20"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-400 mb-2">{credits} Cr</div>
            <div className="text-slate-400 text-sm">💰 Spielgeld</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-800/40 to-indigo-800/40 border-2 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-105 shadow-xl group">
          <CardHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-t-lg -mx-6 -my-2"></div>
            <div className="relative flex flex-row items-center justify-between space-y-0 pb-2 z-10">
              <CardTitle className="text-lg font-bold text-blue-300">
                Spiele gespielt
              </CardTitle>
              <div className="relative">
                <Gamepad2 className="h-8 w-8 text-blue-400 group-hover:animate-pulse" />
                <div className="absolute inset-0 h-8 w-8 text-blue-400 animate-ping opacity-20"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-400 mb-2">0</div>
            <div className="text-slate-400 text-sm">🎮 Starte dein erstes Spiel!</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-800/40 to-amber-800/40 border-2 border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105 shadow-xl group">
          <CardHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-t-lg -mx-6 -my-2"></div>
            <div className="relative flex flex-row items-center justify-between space-y-0 pb-2 z-10">
              <CardTitle className="text-lg font-bold text-yellow-300">
                Bester Score
              </CardTitle>
              <div className="relative">
                <Trophy className="h-8 w-8 text-yellow-400 group-hover:animate-pulse" />
                <div className="absolute inset-0 h-8 w-8 text-yellow-400 animate-ping opacity-20"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-yellow-400 mb-2">--</div>
            <div className="text-slate-400 text-sm">🏆 Noch keine Spiele gespielt</div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Quick Actions */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-500/30 shadow-2xl">
        <CardHeader className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-t-lg -mx-6 -my-2"></div>
          <CardTitle className="text-white flex items-center relative z-10">
            <div className="relative">
              <Star className="h-8 w-8 mr-3 text-purple-400 animate-pulse" />
              <div className="absolute inset-0 h-8 w-8 mr-3 text-purple-400 animate-ping opacity-30"></div>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Schnelle Aktionen ⚡
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Button
              onClick={() => onViewChange('garten')}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white h-20 text-xl font-bold transition-all duration-300 hover:scale-110 shadow-lg"
            >
              <div className="flex flex-col items-center">
                <Gamepad2 className="h-8 w-8 mb-2" />
                <span>🌱 Garten besuchen</span>
              </div>
            </Button>
            
            <Button
              onClick={() => onViewChange('ausstellung')}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white h-20 text-xl font-bold transition-all duration-300 hover:scale-110 shadow-lg"
            >
              <div className="flex flex-col items-center">
                <Trophy className="h-8 w-8 mb-2" />
                <span>🦋 Ausstellung</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Recent Activity */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/30 shadow-2xl">
        <CardHeader className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-t-lg -mx-6 -my-2"></div>
          <CardTitle className="text-white flex items-center relative z-10">
            <div className="relative">
              <Clock className="h-8 w-8 mr-3 text-cyan-400 animate-pulse" />
              <div className="absolute inset-0 h-8 w-8 mr-3 text-cyan-400 animate-ping opacity-30"></div>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              Letzte Aktivität 🕰️
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-lg"></div>
            <div className="relative z-10">
              <div className="relative mb-6">
                <Clock className="h-16 w-16 text-cyan-400 mx-auto animate-spin" style={{animationDuration: '20s'}} />
                <div className="absolute inset-0 h-16 w-16 mx-auto text-cyan-400 animate-ping opacity-30"></div>
              </div>
              <p className="text-slate-300 text-xl mb-3">🌱 Keine Aktivität vorhanden</p>
              <p className="text-slate-400 text-lg">Beginne mit dem Gärtnern um deine Geschichte hier zu sehen</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
