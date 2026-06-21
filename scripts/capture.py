from playwright.sync_api import sync_playwright

BASE = "http://localhost:3941"
DEMO = """Hallo Team,
bitte testet den Zugang mit diesen (Demo-)Daten:
API_KEY = sk-demo-123456789
password=demo123
Authorization: Bearer demo_token

Internes Dashboard: https://dashboard.internal.example/login
Kontakt: support@beispiel-firma.de
Kundennummer: KD-100245
Tool im Einsatz: Atlas-CRM
Projekt Falke startet naechste Woche."""

UNSTICK = "header{position:static !important}"

def goto(page, url, ready_selector):
    # Dev-Mode: kein networkidle (HMR-Websocket). Stattdessen load + Element-Wait.
    page.goto(url, wait_until="load", timeout=60000)
    page.wait_for_selector(ready_selector, timeout=45000)
    page.wait_for_timeout(500)

def shoot_fullpage(page, path):
    page.add_style_tag(content=UNSTICK)
    page.wait_for_timeout(250)
    page.screenshot(path=path, full_page=True)
    print("  saved", path)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # ---------- Full-page Screenshots ----------
    page = browser.new_page(viewport={"width": 1280, "height": 900}, device_scale_factor=2)

    print("Landing ...")
    goto(page, BASE, "text=KI-Chat")
    shoot_fullpage(page, "docs/landing.png")

    print("Scanner (mit Ergebnis) ...")
    goto(page, BASE + "/scanner", "#scan-input")
    page.fill("#scan-input", DEMO)
    page.get_by_role("button", name="Pruefen").click()
    page.wait_for_selector("#scan-results", timeout=15000)
    page.wait_for_timeout(900)
    shoot_fullpage(page, "docs/scanner.png")

    print("Report ...")
    page.get_by_role("button", name="Speichern", exact=True).click()
    link = page.get_by_role("link", name="Report oeffnen")
    link.wait_for(state="visible", timeout=15000)
    href = link.get_attribute("href")
    goto(page, BASE + href, "text=Sicherheits-Report")
    page.wait_for_timeout(400)
    shoot_fullpage(page, "docs/report.png")

    print("Admin ...")
    goto(page, BASE + "/admin", "text=Adminbereich")
    page.wait_for_timeout(700)
    shoot_fullpage(page, "docs/admin.png")
    page.close()

    # ---------- GIF-Frames (fester Viewport) ----------
    print("GIF-Frames ...")
    gp = browser.new_page(viewport={"width": 1200, "height": 760}, device_scale_factor=1)
    goto(gp, BASE + "/scanner", "#scan-input")
    gp.screenshot(path="scripts/frames/f0.png")

    gp.fill("#scan-input", DEMO)
    gp.wait_for_timeout(300)
    gp.screenshot(path="scripts/frames/f1.png")

    gp.get_by_role("button", name="Pruefen").click()
    gp.wait_for_selector("#scan-results", timeout=15000)
    gp.wait_for_timeout(800)
    gp.evaluate("document.getElementById('scan-results').scrollIntoView({block:'start'})")
    gp.wait_for_timeout(500)
    gp.screenshot(path="scripts/frames/f2.png")

    gp.evaluate("window.scrollBy(0, 520)")
    gp.wait_for_timeout(500)
    gp.screenshot(path="scripts/frames/f3.png")

    gp.evaluate("window.scrollBy(0, 780)")
    gp.wait_for_timeout(500)
    gp.screenshot(path="scripts/frames/f4.png")

    try:
        btn = gp.get_by_role("button", name="Vorher/Nachher")
        btn.scroll_into_view_if_needed()
        btn.click()
        gp.wait_for_timeout(500)
        gp.get_by_text("Bereinigter Text", exact=False).first.scroll_into_view_if_needed()
    except Exception as e:
        print("   (Vorher/Nachher uebersprungen:", e, ")")
    gp.wait_for_timeout(500)
    gp.screenshot(path="scripts/frames/f5.png")

    gp.close()
    browser.close()
    print("FERTIG")
