import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="space-y-24">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-grid-faint [background-size:32px_32px] opacity-40" />
        <div className="mx-auto max-w-3xl text-center">
          <span className="chip mb-5 border border-accent/30 bg-accent-soft text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Defensiver Sicherheits-Check · 100 % lokal & regelbasiert
          </span>
          <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Bevor interne Daten im{" "}
            <span className="text-accent">KI-Chat</span> landen.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-slate-300">
            AI SafeCheck Lite prueft Texte, E-Mails und Code-Snippets auf
            Secrets, Passwoerter, Zugangsdaten, personenbezogene und interne
            Firmendaten — <span className="text-white">bevor</span> du sie in
            ChatGPT, Claude, Gemini oder Copilot einfuegst.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/scanner" className="btn-primary px-6 py-3 text-base">
              Text jetzt pruefen →
            </Link>
            <Link href="/privacy" className="btn-ghost px-6 py-3 text-base">
              Wie wir Daten schuetzen
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Keine Anmeldung noetig · Keine externen KI-APIs · Secrets werden nie
            vollstaendig angezeigt
          </p>
        </div>

        {/* Ampel-Vorschau */}
        <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
          <TrafficCard
            color="green"
            title="Gruen"
            text="Keine kritischen Inhalte erkannt. Text kann i. d. R. geteilt werden."
          />
          <TrafficCard
            color="yellow"
            title="Gelb"
            text="Potenziell sensible Inhalte. Vor dem Teilen pruefen & maskieren."
          />
          <TrafficCard
            color="red"
            title="Rot"
            text="Secrets oder vertrauliche Daten gefunden. Nicht ungeprueft einfuegen."
          />
        </div>
      </section>

      {/* PROBLEM */}
      <section className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Das Problem"
          title="Ein kopierter Textblock — und das Secret ist weg"
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <ProblemCard
            title="Unbeabsichtigte Datenlecks"
            text="Mitarbeitende fuegen schnell eine E-Mail oder ein Log in ein KI-Tool ein — inkl. API-Key, IBAN oder Kundennamen."
          />
          <ProblemCard
            title="Compliance-Risiko"
            text="Personenbezogene und vertrauliche Daten verlassen unkontrolliert das Unternehmen. Schwer nachzuvollziehen."
          />
          <ProblemCard
            title="Manipulierter Text"
            text="Kopierte Inhalte enthalten manchmal versteckte Prompt-Injection- oder riskante Anweisungen."
          />
        </div>
      </section>

      {/* NUTZEN */}
      <section className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Nutzen fuer Firmen"
          title="Ein einfacher Check, der teure Fehler verhindert"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <BenefitCard
            title="Sensibilisierung im Arbeitsfluss"
            text="Der Check passt genau dorthin, wo das Risiko entsteht: vor dem Einfuegen. Kein Schulungs-PDF, das niemand liest."
          />
          <BenefitCard
            title="Sichere, bereinigte Version"
            text="Mit einem Klick eine maskierte Fassung erzeugen ([API_KEY_REDACTED], [EMAIL_REDACTED] …) und gefahrlos weiterverwenden."
          />
          <BenefitCard
            title="Datenschutzfreundlich by Design"
            text="Verarbeitung lokal & regelbasiert. Originaltext wird optional gar nicht gespeichert."
          />
          <BenefitCard
            title="Eigene Watchlist"
            text="Firmenname, Projektnamen, Kundennamen und interne Tools als eigene Begriffe hinterlegen."
          />
        </div>
      </section>

      {/* BEISPIELE (ohne echte Daten) */}
      <section className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Beispiele"
          title="So sieht ein Befund aus (mit Demo-Daten)"
        />
        <div className="card card-pad">
          <p className="mb-4 text-sm text-slate-400">
            Alle Beispiele sind frei erfundene Demo-Daten — keine echten
            Secrets.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <ExampleFinding
              icon="🔑"
              severity="Kritisch"
              tone="red"
              title="API Key erkannt"
              masked="sk••••••••••89"
              tip="Key entfernen & rotieren"
            />
            <ExampleFinding
              icon="👤"
              severity="Mittel"
              tone="yellow"
              title="E-Mail-Adresse"
              masked="s••••••••••"
              tip="Maskieren, wenn nicht noetig"
            />
            <ExampleFinding
              icon="🏢"
              severity="Mittel"
              tone="yellow"
              title="Interne URL"
              masked="ht••••••••••in"
              tip="Durch Platzhalter ersetzen"
            />
            <ExampleFinding
              icon="🧨"
              severity="Hoch"
              tone="red"
              title="Prompt-Injection-Hinweis"
              masked="Ig••••••••••ns"
              tip="Nicht uebernehmen, Quelle pruefen"
            />
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="mx-auto max-w-5xl">
        <SectionHeading eyebrow="Preise" title="Fair & transparent" />
        <div className="grid gap-5 md:grid-cols-3">
          <PriceCard
            name="Lite"
            price="29 €"
            period="einmalig"
            highlight={false}
            features={[
              "Voller regelbasierter Scanner",
              "Safe Rewrite & Maskierung",
              "Lokaler Verlauf",
              "HTML-/Druck-Report",
            ]}
            cta="Lite waehlen"
          />
          <PriceCard
            name="Pro"
            price="9 €"
            period="/ Monat"
            highlight={true}
            features={[
              "Alles aus Lite",
              "Strenger Modus",
              "Eigene Watchlist (unbegrenzt)",
              "Erweiterte Reports",
            ]}
            cta="Pro starten"
          />
          <PriceCard
            name="Business"
            price="79 €"
            period="/ Monat"
            highlight={false}
            features={[
              "Alles aus Pro",
              "Watchlist-Vorlagen fuer Teams",
              "Admin-Bereich & Lizenzstatus",
              "Prioritaets-Support",
            ]}
            cta="Business anfragen"
          />
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">
          Lizenzierung vorbereitet ueber Lemon Squeezy. Aktivierung im{" "}
          <Link href="/admin" className="text-accent hover:underline">
            Adminbereich
          </Link>
          .
        </p>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl">
        <div className="card card-pad text-center">
          <h3 className="text-2xl font-semibold">In 5 Sekunden zur Sicherheit</h3>
          <p className="mt-2 text-slate-300">
            Fuege einen Text ein und sieh sofort, was du besser nicht teilst.
          </p>
          <Link
            href="/scanner"
            className="btn-primary mx-auto mt-6 px-6 py-3 text-base"
          >
            Zum Scanner →
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ---------- Hilfs-Komponenten ---------- */

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-7">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">
        {eyebrow}
      </p>
      <h2 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

function TrafficCard({
  color,
  title,
  text,
}: {
  color: "green" | "yellow" | "red";
  title: string;
  text: string;
}) {
  const map = {
    green: "bg-safe text-safe shadow-[0_0_24px_-4px] shadow-safe/50",
    yellow: "bg-warn text-warn shadow-[0_0_24px_-4px] shadow-warn/50",
    red: "bg-danger text-danger shadow-[0_0_24px_-4px] shadow-danger/50",
  } as const;
  return (
    <div className="card card-pad">
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${map[color].split(" ")[0]}`} />
        <span className="font-semibold">{title}</span>
      </div>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  );
}

function ProblemCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="card card-pad">
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  );
}

function BenefitCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="card card-pad">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-safe-soft text-safe">
          ✓
        </span>
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">{text}</p>
        </div>
      </div>
    </div>
  );
}

function ExampleFinding({
  icon,
  severity,
  tone,
  title,
  masked,
  tip,
}: {
  icon: string;
  severity: string;
  tone: "red" | "yellow";
  title: string;
  masked: string;
  tip: string;
}) {
  const toneClass =
    tone === "red"
      ? "bg-danger-soft text-danger border-danger/30"
      : "bg-warn-soft text-warn border-warn/30";
  return (
    <div className="rounded-xl border border-line bg-ink-950/50 p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-white">
          <span aria-hidden>{icon}</span>
          {title}
        </span>
        <span className={`chip border ${toneClass}`}>{severity}</span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <code className="rounded bg-ink-800 px-2 py-1 font-mono text-slate-300">
          {masked}
        </code>
        <span className="text-slate-500">→ {tip}</span>
      </div>
    </div>
  );
}

function PriceCard({
  name,
  price,
  period,
  features,
  highlight,
  cta,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlight: boolean;
  cta: string;
}) {
  return (
    <div
      className={`card card-pad relative flex flex-col ${
        highlight ? "ring-2 ring-accent/50 shadow-glow" : ""
      }`}
    >
      {highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-ink-950">
          Beliebt
        </span>
      )}
      <h3 className="text-lg font-semibold">{name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight">{price}</span>
        <span className="text-sm text-slate-400">{period}</span>
      </div>
      <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-300">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-0.5 text-safe">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/admin"
        className={`mt-6 ${highlight ? "btn-primary" : "btn-ghost"}`}
      >
        {cta}
      </Link>
    </div>
  );
}
