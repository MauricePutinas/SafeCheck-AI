// AI SafeCheck Lite — Erkennungsregeln (regelbasiert, rein defensiv)
//
// Jede Regel beschreibt NUR, wie eine riskante Stelle erkannt und gewarnt wird.
// Es gibt hier KEINE Angriffsanleitungen und KEINE Umgehungstechniken.
//
// Eigene Regeln ergaenzen:
//   1. Neues Rule-Objekt in das passende Kategorie-Array einfuegen.
//   2. Eindeutige `id`, sinnvollen `redactionTag` und `recommendation` setzen.
//   3. `pattern` braucht IMMER das globale Flag (g).

import type { Rule } from "./types";

// ----------------------------------------------------------------------------
// Validatoren (reduzieren Fehlalarme)
// ----------------------------------------------------------------------------

/** Pruft, ob alle vier Oktette einer IPv4 im gueltigen Bereich (0..255) liegen. */
export function isValidIpv4(match: string): boolean {
  const parts = match.split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (!/^\d{1,3}$/.test(p)) return false;
    const n = Number(p);
    return n >= 0 && n <= 255;
  });
}

/** Luhn-Pruefsumme (z.B. fuer kreditkartenartige Nummern). */
export function passesLuhn(value: string): boolean {
  const digits = value.replace(/[^\d]/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/** IBAN-Pruefung nach ISO 7064 (mod 97). */
export function isValidIban(match: string): boolean {
  const iban = match.replace(/\s+/g, "").toUpperCase();
  if (iban.length < 15 || iban.length > 34) return false;
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) return false;
  // Erste vier Zeichen ans Ende verschieben.
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  // Buchstaben -> Zahlen (A=10 ... Z=35).
  let numeric = "";
  for (const ch of rearranged) {
    if (ch >= "A" && ch <= "Z") {
      numeric += (ch.charCodeAt(0) - 55).toString();
    } else {
      numeric += ch;
    }
  }
  // mod 97 stueckweise, um BigInt zu vermeiden.
  let remainder = 0;
  for (const ch of numeric) {
    remainder = (remainder * 10 + (ch.charCodeAt(0) - 48)) % 97;
  }
  return remainder === 1;
}

/** Telefonnummer-Heuristik: 7..15 Ziffern. */
export function looksLikePhone(match: string): boolean {
  const digits = match.replace(/[^\d]/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

// ----------------------------------------------------------------------------
// 1) Secrets / Zugangsdaten
// ----------------------------------------------------------------------------

const SECRET_RULES: Rule[] = [
  {
    id: "secret.private_key",
    title: "Privater Schluessel (PEM)",
    category: "secret",
    severity: "critical",
    pattern:
      /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----[\s\S]*?(?:-----END (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----)?/g,
    redactionTag: "[PRIVATE_KEY_REDACTED]",
    explanation:
      "Der Text enthaelt das Muster eines privaten kryptografischen Schluessels. Private Schluessel gewaehren direkten Zugriff und gehoeren niemals in ein KI-Chatfenster.",
    recommendation:
      "Entferne den privaten Schluessel vollstaendig. Falls er bereits geteilt wurde: Schluessel rotieren/widerrufen.",
    reveal: { start: 0, end: 0 },
  },
  {
    id: "secret.aws_access_key",
    title: "AWS Access Key ID",
    category: "secret",
    severity: "critical",
    pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{12,}\b/g,
    redactionTag: "[AWS_KEY_REDACTED]",
    explanation:
      "Das Muster entspricht einer AWS Access Key ID. Damit lassen sich potenziell Cloud-Ressourcen ansprechen.",
    recommendation:
      "Key aus dem Text entfernen und in der AWS-Konsole deaktivieren/rotieren. Niemals in Klartext weitergeben.",
  },
  {
    id: "secret.openai_key",
    title: "OpenAI-artiger API Key (sk-...)",
    category: "secret",
    severity: "critical",
    pattern: /\bsk-[A-Za-z0-9_\-]{8,}\b/g,
    redactionTag: "[API_KEY_REDACTED]",
    explanation:
      "Das Muster 'sk-...' wird von mehreren KI-/SaaS-Anbietern fuer geheime API Keys genutzt.",
    recommendation:
      "API Key entfernen und beim Anbieter neu generieren (rotieren). Keys gehoeren in einen Secret-Store, nicht in Chats.",
  },
  {
    id: "secret.github_token",
    title: "GitHub Token",
    category: "secret",
    severity: "high",
    pattern: /\bgh[pousr]_[A-Za-z0-9]{16,}\b/g,
    redactionTag: "[API_KEY_REDACTED]",
    explanation:
      "Das Muster entspricht einem GitHub Personal Access / OAuth Token mit potenziellem Repo-Zugriff.",
    recommendation:
      "Token entfernen und in den GitHub-Einstellungen widerrufen. Bei Bedarf ein neues, eng begrenztes Token erstellen.",
  },
  {
    id: "secret.slack_token",
    title: "Slack Token",
    category: "secret",
    severity: "high",
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
    redactionTag: "[API_KEY_REDACTED]",
    explanation:
      "Das Muster entspricht einem Slack-Token, mit dem auf einen Workspace zugegriffen werden koennte.",
    recommendation: "Token entfernen und in Slack widerrufen/rotieren.",
  },
  {
    id: "secret.google_api_key",
    title: "Google API Key",
    category: "secret",
    severity: "high",
    pattern: /\bAIza[0-9A-Za-z_\-]{20,}\b/g,
    redactionTag: "[API_KEY_REDACTED]",
    explanation: "Das Muster entspricht einem Google-API-Key.",
    recommendation:
      "Key entfernen, in der Google Cloud Console einschraenken/rotieren.",
  },
  {
    id: "secret.jwt",
    title: "JSON Web Token (JWT)",
    category: "secret",
    severity: "high",
    pattern: /\beyJ[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{6,}\b/g,
    redactionTag: "[TOKEN_REDACTED]",
    explanation:
      "Das Muster entspricht einem JWT. Solche Tokens koennen Sitzungs- oder Zugriffsrechte enthalten.",
    recommendation:
      "Token entfernen. Falls es ein gueltiges Sitzungstoken ist: abmelden / invalidieren.",
  },
  {
    id: "secret.bearer_token",
    title: "Bearer Token im Header",
    category: "secret",
    severity: "high",
    pattern: /\bBearer\s+[A-Za-z0-9_\-\.=]{6,}/g,
    redactionTag: "[TOKEN_REDACTED]",
    explanation:
      "Ein 'Bearer'-Token wird zur Authentifizierung an APIs gesendet und sollte geheim bleiben.",
    recommendation:
      "Token aus dem Beispiel entfernen oder durch einen Platzhalter ersetzen.",
  },
  {
    id: "secret.generic_api_key",
    title: "API Key / Secret in Zuweisung",
    category: "secret",
    severity: "high",
    pattern:
      /\b(?:api[_-]?key|apikey|secret|client[_-]?secret|access[_-]?token|auth[_-]?token)\b\s*[:=]\s*["']?[A-Za-z0-9_\-\.]{8,}["']?/gi,
    redactionTag: "[API_KEY_REDACTED]",
    explanation:
      "Eine Zuweisung wie 'api_key = ...' enthaelt mit hoher Wahrscheinlichkeit ein Geheimnis.",
    recommendation:
      "Wert durch einen Platzhalter ersetzen. Echte Keys gehoeren in Umgebungsvariablen / Secret-Stores.",
  },
  {
    id: "secret.password_assignment",
    title: "Passwort in Zuweisung",
    category: "secret",
    severity: "high",
    pattern:
      /\b(?:password|passwort|passwd|pwd|pass)\b\s*[:=]\s*["']?[^\s"']{3,}["']?/gi,
    redactionTag: "[PASSWORD_REDACTED]",
    explanation:
      "Eine Zuweisung wie 'password = ...' enthaelt vermutlich ein Klartext-Passwort.",
    recommendation:
      "Passwort entfernen. Niemals echte Passwoerter in KI-Tools einfuegen; betroffenes Passwort aendern.",
  },
];

// ----------------------------------------------------------------------------
// 2) Personenbezogene Daten (PII)
// ----------------------------------------------------------------------------

const PII_RULES: Rule[] = [
  {
    id: "pii.email",
    title: "E-Mail-Adresse",
    category: "pii",
    severity: "medium",
    pattern: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,
    redactionTag: "[EMAIL_REDACTED]",
    explanation:
      "E-Mail-Adressen sind personenbezogene Daten und koennen Rueckschluesse auf Personen/Firmen erlauben.",
    recommendation:
      "E-Mail-Adresse maskieren, wenn sie fuer die Anfrage nicht zwingend benoetigt wird.",
    reveal: { start: 1, end: 0 },
  },
  {
    id: "pii.iban",
    title: "IBAN (Bankverbindung)",
    category: "pii",
    severity: "high",
    pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g,
    validate: isValidIban,
    redactionTag: "[IBAN_REDACTED]",
    explanation:
      "Eine gueltige IBAN ist eine sensible Bankverbindung und ein personenbezogenes Datum.",
    recommendation: "IBAN entfernen oder maskieren.",
  },
  {
    id: "pii.credit_card",
    title: "Kreditkartenartige Nummer",
    category: "pii",
    severity: "high",
    pattern: /\b(?:\d[ \-]?){13,19}\b/g,
    validate: passesLuhn,
    redactionTag: "[CARD_REDACTED]",
    explanation:
      "Die Ziffernfolge besteht die Luhn-Pruefung und koennte eine Zahlungskartennummer sein.",
    recommendation:
      "Kartennummer entfernen. Zahlungsdaten gehoeren niemals in KI-Chats.",
  },
  {
    id: "pii.phone",
    title: "Telefonnummer",
    category: "pii",
    severity: "low",
    pattern: /(?:\+|00)\d{1,3}[\s\-/]?(?:\(?\d{1,5}\)?[\s\-/]?){2,6}\d{2,}/g,
    validate: looksLikePhone,
    redactionTag: "[PHONE_REDACTED]",
    explanation:
      "Telefonnummern sind personenbezogene Daten und sollten nicht ungeprueft geteilt werden.",
    recommendation: "Telefonnummer maskieren, falls nicht zwingend noetig.",
  },
  {
    id: "pii.customer_number",
    title: "Kundennummer",
    category: "pii",
    severity: "medium",
    pattern:
      /\b(?:Kundennummer|Kundennr\.?|Kd\.?-?Nr\.?|Customer\s*(?:No\.?|Number|ID))\b\s*[:#]?\s*[A-Za-z0-9\-]{3,}/gi,
    redactionTag: "[CUSTOMER_NUMBER_REDACTED]",
    explanation:
      "Eine Kundennummer kann eine Person/Firma identifizieren und ist intern/sensibel.",
    recommendation: "Kundennummer entfernen oder durch Platzhalter ersetzen.",
  },
];

// ----------------------------------------------------------------------------
// 3) Interne Firmendaten
// ----------------------------------------------------------------------------

const INTERNAL_RULES: Rule[] = [
  {
    id: "internal.private_ip",
    title: "Private/Interne IP-Adresse",
    category: "internal",
    severity: "medium",
    pattern:
      /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/g,
    validate: isValidIpv4,
    redactionTag: "[INTERNAL_IP_REDACTED]",
    explanation:
      "Private IP-Adressen verraten Teile der internen Netzwerkstruktur.",
    recommendation:
      "Interne IP-Adressen maskieren; sie sind fuer KI-Anfragen selten noetig.",
  },
  {
    id: "internal.ip_address",
    title: "IP-Adresse",
    category: "internal",
    severity: "low",
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    validate: isValidIpv4,
    redactionTag: "[IP_REDACTED]",
    explanation:
      "IP-Adressen koennen Infrastruktur oder Standorte preisgeben.",
    recommendation: "IP-Adresse pruefen und ggf. maskieren.",
    strictOnly: true,
  },
  {
    id: "internal.url",
    title: "Interne URL / System",
    category: "internal",
    severity: "medium",
    pattern:
      /\bhttps?:\/\/(?:[a-z0-9\-]+\.)*(?:intern(?:al)?|intranet|corp|local|localhost|staging|dev|test|vpn|git|gitlab|jira|confluence|jenkins|grafana|kibana)[a-z0-9.\-]*(?::\d+)?(?:\/[^\s]*)?/gi,
    redactionTag: "[INTERNAL_URL_REDACTED]",
    explanation:
      "Interne URLs (Intranet, Staging, Tools) verraten interne Systeme und Namenskonventionen.",
    recommendation:
      "Interne URLs entfernen oder durch generische Platzhalter ersetzen.",
  },
  {
    id: "internal.confidential_marker",
    title: "Vertraulichkeits-Markierung",
    category: "internal",
    severity: "medium",
    pattern:
      /\b(?:streng\s+vertraulich|vertraulich|confidential|internal\s+use\s+only|nur\s+(?:fuer\s+)?intern(?:en\s+gebrauch)?|geheim|NDA)\b/gi,
    redactionTag: "[CONFIDENTIAL_MARKER_REDACTED]",
    explanation:
      "Der Text ist als vertraulich/intern markiert. Solche Inhalte sollten besonders geprueft werden.",
    recommendation:
      "Pruefe, ob der Inhalt ueberhaupt in ein externes KI-Tool darf. Im Zweifel intern halten.",
  },
  {
    id: "internal.project_codename",
    title: "Interner Projekt-/Codename",
    category: "internal",
    severity: "medium",
    pattern: /\b(?:Projekt|Project|Codename|Codewort)\s+["']?[A-Z][A-Za-z0-9_\-]{2,}["']?/g,
    redactionTag: "[PROJECT_REDACTED]",
    explanation:
      "Interne Projekt-/Codenamen koennen vertrauliche Vorhaben verraten.",
    recommendation:
      "Projektnamen durch generische Platzhalter ersetzen (z.B. 'Projekt X').",
    strictOnly: false,
  },
];

// ----------------------------------------------------------------------------
// 4) Prompt-Injection-Hinweise (nur Warnmuster, defensiv)
// ----------------------------------------------------------------------------

const PROMPT_INJECTION_RULES: Rule[] = [
  {
    id: "prompt_injection.ignore_instructions",
    title: "Hinweis: 'Anweisungen ignorieren'",
    category: "prompt_injection",
    severity: "high",
    pattern:
      /\b(?:ignore|disregard|forget)\s+(?:all\s+|any\s+)?(?:previous|prior|above|earlier)\s+(?:instructions?|prompts?|rules?)\b|\bignoriere?\s+(?:alle\s+|die\s+)?(?:vorherigen?|vorigen?|obigen?)\s+anweisungen\b/gi,
    redactionTag: "[PROMPT_INJECTION_MARKER]",
    explanation:
      "Der kopierte Text enthaelt eine typische Prompt-Injection-Formulierung. Solche Saetze koennen ein KI-Tool dazu bringen, Vorgaben zu ignorieren.",
    recommendation:
      "Diese Anweisung NICHT in ein KI-Tool uebernehmen. Pruefe die Quelle des Textes.",
  },
  {
    id: "prompt_injection.system_prompt",
    title: "Hinweis: System-Prompt-Manipulation",
    category: "prompt_injection",
    severity: "medium",
    pattern:
      /\b(?:system\s*prompt|systemprompt|reveal\s+your\s+(?:system\s+)?prompt|show\s+me\s+your\s+instructions|you\s+are\s+now|from\s+now\s+on\s+you\s+are|act\s+as)\b/gi,
    redactionTag: "[PROMPT_INJECTION_MARKER]",
    explanation:
      "Der Text versucht moeglicherweise, das Verhalten oder den System-Prompt eines KI-Tools zu veraendern.",
    recommendation:
      "Solche Passagen kritisch pruefen und nicht ungeprueft weitergeben.",
  },
  {
    id: "prompt_injection.jailbreak_marker",
    title: "Hinweis: Jailbreak-Formulierung",
    category: "prompt_injection",
    severity: "medium",
    pattern:
      /\b(?:jailbreak|developer\s+mode|do\s+anything\s+now|without\s+any\s+restrictions|bypass\s+(?:your\s+)?(?:rules|filters|guidelines))\b/gi,
    redactionTag: "[PROMPT_INJECTION_MARKER]",
    explanation:
      "Der Text enthaelt Begriffe, die oft fuer das Aushebeln von KI-Schutzmechanismen verwendet werden.",
    recommendation:
      "Diese Formulierungen nicht uebernehmen. Es ist ein Warnsignal fuer manipulierten Text.",
  },
];

// ----------------------------------------------------------------------------
// 5) Riskante Anweisungen im kopierten Text (nur Warnmuster)
// ----------------------------------------------------------------------------

const RISKY_INSTRUCTION_RULES: Rule[] = [
  {
    id: "risky_instruction.exfiltrate",
    title: "Riskante Anweisung: Daten abfliessen lassen",
    category: "risky_instruction",
    severity: "high",
    pattern:
      /\b(?:exfiltrate|leak\s+(?:the\s+)?data|send\s+(?:all\s+|the\s+)?(?:data|files|secrets|credentials)|forward\s+all\s+(?:emails|messages)|upload\s+(?:all\s+)?(?:data|files)\s+to)\b/gi,
    redactionTag: "[RISKY_INSTRUCTION_MARKER]",
    explanation:
      "Der Text enthaelt eine Anweisung, die auf einen Datenabfluss abzielt.",
    recommendation:
      "Diese Anweisung nicht ausfuehren und nicht weitergeben. Quelle des Textes pruefen.",
  },
  {
    id: "risky_instruction.destructive",
    title: "Riskante Anweisung: Zerstoererische Aktion",
    category: "risky_instruction",
    severity: "high",
    pattern:
      /\b(?:delete\s+all|drop\s+table|truncate\s+table|wipe\s+(?:all\s+)?data|format\s+(?:the\s+)?(?:disk|drive))\b/gi,
    redactionTag: "[RISKY_INSTRUCTION_MARKER]",
    explanation:
      "Der kopierte Text enthaelt eine potenziell zerstoererische Anweisung.",
    recommendation:
      "Nicht ausfuehren. Solche Anweisungen sind ein Warnsignal in fremdem Text.",
  },
  {
    id: "risky_instruction.credential_request",
    title: "Riskante Anweisung: Zugangsdaten anfordern",
    category: "risky_instruction",
    severity: "high",
    pattern:
      /\b(?:send\s+me\s+your\s+password|share\s+your\s+credentials|provide\s+(?:the\s+)?api\s+key|gib\s+mir\s+(?:dein|das)\s+passwort)\b/gi,
    redactionTag: "[RISKY_INSTRUCTION_MARKER]",
    explanation:
      "Der Text fordert zur Herausgabe von Zugangsdaten auf — ein typisches Social-Engineering-/Phishing-Muster.",
    recommendation:
      "Keine Zugangsdaten herausgeben. Den Text als verdaechtig behandeln.",
  },
];

// ----------------------------------------------------------------------------
// Export: alle Regeln
// ----------------------------------------------------------------------------

export const ALL_RULES: Rule[] = [
  ...SECRET_RULES,
  ...PII_RULES,
  ...INTERNAL_RULES,
  ...PROMPT_INJECTION_RULES,
  ...RISKY_INSTRUCTION_RULES,
];

export const RULES_BY_CATEGORY = {
  secret: SECRET_RULES,
  pii: PII_RULES,
  internal: INTERNAL_RULES,
  prompt_injection: PROMPT_INJECTION_RULES,
  risky_instruction: RISKY_INSTRUCTION_RULES,
};
