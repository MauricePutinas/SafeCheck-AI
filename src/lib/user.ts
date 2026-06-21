// Einfache "aktueller Nutzer"-Logik fuer das MVP.
//
// Dieses MVP ist Single-User (lokal). Es gibt einen Standard-Nutzer
// ("owner"), inkl. zugehoeriger AppSettings. Die Nutzerverwaltung im
// Adminbereich ist bewusst als Platzhalter angelegt.

import { prisma } from "./prisma";

export const DEFAULT_USER_EMAIL = "owner@local";

/** Liefert (oder erstellt) den Standard-Nutzer samt Settings. */
export async function getCurrentUser() {
  let user = await prisma.user.findUnique({
    where: { email: DEFAULT_USER_EMAIL },
    include: { settings: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: DEFAULT_USER_EMAIL,
        name: "Owner",
        role: "owner",
        settings: { create: {} },
      },
      include: { settings: true },
    });
  } else if (!user.settings) {
    await prisma.appSettings.create({ data: { userId: user.id } });
    user = await prisma.user.findUnique({
      where: { id: user.id },
      include: { settings: true },
    });
  }

  return user!;
}

/** Liefert die Einstellungen des Standard-Nutzers (mit sinnvollen Defaults). */
export async function getSettings() {
  const user = await getCurrentUser();
  return {
    userId: user.id,
    storeOriginalText: user.settings?.storeOriginalText ?? false,
    strictMode: user.settings?.strictMode ?? false,
    saveHistory: user.settings?.saveHistory ?? true,
  };
}
