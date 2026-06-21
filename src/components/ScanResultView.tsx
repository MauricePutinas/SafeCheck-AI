import type { ScanResult } from "@/lib/security/types";
import { CATEGORY_LABELS, SEVERITY_ORDER } from "@/lib/security/types";
import { RiskGauge } from "./RiskGauge";
import { FindingCard } from "./FindingCard";
import { SafeRewrite } from "./SafeRewrite";

/** Vollstaendige, gerenderte Auswertung eines Scans. */
export function ScanResultView({
  result,
  originalText,
  showSafeRewrite = true,
}: {
  result: ScanResult;
  originalText: string;
  showSafeRewrite?: boolean;
}) {
  const sortedFindings = [...result.findings].sort(
    (a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity],
  );

  return (
    <div className="space-y-5">
      {/* Score + Zusammenfassung */}
      <div className="card card-pad print-card">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <RiskGauge score={result.riskScore} severity={result.severity} />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Gesamtbefund</h3>
            <p className="mt-1 text-sm text-slate-300">{result.summary}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {result.categoryCounts.length === 0 ? (
                <span className="chip bg-safe-soft text-safe">
                  Keine Findings
                </span>
              ) : (
                result.categoryCounts
                  .sort((a, b) => b.count - a.count)
                  .map((c) => (
                    <span
                      key={c.category}
                      className="chip border border-line bg-ink-800/70 text-slate-300"
                    >
                      {CATEGORY_LABELS[c.category]}
                      <span className="ml-1 rounded bg-ink-700 px-1.5 text-[11px] text-white">
                        {c.count}
                      </span>
                    </span>
                  ))
              )}
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
              <Stat label="Findings" value={String(result.findingCount)} />
              <Stat label="Zeichen" value={String(result.inputLength)} />
              <Stat
                label="Eingabe"
                value={
                  result.inputType === "code"
                    ? "Code"
                    : result.inputType === "email"
                      ? "E-Mail"
                      : "Text"
                }
              />
            </dl>
          </div>
        </div>
      </div>

      {/* Findings */}
      {sortedFindings.length > 0 && (
        <div className="card card-pad print-card">
          <h3 className="mb-4 text-base font-semibold text-white">
            Findings ({sortedFindings.length})
          </h3>
          <div className="space-y-3">
            {sortedFindings.map((f, i) => (
              <FindingCard key={`${f.ruleId}-${i}`} finding={f} />
            ))}
          </div>
        </div>
      )}

      {/* Safe Rewrite */}
      {showSafeRewrite && (
        <SafeRewrite original={originalText} redacted={result.redactedText} />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-ink-950/40 py-2">
      <dd className="text-lg font-semibold tabular-nums text-white">{value}</dd>
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </dt>
    </div>
  );
}
