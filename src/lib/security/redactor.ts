// AI SafeCheck Lite — Redactor
//
// Aufgaben:
//   1) maskMatch(): erzeugt einen MASKIERTEN Auszug fuer die Anzeige.
//      -> Es wird NIEMALS das vollstaendige Secret zurueckgegeben.
//   2) buildRedactedText(): erzeugt die "Safe Rewrite"-Version,
//      in der alle Fundstellen durch sichere Platzhalter ersetzt sind.

import type { Finding, Rule } from "./types";

/** Interner Treffer mit Bezug zur Regel (vor der Finding-Erzeugung). */
export interface RawMatch {
  rule: Rule;
  match: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Maskiert einen Treffer fuer die sichere Anzeige.
 * Beispiel: "sk-demo-123456789" -> "sk•••••••••89"
 *
 * Es bleiben hoechstens `reveal.start` Zeichen am Anfang und
 * `reveal.end` Zeichen am Ende sichtbar. Bei sehr kurzen oder
 * besonders kritischen Treffern wird komplett maskiert.
 */
export function maskMatch(value: string, rule: Rule): string {
  const reveal = rule.reveal ?? { start: 2, end: 2 };
  const trimmed = value.trim();
  const len = trimmed.length;

  // Mehrzeilige Treffer (z.B. PEM-Bloecke) nie im Klartext zeigen.
  if (/\r|\n/.test(value) || rule.category === "secret") {
    if (reveal.start === 0 && reveal.end === 0) {
      return `${rule.redactionTag}`;
    }
  }

  const minToReveal = reveal.start + reveal.end;
  if (len <= minToReveal + 2 || minToReveal === 0) {
    // Zu kurz, um sicher Teile zu zeigen -> nur Bulletpoints + Tag.
    return `${"•".repeat(Math.min(8, Math.max(4, len)))} ${rule.redactionTag}`.trim();
  }

  const head = trimmed.slice(0, reveal.start);
  const tail = reveal.end > 0 ? trimmed.slice(len - reveal.end) : "";
  const middleLen = Math.min(12, Math.max(3, len - minToReveal));
  return `${head}${"•".repeat(middleLen)}${tail}`;
}

/**
 * Baut die bereinigte Textversion.
 * Ersetzt jede Fundstelle (von hinten nach vorne, damit Indizes stabil bleiben)
 * durch den Platzhalter der jeweiligen Regel.
 */
export function buildRedactedText(original: string, matches: RawMatch[]): string {
  if (matches.length === 0) return original;

  // Nach Startindex absteigend sortieren -> Ersetzen von hinten.
  const ordered = [...matches].sort((a, b) => b.startIndex - a.startIndex);

  let result = original;
  for (const m of ordered) {
    result =
      result.slice(0, m.startIndex) +
      m.rule.redactionTag +
      result.slice(m.endIndex);
  }
  return result;
}

/** Wandelt RawMatches in oeffentliche Findings um (mit maskiertem Auszug). */
export function toFindings(matches: RawMatch[]): Finding[] {
  return matches.map((m) => ({
    ruleId: m.rule.id,
    category: m.rule.category,
    severity: m.rule.severity,
    title: m.rule.title,
    maskedMatch: maskMatch(m.match, m.rule),
    startIndex: m.startIndex,
    endIndex: m.endIndex,
    explanation: m.rule.explanation,
    recommendation: m.rule.recommendation,
  }));
}
