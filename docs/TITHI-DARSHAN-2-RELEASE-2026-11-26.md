# Tithi Darshan 2.0 — audited upgrade, tested release and open items
**Audit date:** 26 Nov 2026 (Asia/Kolkata)  
**Production:** https://hindu-tithi-darshan.pages.dev/  
**Repository:** https://github.com/yuvraajsingh1155-cloud/tithi-darshan

## 1. Baseline and backup
- Preserved GitHub `main`, Cloudflare Pages, static Python/Jinja generator, pyswisseph Swiss Ephemeris/Moshier/Lahiri, 12 existing Indian cities, existing `dist` archived dated URLs, and source-controlled editorial articles.
- Existing Supabase Auth Google/email configuration, protected user profiles, private 36-point matching Edge Function, private saved matching reports and account deletion are not migrated or removed.
- Dedicated backup branch `backup/tithi-darshan-2-pre-freshness-upgrade` points to pre-upgrade commit `6ce08ff9c9d63f72d17bac77badfe8adbb91efdb`.
- Previous premium-upgrade audit: `docs/UPGRADE-AUDIT-2026-11-26.md`.

## 2. Findings and fixes
**Date freshness:** Earlier evidence showed a Nov 24 homepage, but during this audit the live homepage and `build-info.json` both reported Nov 26. The precise earlier root cause cannot be proved retroactively. Risks were unversioned asset caching, stale Cloudflare deployments, browser/offline caching, and blind 404 redirects. Fixed/mitigated:
- Indian civil-day dates from Asia/Kolkata, verified client-side and using local source datetime.
- Explicit `no-store` directives on homepage, city-specific 'today' views, dated Panchang pages and `build-info.json`.
- Safe HEAD verification before redirecting an obsolete homepage to a pre-generated date page; visible stale-data warning if today's route is absent or verification fails.
- Browser updates the current Tithi from exact computed 00:00–24:00 Moon–Sun 12-degree segments, including multiple transitions in a civil day; labels the sunrise Tithi separately. It never estimates current Tithi by adding one to a sunrise index.
- Reproducible interval tests check contiguous exact timestamps, sunrise correspondence, leap years and year boundaries.
- The generator's build timestamp is displayed with an explicit UTC label and Cloudflare propagation caveat.

**Automation:** GitHub Action `.github/workflows/production-freshness-watch.yml` checks public date four times daily and requests an ordinary GitHub Action rebuild on stale data. Deployed UI also displays clear errors. Daily and backup generation schedules are retained. The monitor's scheduled corrective dispatch has not been independently exercised during a stale-data event; its existence is not proof of successful recovery.

**Choghadiya:** Day and night are independently divided into eight actual solar windows using the current and next local sunrise; the names use weekday-specific traditional sequences. Current in-window highlighting uses exact ISO timestamps. Not a full wedding/housewarming muhurta decision.

**SEO and search:** /khoj/ is an accessible, noindex static search interface generated from public published pages only, with Hindi/Hinglish matching and direct verified routes. Header link and keyboard shortcuts are functional. Original searchable deity profiles are newly published at /dev-darshan/{ganesh,shiva,vishnu,lakshmi,saraswati}/. OG imagery uses an original favicon-derived PNG. Dynamic private pages remain noindex and excluded from sitemap.

**Authentication/dashboard:** Existing Supabase flows preserved; practical password visibility controls and a verified-origin Google avatar with initials fallback added. Actual Google/email sign-in, SMTP delivery, personal data export and permanent account deletion were not tested with a real user's credentials in this release.

**PWA:** Generated installable PNG icons (192 and 512) with standard-library rasterization of original SVG, network-first static asset caching, zero offline cache for current date-sensitive information, and a real update/reload notification. Existing separate safe offline fallback preserved.

## 3. Key changed and added files
- `scripts/panchang.py`: exact current-Tithi sectors from Swiss Ephemeris (previous astronomical methods preserved).
- `scripts/choghadiya.py`: verified sunrise-to-sunset and sunset-to-next-sunrise intervals.
- `scripts/build.py`: published metadata, search index, deity profiles, Cache-Control security headers, PNG icon generation.
- `scripts/check_public_freshness.py`: live production date verification.
- `scripts/generate_icons.py`: PNG rasterization with only Python standard library.
- `assets/freshness.js`, `assets/global-search.js`, `assets/site.js`, `assets/auth.js`, `assets/sw.js`, `assets/premium.css`, `assets/manifest.webmanifest`: public UI and privacy-safe behavior.
- `templates/panchang.html`, `templates/search.html`, `templates/deity-detail.html`, `templates/account.html`, `templates/base.html`: new functional views, navigation and SEO.
- `data/deity_details.json`: curated original cultural summaries with no fabricated scripture quotes.
- `.github/workflows/daily-panchang.yml`, `production-freshness-watch.yml`, `premium-browser-qa.yml`: expanded syntax and browser tests, monitoring and corrective dispatch, screenshots.
- `tests/test_tithi_timeline.py`, `test_choghadiya.py`, `test_tithi2_static.py`, `test_dev_darshan.py`, `test_pwa_icons.py`, `browser_smoke.py`: regression coverage.
- `dist/`: generated production output; Cloudflare Git integration runs separately from GitHub Action success.

## 4. Database and security
- **New database migrations in this release: none**. Existing `profiles`, `saved_kundli_reports`, `user_preferences` and `user_bookmarks` were read-only audited; all four show RLS enabled.
- Supabase Security Advisor reports one account-level warning: Auth leaked password protection is disabled. Database performance advisor has no alerts. Owner must enable the Auth option if available in their tier.
- Private data is never included in the public search index, service-worker cache, SEO sitemap or generated images.
- No privileged Supabase keys or Google OAuth secrets were added to public scripts.
- Existing CSP policy is not yet a fully enforced, nonce/hash-based production CSP: this remains a documented security backlog item. Edge/API rate limiting and real-account deletion still require a live security test.

## 5. Actual QA and performance evidence
- Earlier baseline: Chromium responsive QA passed 72 and then 80 route/viewport checks over 320, 375, 390, 768, 1024, 1280, 1440 and 1920 px, including settings persistence, keyboard navigation, calendar, date and article actions.
- Actual Playwright screenshots are uploaded as GitHub Actions `tithi-2-visual-qa` artifacts (run `45694700961` and subsequent).
- Lighthouse generated-page laboratory run `45694670658`: homepage Performance **98**, Accessibility **100**, Best Practices **100**, SEO **100**, LCP **1.68 s**, CLS **0.056**. Account was Perf **100**, A11y **100**, Best **100**, SEO **66** due intentional noindex. INP **unavailable** in Lighthouse lab; no public field-vitals guarantee. Newer screenshots or measurements should be preferred once recorded.
- Production content was independently fetched by a headless browser; /khoj/, /dev-darshan/ganesh/, current Panchang and search-index.json were available. An old service worker cache can persist briefly in Cloudflare/browser until the Git integration deploy propagates.
- No automated test can certify full WCAG 2.2 AA across every screen reader/browser combination; manual coverage remains.

## 6. Google and IndexNow
- OpenSEO connected Google Search Console confirmed **Homepage submitted and indexed**, Google Mobile crawler success, last crawl on **2026-11-23** and Google-selected canonical matching declared canonical.
- The calendar alias and one inspected article were **unknown to Google** at inspection time, not proven permanently excluded. GSC 28-day Search Performance showed zero query rows ending 2026-11-22.
- Historical 50-page SEO crawl found 46 title-too-long info-level findings, 1 short description and crawl page-limit warning. Much of that audit predates the new site; no fresh paid audit ordered.
- Eight newly updated/public URLs were **submitted to IndexNow** via OpenSEO; the existing publicly verified key file is reachable. IndexNow does not submit to Google or guarantee indexing.

## 7. Remaining major work / honest product limits
- **Not delivered:** complete historical-timezone Janam Kundli, lagna/planetary houses and Navamsa, Vimshottari Dasha, astrologically sourced period-by-period horoscope, automated DOB Kundli Milan, full Manglik exceptions, accurate Amanta/Purnimanta lunar month names, Samvat calculation, verified local festival/Parana algorithms, dynamic arbitrary-day calculation, 365-day annual Hindu calendar, a permissions-enforced admin CMS, family birth profiles and notification delivery.
- **Not delivered:** complete English translations or `hreflang`; English navigation labels only. English URLs should not be marked as translations that do not exist.
- **Not delivered:** public unrestricted email verification/forgot-password delivery without a custom SMTP sender; no account-provider secret should be shared in chat.
- **Scope for next phase:** validate planetary/birth models against independent ephemeris references; use a secure, quota-limited computation backend with appropriate historical IANA timezones and private persistence. Never generate fake horoscope or marriage predictions.

## 8. Current operational cost
No additional paid subscription, domain, API or ad placement was purchased in this upgrade. Existing Cloudflare Pages, GitHub Actions and Supabase project use free-tier services subject to their normal quotas. OpenSEO indexing/GSC reads were unbilled connector operations (credits-free). Future image/video/back-end computation or outbound SMTP needs a separate budget and owner action if no suitable free option exists.

## 9. Deployment requirements
- Main GitHub daily generator builds and commits updated `dist`; Cloudflare Pages uses the linked GitHub integration. The optional `CLOUDFLARE_DEPLOY_HOOK` is still not configured.
- No access keys should be included in a public repository.
- Production release must be checked independently for both the current `build-info.json` and `sw.js` version; a GitHub successful run does **not** alone prove Cloudflare delivery.

## 10. Git references
- Backup: `6ce08ff9c9d63f72d17bac77badfe8adbb91efdb`.
- Tithi calculation `7cd6b774101ce1cf2cd0e198b8807d8adc54ca5c`.
- Tithi browser freshness `e3c37ce255a091ee57ee4d99c013ace9bfe0aa1d`.
- Night Choghadiya `649bd52b8a577636d889a86fd925f1be78a32605`.
- Search generator `459990b228e3041d29edbbd5cb6f0042a27d75a9`.
- Dev Darshan pages `4d6375ff8aa8df40f1ef91d590417b1199ebc759`.
- Live freshness monitoring `4e473c93be2f1edfc83202e93e8c3aad250243ba`.
- PWA PNG icons `d80e1ec921073b72004eafd8615aaddc579a424e`.


## 11. Final stabilization verification
- Homepage layout shift was measured at **0.103** after initially adding the dynamic Current Tithi card (above requested 0.1). Fixed by reserving that card's space on initial render and applying a stable minimum height.
- **Latest verified Lighthouse run:** GitHub Actions [45695831254](https://github.com/yuvraajsingh1155-cloud/tithi-darshan/actions/runs/45695831254), completed successfully. Homepage: Performance **98**, Accessibility **100**, Best Practices **100**, SEO **100**; laboratory LCP **1.69 s**, CLS **0.056**. Account: Performance **100**, Accessibility **100**, Best Practices **100**, SEO **66**, intentionally noindex. INP not reported, no user-field metric.
- **Latest browser QA:** GitHub Actions [45695831289](https://github.com/yuvraajsingh1155-cloud/tithi-darshan/actions/runs/45695831289) successful across the eight viewport widths. Additional prior screenshot-capture and 80-check QA [45695222770](https://github.com/yuvraajsingh1155-cloud/tithi-darshan/actions/runs/45695222770) passed, with 16 full-page screenshots (8 desktop/mobile widths × home/light and settings/dark).
- **Latest date-build:** [GitHub Actions daily generator](https://github.com/yuvraajsingh1155-cloud/tithi-darshan/actions/workflows/daily-panchang.yml) successfully generated 816 dated pages for 12 cities and a current-date `build-info.json`. Cloudflare Git-integrated deployment can lag behind the source build; check its build timestamp independently rather than inferring from GitHub success.
- The corrected Current Tithi display renders sunrise Tithi on the static page and current prevailing Tithi from actual civil-day Swiss Ephemeris intervals after JavaScript enhancement. Exact sunrise is not conflated with the current Tithi.
