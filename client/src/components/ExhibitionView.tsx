import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/stores/useAuth";
import { useCredits } from "@/lib/stores/useCredits";
import { ButterflyHoverPreview } from "./ButterflyHoverPreview";
import { ButterflyDetailModal } from "./ButterflyDetailModal";
import { RarityImage } from "./RarityImage";
import { Trophy, Plus, DollarSign, Clock, Star, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { HelpButton } from './HelpButton';
import { getRarityColor, getRarityDisplayName, type RarityTier } from "@shared/rarity";
import type { ExhibitionFrame, ExhibitionButterfly, UserButterfly, UserVipButterfly } from "@shared/schema";


interface FrameLike {
  frameId: number;
  totalLikes: number;
  isLiked: boolean;
}

export const ExhibitionView: React.FC = () => {
  const { user } = useAuth();
  const { credits, setCredits } = useCredits();
  const [frames, setFrames] = useState<ExhibitionFrame[]>([]);
  const [exhibitionButterflies, setExhibitionButterflies] = useState<ExhibitionButterfly[]>([]);
  const [exhibitionVipButterflies, setExhibitionVipButterflies] = useState<any[]>([]);
  const [userButterflies, setUserButterflies] = useState<UserButterfly[]>([]);
  const [userVipButterflies, setUserVipButterflies] = useState<UserVipButterfly[]>([]);
  const [frameLikes, setFrameLikes] = useState<FrameLike[]>([]);
  const [sellStatuses, setSellStatuses] = useState<{[key: string]: {canSell: boolean, timeRemainingMs: number}}>({});
  const [selectedButterfly, setSelectedButterfly] = useState<ExhibitionButterfly | null>(null);
  const [showButterflyDialog, setShowButterflyDialog] = useState(false);
  const [currentButterflyIndex, setCurrentButterflyIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{frameId: number, slotIndex: number} | null>(null);
  const [showInventoryDialog, setShowInventoryDialog] = useState(false);
  const [showVipInventoryDialog, setShowVipInventoryDialog] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  const loadSellStatuses = async () => {
    if (!user) return;
    
    try {
      const statuses: {[key: string]: {canSell: boolean, timeRemainingMs: number}} = {};
      
      // Load sell statuses for all exhibition butterflies
      const loadPromises = exhibitionButterflies.map(async (butterfly) => {
        try {
          const response = await fetch(`/api/exhibition/butterfly/${butterfly.id}/sell-status`, {
            headers: {
              'x-user-id': user.id.toString()
            }
          });
          if (response.ok) {
            const data = await response.json();
            statuses[`normal-${butterfly.id}`] = {
              canSell: data.canSell,
              timeRemainingMs: data.timeRemainingMs || 0
            };
          } else {
            // Fallback: Calculate time remaining from placedAt
            const placedTime = new Date(butterfly.placedAt).getTime();
            const timeRemainingMs = Math.max(0, placedTime + (72 * 60 * 60 * 1000) - Date.now());
            statuses[`normal-${butterfly.id}`] = {
              canSell: timeRemainingMs <= 0,
              timeRemainingMs: timeRemainingMs
            };
          }
        } catch (error) {
          console.error(`Failed to load sell status for butterfly ${butterfly.id}:`, error);
          // Fallback: Calculate time remaining from placedAt
          const placedTime = new Date(butterfly.placedAt).getTime();
          const timeRemainingMs = Math.max(0, placedTime + (72 * 60 * 60 * 1000) - Date.now());
          statuses[`normal-${butterfly.id}`] = {
            canSell: timeRemainingMs <= 0,
            timeRemainingMs: timeRemainingMs
          };
        }
      });
      
      // Load sell statuses for all VIP butterflies
      const vipLoadPromises = exhibitionVipButterflies.map(async (vipButterfly) => {
        try {
          const response = await fetch(`/api/exhibition/vip-butterfly/${vipButterfly.id}/sell-status`, {
            headers: {
              'x-user-id': user.id.toString()
            }
          });
          if (response.ok) {
            const data = await response.json();
            statuses[`vip-${vipButterfly.id}`] = {
              canSell: data.canSell,
              timeRemainingMs: data.timeRemainingMs || 0
            };
          } else {
            // Fallback: Calculate time remaining from placedAt  
            const placedTime = new Date(vipButterfly.placedAt).getTime();
            const timeRemainingMs = Math.max(0, placedTime + (72 * 60 * 60 * 1000) - Date.now());
            statuses[`vip-${vipButterfly.id}`] = {
              canSell: timeRemainingMs <= 0,
              timeRemainingMs: timeRemainingMs
            };
          }
        } catch (error) {
          console.error(`Failed to load sell status for VIP butterfly ${vipButterfly.id}:`, error);
          // Fallback: Calculate time remaining from placedAt
          const placedTime = new Date(vipButterfly.placedAt).getTime();
          const timeRemainingMs = Math.max(0, placedTime + (72 * 60 * 60 * 1000) - Date.now());
          statuses[`vip-${vipButterfly.id}`] = {
            canSell: timeRemainingMs <= 0,
            timeRemainingMs: timeRemainingMs
          };
        }
      });
      
      await Promise.all([...loadPromises, ...vipLoadPromises]);
      setSellStatuses(statuses);
    } catch (error) {
      console.error('Failed to load sell statuses:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchExhibitionData();
      fetchUserButterflies();
      fetchUserVipButterflies();
      loadFrameLikes();
      // No need to manually process passive income anymore - it's automatic
    }
  }, [user]);
  
  useEffect(() => {
    if (exhibitionButterflies.length > 0 || exhibitionVipButterflies.length > 0) {
      loadSellStatuses();
      // Refresh sell statuses every 30 seconds
      const interval = setInterval(loadSellStatuses, 30000);
      return () => clearInterval(interval);
    }
  }, [exhibitionButterflies, exhibitionVipButterflies]);

  // Set to newest frame with butterflies when frames are loaded, or reset frame index when frames change
  useEffect(() => {
    if (frames.length > 0 && (exhibitionButterflies.length > 0 || exhibitionVipButterflies.length > 0)) {
      // Find the last frame that has butterflies
      let lastFrameWithButterflies = -1;
      
      for (let i = frames.length - 1; i >= 0; i--) {
        const frameId = frames[i].id;
        const hasNormalButterflies = exhibitionButterflies.some(b => b.frameId === frameId);
        const hasVipButterflies = exhibitionVipButterflies.some(b => b.frameId === frameId);
        
        if (hasNormalButterflies || hasVipButterflies) {
          lastFrameWithButterflies = i;
          break;
        }
      }
      
      // If we found a frame with butterflies, go to it, otherwise go to the last frame
      const targetIndex = lastFrameWithButterflies >= 0 ? lastFrameWithButterflies : frames.length - 1;
      
      if (currentFrameIndex === 0 || currentFrameIndex >= frames.length) {
        setCurrentFrameIndex(targetIndex);
      }
    } else if (frames.length > 0) {
      // If no butterflies yet, just go to the last frame
      if (currentFrameIndex === 0 || currentFrameIndex >= frames.length) {
        setCurrentFrameIndex(frames.length - 1);
      }
    }
  }, [frames.length, exhibitionButterflies.length, exhibitionVipButterflies.length]);

  const fetchExhibitionData = async () => {
    if (!user) return;
    try {
      const [framesRes, butterfliesRes, vipButterfliesRes] = await Promise.all([
        fetch(`/api/user/${user.id}/exhibition-frames`),
        fetch(`/api/user/${user.id}/exhibition-butterflies`),
        fetch(`/api/user/${user.id}/exhibition-vip-butterflies`)
      ]);
      
      if (framesRes.ok && butterfliesRes.ok && vipButterfliesRes.ok) {
        const framesData = await framesRes.json();
        const butterfliesData = await butterfliesRes.json();
        const vipButterfliesData = await vipButterfliesRes.json();
        setFrames(framesData.frames || []);
        setExhibitionButterflies(butterfliesData.butterflies || []);
        setExhibitionVipButterflies(vipButterfliesData.vipButterflies || []);
      }
    } catch (error) {
      console.error('Failed to fetch exhibition data:', error);
    }
  };

  const fetchUserButterflies = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/${user.id}/butterflies`);
      if (response.ok) {
        const data = await response.json();
        setUserButterflies(data.butterflies || []);
      }
    } catch (error) {
      console.error('Failed to fetch user butterflies:', error);
    }
  };

  const fetchUserVipButterflies = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/${user.id}/vip-butterflies`);
      if (response.ok) {
        const data = await response.json();
        setUserVipButterflies(data.vipButterflies || []);
      }
    } catch (error) {
      console.error('Failed to fetch user VIP butterflies:', error);
    }
  };

  const loadFrameLikes = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/user/${user.id}/exhibition/${user.id}/likes`);
      if (response.ok) {
        const data = await response.json();
        setFrameLikes(data.likes || []);
      }
    } catch (error) {
      console.error('Failed to load frame likes:', error);
    }
  };

  const processPassiveIncome = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/exhibition/process-income', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user?.id.toString() || '1'
        },
        body: JSON.stringify({ userId: user.id })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.creditsEarned && data.creditsEarned > 0) {
          // Update credits in store
          const currentUser = await fetch(`/api/user/${user.id}/credits`);
          if (currentUser.ok) {
            const creditsData = await currentUser.json();
            setCredits(creditsData.credits);
          }
          
          // Show notification about earned credits
          console.log(`💰 ${data.creditsEarned} Credits aus der Ausstellung erhalten!`);
        }
      }
    } catch (error) {
      console.error('Failed to process passive income:', error);
    }
  };

  const purchaseFrame = async () => {
    if (!user || isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/exhibition/purchase-frame', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user?.id.toString() || '1'
        },
        body: JSON.stringify({ userId: user.id })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCredits(data.newCredits);
        await fetchExhibitionData();
      } else {
        const error = await response.json();
        alert(error.message || 'Fehler beim Kauf des Rahmens');
      }
    } catch (error) {
      console.error('Failed to purchase frame:', error);
      alert('Fehler beim Kauf des Rahmens');
    }
    setIsLoading(false);
  };

  const getFrameCost = (): number => {
    const frameCount = frames.length;
    if (frameCount === 0) return 0; // First frame is free
    return Math.round(500 * Math.pow(1.2, frameCount - 1));
  };

  // Calculate current Cr/h based on degradation over 168 hours (1 week) with like bonus
  const getCurrentCrPerHour = (rarity: string, isVip?: boolean, placedAt?: string, frameId?: number): number => {
    let baseValue: number;
    
    if (isVip || rarity === 'vip') {
      // VIP butterflies: 60 Cr/h → 6 Cr/h over 168 hours (1 week)
      const startValue = 60;
      const minValue = 6;
      baseValue = calculateDegradedValue(startValue, minValue, placedAt);
    } else {
      const rarityValues = {
        'common': { start: 1, min: 1 },       // No degradation for Common
        'uncommon': { start: 2, min: 1 },     // 2 → 1 Cr/h
        'rare': { start: 5, min: 1 },         // 5 → 1 Cr/h over 1 week
        'super-rare': { start: 10, min: 1 },  // 10 → 1 Cr/h over 1 week
        'epic': { start: 20, min: 2 },        // 20 → 2 Cr/h over 1 week
        'legendary': { start: 50, min: 5 },   // 50 → 5 Cr/h over 1 week
        'mythical': { start: 100, min: 10 }   // 100 → 10 Cr/h over 1 week
      };

      const values = rarityValues[rarity as keyof typeof rarityValues] || { start: 1, min: 1 };
      baseValue = calculateDegradedValue(values.start, values.min, placedAt);
    }
    
    // Apply like bonus: 2% per like for 168 hours (1 week)
    if (frameId && frameLikes) {
      const frameWithLikes = frameLikes.find(f => f.frameId === frameId);
      const likesCount = frameWithLikes ? frameWithLikes.totalLikes : 0;
      const likeBonus = 1 + (likesCount * 0.02); // 2% per like
      baseValue = Math.round(baseValue * likeBonus);
    }
    
    return baseValue;
  };

  // Calculate degraded value over 168 hours (1 week)
  const calculateDegradedValue = (startValue: number, minValue: number, placedAt?: string): number => {
    if (!placedAt) return startValue;

    const placedTime = new Date(placedAt).getTime();
    const now = new Date().getTime();
    const timeSincePlacement = now - placedTime;
    const ONE_WEEK = 168 * 60 * 60 * 1000; // 7 days = 168 hours

    // If less than 168 hours (1 week) have passed, calculate degradation
    if (timeSincePlacement < ONE_WEEK) {
      const degradationProgress = timeSincePlacement / ONE_WEEK; // 0 to 1
      const valueRange = startValue - minValue;
      const currentValue = startValue - (valueRange * degradationProgress);
      return Math.max(Math.round(currentValue), minValue);
    }

    // After 168 hours (1 week), return minimum value
    return minValue;
  };

  const getFrameHourlyIncome = (frameId: number): number => {
    // Income from normal butterflies in this frame with time-based degradation and like bonus
    const frameButterflies = exhibitionButterflies.filter(b => b.frameId === frameId);
    const normalIncome = frameButterflies.reduce((total, butterfly) => {
      return total + getCurrentCrPerHour(butterfly.butterflyRarity, false, butterfly.placedAt, butterfly.frameId);
    }, 0);
    
    // Income from VIP butterflies in this frame with time-based degradation and like bonus
    const frameVipButterflies = exhibitionVipButterflies.filter(b => b.frameId === frameId);
    const vipIncome = frameVipButterflies.reduce((total, vipButterfly) => {
      return total + getCurrentCrPerHour('vip', true, vipButterfly.placedAt, vipButterfly.frameId);
    }, 0);
    
    return normalIncome + vipIncome;
  };

  const getTotalHourlyIncome = (): number => {
    // Calculate income from normal butterflies with time-based degradation and like bonus
    const normalIncome = exhibitionButterflies.reduce((total, butterfly) => {
      return total + getCurrentCrPerHour(butterfly.butterflyRarity, false, butterfly.placedAt, butterfly.frameId);
    }, 0);
    
    // Add income from VIP butterflies with time-based degradation and like bonus
    const vipIncome = exhibitionVipButterflies.reduce((total, vipButterfly) => {
      return total + getCurrentCrPerHour('vip', true, vipButterfly.placedAt, vipButterfly.frameId);
    }, 0);
    
    return normalIncome + vipIncome;
  };

  // Navigation helpers
  const getAllButterflies = () => {
    // Combine normal and VIP butterflies for navigation
    const normalButterflies = exhibitionButterflies.map(b => ({ ...b, isVip: false }));
    const vipButterflies = exhibitionVipButterflies.map(vip => ({ 
      id: vip.id,
      userId: vip.userId,
      frameId: vip.frameId,
      slotIndex: vip.slotIndex,
      butterflyId: vip.vipButterflyId,
      butterflyName: vip.vipButterflyName,
      butterflyRarity: 'vip' as const,
      butterflyImageUrl: vip.vipButterflyImageUrl,
      placedAt: vip.placedAt,
      createdAt: vip.createdAt,
      isVip: true
    }));
    return [...normalButterflies, ...vipButterflies];
  };

  const navigateToNextButterfly = () => {
    const allButterflies = getAllButterflies();
    if (allButterflies.length <= 1) return;
    
    const nextIndex = (currentButterflyIndex + 1) % allButterflies.length;
    const nextButterfly = allButterflies[nextIndex];
    setCurrentButterflyIndex(nextIndex);
    setSelectedButterfly(nextButterfly);
  };

  const navigateToPreviousButterfly = () => {
    const allButterflies = getAllButterflies();
    if (allButterflies.length <= 1) return;
    
    const prevIndex = currentButterflyIndex === 0 ? allButterflies.length - 1 : currentButterflyIndex - 1;
    const prevButterfly = allButterflies[prevIndex];
    setCurrentButterflyIndex(prevIndex);
    setSelectedButterfly(prevButterfly);
  };

  const handleButterflyClick = (butterfly: ExhibitionButterfly) => {
    // Add frameId to the butterfly data for the modal
    const butterflyWithFrame = {
      ...butterfly,
      frameId: butterfly.frameId
    };
    
    // Find the index of this butterfly in the combined list
    const allButterflies = getAllButterflies();
    const butterflyIndex = allButterflies.findIndex(b => b.id === butterfly.id && !b.isVip);
    
    setCurrentButterflyIndex(butterflyIndex >= 0 ? butterflyIndex : 0);
    setSelectedButterfly(butterflyWithFrame);
    setShowButterflyDialog(true);
  };

  const handleVipButterflyClick = (vipButterfly: any) => {
    // Convert VIP butterfly to normal butterfly format for the modal
    const butterflyForModal = {
      id: vipButterfly.id,
      userId: vipButterfly.userId,
      frameId: vipButterfly.frameId,
      slotIndex: vipButterfly.slotIndex,
      butterflyId: vipButterfly.vipButterflyId,
      butterflyName: vipButterfly.vipButterflyName,
      butterflyRarity: 'vip',
      butterflyImageUrl: vipButterfly.vipButterflyImageUrl,
      placedAt: vipButterfly.placedAt,
      createdAt: vipButterfly.createdAt,
      isVip: true
    };
    
    // Find the index of this VIP butterfly in the combined list
    const allButterflies = getAllButterflies();
    const butterflyIndex = allButterflies.findIndex(b => b.id === vipButterfly.id && b.isVip);
    
    setCurrentButterflyIndex(butterflyIndex >= 0 ? butterflyIndex : 0);
    setSelectedButterfly(butterflyForModal);
    setShowButterflyDialog(true);
  };

  const handleEmptySlotClick = (frameId: number, slotIndex: number) => {
    setSelectedSlot({ frameId, slotIndex });
    
    // Show appropriate inventory dialog based on available butterflies
    if (userVipButterflies.length > 0 && userButterflies.length > 0) {
      // Ask user which type they want to place
      const choice = window.confirm("VIP-Schmetterling verwenden? \n\nOK = VIP-Schmetterling\nAbbrechen = Normaler Schmetterling");
      if (choice) {
        setShowVipInventoryDialog(true);
      } else {
        setShowInventoryDialog(true);
      }
    } else if (userVipButterflies.length > 0) {
      setShowVipInventoryDialog(true);
    } else {
      setShowInventoryDialog(true);
    }
  };

  const placeButterflyInSlot = async (butterflyId: number) => {
    if (!selectedSlot || !user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/exhibition/place-butterfly', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user?.id.toString() || '1'
        },
        body: JSON.stringify({ 
          userId: user.id, 
          frameId: selectedSlot.frameId, 
          slotIndex: selectedSlot.slotIndex, 
          butterflyId 
        })
      });
      
      if (response.ok) {
        await fetchExhibitionData();
        await fetchUserButterflies();
        await fetchUserVipButterflies();
        await loadFrameLikes();
        setShowInventoryDialog(false);
        setSelectedSlot(null);
      } else {
        const error = await response.json();
        alert(error.message || 'Fehler beim Platzieren des Schmetterlings');
      }
    } catch (error) {
      console.error('Failed to place butterfly:', error);
      alert('Fehler beim Platzieren des Schmetterlings');
    }
    setIsLoading(false);
  };

  const placeVipButterflyInSlot = async (vipButterflyId: number) => {
    if (!selectedSlot || !user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/exhibition/place-vip-butterfly', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user?.id.toString() || '1'
        },
        body: JSON.stringify({ 
          userId: user.id, 
          frameId: selectedSlot.frameId, 
          slotIndex: selectedSlot.slotIndex, 
          vipButterflyId 
        })
      });
      
      if (response.ok) {
        await fetchExhibitionData();
        await fetchUserButterflies();
        await fetchUserVipButterflies();
        await loadFrameLikes();
        setShowVipInventoryDialog(false);
        setSelectedSlot(null);
      } else {
        const error = await response.json();
        alert(error.message || 'Fehler beim Platzieren des VIP-Schmetterlings');
      }
    } catch (error) {
      console.error('Failed to place VIP butterfly:', error);
      alert('Fehler beim Platzieren des VIP-Schmetterlings');
    }
    setIsLoading(false);
  };

  const renderFrame = (frame: ExhibitionFrame, index: number) => {
    const frameButterflies = exhibitionButterflies.filter(b => b.frameId === frame.id);
    const frameVipButterflies = exhibitionVipButterflies.filter(b => b.frameId === frame.id);
    const totalButterflies = frameButterflies.length + frameVipButterflies.length;
    const isFullFrame = totalButterflies === 10;
    const frameLike = frameLikes.find(fl => fl.frameId === frame.id);
    
    return (
      <Card key={frame.id} className="bg-gradient-to-br from-amber-900 to-amber-800 border-amber-700 shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-amber-100 text-center flex items-center justify-between text-xl">
            <div className="flex items-center">
              <Trophy className="h-6 w-6 mr-3 text-amber-300" />
              <span>Rahmen #{frame.frameNumber} ({getFrameHourlyIncome(frame.id)} cr/h)</span>
              {isFullFrame && (
                <span className="ml-3 text-sm bg-green-600 text-white px-3 py-1 rounded-full animate-pulse shadow-lg">
                  ✨ Vollständig
                </span>
              )}
              {!isFullFrame && (
                <span className="ml-3 text-sm bg-amber-600 text-amber-100 px-3 py-1 rounded-full">
                  {totalButterflies}/6
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Likes Display */}
              {(frameLike?.totalLikes || 0) > 0 && (
                <div className="flex items-center text-pink-300">
                  <Star className="h-5 w-5 mr-2 fill-pink-300" />
                  <span className="text-base">{frameLike?.totalLikes}</span>
                  {isFullFrame && (
                    <span className="ml-2 text-sm text-green-300">(+{frameLike?.totalLikes * 2}% Einkommen)</span>
                  )}
                </div>
              )}
              
              {/* Navigation Controls */}
              {frames.length > 1 && (
                <div className="flex items-center space-x-3 bg-amber-800/60 rounded-lg px-3 py-2 border border-amber-600">
                  <Button
                    onClick={() => setCurrentFrameIndex(Math.max(0, currentFrameIndex - 1))}
                    disabled={currentFrameIndex === 0}
                    variant="outline"
                    size="sm"
                    className="bg-amber-700 border-amber-500 hover:bg-amber-600 text-amber-100 disabled:opacity-50 h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="text-base font-semibold text-amber-100 px-3">
                    #{frame.frameNumber} / {frames.length}
                  </div>
                  
                  <Button
                    onClick={() => setCurrentFrameIndex(Math.min(frames.length - 1, currentFrameIndex + 1))}
                    disabled={currentFrameIndex >= frames.length - 1}
                    variant="outline"
                    size="sm"
                    className="bg-amber-700 border-amber-500 hover:bg-amber-600 text-amber-100 disabled:opacity-50 h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Wood frame effect */}
          <div className="bg-gradient-to-br from-amber-700 to-amber-900 p-8 rounded-lg border-4 border-amber-600 shadow-inner">
            <div className="bg-slate-100 p-7 rounded grid grid-cols-3 grid-rows-2 gap-3 h-[800px] place-items-center">
              {Array.from({ length: 6 }, (_, slotIndex) => {
                const butterfly = frameButterflies.find(b => b.slotIndex === slotIndex);
                const vipButterfly = frameVipButterflies.find(b => b.slotIndex === slotIndex);
                const hasContent = butterfly || vipButterfly;
                
                return (
                  <div 
                    key={slotIndex}
                    className="aspect-square bg-white border border-slate-300 rounded flex items-center justify-center overflow-hidden shadow-md hover:shadow-lg transition-shadow min-h-0"
                  >
                    {hasContent ? (
                      vipButterfly ? (
                        // VIP Butterfly Display
                        <ButterflyHoverPreview
                          butterflyImageUrl={vipButterfly.vipButterflyImageUrl}
                          butterflyName={vipButterfly.vipButterflyName}
                          rarity="vip" as any
                          placedAt={vipButterfly.placedAt}
                          canSell={sellStatuses[`vip-${vipButterfly.id}`]?.canSell}
                          timeRemainingMs={sellStatuses[`vip-${vipButterfly.id}`]?.timeRemainingMs}
                        >
                          <div 
                            className="w-full h-full cursor-pointer relative group bg-gradient-to-br from-pink-800/50 to-purple-800/50 rounded border-2 border-pink-500"
                            onClick={() => handleVipButterflyClick(vipButterfly)}
                          >
                            {/* Animated sparkle overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded animate-pulse"></div>
                            
                            <img
                              src={vipButterfly.vipButterflyImageUrl}
                              alt={vipButterfly.vipButterflyName}
                              className="w-full h-full object-cover rounded transition-transform group-hover:scale-105 relative z-10"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            
                            {/* VIP Crown Icon */}
                            <div className="absolute top-1 right-1 bg-yellow-400 rounded-full p-1 z-20">
                              <Star className="w-3 h-3 text-yellow-900" fill="currentColor" />
                            </div>
                            
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded flex items-center justify-center z-20">
                              <Info className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </ButterflyHoverPreview>
                      ) : (
                        // Normal Butterfly Display
                        <ButterflyHoverPreview
                          butterflyImageUrl={butterfly.butterflyImageUrl}
                          butterflyName={butterfly.butterflyName}
                          rarity={butterfly.butterflyRarity as RarityTier}
                          placedAt={butterfly.placedAt}
                          canSell={sellStatuses[`normal-${butterfly.id}`]?.canSell}
                          timeRemainingMs={sellStatuses[`normal-${butterfly.id}`]?.timeRemainingMs}
                        >
                          <div 
                            className="w-full h-full cursor-pointer relative group"
                            onClick={() => handleButterflyClick(butterfly)}
                          >
                            <RarityImage
                              src={butterfly.butterflyImageUrl}
                              alt={butterfly.butterflyName}
                              rarity={butterfly.butterflyRarity as RarityTier}
                              size="medium"
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded flex items-center justify-center">
                              <Info className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </ButterflyHoverPreview>
                      )
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => handleEmptySlotClick(frame.id, slotIndex)}
                      >
                        <div className="text-slate-400 text-4xl hover:text-slate-600">+</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

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
    <div className="p-6 space-y-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-full">
      {/* Exhibition Header with Stats */}
      <div className="bg-slate-800/60 p-6 rounded-lg border border-purple-500/30">
        {/* Title Section */}
        <div className="relative mb-4">
          {/* HelpButton in absoluter Position rechts oben */}
          <div className="absolute top-0 right-0">
            <HelpButton helpText="In der Ausstellung präsentierst du deine schönsten Schmetterlinge in Rahmen! Du verdienst passiv Credits pro Stunde basierend auf der Rarität deiner ausgestellten Schmetterlinge. VIP-Schmetterlinge bringen noch mehr Credits!" viewType="exhibition" />
          </div>
          
          {/* Zentrierter Content */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-purple-300 mb-1">
              Schmetterlingsausstellung 🦋
            </h1>
            <p className="text-slate-400 text-sm">Stelle deine Schmetterlinge aus</p>
          </div>
        </div>
        
        {/* Compact Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-800/40 to-emerald-800/40 border border-green-500/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className="h-3 w-3 text-green-400 mr-1" />
              <span className="text-xs font-semibold text-green-300">Einkommen</span>
            </div>
            <div className="text-lg font-bold text-green-400">{getTotalHourlyIncome()} Cr/h</div>
          </div>

          <div className="bg-gradient-to-br from-blue-800/40 to-indigo-800/40 border border-blue-500/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Star className="h-3 w-3 text-blue-400 mr-1" />
              <span className="text-xs font-semibold text-blue-300">Schmetterlinge</span>
            </div>
            <div className="text-lg font-bold text-blue-400">{exhibitionButterflies.length}</div>
          </div>

          <div className="bg-gradient-to-br from-amber-800/40 to-orange-800/40 border border-amber-500/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Trophy className="h-3 w-3 text-amber-400 mr-1" />
              <span className="text-xs font-semibold text-amber-300">Rahmen</span>
            </div>
            <div className="text-lg font-bold text-amber-400">{frames.length}</div>
          </div>
        </div>
      </div>

      {/* Frame Display */}
      {frames.length > 0 && (
        <div className="max-w-7xl mx-auto">
          {frames[currentFrameIndex] && renderFrame(frames[currentFrameIndex], currentFrameIndex)}
        </div>
      )}
      
      {/* Compact Purchase New Frame Button */}
      <Card className="bg-gradient-to-br from-purple-800/40 to-indigo-800/40 border border-purple-500/30 border-dashed shadow-lg">
        <CardContent className="p-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <Trophy className="h-6 w-6 text-amber-400" />
              <h3 className="text-lg font-semibold text-white">
                {frames.length === 0 ? 'Erster Rahmen kostenlos!' : `Neuer Rahmen - ${getFrameCost()} Cr`}
              </h3>
            </div>
            <Button 
              onClick={purchaseFrame}
              disabled={isLoading || (frames.length > 0 && credits < getFrameCost())}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              {frames.length === 0 ? 'Kostenlosen Rahmen holen' : `Rahmen kaufen (${getFrameCost()} Cr)`}
            </Button>
            {frames.length > 0 && credits < getFrameCost() && (
              <p className="text-red-400 text-sm mt-2">⚠️ Nicht genügend Credits</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Butterfly Detail Modal */}
      <ButterflyDetailModal
        butterfly={selectedButterfly ? {
          id: selectedButterfly.id,
          butterflyName: selectedButterfly.butterflyName,
          butterflyRarity: selectedButterfly.butterflyRarity,
          butterflyImageUrl: selectedButterfly.butterflyImageUrl,
          placedAt: typeof selectedButterfly.placedAt === 'string' ? selectedButterfly.placedAt : selectedButterfly.placedAt.toISOString(),
          userId: selectedButterfly.userId
        } : null}
        isOpen={showButterflyDialog}
        onClose={() => setShowButterflyDialog(false)}
        onSold={() => {
          fetchExhibitionData();
          fetchUserButterflies();
          fetchUserVipButterflies();
        }}
        currentIndex={currentButterflyIndex}
        totalCount={getAllButterflies().length}
        onNext={navigateToNextButterfly}
        onPrevious={navigateToPreviousButterfly}
      />

      {/* Butterfly Inventory Dialog */}
      <Dialog open={showInventoryDialog} onOpenChange={setShowInventoryDialog}>
        <DialogContent className="bg-slate-900 border-slate-600 text-white max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">
              Schmetterling auswählen
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {userButterflies.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                Keine Schmetterlinge im Inventar
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userButterflies
                  .filter((butterfly) => {
                    // Filter out butterflies that are already in this frame
                    if (!selectedSlot) return true;
                    const butterfliesInFrame = exhibitionButterflies.filter(eb => eb.frameId === selectedSlot.frameId);
                    return !butterfliesInFrame.some(eb => eb.butterflyId === butterfly.butterflyId);
                  })
                  .map((butterfly) => (
                  <Card
                    key={butterfly.id}
                    className="bg-slate-800 border-slate-600 cursor-pointer hover:bg-slate-700 transition-colors"
                    onClick={() => placeButterflyInSlot(butterfly.butterflyId)}
                  >
                    <CardContent className="p-4">
                      <ButterflyHoverPreview
                        butterflyImageUrl={butterfly.butterflyImageUrl}
                        butterflyName={butterfly.butterflyName}
                        rarity={butterfly.butterflyRarity as RarityTier}
                      >
                        <div className="text-center">
                          <RarityImage 
                            src={butterfly.butterflyImageUrl}
                            alt={butterfly.butterflyName}
                            rarity={butterfly.butterflyRarity as RarityTier}
                            size="large"
                            className="w-16 h-16 mx-auto mb-2"
                          />
                          <div className="text-sm font-semibold text-white mb-1">
                            {butterfly.butterflyName}
                          </div>
                          <div className={`text-xs ${getRarityColor(butterfly.butterflyRarity as RarityTier)} mb-1`}>
                            {getRarityDisplayName(butterfly.butterflyRarity as RarityTier)}
                          </div>
                          <div className="text-xs text-slate-400">
                            Anzahl: {butterfly.quantity}
                          </div>
                        </div>
                      </ButterflyHoverPreview>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* VIP Butterfly Inventory Dialog */}
      <Dialog open={showVipInventoryDialog} onOpenChange={setShowVipInventoryDialog}>
        <DialogContent className="bg-gradient-to-br from-pink-900 to-purple-900 border-pink-500 text-white max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-pink-200 flex items-center justify-center gap-2">
              <Star className="h-6 w-6 text-pink-400" fill="currentColor" />
              VIP-Schmetterling auswählen ✨👑
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {userVipButterflies.length === 0 ? (
              <div className="text-center py-8 text-pink-300">
                Keine VIP-Schmetterlinge im Inventar
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userVipButterflies.map((vipButterfly) => (
                  <Card
                    key={vipButterfly.id}
                    className="bg-gradient-to-r from-pink-800/50 to-purple-800/50 border-pink-500 cursor-pointer hover:from-pink-700/60 hover:to-purple-700/60 transition-colors relative"
                    onClick={() => placeVipButterflyInSlot(vipButterfly.vipButterflyId)}
                  >
                    {/* Animated sparkle overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg animate-pulse"></div>
                    
                    <CardContent className="p-4 relative z-10">
                      <div className="text-center">
                        {/* VIP GIF Display */}
                        <div className="relative mb-2">
                          <img
                            src={vipButterfly.vipButterflyImageUrl}
                            alt={vipButterfly.vipButterflyName}
                            className="w-16 h-16 mx-auto rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          {/* VIP Crown Icon */}
                          <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                            <Star className="w-3 h-3 text-yellow-900" fill="currentColor" />
                          </div>
                        </div>
                        
                        <div className="text-sm font-semibold text-pink-200 mb-1 flex items-center justify-center gap-1">
                          {vipButterfly.vipButterflyName}
                          <span className="text-yellow-400">👑</span>
                        </div>
                        <div className="text-xs text-pink-300 font-semibold mb-1">
                          ✨ VIP Premium
                        </div>
                        <div className="text-xs text-pink-400">
                          Anzahl: {vipButterfly.quantity}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};