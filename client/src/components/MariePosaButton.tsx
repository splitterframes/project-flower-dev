import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';
import MariePosaDialog from './MariePosaDialog';
import MariePosaReturnDialog from './MariePosaReturnDialog';
import { useAuth } from '@/lib/stores/useAuth';

interface MariePosaButtonProps {
  userId: number;
}

export default function MariePosaButton({ userId }: MariePosaButtonProps) {
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [nextAvailableAt, setNextAvailableAt] = useState<Date | null>(null);

  const checkMariePosaStatus = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/user/${userId}/marie-posa-status`);
      if (response.ok) {
        const data = await response.json();
        setIsAvailable(data.isAvailable);
        setNextAvailableAt(data.nextAvailableAt ? new Date(data.nextAvailableAt) : null);
      }
    } catch (error) {
      console.error('Error checking Marie Posa status:', error);
    }
  };

  // Check status on mount and every minute
  useEffect(() => {
    checkMariePosaStatus();
    const interval = setInterval(checkMariePosaStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [userId]);

  const handleClick = () => {
    if (isAvailable) {
      setShowDialog(true);
    } else {
      // Show nice dialog when Marie Posa will be available next
      if (nextAvailableAt && nextAvailableAt.getTime() > Date.now()) {
        setShowReturnDialog(true);
      }
    }
  };

  const handlePurchaseComplete = () => {
    // Refresh status after successful purchase
    checkMariePosaStatus();
  };

  const buttonClassName = isAvailable 
    ? "border-yellow-500 text-yellow-300 hover:bg-yellow-800 hover:text-white shadow-lg shadow-yellow-400/20 animate-pulse px-2 sm:px-3" 
    : "border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-slate-300 px-2 sm:px-3";

  const titleText = isAvailable 
    ? "Marie Posa - Handeln verfügbar!" 
    : nextAvailableAt 
      ? `Marie Posa - Verfügbar um ${nextAvailableAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
      : "Marie Posa - Exklusive Händlerin";

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        className={buttonClassName}
        title={titleText}
      >
        <Crown className={`h-4 w-4 sm:mr-2 ${isAvailable ? 'text-yellow-400' : 'text-slate-400'}`} />
        <span className="hidden sm:inline">
          {isAvailable ? "Marie" : "Marie"}
        </span>
      </Button>

      <MariePosaDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        user={user}
        onPurchaseComplete={handlePurchaseComplete}
      />

      {nextAvailableAt && (
        <MariePosaReturnDialog
          isOpen={showReturnDialog}
          onClose={() => setShowReturnDialog(false)}
          nextAvailableAt={nextAvailableAt}
        />
      )}
    </>
  );
}