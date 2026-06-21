import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { licenseActivateSchema } from "@/lib/validation";
import { activateLicenseKey } from "@/lib/lemon-squeezy";

export const dynamic = "force-dynamic";

/**
 * Aktiviert einen Lemon-Squeezy-Lizenzschluessel.
 * Ohne konfiguriertes Lemon Squeezy wird die Lizenz lokal als "inactive"
 * gespeichert (die App bleibt voll nutzbar).
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungueltiger Body." }, { status: 400 });
  }

  const parsed = licenseActivateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { licenseKey, instanceName } = parsed.data;

  try {
    const user = await getCurrentUser();
    const activation = await activateLicenseKey(licenseKey, instanceName);

    const license = await prisma.license.upsert({
      where: { licenseKey },
      update: {
        userId: user.id,
        status: activation.status,
        tier: activation.tier,
        instanceId: activation.instanceId ?? null,
        instanceName: activation.instanceName ?? instanceName ?? null,
        expiresAt: activation.expiresAt ? new Date(activation.expiresAt) : null,
        activatedAt: activation.ok ? new Date() : null,
        lastCheckAt: new Date(),
        rawJson: activation.raw ? JSON.stringify(activation.raw) : null,
      },
      create: {
        userId: user.id,
        licenseKey,
        status: activation.status,
        tier: activation.tier,
        instanceId: activation.instanceId ?? null,
        instanceName: activation.instanceName ?? instanceName ?? null,
        expiresAt: activation.expiresAt ? new Date(activation.expiresAt) : null,
        activatedAt: activation.ok ? new Date() : null,
        lastCheckAt: new Date(),
        rawJson: activation.raw ? JSON.stringify(activation.raw) : null,
      },
      select: {
        id: true,
        status: true,
        tier: true,
        instanceName: true,
        expiresAt: true,
      },
    });

    return NextResponse.json({
      ok: activation.ok,
      message: activation.message,
      license,
    });
  } catch {
    return NextResponse.json(
      { error: "Lizenz konnte nicht gespeichert werden." },
      { status: 500 },
    );
  }
}
