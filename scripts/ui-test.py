from playwright.sync_api import sync_playwright
import sys

BASE = "http://localhost:3939"
DEMO = """Hallo Team,
API_KEY = sk-demo-123456789
password=demo123
Authorization: Bearer demo_token
Mail: support@beispiel-firma.de
Internes Dashboard: https://dashboard.internal.example/login
Tool im Einsatz: Atlas-CRM
Projekt Falke startet naechste Woche."""

failures = []

def check(name, cond):
    print(("  OK  " if cond else " FAIL ") + name)
    if not cond:
        failures.append(name)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 1600})
    console_errors = []
    page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: console_errors.append("PAGEERROR: " + str(e)))

    # --- Landing ---
    page.goto(BASE, wait_until="networkidle")
    check("Landing zeigt Headline", "KI-Chat" in page.content())
    check("Landing zeigt Pricing 29/9/79", all(x in page.content() for x in ["29", "79"]))
    page.screenshot(path="scripts/shot-landing.png", full_page=True)

    # --- Scanner ---
    page.goto(BASE + "/scanner", wait_until="networkidle")
    page.fill("#scan-input", DEMO)
    page.get_by_role("button", name="Pruefen").click()
    page.wait_for_selector("#scan-results", timeout=8000)
    page.wait_for_timeout(800)
    content = page.content()

    check("Finding-Titel OpenAI Key", "OpenAI-artiger API Key" in content)
    check("Finding Passwort", "Passwort in Zuweisung" in content)
    check("Finding Bearer Token", "Bearer Token im Header" in content)
    check("Finding E-Mail", "E-Mail-Adresse" in content)
    check("Finding interne URL", "Interne URL" in content)
    check("Watchlist Atlas-CRM (aus DB) erkannt", "Watchlist-Treffer" in content)
    check("Safe Rewrite Platzhalter sichtbar", "[API_KEY_REDACTED]" in content)
    check("Score 100 angezeigt", "100" in content)

    # Sicherheits-Invariante: Findings-Bereich enthaelt KEIN Klartext-Secret.
    findings_card = page.locator("#scan-results .card").filter(
        has=page.get_by_role("heading", name="Findings")
    ).first
    findings_text = findings_card.inner_text()
    check("Findings ohne Klartext-Key", "sk-demo-123456789" not in findings_text)
    check("Findings ohne Klartext-Passwort", "demo123" not in findings_text)

    # Safe-Rewrite (bereinigt) enthaelt kein Secret.
    redacted_box = page.locator("#scan-results pre").last.inner_text()
    check("Bereinigter Text ohne Klartext-Key", "sk-demo-123456789" not in redacted_box)
    check("Bereinigter Text mit Platzhalter", "[API_KEY_REDACTED]" in redacted_box)

    page.screenshot(path="scripts/shot-scanner.png", full_page=True)

    # --- Safe Rewrite Vorher/Nachher Toggle ---
    page.get_by_role("button", name="Vorher/Nachher").click()
    page.wait_for_timeout(300)
    check("Vorher/Nachher zeigt Original", "sk-demo-123456789" in page.content())

    # --- Speichern (ohne Original) ---
    page.get_by_role("button", name="Speichern", exact=True).click()
    link = page.get_by_role("link", name="Report oeffnen")
    link.wait_for(state="visible", timeout=8000)
    check("Scan gespeichert -> Report-Link da", link.count() == 1)
    report_href = link.get_attribute("href")
    page.screenshot(path="scripts/shot-saved.png", full_page=True)

    # --- Report oeffnen (per href navigieren, robust) ---
    page.goto(BASE + report_href, wait_until="networkidle")
    rc = page.content()
    check("Report: Titel", "Sicherheits-Report" in rc)
    check("Report: Empfehlungen", "Empfehlungen" in rc)
    check("Report: Disclaimer keine Rechtsberatung", "keine Rechtsberatung" in rc)
    check("Report: kein Klartext-Key (Original nicht gespeichert)", "sk-demo-123456789" not in rc)
    page.screenshot(path="scripts/shot-report.png", full_page=True)

    # --- History ---
    page.goto(BASE + "/history", wait_until="networkidle")
    hc = page.content()
    check("History listet Scan (Kritisch)", "Kritisch" in hc)

    # --- Admin ---
    page.goto(BASE + "/admin", wait_until="networkidle")
    page.wait_for_timeout(700)
    ac = page.content()
    check("Admin: Lizenz-Sektion", "Lizenz" in ac)
    check("Admin: Watchlist-Begriffe (Atlas-CRM)", "Atlas-CRM" in ac)
    check("Admin: Statistik Scans", "Scans gesamt" in ac)
    page.screenshot(path="scripts/shot-admin.png", full_page=True)

    # --- Settings ---
    page.goto(BASE + "/settings", wait_until="networkidle")
    page.wait_for_timeout(500)
    check("Settings: Datenschutz-Sektion", "Datenschutz" in page.content())

    browser.close()

if console_errors:
    print("\nConsole errors:")
    for e in console_errors[:10]:
        print("  !", e)

print("\n" + ("ALL UI CHECKS OK" if not failures else f"{len(failures)} FAILED: {failures}"))
sys.exit(1 if failures else 0)
