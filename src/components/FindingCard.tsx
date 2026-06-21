import type { Finding } from "@/lib/security/types";
import { CATEGORY_LABELS, SEVERITY_LABELS } from "@/lib/security/types";
import { CATEGORY_ICON, SEVERITY_BADGE } from "@/lib/ui";

export function FindingCard({ finding }: { finding: Finding }) {
  return (
    <div className="rounded-xl border border-line bg-ink-950/40 p-4 print-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-lg" aria-hidden>
            {CATEGORY_ICON[finding.category]}
          </span>
          <div>
            <h4 className="text-sm font-semibold text-white">{finding.title}</h4>
            <p className="text-xs text-slate-500">
              {CATEGORY_LABELS[finding.category]}
            </p>
          </div>
        </div>
        <span className={`chip ${SEVERITY_BADGE[finding.severity]}`}>
          {SEVERITY_LABELS[finding.severity]}
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[auto,1fr] sm:items-center">
        <span className="text-xs uppercase tracking-wide text-slate-500">
          Fundstelle (maskiert)
        </span>
        <code className="w-fit rounded-md bg-ink-800 px-2.5 py-1 font-mono text-xs text-slate-200">
          {finding.maskedMatch}
        </code>
      </div>

      <p className="mt-3 text-sm text-slate-300">{finding.explanation}</p>

      <div className="mt-3 flex items-start gap-2 rounded-lg border border-accent/20 bg-accent-soft/40 p-2.5">
        <span className="mt-0.5 text-accent" aria-hidden>
          →
        </span>
        <p className="text-sm text-slate-200">
          <span className="font-medium text-accent">Empfehlung: </span>
          {finding.recommendation}
        </p>
      </div>
    </div>
  );
}
