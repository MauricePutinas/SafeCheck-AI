// AI SafeCheck Lite — Lemon Squeezy Lizenz-Vorbereitung
//
// Dieses Modul kapselt die Lizenz-Logik. Es ist BEWUSST so gebaut, dass die
// App auch OHNE konfigurierte Lemon-Squeezy-Zugaenge vollstaendig laeuft
// (lokaler "inactive"-Status). Echte Aktivierung/Validierung erfolgt erst,
// wenn die Umgebungsvariablen gesetzt sind.

import crypto from "crypto";

export type LicenseTier = "lite" | "pro" | "business";
export type LicenseStatus = "inactive" | "active" | "expired" | "disabled";

export interface LemonConfig {
  apiKey: string | undefined;
  webhookSecret: string | undefined;
  storeId: string | undefined;
  variantLite: string | undefined;
  variantPro: string | undefined;
  variantBusiness: string | undefined;
  configured: boolean;
}

export function getLemonConfig(): LemonConfig {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY || undefined;
  const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || undefined;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID || undefined;
  return {
    apiKey,
    webhookSecret,
    storeId,
    variantLite: process.env.LEMON_SQUEEZY_VARIANT_LITE || undefined,
    variantPro: process.env.LEMON_SQUEEZY_VARIANT_PRO || undefined,
    variantBusiness: process.env.LEMON_SQUEEZY_VARIANT_BUSINESS || undefined,
    configured: Boolean(apiKey && storeId),
  };
}

const LEMON_API = "https://api.lemonsqueezy.com/v1";

export interface ActivationResult {
  ok: boolean;
  status: LicenseStatus;
  tier: LicenseTier;
  instanceId?: string;
  instanceName?: string;
  expiresAt?: string | null;
  message: string;
  raw?: unknown;
}

/**
 * Aktiviert einen Lizenzschluessel ueber die Lemon-Squeezy-API.
 * Wenn keine API-Konfiguration vorliegt, wird ein lokaler "inactive"-Status
 * zurueckgegeben (so bleibt die App ohne Konto lauffaehig).
 */
export async function activateLicenseKey(
  licenseKey: string,
  instanceName = "AI SafeCheck Lite",
): Promise<ActivationResult> {
  const config = getLemonConfig();

  if (!config.configured) {
    return {
      ok: false,
      status: "inactive",
      tier: "lite",
      message:
        "Lemon Squeezy ist nicht konfiguriert. Lizenz wurde lokal gespeichert, aber nicht validiert. (Setze LEMON_SQUEEZY_API_KEY & STORE_ID in .env)",
    };
  }

  try {
    const res = await fetch(`${LEMON_API}/licenses/activate`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        license_key: licenseKey,
        instance_name: instanceName,
      }),
    });

    const data = (await res.json()) as LemonLicenseResponse;

    if (!res.ok || data.activated === false || data.error) {
      return {
        ok: false,
        status: "inactive",
        tier: "lite",
        message: data.error ?? "Aktivierung fehlgeschlagen.",
        raw: data,
      };
    }

    return {
      ok: true,
      status: "active",
      tier: tierFromVariant(data.meta?.variant_id, config),
      instanceId: data.instance?.id,
      instanceName: data.instance?.name,
      expiresAt: data.license_key?.expires_at ?? null,
      message: "Lizenz erfolgreich aktiviert.",
      raw: data,
    };
  } catch (err) {
    return {
      ok: false,
      status: "inactive",
      tier: "lite",
      message:
        "Verbindung zu Lemon Squeezy fehlgeschlagen: " +
        (err instanceof Error ? err.message : "Unbekannter Fehler"),
    };
  }
}

/** Ordnet eine Lemon-Variant-ID einem Pricing-Tier zu. */
export function tierFromVariant(
  variantId: string | number | undefined,
  config: LemonConfig,
): LicenseTier {
  const id = variantId != null ? String(variantId) : "";
  if (id && id === config.variantBusiness) return "business";
  if (id && id === config.variantPro) return "pro";
  return "lite";
}

/**
 * Prueft die Signatur eines Lemon-Squeezy-Webhooks (HMAC SHA-256).
 * Gibt true zurueck, wenn die Signatur gueltig ist.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const config = getLemonConfig();
  if (!config.webhookSecret || !signatureHeader) return false;

  const hmac = crypto.createHmac("sha256", config.webhookSecret);
  const digest = hmac.update(rawBody, "utf8").digest("hex");

  try {
    const a = Buffer.from(digest, "hex");
    const b = Buffer.from(signatureHeader, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// --- Typen der (vereinfachten) Lemon-Squeezy-Antwort ---
interface LemonLicenseResponse {
  activated?: boolean;
  error?: string | null;
  license_key?: {
    id?: number;
    status?: string;
    key?: string;
    expires_at?: string | null;
  };
  instance?: {
    id?: string;
    name?: string;
  };
  meta?: {
    store_id?: number;
    order_id?: number;
    product_id?: number;
    variant_id?: number;
    customer_name?: string;
    customer_email?: string;
  };
}
