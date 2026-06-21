"use client";

import { useEffect, useState } from "react";
import type { Severity } from "@/lib/security/types";
import { SEVERITY_LABELS } from "@/lib/security/types";
import { SEVERITY_BADGE } from "@/lib/ui";
import { WATCHLIST_TEMPLATES } from "@/lib/watchlist-templates";

type WlType = "company" | "project" | "customer" | "tool" | "other";

interface Term {
  id: string;
  term: string;
  type: string;
  severity: Severity;
  caseSensitive: boolean;
  enabled: boolean;
}

const TYPE_LABEL: Record<WlType, string> = {
  company: "Firma",
  project: "Projekt",
  customer: "Kunde",
  tool: "Tool",
  other: "Sonstiges",
};

export function WatchlistManager() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState("");
  const [type, setType] = useState<WlType>("project");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/watchlist");
      const data = await res.json();
      if (res.ok) setTerms(data.terms);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addTerm(payload: {
    term: string;
    type: WlType;
    severity: Severity;
  }) {
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      setTerms((prev) => [data.term, ...prev]);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!term.trim()) return;
    setBusy(true);
    await addTerm({ term: term.trim(), type, severity });
    setTerm("");
    setBusy(false);
  }

  async function handleDelete(id: string) {
    setTerms((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
  }

  async function applyTemplate(templateId: string) {
    const tpl = WATCHLIST_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setBusy(true);
    const existing = new Set(terms.map((t) => t.term.toLowerCase()));
    for (const item of tpl.items) {
      if (existing.has(item.term.toLowerCase())) continue;
      await addTerm(item);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      {/* Hinzufuegen */}
      <form
        onSubmit={handleAdd}
        className="grid gap-3 sm:grid-cols-[1fr,auto,auto,auto]"
      >
        <div>
          <label className="label">Begriff</label>
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="z.B. Projekt Falke, Beispiel GmbH …"
            className="input"
          />
        </div>
        <div>
          <label className="label">Typ</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as WlType)}
            className="input"
          >
            {(Object.keys(TYPE_LABEL) as WlType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Schweregrad</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as Severity)}
            className="input"
          >
            {(["low", "medium", "high", "critical"] as Severity[]).map((s) => (
              <option key={s} value={s}>
                {SEVERITY_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={busy} className="btn-primary w-full">
            + Hinzufuegen
          </button>
        </div>
      </form>

      {/* Vorlagen */}
      <div>
        <p className="label">Vorlagen anwenden</p>
        <div className="flex flex-wrap gap-2">
          {WATCHLIST_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => applyTemplate(tpl.id)}
              disabled={busy}
              title={tpl.description}
              className="chip border border-line bg-ink-800/70 text-slate-300 hover:bg-ink-700/70"
            >
              + {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <p className="text-sm text-slate-400">Lade Watchlist …</p>
      ) : terms.length === 0 ? (
        <p className="rounded-xl border border-line bg-ink-950/30 p-4 text-sm text-slate-400">
          Noch keine Begriffe. Fuege eigene Firmen-, Projekt- oder Kundennamen
          hinzu oder wende eine Vorlage an.
        </p>
      ) : (
        <ul className="divide-y divide-line/60 overflow-hidden rounded-xl border border-line">
          {terms.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 bg-ink-950/30 px-4 py-2.5"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-white">{t.term}</span>
                <span className="chip border border-line bg-ink-800/70 text-xs text-slate-400">
                  {TYPE_LABEL[(t.type as WlType) ?? "other"] ?? t.type}
                </span>
                <span className={`chip ${SEVERITY_BADGE[t.severity]}`}>
                  {SEVERITY_LABELS[t.severity]}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(t.id)}
                className="rounded-lg border border-danger/30 px-2.5 py-1 text-xs text-danger hover:bg-danger/10"
              >
                Loeschen
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
