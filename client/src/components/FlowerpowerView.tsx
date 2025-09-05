import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/stores/useAuth";
import { useNotification } from "../hooks/useNotification";
import { RarityImage } from "./RarityImage";
import { Sparkles, Flower, Zap, Star, Heart, Plus, Minus, Trophy, Users, Info, Gift } from "lucide-react";
import { HelpButton } from './HelpButton';

interface WeeklyChallenge {
  id: number;
  weekNumber: number;
  year: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  flowerId1: number;
  flowerId2: number;
  flowerId3: number;
  flowerId4: number;
  flowerId5: number;
  flowerId6: number;
}

interface LeaderboardEntry {
  userId: number;
  username: string;
  totalDonations: number;
}

interface UserFlower {
  id: number;
  userId: number;
  flowerId: number;
  flowerRarity: string;
  quantity: number;
  createdAt: string;
}

export const FlowerpowerView: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [flowers, setFlowers] = useState<UserFlower[]>([]);
  const [challenge, setChallenge] = useState<WeeklyChallenge | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [donationAmounts, setDonationAmounts] = useState<Record<number, number>>({});
  const [showDonateDialog, setShowDonateDialog] = useState(false);
  const [donateFlowerId, setDonateFlowerId] = useState<number | null>(null);
  const [donateAmount, setDonateAmount] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenge();
    if (user) {
      fetchMyFlowers();
    }
  }, [user]);

  useEffect(() => {
    if (challenge) {
      loadLeaderboard();
    }
  }, [challenge]);

  const fetchMyFlowers = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/${user.id}/flowers`);
      if (response.ok) {
        const data = await response.json();
        setFlowers(data.flowers || []);
      }
    } catch (error) {
      console.error('Failed to fetch my flowers:', error);
    }
  };

  const loadChallenge = async () => {
    try {
      const response = await fetch('/api/weekly-challenge/current');
      if (response.ok) {
        const data = await response.json();
        setChallenge(data.challenge);
        setIsActive(data.isActive);
      }
    } catch (error) {
      console.error('Error loading challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    if (!challenge) return;
    
    try {
      const response = await fetch(`/api/weekly-challenge/${challenge.id}/leaderboard`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const handleDonate = async () => {
    if (!challenge || !donateFlowerId || !user) return;

    try {
      const response = await fetch('/api/weekly-challenge/donate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString()
        },
        body: JSON.stringify({
          challengeId: challenge.id,
          flowerId: donateFlowerId,
          quantity: donateAmount
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setShowDonateDialog(false);
        loadLeaderboard();
        fetchMyFlowers(); // Refresh flowers
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      console.error('Error donating flower:', error);
    }
  };

  const getFlowerQuantity = (flowerId: number): number => {
    const flower = flowers.find(f => f.flowerId === flowerId);
    return flower?.quantity || 0;
  };

  const getFlowerRarity = (flowerId: number): string => {
    // Based on rarity distribution from replit.md
    if (flowerId <= 55) return "common";
    if (flowerId <= 100) return "uncommon";
    if (flowerId <= 135) return "rare";
    if (flowerId <= 160) return "super-rare";
    if (flowerId <= 180) return "epic";
    if (flowerId <= 195) return "legendary";
    return "mythical";
  };

  const getRarityColor = (rarity: string): string => {
    const colors = {
      "common": "yellow",
      "uncommon": "green", 
      "rare": "blue",
      "super-rare": "cyan",
      "epic": "purple",
      "legendary": "orange",
      "mythical": "red"
    };
    return colors[rarity as keyof typeof colors] || "gray";
  };

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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Zap className="h-12 w-12 text-orange-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white">Lade Challenge...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 p-8">
          <CardContent className="text-center">
            <Flower className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Keine aktive Challenge</h2>
            <p className="text-slate-400">Derzeit ist keine Weekly Challenge aktiv.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 p-8">
          <CardContent className="text-center">
            <Heart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Challenge pausiert</h2>
            <p className="text-slate-400">Die Weekly Challenge ist zwischen Sonntag 18:00 und Montag 0:00 pausiert.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const challengeFlowerIds = challenge ? [
    challenge.flowerId1,
    challenge.flowerId2,
    challenge.flowerId3,
    challenge.flowerId4,
    challenge.flowerId5,
    challenge.flowerId6
  ] : [];

  const openDonateDialog = (flowerId: number) => {
    setDonateFlowerId(flowerId);
    setDonateAmount(1);
    setShowDonateDialog(true);
  };

  const adjustDonateAmount = (delta: number) => {
    const maxAmount = getFlowerQuantity(donateFlowerId || 0);
    setDonateAmount(Math.max(1, Math.min(maxAmount, donateAmount + delta)));
  };

  return (
    <div className="h-full bg-slate-950 text-white overflow-y-auto">
      <div className="container mx-auto px-4 py-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div></div> {/* Spacer links */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Zap className="h-10 w-10 text-orange-400 mr-3" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                Flowerpower Challenge
              </h1>
            </div>
            <p className="text-slate-400 text-lg">
              Woche {challenge?.weekNumber} • Spende Blumen und gewinne animierte Schmetterlinge!
            </p>
          </div>
          <div className="flex justify-end">
            <HelpButton helpText="Bei der Flowerpower Challenge spendest du bestimmte Blumen für die Gemeinschaft! Je mehr Blumen du spendest, desto höher deine Chance auf seltene animierte Schmetterlinge als Belohnung!" />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Challenge Info & Rewards */}
          <div className="lg:col-span-1 space-y-4">
            {/* Challenge Flowers */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  Gesuchte Blumen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {challengeFlowerIds.map((flowerId, index) => {
                    const rarity = getFlowerRarity(flowerId);
                    const quantity = getFlowerQuantity(flowerId);
                    const color = getRarityColor(rarity);
                    
                    return (
                      <div key={flowerId} className="relative">
                        <div className={`bg-slate-700 rounded-lg p-3 border-2 border-${color}-500`}>
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={`bg-${color}-500/20 text-${color}-300`}>
                              {rarity}
                            </Badge>
                            <span className="text-sm text-slate-400">#{flowerId}</span>
                          </div>
                          
                          <RarityImage
                            src={`/Blumen/${flowerId}.jpg`}
                            alt={`Blume ${flowerId}`}
                            rarity={rarity}
                            size={60}
                          />
                          
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-slate-400">Besitzt:</span>
                            <span className="font-medium">{quantity}</span>
                          </div>
                          
                          {quantity > 0 && (
                            <Button
                              onClick={() => openDonateDialog(flowerId)}
                              size="sm"
                              className="w-full mt-2 bg-orange-500 hover:bg-orange-600"
                            >
                              <Heart className="h-3 w-3 mr-1" />
                              Spenden
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Rewards Info */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
                  Belohnungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center p-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
                  <div className="w-8 h-8 bg-yellow-500 text-black rounded-full flex items-center justify-center font-bold mr-3">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-yellow-400">Animierter Schmetterling</p>
                    <p className="text-xs text-slate-400">60 Cr/h passives Einkommen</p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center font-bold mr-3">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-purple-400">Epischer Schmetterling</p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                  <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center font-bold mr-3">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-cyan-400">Super-Seltener Schmetterling</p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-bold mr-3">
                    4-10
                  </div>
                  <div>
                    <p className="font-medium text-blue-400">Seltene Schmetterlinge</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center: Main Challenge Area */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800 border-slate-700 h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-center text-center">
                  <Gift className="h-6 w-6 text-pink-400 mr-2" />
                  Challenge Status
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-6">
                <div className="text-6xl">🌸</div>
                
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">Gemeinschafts-Challenge</h3>
                  <p className="text-slate-400">
                    Spende Blumen und erhalte im Gegenzug Samen!
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    50% Chance auf einen Samen der nächstniedrigeren Seltenheitsstufe
                  </p>
                </div>

                {challenge && (
                  <div className="text-center p-4 bg-slate-700 rounded-lg">
                    <p className="text-sm text-slate-400">Challenge endet:</p>
                    <p className="font-medium">
                      {new Date(challenge.endTime).toLocaleDateString('de-DE', {
                        weekday: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Leaderboard */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800 border-slate-700 h-full">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 text-green-400 mr-2" />
                  Bestenliste
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Noch keine Spenden</p>
                    <p className="text-sm">Sei der Erste!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.slice(0, 10).map((entry, index) => (
                      <div
                        key={entry.userId}
                        className={`flex items-center p-3 rounded-lg ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' :
                          index === 1 ? 'bg-purple-500/20 border border-purple-500/30' :
                          index === 2 ? 'bg-cyan-500/20 border border-cyan-500/30' :
                          'bg-slate-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-purple-500' :
                          index === 2 ? 'bg-cyan-500' :
                          'bg-slate-600'
                        }`}>
                          {index + 1}
                        </div>
                        
                        <div className="flex-1">
                          <p className="font-medium">{entry.username}</p>
                          <p className="text-sm text-slate-400">
                            {entry.totalDonations} Blumen gespendet
                          </p>
                        </div>

                        {index < 3 && (
                          <Trophy className={`h-5 w-5 ${
                            index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-purple-500' :
                            'text-cyan-500'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Donation Dialog */}
        <Dialog open={showDonateDialog} onOpenChange={setShowDonateDialog}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Heart className="h-5 w-5 text-pink-400 mr-2" />
                Blume spenden
              </DialogTitle>
            </DialogHeader>
            
            {donateFlowerId && (
              <div className="space-y-4">
                <div className="text-center">
                  <RarityImage
                    src={`/Blumen/${donateFlowerId}.jpg`}
                    alt={`Blume ${donateFlowerId}`}
                    rarity={getFlowerRarity(donateFlowerId)}
                    size={80}
                  />
                  <p className="mt-2 text-sm text-slate-400">
                    Besitzt: {getFlowerQuantity(donateFlowerId)} Stück
                  </p>
                </div>

                <div className="flex items-center justify-center space-x-4">
                  <Button
                    onClick={() => adjustDonateAmount(-1)}
                    disabled={donateAmount <= 1}
                    variant="outline"
                    size="sm"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-2xl font-bold w-16 text-center">
                    {donateAmount}
                  </span>
                  
                  <Button
                    onClick={() => adjustDonateAmount(1)}
                    disabled={donateAmount >= getFlowerQuantity(donateFlowerId)}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-center text-sm text-slate-400">
                  Du erhältst möglicherweise {donateAmount} Samen zurück
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                onClick={() => setShowDonateDialog(false)}
                variant="outline"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleDonate}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Heart className="h-4 w-4 mr-2" />
                Spenden
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};