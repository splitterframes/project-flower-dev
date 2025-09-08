import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, CreditCard, Gift, Loader2 } from "lucide-react";

interface DonateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName?: string;
}

export function DonateDialog({ open, onOpenChange, recipientName = "dem Spieler" }: DonateDialogProps) {
  const [donorName, setDonorName] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDonate = async () => {
    if (!donorName.trim() || !amount || parseFloat(amount) < 1) {
      alert('Bitte alle Felder ausfüllen und mindestens 1€ spenden.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/stripe/create-donation-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          donorName: donorName.trim(),
          recipientName
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(`Fehler: ${data.error}`);
        return;
      }

      // Weiterleitung zu Stripe Checkout
      window.location.href = data.checkoutUrl;

    } catch (error) {
      console.error('Donation error:', error);
      alert('Fehler beim Erstellen der Spende. Bitte erneut versuchen.');
    } finally {
      setIsLoading(false);
    }
  };

  const presetAmounts = [2, 5, 10, 20];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Heart className="text-red-500" size={24} />
            💖 Spende für Mariposa
          </DialogTitle>
          <DialogDescription className="text-base">
            Unterstütze Mich mit einer kleinen Spende! 
            Alle Zahlungen werden sicher über Stripe verarbeitet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Spender Name */}
          <div className="space-y-2">
            <Label htmlFor="donorName" className="text-sm font-medium">
              Dein Name (wird angezeigt)
            </Label>
            <Input
              id="donorName"
              placeholder="Dein Spender-Name..."
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              className="text-base"
            />
          </div>

          {/* Betrag Auswahl */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Spendenbetrag wählen</Label>
            
            {/* Preset Beträge */}
            <div className="grid grid-cols-4 gap-2">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  variant={amount === preset.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(preset.toString())}
                  className="text-sm"
                >
                  {preset}€
                </Button>
              ))}
            </div>

            {/* Individueller Betrag */}
            <div className="space-y-2">
              <Label htmlFor="customAmount" className="text-xs text-muted-foreground">
                Oder eigener Betrag:
              </Label>
              <div className="relative">
                <Input
                  id="customAmount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-8 text-base"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  €
                </div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard size={16} />
                Sichere Zahlung
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground">
              <ul className="space-y-1">
                <li>✅ Stripe - Vertrauenswürdiger Payment-Anbieter</li>
                <li>✅ Alle Kreditkarten & PayPal akzeptiert</li>
                <li>✅ SSL-verschlüsselt & 100% sicher</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Abbrechen
          </Button>
          <Button 
            onClick={handleDonate}
            disabled={isLoading || !donorName.trim() || !amount || parseFloat(amount) < 1}
            className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Weiterleitung...
              </>
            ) : (
              <>
                <Gift className="mr-2 h-4 w-4" />
                {amount ? `${amount}€ spenden` : 'Spenden'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}