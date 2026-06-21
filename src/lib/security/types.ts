// AI SafeCheck Lite — Security Engine Typen
//
// Diese Datei ist der gemeinsame Vertrag fuer Scanner, Redactor und Risk-Score.
// Sie ist rein defensiv: Sie beschreibt nur Erkennung und Warnung, niemals Angriffe.

/** Schweregrad eines Findings bzw. eines Scans. */
export type Severity = "low" | "medium" | "high" | "critical";

/** Oberkategorie eines Findings. */
export type Category =
  | "secret" // API Keys, Tokens, Passwoerter, Private Keys
  | "pii" // personenbezogene Daten (E-Mail, Telefon, IBAN ...)
  | "internal" // interne Firmendaten, URLs, Projektnamen, IPs
  | "prompt_injection" // Hinweise auf Prompt-Injection im kopierten Text
  | "risky_instruction"; // riskante Anweisungen (z.B. "send all data")

/** Art der Nutzereingabe. */
export type InputType = "text" | "code" | "email";

/**
 * Eine Erkennungsregel. Bewusst datengetrieben gehalten,
 * damit eigene Regeln einfach ergaenzt werden koennen.
 */
export interface Rule {
  /** Stabile, eindeutige ID (z.B. "secret.openai_key"). */
  id: string;
  /** Kurzer, sprechender Titel fuer die UI. */
  title: string;
  category: Category;
  severity: Severity;
  /**
   * Regex, der die verdaechtige Stelle findet.
   * Muss das globale Flag (g) gesetzt haben.
   */
  pattern: RegExp;
  /** Erklaerung, warum das ein Risiko ist (defensiv, ohne Exploit-Wissen). */
  explanation: string;
  /** Konkrete, sichere Handlungsempfehlung. */
  recommendation: string;
  /** Platzhalter, der beim Safe-Rewrite eingesetzt wird, z.B. "[API_KEY_REDACTED]". */
  redactionTag: string;
  /**
   * Optionaler Validator, um Fehlalarme zu reduzieren
   * (z.B. IBAN-Pruefsumme, Luhn-Check). Gibt true zurueck,
   * wenn der Treffer als echtes Risiko gewertet werden soll.
   */
  validate?: (match: string) => boolean;
  /** Wenn true, wird die Regel nur im strengen Modus angewandt. */
  strictOnly?: boolean;
  /** Wie viel vom Treffer am Anfang/Ende sichtbar bleiben darf (Default 2/2). */
  reveal?: { start: number; end: number };
}

/** Ein einzelnes Erkennungsergebnis. */
export interface Finding {
  ruleId: string;
  category: Category;
  severity: Severity;
  title: string;
  /** Niemals der vollstaendige Treffer — immer maskiert. */
  maskedMatch: string;
  /** Position im Originaltext (fuer Highlighting). */
  startIndex: number;
  endIndex: number;
  explanation: string;
  recommendation: string;
}

/** Aggregierte Statistik je Kategorie. */
export interface CategoryCount {
  category: Category;
  count: number;
}

/** Vollstaendiges Ergebnis eines Scans. */
export interface ScanResult {
  inputType: InputType;
  riskScore: number; // 0..100
  severity: Severity;
  findings: Finding[];
  findingCount: number;
  categoryCounts: CategoryCount[];
  /** Bereinigte Version des Textes mit maskierten Secrets. */
  redactedText: string;
  /** Laenge des Originaltextes (Metadaten, nicht der Text selbst). */
  inputLength: number;
  /** Kurzer, menschenlesbarer Gesamtbefund. */
  summary: string;
  /** Zeitpunkt der Auswertung (ISO-String). */
  scannedAt: string;
}

/** Optionen fuer einen Scan-Durchlauf. */
export interface ScanOptions {
  inputType?: InputType;
  /** Strenger Modus: zusaetzliche Regeln + niedrigere Schwellen. */
  strictMode?: boolean;
  /** Eigene Begriffe (Watchlist), die zusaetzlich erkannt werden. */
  watchlist?: WatchlistEntry[];
}

/** Eigener Watchlist-Begriff (Firmen-, Projekt-, Kundenname, Tool ...). */
export interface WatchlistEntry {
  term: string;
  type?: "company" | "project" | "customer" | "tool" | "other";
  severity?: Severity;
  caseSensitive?: boolean;
}

/** Reihenfolge der Schweregrade fuer Sortierung/Vergleich. */
export const SEVERITY_ORDER: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/** Menschlich lesbare Labels (Deutsch) je Kategorie. */
export const CATEGORY_LABELS: Record<Category, string> = {
  secret: "Secret / Zugangsdaten",
  pii: "Personenbezogene Daten",
  internal: "Interne Firmendaten",
  prompt_injection: "Prompt-Injection-Hinweis",
  risky_instruction: "Riskante Anweisung",
};

/** Menschlich lesbare Labels (Deutsch) je Schweregrad. */
export const SEVERITY_LABELS: Record<Severity, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
  critical: "Kritisch",
};
