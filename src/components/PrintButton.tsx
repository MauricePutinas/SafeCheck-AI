"use client";

export function PrintButton({
  label = "🖨 Drucken / als PDF speichern",
  className = "btn-ghost",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      {label}
    </button>
  );
}
