import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { getLemonConfig } from "@/lib/lemon-squeezy";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();

    const [scanCount, watchlistCount, license, severityGroups] =
      await Promise.all([
        prisma.scan.count({ where: { userId: user.id } }),
        prisma.watchlistTerm.count({ where: { userId: user.id } }),
        prisma.license.findFirst({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            licenseKey: true,
            status: true,
            tier: true,
            instanceName: true,
            activatedAt: true,
            expiresAt: true,
            lastCheckAt: true,
          },
        }),
        prisma.scan.groupBy({
          by: ["severity"],
          where: { userId: user.id },
          _count: { _all: true },
        }),
      ]);

    const config = getLemonConfig();

    // Lizenzschluessel maskieren (nie vollstaendig zeigen).
    const maskedLicense = license
      ? { ...license, licenseKey: maskKey(license.licenseKey) }
      : null;

    return NextResponse.json({
      user: { email: user.email, name: user.name, role: user.role },
      stats: {
        scanCount,
        watchlistCount,
        severity: severityGroups.map((g) => ({
          severity: g.severity,
          count: g._count._all,
        })),
      },
      license: maskedLicense,
      lemonConfigured: config.configured,
    });
  } catch {
    return NextResponse.json(
      { error: "Admindaten konnten nicht geladen werden." },
      { status: 500 },
    );
  }
}

function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}
