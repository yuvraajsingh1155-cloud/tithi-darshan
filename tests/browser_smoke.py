"""Real Chromium responsive/accessibility smoke tests against the generated local site.

Run after build + local HTTP server, with playwright chromium installed:
    python tests/browser_smoke.py
Only tests implemented controls. Does not claim full WCAG or end-to-end Google consent.
"""
from __future__ import annotations
import json
from datetime import datetime
from zoneinfo import ZoneInfo
import os
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE=os.getenv("TEST_BASE_URL","http://127.0.0.1:8765")
VIEWPORTS=[320,375,390,768,1024,1280,1440,1920]
TODAY=datetime.now(ZoneInfo("Asia/Kolkata")).date().isoformat()
PAGES=["/","/calendar/","/settings/","/mera-account/","/rashifal/","/kundli-milan/","/lekh/","/ekadashi/","/khoj/",f"/panchang/lucknow/{TODAY}/"]
results=[]
def check_page(page,path,width):
    errors=[]
    page.on("pageerror",lambda error:errors.append(str(error)))
    response=page.goto(BASE+path,wait_until="domcontentloaded",timeout=45000)
    assert response is not None and response.status==200,(path,width,response.status if response else "none")
    page.wait_for_timeout(100)
    sizes=page.evaluate("({scroll:document.documentElement.scrollWidth,width:window.innerWidth})")
    if sizes["scroll"]>sizes["width"]+2:
        offenders=page.evaluate("""() => [...document.querySelectorAll('body *')]
        .map(el => ({tag:el.tagName.toLowerCase(),cls:String(el.className||'').slice(0,70),
          id:el.id||'',left:Math.round(el.getBoundingClientRect().left),
          right:Math.round(el.getBoundingClientRect().right)}))
        .filter(x=>x.right>innerWidth+3||x.left<-3)
        .slice(0,18)""")
        raise AssertionError(("horizontal overflow",path,width,sizes,offenders))
    assert page.locator("main").count()==1
    assert len(errors)==0,("page Javascript exception",path,width,errors)
    results.append({"route":path,"width":width,"result":"PASS"})

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
    for width in VIEWPORTS:
        context=browser.new_context(viewport={"width":width,"height":900},device_scale_factor=1)
        page=context.new_page()
        for path in PAGES:
            check_page(page,path,width)
        page.goto(BASE+"/settings/",wait_until="domcontentloaded")
        assert page.locator("#website-settings").count()==1
        page.select_option("#pref-theme","dark")
        page.wait_for_timeout(100)
        assert page.locator("html").get_attribute("data-theme")=="dark"
        page.select_option("#pref-city","hardoi")
        page.locator("#pref-high-contrast").check()
        page.select_option("#pref-time","12h")
        page.reload(wait_until="domcontentloaded")
        assert page.locator("#pref-time").input_value()=="12h"
        page.goto(BASE+f"/panchang/lucknow/{TODAY}/",wait_until="domcontentloaded")
        assert page.locator("#choghadiya .choghadiya-slot").count()==16
        assert page.locator("#choghadiya [data-slot-start][data-slot-end]").count()==16
        assert page.locator("#tithi-civil-segments").count()==1
        assert page.locator("[data-clock]").count()>=10
        page.goto(BASE+"/settings/",wait_until="domcontentloaded")
        page.reload(wait_until="domcontentloaded")
        assert page.locator("#pref-city").input_value()=="hardoi"
        assert page.locator("html").get_attribute("data-theme")=="dark"
        assert page.locator("html").get_attribute("data-contrast")=="high"
        pref_links=page.locator("[data-preferred-panchang]").evaluate_all(
            "(nodes)=>nodes.map(a=>a.getAttribute('href'))")
        assert pref_links and all(url and url.startswith("/panchang/hardoi/") for url in pref_links),pref_links
        page.once("dialog",lambda d:d.accept())
        page.locator("#reset-prefs").click()
        assert page.locator("#pref-theme").input_value()=="system"
        if width<=1080:
            page.goto(BASE+"/")
            toggle=page.locator("#menu-toggle")
            assert toggle.is_visible()
            toggle.click()
            assert toggle.get_attribute("aria-expanded")=="true"
            assert page.locator("#primary-nav").is_visible()
            page.keyboard.press("Escape")
            assert toggle.get_attribute("aria-expanded")=="false"
        # Search published information via the genuinely generated local index.
        page.goto(BASE+"/khoj/",wait_until="domcontentloaded")
        page.locator("#global-search-input").fill("एकादशी")
        page.locator("#universal-search-form button[type=submit]").click()
        page.locator(".search-result-card").first.wait_for(timeout=12000)
        assert page.locator("#search-count").text_content().strip()
        # Verify live current Tithi displays only verified data (not a placeholder).
        page.goto(BASE+"/",wait_until="domcontentloaded")
        page.locator("#current-tithi-card").wait_for(state="visible",timeout=12000)
        assert "पक्ष" in (page.locator("#current-tithi-name").text_content() or "")
        page.evaluate("""() => {
          window.__copied=null;
          Object.defineProperty(navigator,'clipboard',{configurable:true,
            value:{writeText:async value=>{window.__copied=value;}}});
        }""")
        page.locator("[data-copy-page]").click()
        page.wait_for_function("window.__copied !== null")
        assert page.evaluate("window.__copied").startswith(BASE+"/")
        page.goto(BASE+"/mera-account/",wait_until="domcontentloaded")
        assert page.locator("#auth-panel").is_visible()
        assert page.locator("#profile-panel").is_hidden()
        page.locator("#toggle-auth-password").click()
        assert page.locator("#auth-password").get_attribute("type")=="text"
        page.locator("#toggle-auth-password").click()
        assert page.locator("#auth-password").get_attribute("type")=="password"
        # Reproducible visual QA screenshots for each breakpoint and mode.
        screenshots=Path("artifacts/tithi-2-visual-qa")
        screenshots.mkdir(parents=True,exist_ok=True)
        page.goto(BASE+"/",wait_until="domcontentloaded")
        assert page.locator("body").get_attribute("data-page")=="home"
        page.locator("#current-tithi-card").wait_for(state="visible",timeout=12000)
        page.screenshot(path=str(screenshots/f"home-{width}.png"),full_page=True,animations="disabled")
        page.goto(BASE+"/settings/",wait_until="domcontentloaded")
        page.select_option("#pref-theme","dark")
        page.screenshot(path=str(screenshots/f"settings-dark-{width}.png"),full_page=True,animations="disabled")
        page.select_option("#pref-theme","system")
        # Exercise native sharing and print actions on a real published article.
        page.goto(BASE+"/lekh/",wait_until="domcontentloaded")
        article_link=page.locator(".article-card").first.get_attribute("href")
        assert article_link is not None and article_link.startswith("/lekh/")
        page.goto(BASE+article_link,wait_until="domcontentloaded")
        page.evaluate("""() => {
          window.__shared = null;
          navigator.share = async (info) => {window.__shared=info;};
          window.print = () => {window.__printed=true;};
        }""")
        page.locator("[data-share-page]").click()
        page.wait_for_function("window.__shared !== null")
        assert page.evaluate("window.__shared.url").endswith(article_link)
        page.locator("[data-print-page]").click()
        assert page.evaluate("window.__printed === true")
        context.close()
    browser.close()

for path in ["/manifest.webmanifest","/sw.js","/offline/"]:
    with urllib.request.urlopen(BASE+path,timeout=15) as r:
        assert r.status==200,(path,r.status)
        if path.endswith(".webmanifest"):
            manifest=json.load(r)
            assert manifest["start_url"]=="/"
assert Path("dist/settings/index.html").exists()
assert Path("dist/calendar/delhi").exists()
print(json.dumps({"viewport_checks":VIEWPORTS,"pages_tested":PAGES,
    "total_page_checks":len(results),"result":"PASS","settings_persistence":"PASS",
    "keyboard_menu":"PASS","PWA_assets":"PASS"},ensure_ascii=False,indent=2))
