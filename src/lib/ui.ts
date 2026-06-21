// Gemeinsame UI-Hilfen (client-sicher, keine Server-Abhaengigkeiten).
import type { Category, Severity } from "./security/types";

export type Traffic = "green" | "yellow" | "red";

export function severityTraffic(severity: Severity): Traffic {
  if (severity === "low") return "green";
  if (severity === "medium") return "yellow";
  return "red";
}

/** Tailwind-Klassen je Ampelfarbe (Hintergrund + Text + Rahmen). */
export const TRAFFIC_CLASSES: Record<
  Traffic,
  { badge: string; ring: string; text: string; dot: string; bar: string }
> = {
  green: {
    badge: "bg-safe-soft text-safe border border-safe/30",
    ring: "ring-safe/40",
    text: "text-safe",
    dot: "bg-safe",
    bar: "bg-safe",
  },
  yellow: {
    badge: "bg-warn-soft text-warn border border-warn/30",
    ring: "ring-warn/40",
    text: "text-warn",
    dot: "bg-warn",
    bar: "bg-warn",
  },
  red: {
    badge: "bg-danger-soft text-danger border border-danger/30",
    ring: "ring-danger/40",
    text: "text-danger",
    dot: "bg-danger",
    bar: "bg-danger",
  },
};

export const SEVERITY_BADGE: Record<Severity, string> = {
  low: "bg-safe-soft text-safe border border-safe/30",
  medium: "bg-warn-soft text-warn border border-warn/30",
  high: "bg-danger-soft text-danger border border-danger/30",
  critical: "bg-critical-soft text-critical border border-critical/40",
};

export const CATEGORY_ICON: Record<Category, string> = {
  secret: "🔑",
  pii: "👤",
  internal: "🏢",
  prompt_injection: "🧨",
  risky_instruction: "⚠️",
};

export function scoreLabel(score: number): string {
  if (score >= 80) return "Kritisch";
  if (score >= 50) return "Hohes Risiko";
  if (score >= 25) return "Mittleres Risiko";
  if (score > 0) return "Geringes Risiko";
  return "Kein Risiko erkannt";
}

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
