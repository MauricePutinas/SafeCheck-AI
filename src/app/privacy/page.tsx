import Link from "next/link";

export const metadata = {
  title: "Datenschutz — AI SafeCheck Lite",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Datenschutz</h1>
        <p className="mt-2 text-slate-400">
          AI SafeCheck Lite ist darauf ausgelegt, Datenrisiken zu reduzieren —
          nicht zu schaffen. Hier erklaeren wir transparent, wie das Tool mit
          deinen Daten umgeht.
        </p>
      </header>

      <Section title="Lokale, regelbasierte Verarbeitung">
        <p>
          Die Pruefung deiner Eingaben erfolgt <strong>regelbasiert</strong> und
          standardmaessig <strong>lokal in deinem Browser</strong>. Der Scanner
          nutzt feste Muster (Regex) und deine Watchlist. Es werden{" "}
          <strong>keine externen KI-Dienste</strong> aufgerufen, um deinen Text
          zu analysieren.
        </p>
      </Section>

      <Section title="Was gespeichert wird">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Wenn du einen Scan speicherst, werden{" "}
            <strong>nur Score und (maskierte) Findings</strong> abgelegt.
          </li>
          <li>
            Der <strong>Originaltext wird standardmaessig nicht gespeichert</strong>.
            Du kannst dies pro Scan und global in den Einstellungen aktivieren.
          </li>
          <li>
            Findings enthalten <strong>niemals das vollstaendige Secret</strong>,
            sondern nur einen maskierten Auszug (z.B. <code>sk••••••••89</code>).
          </li>
        </ul>
      </Section>

      <Section title="Datenschutzfreundlicher Modus">
        <p>
          Im datenschutzfreundlichen Modus wird der Originaltext nach dem Scan{" "}
          <strong>verworfen</strong>. So bleiben sensible Inhalte gar nicht erst
          in der Datenbank. Diesen Modus steuerst du in den{" "}
          <Link href="/settings" className="text-accent hover:underline">
            Einstellungen
          </Link>{" "}
          (Option „Originaltext speichern“ deaktivieren).
        </p>
      </Section>

      <Section title="Speicherort">
        <p>
          Daten werden in einer lokalen <strong>SQLite-Datenbank</strong>{" "}
          gespeichert (Standard: <code>prisma/dev.db</code>). Bei lokalem Betrieb
          verlassen die Daten deinen Rechner nicht.
        </p>
      </Section>

      <Section title="Keine Angriffsfunktionen">
        <p>
          Dieses Tool ist <strong>rein defensiv</strong>. Es erkennt und warnt
          vor Risiken. Es bietet keine Angriffsfunktionen, keine Exploits und
          keine Umgehungstechniken. Prompt-Injection- und „riskante Anweisungen“
          werden ausschliesslich als <strong>Warnmuster</strong> erkannt.
        </p>
      </Section>

      <div className="rounded-xl border border-line bg-ink-950/40 p-4 text-sm text-slate-400">
        <strong className="text-slate-300">Rechtlicher Hinweis:</strong> AI
        SafeCheck Lite liefert einen technischen Vorabcheck und stellt{" "}
        <em>keine Rechtsberatung</em> dar. Fuer verbindliche Datenschutz-Aussagen
        wende dich an eine fachkundige Stelle.
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card card-pad">
      <h2 className="mb-2 text-lg font-semibold text-white">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-slate-300">
        {children}
      </div>
    </section>
  );
}
