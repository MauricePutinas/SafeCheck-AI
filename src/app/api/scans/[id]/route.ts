import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

export const dynamic = "force-dynamic";

/** Einzelnen Scan inkl. Findings laden. */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    const scan = await prisma.scan.findFirst({
      where: { id: params.id, userId: user.id },
      include: { findings: true },
    });
    if (!scan) {
      return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
    }
    return NextResponse.json({ scan });
  } catch {
    return NextResponse.json(
      { error: "Scan konnte nicht geladen werden." },
      { status: 500 },
    );
  }
}

/** Scan loeschen. */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    const existing = await prisma.scan.findFirst({
      where: { id: params.id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
    }
    await prisma.scan.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Scan konnte nicht geloescht werden." },
      { status: 500 },
    );
  }
}
