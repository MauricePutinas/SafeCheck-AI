"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { scanText } from "@/lib/security/scanner";
import type {
  InputType,
  ScanResult,
  WatchlistEntry,
} from "@/lib/security/types";
import { DEMO_SAMPLES } from "@/lib/security/test-samples";
import { ScanResultView } from "./ScanResultView";

interface Props {
  defaultStrict: boolean;
  defaultSaveHistory: boolean;
  defaultStoreOriginal: boolean;
  watchlist: WatchlistEntry[];
}

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; id: string }
  | { kind: "error"; message: string };

export function ScannerClient({
  defaultStrict,
  defaultSaveHistory,
  defaultStoreOriginal,
  watchlist,
}: Props) {
  const [text, setText] = useState("");
  const [inputType, setInputType] = useState<InputType>("text");
  const [strict, setStrict] = useState(defaultStrict);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scannedText, setScannedText] = useState("");

  const [saveHistory, setSaveHistory] = useState(defaultSaveHistory);
  const [storeOriginal, setStoreOriginal] = useState(defaultStoreOriginal);
  const [save, setSave] = useState<SaveState>({ kind: "idle" });

  const canScan = text.trim().length > 0;

  function handleScan() {
    if (!canScan) return;
    const res = scanText(
      text,
      { inputType, strictMode: strict, watchlist },
      new Date().toISOString(),
    );
    setResult(res);
    setScannedText(text);
    setSave({ kind: "idle" });
    // Ergebnis in den Blick ruecken.
    if (typeof window !== "undefined") {
      requestAnimationFrame(() =>
        document
          .getElementById("scan-results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  }

  function handleClear() {
    setText("");
    setResult(null);
    setScannedText("");
    setSave({ kind: "idle" });
  }

  function loadSample(id: string) {
    const sample = DEMO_SAMPLES.find((s) => s.id === id);
    if (!sample) return;
    setText(sample.content);
    setInputType(sample.inputType);
    setResult(null);
    setSave({ kind: "idle" });
  }

  async function handleSave() {
    if (!result) return;
    setSave({ kind: "saving" });
    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result,
          // Originaltext NUR mitsenden, wenn ausdruecklich gewuenscht.
          originalText: storeOriginal ? scannedText : null,
          storeOriginal,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Speichern fehlgeschlagen.");
      }
      setSave({ kind: "saved", id: data.id });
    } catch (err) {
      setSave({
        kind: "error",
        message: err instanceof Error ? err.message : "Unbekannter Fehler.",
      });
    }
  }

  const charCount = text.length;

  return (
    <div className="space-y-6">
      {/* Eingabe */}
      <div className="card card-pad">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-line bg-ink-950/60 p-1">
            {(["text", "code", "email"] as InputType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setInputType(t)}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  inputType === t
                    ? "bg-ink-700 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t === "text" ? "Text" : t === "code" ? "Code" : "E-Mail"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <SampleMenu onPick={loadSample} />
            <button
              type="button"
              onClick={handleClear}
              className="btn-ghost"
              disabled={!text && !result}
            >
              Leeren
            </button>
          </div>
        </div>

        <label className="label" htmlFor="scan-input">
          Eingabe einfuegen (Text · Code · E-Mail)
        </label>
        <textarea
          id="scan-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          spellCheck={false}
          placeholder="Text, Code-Snippet oder E-Mail hier einfuegen … Die Pruefung laeuft lokal in deinem Browser."
          className="input scroll-thin min-h-[220px] font-mono leading-relaxed"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={strict}
              onChange={(e) => setStrict(e.target.checked)}
              className="h-4 w-4 rounded border-line bg-ink-950 accent-accent"
            />
            Strenger Modus
            <span className="text-xs text-slate-500">
              (mehr Warnungen, niedrigere Schwellen)
            </span>
          </label>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{charCount} Zeichen</span>
            <button
              type="button"
              onClick={handleScan}
              disabled={!canScan}
              className="btn-primary px-5"
            >
              Pruefen →
            </button>
          </div>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <LockIcon />
          Lokale Verarbeitung: Der Text wird in deinem Browser regelbasiert
          geprueft. Es werden keine externen KI-Dienste aufgerufen.
        </p>
      </div>

      {/* Ergebnisse */}
      {result && (
        <div id="scan-results" className="space-y-5">
          <div className="no-print flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Ergebnis</h2>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-ghost"
            >
              🖨 Report drucken / als PDF
            </button>
          </div>

          <ScanResultView result={result} originalText={scannedText} />

          {/* Speichern / Verlauf */}
          <div className="card card-pad no-print">
            <h3 className="text-base font-semibold text-white">
              Im Verlauf speichern
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Gespeichert werden Score und Findings (maskiert). Der Originaltext
              wird nur gespeichert, wenn du es ausdruecklich aktivierst.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={saveHistory}
                    onChange={(e) => setSaveHistory(e.target.checked)}
                    className="h-4 w-4 rounded border-line bg-ink-950 accent-accent"
                  />
                  Diesen Scan im Verlauf speichern
                </label>
                <label
                  className={`flex items-center gap-2 text-sm ${
                    saveHistory
                      ? "cursor-pointer text-slate-300"
                      : "cursor-not-allowed text-slate-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={storeOriginal}
                    disabled={!saveHistory}
                    onChange={(e) => setStoreOriginal(e.target.checked)}
                    className="h-4 w-4 rounded border-line bg-ink-950 accent-warn"
                  />
                  Originaltext mitspeichern{" "}
                  <span className="text-xs text-warn">(enthaelt evtl. Secrets)</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                {save.kind === "saved" && (
                  <Link href={`/report/${save.id}`} className="btn-ghost">
                    Report oeffnen
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!saveHistory || save.kind === "saving"}
                  className="btn-primary"
                >
                  {save.kind === "saving"
                    ? "Speichert …"
                    : save.kind === "saved"
                      ? "✓ Gespeichert"
                      : "Speichern"}
                </button>
              </div>
            </div>

            {save.kind === "saved" && (
              <p className="mt-3 text-sm text-safe">
                Gespeichert. Du findest den Scan im{" "}
                <Link href="/history" className="underline">
                  Verlauf
                </Link>
                .
              </p>
            )}
            {save.kind === "error" && (
              <p className="mt-3 text-sm text-danger">{save.message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SampleMenu({ onPick }: { onPick: (id: string) => void }) {
  return (
    <div className="relative">
      <select
        onChange={(e) => {
          if (e.target.value) onPick(e.target.value);
          e.target.value = "";
        }}
        defaultValue=""
        className="input cursor-pointer py-2 pr-8 text-sm"
        aria-label="Beispiel laden"
      >
        <option value="" disabled>
          Beispiel laden …
        </option>
        {DEMO_SAMPLES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="5"
        y="11"
        width="14"
        height="9"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 11V8a4 4 0 1 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}
