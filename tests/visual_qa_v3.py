"""Tithi Darshan Visual V3: genuine Chromium viewport/interaction QA.

Produces actual screenshots of locally generated website pages. The signed-in
dashboard screenshot uses an explicit MOCK Supabase fixture only to review the
layout and must NOT be described as a real Google Login or database E2E test.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import os

BASE=os.getenv("TEST_BASE_URL","http://127.0.0.1:8765")
OUT=Path("artifacts/visual-v3")
OUT.mkdir(parents=True,exist_ok=True)
WIDTHS=[360,390,768,1024,1366,1440,1920]
ROUTES=[
    "/","/devi-devta/","/dev-darshan/shiva/","/dev-darshan/ganesh/",
    "/mera-account/","/settings/","/khoj/","/calendar/","/rashifal/",
    "/kundli-milan/","/lekh/"
]
checks=0

def validate(page,width,path):
    global checks
    errors=[]
    page.on("pageerror",lambda err:errors.append(str(err)))
    response=page.goto(BASE+path,wait_until="domcontentloaded",timeout=45000)
    assert response and response.status==200,(path,width,"status",response.status if response else None)
    page.wait_for_timeout(120)
    sizes=page.evaluate("({page:document.documentElement.scrollWidth,viewport:window.innerWidth})")
    assert sizes["page"]<=sizes["viewport"]+2,(width,path,"overflow",sizes)
    assert page.locator("header.td-app-header").is_visible(),(path,"header")
    assert page.locator(".td-footer-grid").count()==1,(path,"footer")
    assert not errors,(path,width,errors)
    checks+=1

MOCK_JS=r"""(() => {
const user={
 id:'fixture-visual-only',email:'layout-preview@example.invalid',
 user_metadata:{full_name:'डेमो प्रोफाइल'}
};
const query={
 select(){return this},eq(){return this},order(){return this},
 range(){return Promise.resolve({data:[],error:null})},
 limit(){return Promise.resolve({data:[],error:null})},
 maybeSingle(){return Promise.resolve({data:{display_name:'डेमो प्रोफाइल',preferred_rashi:'mesh'},error:null})},
 upsert(){return Promise.resolve({error:null})}
};
window.supabase={createClient(){return {
 auth:{
 getSession:async()=>({data:{session:{user}},error:null}),
 getUser:async()=>({data:{user},error:null}),
 onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
 signOut:async()=>({error:null}),
 signInWithOAuth:async()=>({error:null})
 },
 from:()=>Object.create(query),
 functions:{invoke:async()=>({data:null,error:new Error('No private calls in visual fixture')})}
}}};
})();"""

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
    for width in WIDTHS:
        ctx=browser.new_context(viewport={"width":width,"height":840},device_scale_factor=1)
        page=ctx.new_page()
        for path in ROUTES:
            validate(page,width,path)
        # Search overlay is not a decorative button.
        page.goto(BASE+"/",wait_until="domcontentloaded")
        page.locator(".td-header-search").click()
        dialog=page.locator("#td-search-dialog")
        assert dialog.is_visible()
        page.locator("#td-command-input").fill("शिव")
        page.locator(".td-command-result").first.wait_for(timeout=10000)
        assert "शिव" in page.locator(".td-command-results").inner_text()
        page.keyboard.press("Escape")
        assert not dialog.is_visible()
        # Test functional desktop dropdowns and mobile drawer.
        if width<=1040:
            toggle=page.locator("#menu-toggle")
            assert toggle.is_visible()
            toggle.click()
            assert page.locator("#primary-nav").is_visible()
            assert toggle.get_attribute("aria-expanded")=="true"
            page.keyboard.press("Escape")
            assert not page.locator("#primary-nav").is_visible()
        else:
            group=page.locator(".td-nav-group summary").first
            group.click()
            assert page.locator(".td-nav-group").first.get_attribute("open") is not None
            page.keyboard.press("Escape")
            assert page.locator(".td-nav-group").first.get_attribute("open") is None
        # Gallery genuinely contains source-controlled WebP portraits.
        page.goto(BASE+"/devi-devta/",wait_until="domcontentloaded")
        assert page.locator(".deity-card img[src$='.webp']").count()==5
        assert page.evaluate("""() => [...document.querySelectorAll('.deity-card img')].every(
          image=>image.complete&&image.naturalWidth>100)""")
        if width in (390,1440):
            page.screenshot(path=str(OUT/f"dev-darshan-{width}.png"),full_page=True,animations="disabled")
            page.goto(BASE+"/",wait_until="domcontentloaded")
            page.screenshot(path=str(OUT/f"home-{width}.png"),full_page=True,animations="disabled")
            page.goto(BASE+"/mera-account/",wait_until="domcontentloaded")
            assert page.locator("#auth-stage").is_visible()
            assert page.locator("#dashboard-stage").is_hidden()
            page.screenshot(path=str(OUT/f"login-{width}.png"),full_page=True,animations="disabled")
            page.goto(BASE+"/settings/",wait_until="domcontentloaded")
            page.locator("[data-theme-choice='dark']").click()
            assert page.locator("html").get_attribute("data-theme")=="dark"
            assert page.locator("[data-theme-choice='dark']").get_attribute("aria-pressed")=="true"
            page.screenshot(path=str(OUT/f"settings-dark-{width}.png"),full_page=True,animations="disabled")
            page.locator("[data-theme-choice='light']").click()
            assert page.locator("html").get_attribute("data-theme")=="light"
            page.locator("[data-theme-choice='system']").click()
            assert page.locator("[data-theme-choice='system']").get_attribute("aria-pressed")=="true"
            page.locator("#pref-density").select_option("compact")
            assert page.locator("html").get_attribute("data-density")=="compact"
        ctx.close()
    # UI preview using explicit fake fixture — no real Supabase credentials/user.
    for width in (390,1440):
        ctx=browser.new_context(viewport={"width":width,"height":900})
        ctx.add_init_script("""() => localStorage.setItem(
          'sb-ipqejplvpmznhhtcmozz-auth-token','local-visual-fixture-only')""")
        ctx.route("**/supabase.min.js",lambda route:route.fulfill(
          status=200,content_type="text/javascript; charset=utf-8",body=MOCK_JS))
        page=ctx.new_page()
        response=page.goto(BASE+"/mera-account/",wait_until="domcontentloaded")
        assert response.status==200
        page.locator("#dashboard-stage").wait_for(state="visible",timeout=12000)
        assert page.locator("#auth-stage").is_hidden()
        assert page.locator("#profile-form").is_visible()
        assert "डेमो प्रोफाइल" in page.locator("#dashboard-welcome-name").inner_text()
        assert page.locator("#header-profile").is_visible()
        profile=page.locator("#header-profile-trigger")
        profile.click()
        assert page.locator("#header-profile-menu").is_visible()
        page.keyboard.press("Escape")
        assert not page.locator("#header-profile-menu").is_visible()
        if width==1440:
            sidebar=page.locator("#dashboard-sidebar-toggle")
            sidebar.click()
            assert page.locator("#dashboard-stage").evaluate(
                "(node)=>node.classList.contains('td-sidebar-collapsed')")
            sidebar.click()
        page.screenshot(path=str(OUT/f"dashboard-MOCK-{width}.png"),
          full_page=True,animations="disabled")
        ctx.close()
    browser.close()
print(json.dumps({"status":"PASS","widths":WIDTHS,"pages_per_width":len(ROUTES),
 "page_checks":checks,"artwork":"5 approved WebP assets validated",
 "command_palette":"functional","login_screen":"verified logged-out",
 "dashboard":"LAYOUT FIXTURE ONLY, NOT REAL AUTHENTICATION",
 "screenshots":len(list(OUT.glob("*.png")))},ensure_ascii=False,indent=2))
