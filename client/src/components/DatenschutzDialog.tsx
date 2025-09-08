import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DatenschutzDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DatenschutzDialog: React.FC<DatenschutzDialogProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">🔒 Datenschutzerklärung</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 text-sm">
          <section>
            <h3 className="font-semibold text-base mb-2">1. Datenschutz auf einen Blick</h3>
            <p className="text-slate-300 leading-relaxed mb-3">
              Diese Datenschutzerklärung klärt Sie über die Art, den Umfang und Zweck der Verarbeitung von personenbezogenen Daten innerhalb unseres Onlineangebotes und der mit ihm verbundenen Webseiten, Funktionen und Inhalte auf.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">2. Verantwortliche Stelle</h3>
            <div className="space-y-1 text-slate-300">
              <p><strong>Verantwortlich:</strong> Mariposa Game Studio</p>
              <p><strong>E-Mail:</strong> datenschutz@mariposa-game.de</p>
              <p><strong>Anschrift:</strong> Beispielstraße 123, 12345 Musterstadt</p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">3. Erfassung und Verarbeitung von Daten</h3>
            
            <h4 className="font-medium mb-2 mt-4">3.1 Registrierung und Login</h4>
            <div className="text-slate-300 space-y-2">
              <p><strong>Erfasste Daten:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Benutzername</li>
                <li>Passwort (verschlüsselt gespeichert)</li>
                <li>Spielfortschritt und Spielstatistiken</li>
              </ul>
              <p><strong>Zweck:</strong> Bereitstellung des Spieldienstes, Verwaltung Ihres Spielaccounts</p>
              <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</p>
            </div>

            <h4 className="font-medium mb-2 mt-4">3.2 Spielaktivitäten</h4>
            <div className="text-slate-300 space-y-2">
              <p><strong>Erfasste Daten:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Spielaktionen und -entscheidungen</li>
                <li>Spielfortschritt (Credits, Suns, DNA, Tickets)</li>
                <li>Sammlungen (Blumen, Schmetterlinge, etc.)</li>
                <li>Zeitstempel der Aktivitäten</li>
              </ul>
              <p><strong>Zweck:</strong> Spielfunktionalität, Fortschritt speichern, Ranglisten</p>
              <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</p>
            </div>

            <h4 className="font-medium mb-2 mt-4">3.3 Zahlungsverarbeitung (Spenden)</h4>
            <div className="text-slate-300 space-y-2">
              <p><strong>Externe Verarbeitung:</strong> Stripe (Stripe, Inc., USA)</p>
              <p><strong>Erfasste Daten:</strong> Zahlungsinformationen werden ausschließlich bei Stripe verarbeitet</p>
              <p><strong>Zweck:</strong> Verarbeitung von freiwilligen Spenden</p>
              <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">4. Cookies und lokale Speicherung</h3>
            <p className="text-slate-300 leading-relaxed">
              Unser Spiel verwendet Session-Cookies für die Anmeldung und lokale Browser-Speicher für Spieleinstellungen. Diese Daten werden nur lokal gespeichert und nicht an Dritte weitergegeben.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">5. Datenweitergabe</h3>
            <p className="text-slate-300 leading-relaxed">
              Ihre Daten werden nicht an Dritte verkauft oder weitergegeben, außer:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 text-slate-300 mt-2">
              <li>Bei Zahlungsverarbeitung über Stripe</li>
              <li>Wenn gesetzlich dazu verpflichtet</li>
              <li>Mit Ihrer ausdrücklichen Einwilligung</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">6. Speicherdauer</h3>
            <p className="text-slate-300 leading-relaxed">
              Ihre Spielerdaten werden solange gespeichert, wie Sie aktiver Spieler sind. Bei Löschung Ihres Accounts werden alle personenbezogenen Daten innerhalb von 30 Tagen gelöscht.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">7. Ihre Rechte</h3>
            <div className="text-slate-300 space-y-2">
              <p>Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
                <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
                <li>Recht auf Löschung (Art. 17 DSGVO)</li>
                <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
                <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">8. Datensicherheit</h3>
            <p className="text-slate-300 leading-relaxed">
              Wir verwenden technische und organisatorische Sicherheitsmaßnahmen, um Ihre Daten vor Verlust, Manipulation und unberechtigtem Zugriff zu schützen. Passwörter werden verschlüsselt gespeichert.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">9. Kontakt</h3>
            <p className="text-slate-300">
              Bei Fragen zum Datenschutz kontaktieren Sie uns unter: 
              <br />
              <strong>E-Mail:</strong> datenschutz@mariposa-game.de
            </p>
          </section>

          <section>
            <p className="text-xs text-slate-400 pt-4 border-t border-slate-700">
              Stand dieser Datenschutzerklärung: September 2025
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};