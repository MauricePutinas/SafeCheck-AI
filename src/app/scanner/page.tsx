import { ScannerClient } from "@/components/ScannerClient";
import { getCurrentUser, getSettings } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { Severity, WatchlistEntry } from "@/lib/security/types";

export const dynamic = "force-dynamic";

export default async function ScannerPage() {
  // Defensiv: falls die DB (noch) nicht erreichbar ist, mit Defaults arbeiten.
  let settings = {
    strictMode: false,
    saveHistory: true,
    storeOriginalText: false,
  };
  let watchlist: WatchlistEntry[] = [];

  try {
    const user = await getCurrentUser();
    const s = await getSettings();
    settings = {
      strictMode: s.strictMode,
      saveHistory: s.saveHistory,
      storeOriginalText: s.storeOriginalText,
    };
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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Scanner</h1>
        <p className="mt-1 text-slate-400">
          Pruefe Text, Code oder E-Mails auf Secrets, personenbezogene und
          interne Daten — bevor du sie in ein KI-Tool einfuegst.
        </p>
      </header>

      <ScannerClient
        defaultStrict={settings.strictMode}
        defaultSaveHistory={settings.saveHistory}
        defaultStoreOriginal={settings.storeOriginalText}
        watchlist={watchlist}
      />
    </div>
  );
}
