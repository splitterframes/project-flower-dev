import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ImpressumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImpressumDialog: React.FC<ImpressumDialogProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">📄 Impressum</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 text-sm">
          <section>
            <h3 className="font-semibold text-base mb-2">Angaben gemäß § 5 TMG</h3>
            <div className="space-y-1 text-slate-300">
              <p><strong>Betreiber:</strong> Mariposa Game Studio</p>
              <p><strong>Anschrift:</strong> Beispielstraße 123</p>
              <p><strong>PLZ/Ort:</strong> 12345 Musterstadt</p>
              <p><strong>Land:</strong> Deutschland</p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">Kontakt</h3>
            <div className="space-y-1 text-slate-300">
              <p><strong>Telefon:</strong> +49 (0) 123 456789</p>
              <p><strong>E-Mail:</strong> kontakt@mariposa-game.de</p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h3>
            <div className="space-y-1 text-slate-300">
              <p>Mariposa Game Studio</p>
              <p>Beispielstraße 123</p>
              <p>12345 Musterstadt</p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">Haftung für Inhalte</h3>
            <p className="text-slate-300 leading-relaxed">
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht unter der Verpflichtung, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">Haftung für Links</h3>
            <p className="text-slate-300 leading-relaxed">
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">Urheberrecht</h3>
            <p className="text-slate-300 leading-relaxed">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">Spielinhalte</h3>
            <p className="text-slate-300 leading-relaxed">
              Mariposa ist ein Browser-basiertes Spiel. Alle Spielinhalte, Grafiken, Namen und Spielmechaniken sind urheberrechtlich geschützt. Das Spiel wird "wie besehen" zur Verfügung gestellt. Wir übernehmen keine Gewähr für Verfügbarkeit oder Spielfortschritt.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">Zahlungen</h3>
            <p className="text-slate-300 leading-relaxed">
              Spenden über Stripe werden sicher verarbeitet. Alle Transaktionen sind freiwillig und dienen der Unterstützung des Spiels. Es besteht kein Anspruch auf Rückzahlung von Spenden.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};