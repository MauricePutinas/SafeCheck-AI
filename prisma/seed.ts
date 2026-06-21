// Seed-Skript: legt Standard-Nutzer, Einstellungen und Demo-Watchlist an.
// Ausfuehren: npm run db:seed  (oder Teil von "npm run setup")
import { PrismaClient } from "@prisma/client";
import { DEMO_WATCHLIST } from "../src/lib/security/test-samples";

const prisma = new PrismaClient();

async function main() {
  const email = "owner@local";

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Owner",
      role: "owner",
      settings: {
        create: {
          storeOriginalText: false,
          strictMode: false,
          saveHistory: true,
        },
      },
    },
  });

  // Sicherstellen, dass Settings existieren (falls User schon vorhanden war).
  await prisma.appSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  // Demo-Watchlist-Begriffe nur anlegen, wenn noch keine vorhanden sind.
  const count = await prisma.watchlistTerm.count({ where: { userId: user.id } });
  if (count === 0) {
    for (const item of DEMO_WATCHLIST) {
      await prisma.watchlistTerm.create({
        data: {
          userId: user.id,
          term: item.term,
          type: item.type,
          severity: item.severity,
        },
      });
    }
    console.log(`✓ ${DEMO_WATCHLIST.length} Demo-Watchlist-Begriffe angelegt.`);
  } else {
    console.log("• Watchlist bereits vorhanden — keine Demo-Daten angelegt.");
  }

  console.log(`✓ Seed abgeschlossen (Nutzer: ${user.email}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
