import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { createWatchlistSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const terms = await prisma.watchlistTerm.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ terms });
  } catch {
    return NextResponse.json(
      { error: "Watchlist konnte nicht geladen werden." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungueltiger Body." }, { status: 400 });
  }

  const parsed = createWatchlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const user = await getCurrentUser();
    const term = await prisma.watchlistTerm.create({
      data: { userId: user.id, ...parsed.data },
    });
    return NextResponse.json({ term });
  } catch {
    return NextResponse.json(
      { error: "Begriff konnte nicht gespeichert werden." },
      { status: 500 },
    );
  }
}
