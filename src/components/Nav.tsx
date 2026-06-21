"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Start" },
  { href: "/scanner", label: "Scanner" },
  { href: "/history", label: "Verlauf" },
  { href: "/settings", label: "Einstellungen" },
  { href: "/admin", label: "Admin" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="no-print sticky top-0 z-30 border-b border-line/70 bg-ink-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/30">
            <ShieldIcon />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            AI SafeCheck <span className="text-accent">Lite</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-ink-700/60 text-white"
                    : "text-slate-400 hover:bg-ink-800/60 hover:text-slate-200"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link href="/scanner" className="btn-primary ml-2 hidden sm:inline-flex">
            Jetzt pruefen
          </Link>
        </nav>
      </div>
    </header>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l7 3v6c0 4.5-3 8-7 11-4-3-7-6.5-7-11V5l7-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
