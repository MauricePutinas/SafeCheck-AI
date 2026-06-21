// AI SafeCheck Lite — Risikobewertung
//
// Berechnet aus den Findings einen riskScore (0..100) und einen Gesamt-Severity.
// Bewusst transparent & nachvollziehbar (keine Blackbox).

import type { Finding, Severity } from "./types";
import { SEVERITY_ORDER } from "./types";

/** Gewichtung je Schweregrad fuer den Score. */
const SEVERITY_WEIGHT: Record<Severity, number> = {
  low: 4,
  medium: 11,
  high: 24,
  critical: 45,
};

export interface RiskResult {
  score: number; // 0..100
  severity: Severity;
}

/**
 * Aggregiert Findings zu einem Score.
 * - Summe der gewichteten Findings (mit leicht abnehmendem Grenznutzen je Kategorie).
 * - Strenger Modus erhoeht den Score moderat.
 */
export function computeRisk(findings: Finding[], strictMode = false): RiskResult {
  if (findings.length === 0) {
    return { score: 0, severity: "low" };
  }

  let raw = 0;
  // Abnehmender Grenznutzen: viele gleichartige Findings zaehlen weniger stark.
  const perRuleCount: Record<string, number> = {};

  for (const f of findings) {
    perRuleCount[f.ruleId] = (perRuleCount[f.ruleId] ?? 0) + 1;
    const occurrence = perRuleCount[f.ruleId];
    // 1. Treffer voll, weitere Treffer derselben Regel gedaempft.
    const damp = occurrence === 1 ? 1 : 1 / (1 + Math.log2(occurrence));
    raw += SEVERITY_WEIGHT[f.severity] * damp;
  }

  if (strictMode) {
    raw *= 1.2;
  }

  const score = Math.max(0, Math.min(100, Math.round(raw)));

  return { score, severity: deriveSeverity(findings, score) };
}

/** Leitet den Gesamt-Severity aus dem hoechsten Einzel-Finding und dem Score ab. */
export function deriveSeverity(findings: Finding[], score: number): Severity {
  const highest = highestSeverity(findings);

  if (highest === "critical") return "critical";
  if (highest === "high" || score >= 65) return "high";
  if (highest === "medium" || score >= 30) return "medium";
  return "low";
}

/** Hoechster Schweregrad in einer Finding-Liste. */
export function highestSeverity(findings: Finding[]): Severity {
  let current: Severity = "low";
  for (const f of findings) {
    if (SEVERITY_ORDER[f.severity] > SEVERITY_ORDER[current]) {
      current = f.severity;
    }
  }
  return current;
}

/** Ampel-Farbe (Gruen/Gelb/Rot) je Severity. */
export function trafficLight(severity: Severity): "green" | "yellow" | "red" {
  switch (severity) {
    case "low":
      return "green";
    case "medium":
      return "yellow";
    case "high":
    case "critical":
      return "red";
  }
}
