import type { Severity } from "@/lib/security/types";
import { SEVERITY_LABELS } from "@/lib/security/types";
import { scoreLabel, severityTraffic } from "@/lib/ui";

const COLOR: Record<"green" | "yellow" | "red", string> = {
  green: "#22c55e",
  yellow: "#f59e0b",
  red: "#ef4444",
};

/** Kreisfoermige Risiko-Anzeige (0..100) mit Ampelfarbe. */
export function RiskGauge({
  score,
  severity,
  size = 160,
}: {
  score: number;
  severity: Severity;
  size?: number;
}) {
  const traffic = severityTraffic(severity);
  const color = COLOR[traffic];
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1e2840"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 600ms ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-semibold tabular-nums" style={{ color }}>
            {score}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-slate-500">
            / 100
          </span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <p className="text-sm font-semibold" style={{ color }}>
          {scoreLabel(score)}
        </p>
        <p className="text-xs text-slate-500">
          Schweregrad: {SEVERITY_LABELS[severity]}
        </p>
      </div>
    </div>
  );
}
