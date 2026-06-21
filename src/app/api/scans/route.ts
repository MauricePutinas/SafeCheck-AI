import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getSettings } from "@/lib/user";
import { saveScanSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Liste der gespeicherten Scans (nur Metadaten + Findings, kein Originaltext). */
export async function GET() {
  try {
    const user = await getCurrentUser();
    const scans = await prisma.scan.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        inputType: true,
        riskScore: true,
        severity: true,
        findingCount: true,
        createdAt: true,
        summaryJson: true,
      },
    });
    return NextResponse.json({ scans });
  } catch (err) {
    return NextResponse.json(
      { error: "Verlauf konnte nicht geladen werden." },
      { status: 500 },
    );
  }
}

/** Speichert einen (lokal erzeugten) Scan. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungueltiger Body." }, { status: 400 });
  }

  const parsed = saveScanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { result, originalText, storeOriginal } = parsed.data;

  try {
    const user = await getCurrentUser();
    const settings = await getSettings();

    // Datenschutz: Originaltext nur speichern, wenn BEIDE Bedingungen erfuellt sind
    // (Nutzerwunsch in diesem Scan UND globale Einstellung erlaubt es).
    const allowOriginal = storeOriginal && settings.storeOriginalText;
    const originalToStore = allowOriginal ? (originalText ?? null) : null;

    const scan = await prisma.scan.create({
      data: {
        userId: user.id,
        inputType: result.inputType,
        originalText: originalToStore,
        redactedText: result.redactedText,
        riskScore: result.riskScore,
        severity: result.severity,
        findingCount: result.findingCount,
        summaryJson: JSON.stringify({
          summary: result.summary,
          categoryCounts: result.categoryCounts,
        }),
        findings: {
          create: result.findings.map((f) => ({
            ruleId: f.ruleId,
            category: f.category,
            severity: f.severity,
            title: f.title,
            maskedMatch: f.maskedMatch,
            startIndex: f.startIndex,
            endIndex: f.endIndex,
            explanation: f.explanation,
            recommendation: f.recommendation,
          })),
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ id: scan.id, storedOriginal: allowOriginal });
  } catch (err) {
    return NextResponse.json(
      { error: "Scan konnte nicht gespeichert werden." },
      { status: 500 },
    );
  }
}
