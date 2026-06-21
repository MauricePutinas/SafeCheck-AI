import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { ScanResultView } from "@/components/ScanResultView";
import { PrintButton } from "@/components/PrintButton";
import { CopyButton } from "@/components/CopyButton";
import { formatDate } from "@/lib/ui";
import type {
  CategoryCount,
  Finding,
  InputType,
  ScanResult,
  Severity,
} from "@/lib/security/types";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
}: {
  params: { id: string };
}) {
  let scan;
  try {
    const user = await getCurrentUser();
    scan = await prisma.scan.findFirst({
      where: { id: params.id, userId: user.id },
      include: { findings: true },
    });
  } catch {
    scan = null;
  }

  if (!scan) {
    notFound();
  }

  // summaryJson -> summary + categoryCounts
  let summary = "";
  let categoryCounts: CategoryCount[] = [];
  if (scan.summaryJson) {
    try {
      const parsed = JSON.parse(scan.summaryJson) as {
        summary?: string;
        categoryCounts?: CategoryCount[];
      };
      summary = parsed.summary ?? "";
      categoryCounts = parsed.categoryCounts ?? [];
    } catch {
      // ignore
    }
  }

  const findings: Finding[] = scan.findings.map((f) => ({
    ruleId: f.ruleId,
    category: f.category as Finding["category"],
    severity: f.severity as Severity,
    title: f.title,
    maskedMatch: f.maskedMatch,
    startIndex: f.startIndex,
    endIndex: f.endIndex,
    explanation: f.explanation,
    recommendation: f.recommendation,
  }));

  const hasOriginal = Boolean(scan.originalText);
  const result: ScanResult = {
    inputType: scan.inputType as InputType,
    riskScore: scan.riskScore,
    severity: scan.severity as Severity,
    findings,
    findingCount: scan.findingCount,
    categoryCounts,
    redactedText: scan.redactedText ?? "",
    inputLength: scan.originalText?.length ?? scan.redactedText?.length ?? 0,
    summary,
    scannedAt: scan.createdAt.toISOString(),
  };

  return (
    <div className="space-y-6">
      {/* Kopf */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="no-print mb-2">
            <Link
              href="/history"
              className="text-sm text-slate-400 hover:text-slate-200"
            >
              ← Zurueck zum Verlauf
            </Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Sicherheits-Report
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Erstellt am {formatDate(scan.createdAt)} · Scan-ID:{" "}
            <span className="font-mono text-xs">{scan.id}</span>
          </p>
        </div>
        <div className="no-print flex items-center gap-2">
          <CopyButton
            value={result.redactedText}
            label="Bereinigt kopieren"
            className="btn-ghost"
          />
          <PrintButton />
        </div>
      </header>

      {/* Ergebnis */}
      <ScanResultView
        result={result}
        originalText={scan.originalText ?? ""}
        showSafeRewrite={hasOriginal}
      />

      {/* Wenn kein Originaltext gespeichert wurde: bereinigten Text separat zeigen */}
      {!hasOriginal && (
        <div className="card card-pad print-card">
          <h3 className="text-base font-semibold text-white">Bereinigter Text</h3>
          <p className="mt-1 text-xs text-slate-400">
            Der Originaltext wurde aus Datenschutzgruenden nicht gespeichert.
          </p>
          <pre className="scroll-thin mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-ink-950/60 p-3.5 font-mono text-xs text-slate-100">
            {result.redactedText || "—"}
          </pre>
        </div>
      )}

      {/* Empfehlungs-Zusammenfassung */}
      <div className="card card-pad print-card">
        <h3 className="text-base font-semibold text-white">Empfehlungen</h3>
        {findings.length === 0 ? (
          <p className="mt-2 text-sm text-slate-300">
            Keine konkreten Risiken — trotzdem vor dem Teilen kurz pruefen.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {dedupeRecommendations(findings).map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 text-accent">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-line bg-ink-950/40 p-4 text-xs text-slate-500 print-card">
        <strong className="text-slate-400">Hinweis:</strong> Dieser Report ist
        ein technischer Vorabcheck und stellt <em>keine Rechtsberatung</em> dar.
        Er ersetzt keine vollstaendige Datenschutz- oder Sicherheitspruefung.
        Secrets werden niemals vollstaendig dargestellt.
      </div>
    </div>
  );
}

function dedupeRecommendations(findings: Finding[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of findings) {
    if (!seen.has(f.recommendation)) {
      seen.add(f.recommendation);
      out.push(f.recommendation);
    }
  }
  return out;
}
