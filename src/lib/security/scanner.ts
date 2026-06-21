// AI SafeCheck Lite — Scanner (Orchestrierung)
//
// Reiner, deterministischer, regelbasierter Scan. Laeuft sowohl im Browser
// (lokale Verarbeitung) als auch serverseitig. Keine externen Aufrufe.

import type {
  Category,
  CategoryCount,
  Finding,
  Rule,
  ScanOptions,
  ScanResult,
  Severity,
  WatchlistEntry,
} from "./types";
import { CATEGORY_LABELS, SEVERITY_ORDER } from "./types";
import { ALL_RULES } from "./rules";
import { buildRedactedText, toFindings, type RawMatch } from "./redactor";
import { computeRisk } from "./risk-score";

const ISO_FALLBACK = "1970-01-01T00:00:00.000Z";

/** Maskiert Regex-Sonderzeichen in einem Watchlist-Begriff. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Erzeugt dynamische Regeln aus der Nutzer-Watchlist. */
export function buildWatchlistRules(entries: WatchlistEntry[] = []): Rule[] {
  const tagByType: Record<string, string> = {
    company: "[COMPANY_NAME_REDACTED]",
    project: "[PROJECT_REDACTED]",
    customer: "[CUSTOMER_NAME_REDACTED]",
    tool: "[INTERNAL_TOOL_REDACTED]",
    other: "[WATCHLIST_REDACTED]",
  };

  const rules: Rule[] = [];
  entries.forEach((entry, idx) => {
    const term = entry.term?.trim();
    if (!term) return;

    const type = entry.type ?? "other";
    const flags = entry.caseSensitive ? "g" : "gi";
    // Wortgrenzen nur, wenn der Begriff mit einem Wortzeichen beginnt/endet.
    const escaped = escapeRegExp(term);
    const boundaryStart = /^\w/.test(term) ? "\\b" : "";
    const boundaryEnd = /\w$/.test(term) ? "\\b" : "";
    const pattern = new RegExp(`${boundaryStart}${escaped}${boundaryEnd}`, flags);

    rules.push({
      id: `watchlist.${type}.${idx}`,
      title: `Watchlist-Treffer (${type})`,
      category: "internal",
      severity: entry.severity ?? "medium",
      pattern,
      redactionTag: tagByType[type] ?? tagByType.other,
      explanation:
        "Dieser Begriff steht auf deiner internen Watchlist (z.B. Firmen-, Projekt- oder Kundenname).",
      recommendation:
        "Eigene/interne Begriffe maskieren, bevor der Text in ein externes KI-Tool gelangt.",
      reveal: { start: 1, end: 1 },
    });
  });

  return rules;
}

/** Sammelt alle Roh-Treffer einer Regel im Text. */
function collectMatches(text: string, rule: Rule): RawMatch[] {
  // Frische Regex-Instanz: vermeidet geteilten lastIndex-Zustand.
  const flags = rule.pattern.flags.includes("g")
    ? rule.pattern.flags
    : rule.pattern.flags + "g";
  const re = new RegExp(rule.pattern.source, flags);

  const out: RawMatch[] = [];
  let m: RegExpExecArray | null;
  let guard = 0;
  while ((m = re.exec(text)) !== null) {
    if (guard++ > 5000) break; // Sicherheitsbremse gegen Endlosschleifen
    const match = m[0];
    if (match.length === 0) {
      re.lastIndex++;
      continue;
    }
    if (rule.validate && !rule.validate(match)) {
      continue;
    }
    out.push({
      rule,
      match,
      startIndex: m.index,
      endIndex: m.index + match.length,
    });
  }
  return out;
}

/** Entfernt ueberlappende Treffer: hoehere Severity bzw. laengere Abdeckung gewinnt. */
function dedupeOverlaps(matches: RawMatch[]): RawMatch[] {
  const sorted = [...matches].sort((a, b) => {
    const sev = SEVERITY_ORDER[b.rule.severity] - SEVERITY_ORDER[a.rule.severity];
    if (sev !== 0) return sev;
    const lenA = a.endIndex - a.startIndex;
    const lenB = b.endIndex - b.startIndex;
    if (lenB !== lenA) return lenB - lenA;
    return a.startIndex - b.startIndex;
  });

  const kept: RawMatch[] = [];
  for (const m of sorted) {
    const overlaps = kept.some(
      (k) => m.startIndex < k.endIndex && m.endIndex > k.startIndex,
    );
    if (!overlaps) kept.push(m);
  }

  // Fuer stabile Anzeige nach Position sortieren.
  return kept.sort((a, b) => a.startIndex - b.startIndex);
}

/** Zaehlt Findings je Kategorie. */
function countByCategory(findings: Finding[]): CategoryCount[] {
  const map = new Map<Category, number>();
  for (const f of findings) {
    map.set(f.category, (map.get(f.category) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([category, count]) => ({
    category,
    count,
  }));
}

/** Erzeugt eine kurze, menschenlesbare Zusammenfassung. */
function buildSummary(
  findings: Finding[],
  severity: Severity,
  counts: CategoryCount[],
): string {
  if (findings.length === 0) {
    return "Keine offensichtlichen Risiken erkannt. Trotzdem vor dem Teilen kurz pruefen.";
  }
  const parts = counts
    .sort((a, b) => b.count - a.count)
    .map((c) => `${c.count}x ${CATEGORY_LABELS[c.category]}`);

  const lead =
    severity === "critical" || severity === "high"
      ? "Achtung: sensible Inhalte gefunden."
      : severity === "medium"
        ? "Hinweis: potenziell sensible Inhalte gefunden."
        : "Geringes Risiko erkannt.";

  return `${lead} ${findings.length} Fund(e): ${parts.join(", ")}.`;
}

/**
 * Hauptfunktion: scannt einen Text und liefert das vollstaendige Ergebnis.
 * Optional `now` (ISO-String) fuer deterministische/serverseitige Zeitstempel.
 */
export function scanText(
  input: string,
  options: ScanOptions = {},
  now?: string,
): ScanResult {
  const text = input ?? "";
  const inputType = options.inputType ?? "text";
  const strictMode = options.strictMode ?? false;

  // Aktive Regeln zusammenstellen.
  const baseRules = ALL_RULES.filter((r) => (strictMode ? true : !r.strictOnly));
  const watchlistRules = buildWatchlistRules(options.watchlist ?? []);
  const activeRules = [...baseRules, ...watchlistRules];

  // Alle Treffer sammeln.
  const allMatches: RawMatch[] = [];
  for (const rule of activeRules) {
    allMatches.push(...collectMatches(text, rule));
  }

  // Ueberlappungen aufloesen.
  const matches = dedupeOverlaps(allMatches);

  // Findings + bereinigter Text.
  const findings = toFindings(matches);
  const redactedText = buildRedactedText(text, matches);

  // Risiko.
  const { score, severity } = computeRisk(findings, strictMode);
  const categoryCounts = countByCategory(findings);
  const summary = buildSummary(findings, severity, categoryCounts);

  return {
    inputType,
    riskScore: score,
    severity,
    findings,
    findingCount: findings.length,
    categoryCounts,
    redactedText,
    inputLength: text.length,
    summary,
    scannedAt: now ?? ISO_FALLBACK,
  };
}
