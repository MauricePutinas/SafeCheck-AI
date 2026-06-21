// Schneller Smoke-Test der Security-Engine (nur fuer Entwicklung).
// Ausfuehren: npx tsx scripts/engine-test.mts
import { scanText } from "../src/lib/security/scanner";
import { DEMO_SAMPLES, DEMO_WATCHLIST } from "../src/lib/security/test-samples";

let failures = 0;
function check(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.log(`  ❌ ${name}`);
  } else {
    console.log(`  ✅ ${name}`);
  }
}

for (const sample of DEMO_SAMPLES) {
  const res = scanText(
    sample.content,
    { inputType: sample.inputType, watchlist: DEMO_WATCHLIST },
    "2026-06-21T00:00:00.000Z",
  );
  console.log(`\n=== ${sample.label} (score ${res.riskScore}, ${res.severity}) ===`);
  console.log(`  Findings: ${res.findingCount}`);
  for (const f of res.findings) {
    console.log(`   - [${f.severity}] ${f.title}: ${f.maskedMatch}`);
  }

  // Sicherheits-Invariante: kein vollstaendiges Secret in maskedMatch.
  for (const f of res.findings) {
    if (f.ruleId.startsWith("secret.")) {
      check(
        `kein Klartext-Secret in "${f.title}"`,
        !f.maskedMatch.includes("demo-123456789") &&
          !f.maskedMatch.includes("demo123") &&
          !f.maskedMatch.includes("987654321"),
      );
    }
  }
}

// Gezielte Erwartungen
const mixed = scanText(DEMO_SAMPLES[0].content, { watchlist: DEMO_WATCHLIST }, "x");
check("mixed: findet API Key", mixed.findings.some((f) => f.ruleId === "secret.openai_key" || f.ruleId === "secret.generic_api_key"));
check("mixed: findet Passwort", mixed.findings.some((f) => f.ruleId === "secret.password_assignment"));
check("mixed: findet Bearer Token", mixed.findings.some((f) => f.ruleId === "secret.bearer_token"));
check("mixed: findet interne URL", mixed.findings.some((f) => f.ruleId === "internal.url"));
check("mixed: findet E-Mail", mixed.findings.some((f) => f.ruleId === "pii.email"));
check("mixed: redacted enthaelt Platzhalter", mixed.redactedText.includes("_REDACTED]"));
check("mixed: redacted ohne Klartext-Key", !mixed.redactedText.includes("sk-demo-123456789"));

const email = scanText(DEMO_SAMPLES[2].content, {}, "x");
check("email: gueltige IBAN erkannt", email.findings.some((f) => f.ruleId === "pii.iban"));

const inj = scanText(DEMO_SAMPLES[3].content, {}, "x");
check("injection: ignore-instructions erkannt", inj.findings.some((f) => f.ruleId === "prompt_injection.ignore_instructions"));

const clean = scanText(DEMO_SAMPLES[4].content, {}, "x");
check("clean: Score gering", clean.riskScore <= 10);

console.log(`\n${failures === 0 ? "ALLE CHECKS OK ✅" : failures + " FEHLGESCHLAGEN ❌"}`);
process.exit(failures === 0 ? 0 : 1);
