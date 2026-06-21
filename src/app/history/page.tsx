"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Severity } from "@/lib/security/types";
import { SEVERITY_LABELS } from "@/lib/security/types";
import { SEVERITY_BADGE, formatDate } from "@/lib/ui";

interface ScanRow {
  id: string;
  inputType: string;
  riskScore: number;
  severity: Severity;
  findingCount: number;
  createdAt: string;
  summaryJson: string | null;
}

export default function HistoryPage() {
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/scans");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Fehler beim Laden.");
      setScans(data.scans);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    const ok = window.confirm("Diesen Scan wirklich aus dem Verlauf loeschen?");
    if (!ok) return;
    setScans((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/scans/${id}`, { method: "DELETE" });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Verlauf</h1>
          <p className="mt-1 text-slate-400">
            Gespeicherte Scans. Es werden nur Score und (maskierte) Findings
            gespeichert — Originaltext nur, wenn du es ausdruecklich aktivierst.
          </p>
        </div>
        <Link href="/scanner" className="btn-primary">
          Neuer Scan
        </Link>
      </header>

      {loading && (
        <div className="card card-pad text-sm text-slate-400">Lade Verlauf …</div>
      )}

      {error && (
        <div className="card card-pad text-sm text-danger">{error}</div>
      )}

      {!loading && !error && scans.length === 0 && (
        <div className="card card-pad text-center">
          <p className="text-slate-300">Noch keine gespeicherten Scans.</p>
          <Link href="/scanner" className="btn-primary mx-auto mt-4">
            Ersten Scan starten
          </Link>
        </div>
      )}

      {scans.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-ink-950/40 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Datum</th>
                <th className="px-4 py-3 font-medium">Typ</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Schweregrad</th>
                <th className="px-4 py-3 font-medium">Findings</th>
                <th className="px-4 py-3 text-right font-medium">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr
                  key={scan.id}
                  className="border-b border-line/50 last:border-0 hover:bg-ink-800/30"
                >
                  <td className="px-4 py-3 text-slate-300">
                    {formatDate(scan.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {scan.inputType === "code"
                      ? "Code"
                      : scan.inputType === "email"
                        ? "E-Mail"
                        : "Text"}
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums">
                    {scan.riskScore}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`chip ${SEVERITY_BADGE[scan.severity]}`}>
                      {SEVERITY_LABELS[scan.severity]}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-300">
                    {scan.findingCount}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/report/${scan.id}`}
                        className="rounded-lg border border-line px-2.5 py-1 text-xs text-slate-300 hover:bg-ink-700/60"
                      >
                        Report
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(scan.id)}
                        className="rounded-lg border border-danger/30 px-2.5 py-1 text-xs text-danger hover:bg-danger/10"
                      >
                        Loeschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
