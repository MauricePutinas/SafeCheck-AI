import { NextResponse } from "next/server";
import { scanText } from "@/lib/security/scanner";
import { getCurrentUser, getSettings } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { getAiAdapter } from "@/lib/ai-adapter";
import { scanRequestSchema } from "@/lib/validation";
import type { Severity, WatchlistEntry } from "@/lib/security/types";

export const dynamic = "force-dynamic";

/**
 * Optionaler serverseitiger Scan-Endpoint.
 * Die Web-UI scannt standardmaessig LOKAL im Browser. Dieser Endpoint
 * existiert fuer programmatische Nutzung und den (optionalen) AI-Adapter.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungueltiger Body." }, { status: 400 });
  }

  const parsed = scanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { text, inputType, strictMode } = parsed.data;

  // Einstellungen + Watchlist (best effort).
  let strict = strictMode ?? false;
  let watchlist: WatchlistEntry[] = [];
  try {
    const user = await getCurrentUser();
    const settings = await getSettings();
    if (strictMode === undefined) strict = settings.strictMode;
    const terms = await prisma.watchlistTerm.findMany({
      where: { userId: user.id, enabled: true },
    });
    watchlist = terms.map((t) => ({
      term: t.term,
      type: t.type as WatchlistEntry["type"],
      severity: t.severity as Severity,
      caseSensitive: t.caseSensitive,
    }));
  } catch {
    // Defaults beibehalten.
  }

  const result = scanText(
    text,
    { inputType, strictMode: strict, watchlist },
    new Date().toISOString(),
  );

  // Optionaler AI-Adapter (standardmaessig deaktiviert / No-Op).
  const adapter = getAiAdapter();
  let aiUsed = false;
  if (adapter.isEnabled()) {
    const ai = await adapter.analyze({ text, inputType });
    aiUsed = ai.used;
    if (ai.findings.length > 0) {
      result.findings.push(...ai.findings);
      result.findingCount = result.findings.length;
    }
  }

  return NextResponse.json({ result, aiUsed });
}
