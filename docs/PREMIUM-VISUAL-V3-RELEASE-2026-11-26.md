# Tithi Darshan — Premium Visual V3 Release & Audit
**Audit:** 26 November 2026 (Asia/Kolkata)  
**Production:** https://hindu-tithi-darshan.pages.dev/  
**Source:** https://github.com/yuvraajsingh1155-cloud/tithi-darshan

## Baseline and preservation
- Live website had a shared Python/Jinja static generator, Swiss Ephemeris calculations, Cloudflare Pages deploy, Supabase Google and email authentication, RLS-protected saved data, 12-city Panchang and calendar views. All remain intact.
- Previous UI used some mixed emojis, large continuous mobile sections, inconsistent form/card borders, and minimal symbolic SVG pictures for the five supported deity cards.
- Backup taken before changes: `backup/premium-visual-before-2026-11-26`, source commit `440d359fb2b8e97b14c8ff935e984bd3b08f8ee3`. Previous working HTML/CSS/JS preserved.
- No database migration, table deletion, credential change or new paid API was performed.

## Visually verified improvements
1. Brand: a cohesive lotus/sunrise maroon-gold vector emblem in `assets/brand-mark.svg`, plus a locally authored consistent SVG icon set `assets/td-icons.svg`.
2. Centralized visual design layer `assets/visual-v3.css`: warm ivory/maroon/antique-gold semantic tokens, typography, spacing, focus, dark mode, shadows, responsive shell, print.
3. Header, navigation and footer: semantic grouped desktop dropdowns, unobtrusive global search, preferred-city link, light/dark/system theme control, verified-user avatar menu, keyboard Escape and outside dismiss, mobile drawer and five-tab bottom navigation.
4. Home: more compact Tithi hero, restrained accent colors, actionable calendar/rashi/Kundli shortcuts, clear solar/tithi timings and refined information hierarchy; existing astronomy content and indexed routes remain.
5. Authentication: branded two-column desktop Login with original temple atmosphere and responsive lean mobile version; real Google and email controls retained. Password visibility and error text remain functional.
6. Dashboard: personalized welcome/date/location, private profile form, saved bookmarks and reports (actual RLS query data), meaningful empty states, real quick links, private export/delete controls and locally persistent sidebar-collapse. No fabricated counts, invented Kundlis or notification buttons.
7. Settings: working visual theme cards and local comfort/compact density, font size, contrast, motion, city and clock preference controls. Density is local-only and excluded from Supabase upsert until a controlled DB migration.
8. Global search command palette: real cached-public index, Hindi/Hinglish suggestion matching, native keyboard dialog, Escape close, arrow-key result navigation and standalone indexed-content search route fallback.
9. Dev Darshan: five approved original paintings with thumbnail/detail sources; dedicated gallery and individual pages, no forced crops of sacred objects.
10. Improved PWA presentation remains on existing no-private-cache service worker; no PWA feature was represented as a paid native app.

## New original devotional art
- `assets/devotional/shiva.webp` + `shiva-320.webp`
- `assets/devotional/ganesha.webp` + `ganesha-320.webp`
- `assets/devotional/vishnu.webp` + `vishnu-320.webp`
- `assets/devotional/lakshmi.webp` + `lakshmi-320.webp`
- `assets/devotional/saraswati.webp` + `saraswati-320.webp`
- `assets/devotional/temple.webp` supporting artwork for desktop auth.
All artwork was newly generated, visually inspected and encoded as optimized WebP. Gallery responsive images use `srcset` with 320px and 512px variants; original SVGs retained for historical reference and fallback. See `docs/DEVOTIONAL-ARTWORK-REGISTER.md` for iconography notes and editorial limitations. **No approved new deity art was published for Krishna, Rama, Hanuman, Durga, Kali or Surya in this stage.** These are separate missing assets, not substituted with misleading depictions.

## Changed source modules
- `templates/base.html`: centralized responsive application shell, footer, verified profile entry point and native search dialog.
- `templates/panchang.html`, `templates/deities.html`, `templates/deity-detail.html`: professional public presentation and responsive artwork.
- `templates/account.html`, `templates/settings.html`: real Login/Dashboard and Settings redesign.
- `assets/visual-v3.css`, `assets/td-icons.svg`, `assets/brand-mark.svg`: design system.
- `assets/site.js`, `assets/shell.js`, `assets/dashboard.js`, `assets/auth.js`, `assets/preferences.js`, `assets/settings.js`: menu, session-aware profile, verified logout, public search palette, private dashboard and preferences.
- `scripts/build.py`: validates existence of five large and five small devotional portraits.
- `tests/visual_qa_v3.py`, `tests/browser_smoke.py`, `.github/workflows/premium-browser-qa.yml`, `.github/workflows/lighthouse-audit.yml`: reproducible Chromium screenshots/tests and Lighthouse lab audit.
- `.github/workflows/daily-panchang.yml`: cancels superseded publish jobs to reduce races from successive code commits, checks shell/dashboard script syntax and retains daily scheduling.

## Reproducible test evidence
- GitHub Action `45759183715` (Premium Website Browser QA) completed successfully after responsive artwork changes. The dedicated visual suite tested **77 route/viewport combinations** (11 routes × 7 viewport widths: 360, 390, 768, 1024, 1366, 1440 and 1920 px), plus keyboard/dialog navigation, gallery image loading, genuine theme card switching, menu interactions and two MOCK dashboard layouts.
- Ten labeled visual screenshots are archived in the `tithi-premium-v3-screenshots` artifact, including desktop/mobile Homepage, Dev Darshan, Login, dark Settings and dashboard MOCK screenshots. **Dashboard shots are visual fixtures with fake credentials; real Auth was not tested.** Older previous-release screenshots can be used as the before state.
- GitHub Action `45759183687` Chrome Lighthouse, locally generated release preview:
  - Homepage: Performance **97**, Accessibility **100**, Best Practices **100**, SEO **100**; LCP ~**1.95s**, CLS **0.061**.
  - Login/account: Performance **95**, Accessibility **100**, Best Practices **100**, SEO **69**, intentional noindex; LCP ~**2.89s** (above the 2.5s stretch target), CLS ~**0.002**.
  - INP unavailable in the laboratory measurement. These are not field data or full WCAG 2.2 AA certification.
- The existing 320px regression test found and resolved a genuine 18px horizontal overflow in a legacy full-width card with margins. Keyboard Escape initially failed to close the search dialog and was corrected. No unsupported "perfect across all browsers" claims are made.

## Deployment / security / cost
- Existing Cloudflare Pages site and GitHub-integrated deployment retained. Last successful GitHub daily publish run during this upgrade: `45759301196`.
- A GitHub success is not independently sufficient proof of the latest Cloudflare deployment; inspect `/build-info.json`, HTML srcsets and `assets/visual-v3.css` after Git-integrated propagation. The deploy-hook secret is not configured.
- Supabase private user tables preserve their existing RLS checks and data; Google OAuth Client Secret and service role key remain server-side.
- Leaked-password protection remains an Auth dashboard warning subject to plan/provider availability.
- **New billed infrastructure: ₹0**. Existing Cloudflare/GitHub/Supabase free-tier quotas apply.
- Remaining product limitations: six deity portraits not approved, public email SMTP not configured, no full English translation, real Google sign-in/out/restore profile and account deletion not tested in this visual-only phase, real login dashboard image not accessible without a safe test account, and mobile Firefox/iOS Safari/manual WCAG reviews not completed.

## Selected commit references
- Backup: `440d359fb2b8e97b14c8ff935e984bd3b08f8ee3`.
- Five original high-resolution artwork files: `2a62aa94dffe3eed1c0a31676a712a4718e48ef1`.
- Five optimized thumbnails: `141558bfeef05f7ce05d98b624f3c7c64d2d1c30`.
- HTML and responsive gallery: `dc93e4d593d2` (and later generated `dist` commits).
- Corrected Auth heading hierarchy: `b591c1951e7b`.
- Corrected keyboard search dialog: `37b70f4874fd`.
- Latest race control improvement: `f9e25c088bac`.

## Live entry points
- Homepage: https://hindu-tithi-darshan.pages.dev/
- Dev Darshan: https://hindu-tithi-darshan.pages.dev/devi-devta/
- Google Login / Personal Dashboard: https://hindu-tithi-darshan.pages.dev/mera-account/
- Settings: https://hindu-tithi-darshan.pages.dev/settings/
- Search: https://hindu-tithi-darshan.pages.dev/khoj/
