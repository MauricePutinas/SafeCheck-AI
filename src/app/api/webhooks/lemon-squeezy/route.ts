import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature, tierFromVariant, getLemonConfig } from "@/lib/lemon-squeezy";

export const dynamic = "force-dynamic";

/**
 * Lemon-Squeezy-Webhook-Endpoint (vorbereitet).
 *
 * Verarbeitet (vereinfacht) Lizenz-/Subscription-Events und haelt den lokalen
 * Lizenzstatus aktuell. Die Signatur wird per HMAC-SHA256 geprueft.
 *
 * Konfiguration: LEMON_SQUEEZY_WEBHOOK_SECRET in .env setzen und diese URL
 * im Lemon-Squeezy-Dashboard als Webhook hinterlegen:
 *   POST /api/webhooks/lemon-squeezy
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");

  const config = getLemonConfig();
  if (!config.webhookSecret) {
    // Nicht konfiguriert -> Webhook bewusst ablehnen (keine ungeprueften Updates).
    return NextResponse.json(
      { error: "Webhook nicht konfiguriert (LEMON_SQUEEZY_WEBHOOK_SECRET fehlt)." },
      { status: 503 },
    );
  }

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Ungueltige Signatur." }, { status: 401 });
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Ungueltiges JSON." }, { status: 400 });
  }

  const eventName = payload?.meta?.event_name ?? "unknown";
  const attributes = payload?.data?.attributes ?? {};
  const licenseKey =
    attributes.key ?? attributes.license_key ?? attributes.first_order_item?.license_key;

  // Status auf "active"/"disabled"/"expired" abbilden.
  const status = mapStatus(eventName, attributes.status);

  try {
    if (licenseKey) {
      await prisma.license.upsert({
        where: { licenseKey },
        update: {
          status,
          tier: tierFromVariant(attributes.variant_id, config),
          expiresAt: attributes.expires_at ? new Date(attributes.expires_at) : null,
          lastCheckAt: new Date(),
          rawJson: rawBody.slice(0, 10_000),
        },
        create: {
          licenseKey,
          status,
          tier: tierFromVariant(attributes.variant_id, config),
          expiresAt: attributes.expires_at ? new Date(attributes.expires_at) : null,
          lastCheckAt: new Date(),
          rawJson: rawBody.slice(0, 10_000),
        },
      });
    }
    return NextResponse.json({ received: true, event: eventName });
  } catch {
    return NextResponse.json(
      { error: "Webhook-Verarbeitung fehlgeschlagen." },
      { status: 500 },
    );
  }
}

function mapStatus(
  eventName: string,
  rawStatus?: string,
): "active" | "inactive" | "expired" | "disabled" {
  if (rawStatus === "expired") return "expired";
  if (rawStatus === "disabled") return "disabled";
  if (
    eventName.includes("license_key_created") ||
    eventName.includes("subscription_created") ||
    eventName.includes("order_created") ||
    rawStatus === "active"
  ) {
    return "active";
  }
  if (eventName.includes("expired")) return "expired";
  if (eventName.includes("disabled") || eventName.includes("cancelled")) {
    return "disabled";
  }
  return "inactive";
}

// Vereinfachte Webhook-Struktur
interface LemonWebhookPayload {
  meta?: { event_name?: string };
  data?: {
    attributes?: {
      key?: string;
      license_key?: string;
      status?: string;
      variant_id?: number;
      expires_at?: string | null;
      first_order_item?: { license_key?: string };
    };
  };
}
