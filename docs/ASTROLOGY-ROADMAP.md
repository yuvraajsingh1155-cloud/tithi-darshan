# Tithi Darshan — authenticated astrology features

## What has actually shipped
- Public navigation and pre-rendered landing pages for account and daily horoscope.
- An explicit, non-deceptive activation state: no account registration, personal-data collection, or match calculator until secure backend exists.
- Existing Panchang and editorial pages remain public and indexable.

## Required to activate securely
1. Choose/authenticate identity provider (e.g. Supabase Auth). Configure its public project URL / publishable key, OAuth redirect allowlist for production domain, email confirmation and account recovery. Never commit service-role keys.
2. Add Cloudflare Pages Functions API endpoints with authentication verification; ensure Cloudflare Git integration deploys functions, not only dist.
3. Bind D1 database and apply reviewed SQL migration for user profiles and saved reports. Enforce account ownership on every query and deletion/retention.
4. Implement and independently validate Moon sidereal longitude, nakshatra, pada, 8 ashtakoota scoring tables, Manglik definitions, time-zone conversions and birth-location coordinate resolution. Record rule variants and display each of the 8 scores, not just an unexplained total.
5. Generate general zodiac editorial content with verification; personal daily report needs correct calculation and transparent interpretation. Do not generate invented astronomical output.
6. Security tests: XSS/CSRF, input validation, rate limiting, session expiry, privacy and consent, account/data deletion, secure transport, log redaction, astrology disclaimer.

## Deployment notes
Cloudflare currently serves static dist/. Do not put private forms, passwords, birth data or bearer tokens in static HTML or GitHub artifacts.
Site's existing Python pyswisseph engine runs during GitHub Actions static generation; Cloudflare Functions cannot directly execute that Python module. Use an appropriately licensed astronomy computation service or a validated compatible JavaScript engine for private per-request calculations.
Public article metadata and homepage remain SEO-indexed; account/private reports must be noindex.
