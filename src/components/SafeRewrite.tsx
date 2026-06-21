"use client";

import { useState } from "react";
import { CopyButton } from "./CopyButton";

/** Vorher/Nachher-Ansicht der bereinigten Textversion inkl. Kopierbutton. */
export function SafeRewrite({
  original,
  redacted,
}: {
  original: string;
  redacted: string;
}) {
  const [showOriginal, setShowOriginal] = useState(false);
  const changed = original !== redacted;

  return (
    <div className="card card-pad">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">Safe Rewrite</h3>
          <p className="text-xs text-slate-400">
            Bereinigte Version mit maskierten sensiblen Inhalten.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOriginal((v) => !v)}
            className="btn-ghost"
          >
            {showOriginal ? "Nur bereinigt" : "Vorher/Nachher"}
          </button>
          <CopyButton
            value={redacted}
            label="Bereinigt kopieren"
            className="btn-primary"
          />
        </div>
      </div>

      {!changed && (
        <p className="mt-3 rounded-lg border border-safe/20 bg-safe-soft/40 p-2.5 text-sm text-safe">
          Es wurde nichts maskiert — der Text enthielt keine erkannten
          sensiblen Stellen.
        </p>
      )}

      <div className={`mt-4 grid gap-4 ${showOriginal ? "lg:grid-cols-2" : ""}`}>
        {showOriginal && (
          <div>
            <p className="label">Vorher (Original)</p>
            <pre className="scroll-thin max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-ink-950/60 p-3.5 font-mono text-xs text-slate-300">
              {original}
            </pre>
          </div>
        )}
        <div>
          <p className="label">
            {showOriginal ? "Nachher (bereinigt)" : "Bereinigter Text"}
          </p>
          <pre className="scroll-thin max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-accent/25 bg-ink-950/60 p-3.5 font-mono text-xs text-slate-100">
            {redacted}
          </pre>
        </div>
      </div>
    </div>
  );
}
