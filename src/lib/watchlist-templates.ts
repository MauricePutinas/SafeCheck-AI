// Watchlist-Vorlagen fuer Teams (Adminbereich).
// Dies sind generische Platzhalter-Begriffe, die typischerweise intern sind.
// Nutzer ersetzen sie durch ihre echten Werte.

import type { Severity } from "./security/types";

export interface WatchlistTemplate {
  id: string;
  label: string;
  description: string;
  items: {
    term: string;
    type: "company" | "project" | "customer" | "tool" | "other";
    severity: Severity;
  }[];
}

export const WATCHLIST_TEMPLATES: WatchlistTemplate[] = [
  {
    id: "company",
    label: "Firmen-Basics",
    description: "Eigener Firmenname und gaengige interne Bezeichnungen.",
    items: [
      { term: "Beispiel GmbH", type: "company", severity: "medium" },
      { term: "Intranet", type: "tool", severity: "low" },
      { term: "VPN", type: "tool", severity: "low" },
    ],
  },
  {
    id: "projects",
    label: "Projekt-Codenamen",
    description: "Platzhalter fuer vertrauliche Projektnamen.",
    items: [
      { term: "Projekt Falke", type: "project", severity: "medium" },
      { term: "Projekt Atlas", type: "project", severity: "medium" },
      { term: "Roadmap 2026", type: "project", severity: "medium" },
    ],
  },
  {
    id: "tools",
    label: "Interne Tools",
    description: "Namen interner Systeme und Tools.",
    items: [
      { term: "Atlas-CRM", type: "tool", severity: "low" },
      { term: "Jira", type: "tool", severity: "low" },
      { term: "Confluence", type: "tool", severity: "low" },
    ],
  },
  {
    id: "customers",
    label: "Kunden (Beispiel)",
    description: "Platzhalter fuer sensible Kundennamen.",
    items: [
      { term: "Musterkunde AG", type: "customer", severity: "high" },
      { term: "Großkunde Nord", type: "customer", severity: "high" },
    ],
  },
];
