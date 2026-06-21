// AI SafeCheck Lite — Optionaler AI-Adapter (vorbereitetes Interface)
//
// Der Scanner ist vollstaendig regelbasiert und braucht KEINE externe KI.
// Dieses Interface ist nur ein Platzhalter, falls man spaeter einen
// zusaetzlichen (optionalen) KI-gestuetzten Klassifikator anbinden moechte.
//
// Standard: deaktiviert. Es werden KEINE Daten nach aussen gesendet.

import type { Finding, InputType } from "./security/types";

export interface AiAdapterInput {
  text: string;
  inputType: InputType;
}

export interface AiAdapterResult {
  /** Zusaetzliche, KI-gestuetzte Findings (optional). */
  findings: Finding[];
  /** Quelle/Provider-Name fuer Transparenz. */
  provider: string;
  /** Hinweis, ob der Adapter aktiv war. */
  used: boolean;
}

export interface AiAdapter {
  readonly name: string;
  isEnabled(): boolean;
  analyze(input: AiAdapterInput): Promise<AiAdapterResult>;
}

/**
 * Standard-Adapter: bewusst eine "No-Op"-Implementierung.
 * Sie sendet nichts, ruft nichts auf und liefert keine zusaetzlichen Findings.
 */
export class NoopAiAdapter implements AiAdapter {
  readonly name = "noop";

  isEnabled(): boolean {
    return process.env.AI_ADAPTER_ENABLED === "true";
  }

  async analyze(_input: AiAdapterInput): Promise<AiAdapterResult> {
    return {
      findings: [],
      provider: this.name,
      used: false,
    };
  }
}

/** Liefert den aktiven Adapter (aktuell immer der No-Op-Adapter). */
export function getAiAdapter(): AiAdapter {
  // Hier koennte spaeter anhand von AI_ADAPTER_PROVIDER ein echter
  // (optionaler) Adapter zurueckgegeben werden.
  return new NoopAiAdapter();
}
