import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "AI SafeCheck Lite — Sicher pruefen, bevor Daten ins KI-Tool gelangen",
  description:
    "Defensiver, regelbasierter Sicherheits-Check fuer Texte, E-Mails und Code-Snippets. Erkennt Secrets, personenbezogene und interne Daten — lokal, bevor sie in ChatGPT, Claude, Gemini oder Copilot landen.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="no-print mx-auto max-w-6xl px-4 pb-10 pt-6 text-xs text-slate-500">
          <div className="flex flex-col items-start justify-between gap-2 border-t border-line/60 pt-6 sm:flex-row sm:items-center">
            <p>
              AI SafeCheck Lite — defensiver Vorab-Check. Verarbeitung lokal &
              regelbasiert.
            </p>
            <div className="flex items-center gap-4">
              <a href="/privacy" className="hover:text-slate-300">
                Datenschutz
              </a>
              <span className="text-slate-600">
                Keine Rechtsberatung — technischer Vorabcheck.
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
