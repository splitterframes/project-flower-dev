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
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {user.username}!
        </h1>
        <p className="text-slate-400">Ready to start gaming?</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Credits
            </CardTitle>
            <Coins className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{credits} Cr</div>
            <p className="text-xs text-slate-500">
              Available for games
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Games Played
            </CardTitle>
            <Gamepad2 className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">0</div>
            <p className="text-xs text-slate-500">
              Start your first game!
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Best Score
            </CardTitle>
            <Trophy className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">--</div>
            <p className="text-xs text-slate-500">
              No games played yet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Star className="h-5 w-5 mr-2 text-orange-400" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={() => onViewChange('game')}
              className="bg-orange-600 hover:bg-orange-700 text-white h-16 text-lg"
            >
              <Gamepad2 className="h-6 w-6 mr-2" />
              Start Game
            </Button>
            
            <Button
              onClick={() => onViewChange('leaderboard')}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 h-16 text-lg"
            >
              <Trophy className="h-6 w-6 mr-2" />
              Leaderboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-400" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-slate-400">No recent activity</p>
            <p className="text-slate-500 text-sm mt-2">Start playing to see your game history here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
