"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Settings {
  storeOriginalText: boolean;
  strictMode: boolean;
  saveHistory: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Fehler.");
        setSettings(data.settings);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
      }
    })();
  }, []);

  async function update(patch: Partial<Settings>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    setStatus("saving");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Speichern fehlgeschlagen.");
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Einstellungen</h1>
        <p className="mt-1 text-slate-400">
          Datenschutz- und Scan-Verhalten. Aenderungen werden sofort
          gespeichert.
        </p>
      </header>

      {error && <div className="card card-pad text-sm text-danger">{error}</div>}

      {!settings ? (
        <div className="card card-pad text-sm text-slate-400">Lade …</div>
      ) : (
        <>
          <section className="card card-pad space-y-1">
            <h2 className="text-base font-semibold text-white">Datenschutz</h2>
            <p className="pb-2 text-xs text-slate-400">
              Steuere, ob und wie Daten gespeichert werden.
            </p>

            <Toggle
              checked={settings.saveHistory}
              onChange={(v) => update({ saveHistory: v })}
              title="Verlauf speichern"
              desc="Scans (Score & maskierte Findings) im lokalen Verlauf ablegen."
            />
            <Toggle
              checked={settings.storeOriginalText}
              onChange={(v) => update({ storeOriginalText: v })}
              title="Originaltext speichern"
              desc="Wenn deaktiviert, wird der Originaltext nach dem Scan verworfen (datenschutzfreundlicher Modus). Empfohlen: AUS."
              warn
            />
          </section>

          <section className="card card-pad space-y-1">
            <h2 className="text-base font-semibold text-white">Scan-Verhalten</h2>
            <p className="pb-2 text-xs text-slate-400">
              Wie streng der Scanner arbeitet.
            </p>
            <Toggle
              checked={settings.strictMode}
              onChange={(v) => update({ strictMode: v })}
              title="Strenger Modus"
              desc="Aktiviert zusaetzliche Regeln und senkt die Schwellen — mehr Warnungen, weniger uebersehene Risiken."
            />
          </section>

          <section className="card card-pad">
            <h2 className="text-base font-semibold text-white">Watchlist</h2>
            <p className="mt-1 text-sm text-slate-400">
              Eigene Begriffe (Firmen-, Projekt-, Kundennamen, interne Tools)
              verwaltest du im{" "}
              <Link href="/admin" className="text-accent hover:underline">
                Adminbereich
              </Link>
              .
            </p>
          </section>

          <p className="text-xs text-slate-500">
            {status === "saving"
              ? "Speichert …"
              : status === "saved"
                ? "✓ Gespeichert"
                : ""}
          </p>
        </>
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  title,
  desc,
  warn,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  desc: string;
  warn?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-line bg-ink-950/30 p-3.5">
      <div>
        <p className="text-sm font-medium text-white">
          {title}
          {warn && checked && (
            <span className="ml-2 text-xs text-warn">Achtung aktiv</span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">{desc}</p>
      </div>
      <span
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? (warn ? "bg-warn" : "bg-accent") : "bg-ink-600"
        }`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
