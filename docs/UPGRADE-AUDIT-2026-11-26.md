# Tithi Darshan upgrade audit and prioritized checklist — 26 Nov 2026

## Existing architecture (preserve)
- GitHub `yuvraajsingh1155-cloud/tithi-darshan`, branch `main`.
- Python 3.11 + Jinja static generator at `scripts/build.py`, Swiss Ephemeris `scripts/panchang.py`; 12 city records in `data/cities.json`; editorial festival list with explicit sources.
- Generated `dist/` deployed to https://hindu-tithi-darshan.pages.dev/ through Cloudflare Pages.
- GitHub Actions daily/backup rebuild, node syntax, Python tests and Supabase anonymous denial tests.
- Supabase project `ipqejplvpmznhhtcmozz`: Auth (Google enabled), `profiles`, `saved_kundli_reports` with RLS, `kundli-match` and `delete-account` Edge Functions. Existing saved reports and authentication must not be invalidated.
- Existing routes /panchang/<city>/<date>/, /mera-account/, /kundli-milan/, /rashifal/, /lekh/, /jankari/, etc, plus Google site verification and sitemap.

## Findings (verified / checked)
- Build workflow completed successfully Nov 25; public and code checked Nov 26.
- Security advisor: **warning**: Auth leaked password protection disabled. Cannot toggle via available Supabase connector; operator follow-up needed.
- Authenticated dashboard exists but no reusable settings panel or preference sync.
- Mobile nav uses horizontal scrolling instead of accessible responsive menu / bottom navigation.
- No persistent full light/dark/system theme or high-contrast controls.
- No Web App Manifest or offline fallback.
- Horoscope only provides daily cultural encouragement, NOT reliable birth-chart predictions.
- 36 guna scoring requires known birth Nakshatra and Chandra Rashi, not date/time/location. No actual natal planets or Manglik decisions. Do not claim otherwise.
- Home has accurate tithi/panchang/rahu/abhijit (by existing conventions) but not moonrise, moonset, choghadiya. Never fill these with guesses.
- Google Search Console verified for exact domain; GA4 has no connected property. Existing SEO audit was a 50-page sample, not complete Lighthouse.
- Existing image assets are original symbolic SVGs; retain them and license constraints.

## Prioritized staged work
1. [x] Add consistent responsive navigation, mobile bottom bar and focused settings page with durable theme, contrast, text size, city selection, system theme and reduced-motion controls.
2. [x] Add PWA manifest, safe offline cache, offline page and print styling; never cache authenticated/private pages.
3. [x] Add useful monthly calendar view from **existing** sunrise-based per-city panchang values and preserved day URLs.
4. [x] Enhance dashboard with persistent preferences and bookmarks behind ownership-based RLS, maintaining existing profile/login/logout and deletion behavior.
5. [x] Improve CI checks for new static assets, links, accessibility and security boundaries; inspect production.
6. [~] Expand astronomical modules: verified moonrise/moonset and daytime Choghadiya shipped, plus 12-city monthly calendars and sunrise Ekadashi observations. Full birth-chart Janam Kundli and planetary transit remain unimplemented.
7. [ ] Future editorially sourced festival, mantra and chalisa content requires human source/license verification; do not generate unverified daily predictions.
8. [ ] Admin dashboard requires restricted app_metadata/role-based access, real audit trails, backups and publishing workflows; do not fake admin controls.
9. [ ] Connect GA4 only after owner supplies/links actual stream; never invent measurement ID. Lighthouse and WCAG 2.2 AA targets require real-browser audit to claim.

## Security approach
- Keep existing Supabase project and RLS; add ownership-policy migrations for any new user data.
- Never embed any privileged keys or Google Client Secret in browser or repository.
- Consent gates for personal birth profiles, and explicit exclusions when not implemented.
- A service worker must bypass auth, Supabase endpoints, private dashboard and API.
- No paid services or purchases authorized.

## Release evidence — staged upgrade
- **Pre-upgrade backup:** Git branch `backup/pre-premium-upgrade-2026-11-26` at existing tested source commit `232bb5968281cbe23508351665701751753db45c`.
- **Production URL:** https://hindu-tithi-darshan.pages.dev/ (existing Cloudflare Pages project retained).
- **New site features:** premium responsive navigation, mobile bottom nav, accessible light/dark/system and settings, optional RLS-backed preferences, 12-city monthly calendars (current and next Gregorian month), 12-city sunrise Ekadashi observation lists, verified moonrise/moonset, daytime Choghadiya, original-source devotional links, functional article bookmarking and print/share controls, account bookmarks/data export, PWA public offline fallback.
- **Browser test:** GitHub Actions `45687825964` passed 72 page/viewport checks: 9 routes on 320, 375, 390, 768, 1024, 1280, 1440 and 1920 px; includes settings persistence, keyboard menu, PWA. Earlier 56-check runs also passed.
- **Lighthouse** local generated preview: successful Chrome run `45687341514` homepage Performance **99**, Accessibility **100**, Best Practices **100**, SEO **100**, LCP ~**1.55s**, CLS ~**0.030**; private account Performance 99/Accessibility 100/Best 100/SEO 66 due intentional `noindex`. INP not available from lab.
- **Security:** four public user-owned tables have RLS enabled; user_preferences/bookmarks have user ownership checks. Supabase Security Advisor warned Auth **leaked-password protection is disabled** (must be enabled in owner's Supabase Auth settings). Security Advisor performance lint is empty. No privileged credentials in public JS.
- **Astronomy:** Moonrise/moonset generated by Swiss Ephemeris Moshier observer coordinates; independent Lucknow Nov 26 2026 reference test, returning ~18:51 and 08:24 IST. Daytime Choghadiya uses sunrise/sunset and published weekday order. Both do NOT make marriage success or event-election claims.
- **SEO:** existing Search Console property verified; no Google Analytics 4 property connected and no invented tag; newly generated public routes crawlable, aliases and private routes noindex.
- **New paid subscriptions/services/domains:** **none**. Deployment uses existing Cloudflare/GitHub/Supabase free-tier services subject to changing quotas.
- **Limitations:** No automated full Janam Kundli from DOB/time/place, no comprehensive natal weekly/monthly/yearly horoscope, 12-month Hindu annual calendar, no verified Amanta/Purnimanta switch, notification backend, consented family birth profiles, numerology/planetary transit tools, comprehensive Aarti/Mantra/Chalisa library or privileged admin authoring console. Email signup still needs external SMTP for unrestricted public delivery. Account deletion and Google OAuth user journey were not tested end-to-end with a real signed-in user in this upgrade. Full WCAG 2.2 AA (manual assistive-technology testing) and INP require independent live testing.
- **CI source:** `.github/workflows/daily-panchang.yml` builds daily and tests source, runs anonymous Auth denial probes and updates `dist` race-safely; premium Playwright and Lighthouse are additional GitHub Actions jobs.


- **Production caveat at last check:** Cloudflare still returned the earlier `tithi-public-v1` service-worker cache and an older `build-info.json` than the final GitHub `dist` (the latest GitHub build was successful). Git integration can lag; the optional `CLOUDFLARE_DEPLOY_HOOK` GitHub Actions secret is not configured. Do not mark the final PWA cache-bump as live until independent Cloudflare verification shows `tithi-public-v2`.
