"use client";

import { useState } from "react";

export function CopyButton({
  value,
  label = "Kopieren",
  className = "btn-ghost",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Fallback: stilles Scheitern (z.B. ohne Clipboard-Berechtigung).
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={handleCopy} className={className}>
      {copied ? "✓ Kopiert" : label}
    </button>
  );
}
