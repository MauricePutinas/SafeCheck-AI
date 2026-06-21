"use client";

import { useEffect, useState } from "react";
import { WatchlistManager } from "@/components/WatchlistManager";
import { formatDate } from "@/lib/ui";

interface Overview {
  user: { email: string; name: string | null; role: string };
  stats: {
    scanCount: number;
    watchlistCount: number;
    severity: { severity: string; count: number }[];
  };
  license: {
    licenseKey: string;
    status: string;
    tier: string;
    instanceName: string | null;
    activatedAt: string | null;
    expiresAt: string | null;
    lastCheckAt: string | null;
  } | null;
  lemonConfigured: boolean;
}

const STATUS_STYLE: Record<string, string> = {
  active: "bg-safe-soft text-safe border-safe/30",
  inactive: "bg-ink-800 text-slate-400 border-line",
  expired: "bg-warn-soft text-warn border-warn/30",
  disabled: "bg-danger-soft text-danger border-danger/30",
};

export default function AdminPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [licenseKey, setLicenseKey] = useState("");
  const [activating, setActivating] = useState(false);
  const [activationMsg, setActivationMsg] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/overview");
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? "Fehler.");
      setData(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!licenseKey.trim()) return;
    setActivating(true);
    setActivationMsg(null);
    try {
      const res = await fetch("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: licenseKey.trim() }),
      });
      const d = await res.json();
      setActivationMsg(d?.message ?? (res.ok ? "Gespeichert." : "Fehler."));
      setLicenseKey("");
      await load();
    } catch {
      setActivationMsg("Verbindung fehlgeschlagen.");
    } finally {
      setActivating(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Adminbereich</h1>
        <p className="mt-1 text-slate-400">
          Lizenzstatus, Nutzung, Nutzerverwaltung (Platzhalter) und
          Watchlist-Verwaltung.
        </p>
      </header>

      {error && <div className="card card-pad text-sm text-danger">{error}</div>}

      {/* Lizenz */}
      <section className="card card-pad">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white">Lizenz</h2>
          {data?.license ? (
            <span
              className={`chip border ${STATUS_STYLE[data.license.status] ?? STATUS_STYLE.inactive}`}
            >
              {data.license.status} · {data.license.tier}
            </span>
          ) : (
            <span className="chip border border-line bg-ink-800 text-slate-400">
              keine Lizenz
            </span>
          )}
        </div>

        {!data?.lemonConfigured && (
          <p className="mt-3 rounded-lg border border-warn/20 bg-warn-soft/40 p-2.5 text-xs text-warn">
            Lemon Squeezy ist nicht konfiguriert (.env: LEMON_SQUEEZY_API_KEY,
            LEMON_SQUEEZY_STORE_ID). Lizenzschluessel werden lokal gespeichert,
            aber nicht online validiert. Die App bleibt voll nutzbar.
          </p>
        )}

        {data?.license && (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Row label="Schluessel (maskiert)" value={data.license.licenseKey} mono />
            <Row label="Instanz" value={data.license.instanceName ?? "—"} />
            <Row
              label="Aktiviert am"
              value={data.license.activatedAt ? formatDate(data.license.activatedAt) : "—"}
            />
            <Row
              label="Laeuft ab"
              value={data.license.expiresAt ? formatDate(data.license.expiresAt) : "—"}
            />
          </dl>
        )}

        <form onSubmit={handleActivate} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="Lemon-Squeezy-Lizenzschluessel eingeben …"
            className="input font-mono"
          />
          <button type="submit" disabled={activating} className="btn-primary shrink-0">
            {activating ? "Aktiviere …" : "Lizenz aktivieren"}
          </button>
        </form>
        {activationMsg && (
          <p className="mt-2 text-sm text-slate-300">{activationMsg}</p>
        )}
      </section>

      {/* Statistik */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Scans gesamt"
          value={data ? String(data.stats.scanCount) : "…"}
        />
        <StatCard
          label="Watchlist-Begriffe"
          value={data ? String(data.stats.watchlistCount) : "…"}
        />
        <StatCard
          label="Kritische/hohe Scans"
          value={
            data
              ? String(
                  data.stats.severity
                    .filter((s) => s.severity === "high" || s.severity === "critical")
                    .reduce((a, b) => a + b.count, 0),
                )
              : "…"
          }
        />
      </section>

      {/* Nutzerverwaltung (Platzhalter) */}
      <section className="card card-pad">
        <h2 className="text-base font-semibold text-white">
          Nutzerverwaltung{" "}
          <span className="text-xs font-normal text-slate-500">(Platzhalter)</span>
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          In dieser Lite-Version laeuft alles unter einem lokalen Owner-Konto.
          Mehrbenutzer-Verwaltung ist vorbereitet.
        </p>
        {data && (
          <div className="mt-4 overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead className="bg-ink-950/40 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">E-Mail</th>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Rolle</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-line/50">
                  <td className="px-4 py-2.5 font-mono text-slate-300">
                    {data.user.email}
                  </td>
                  <td className="px-4 py-2.5 text-slate-300">
                    {data.user.name ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-300">{data.user.role}</td>
                  <td className="px-4 py-2.5">
                    <span className="chip bg-safe-soft text-safe">aktiv</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Watchlist */}
      <section className="card card-pad">
        <h2 className="mb-1 text-base font-semibold text-white">
          Watchlist & Vorlagen
        </h2>
        <p className="mb-4 text-xs text-slate-400">
          Eigene Begriffe, die der Scanner zusaetzlich erkennt.
        </p>
        <WatchlistManager />
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-line bg-ink-950/30 px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className={`text-slate-200 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card card-pad">
      <p className="text-3xl font-semibold tabular-nums text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
        {label}
      </p>
    </div>
  );
}
