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
1. [ ] Add consistent responsive navigation, mobile bottom bar and focused settings page with durable theme, contrast, text size, city selection, system theme and reduced-motion controls.
2. [ ] Add PWA manifest, safe offline cache, offline page and print styling; never cache authenticated/private pages.
3. [ ] Add useful monthly calendar view from **existing** sunrise-based per-city panchang values and preserved day URLs.
4. [ ] Enhance dashboard with persistent preferences and bookmarks behind ownership-based RLS, maintaining existing profile/login/logout and deletion behavior.
5. [ ] Improve CI checks for new static assets, links, accessibility and security boundaries; inspect production.
6. [ ] Expand astronomical modules only after verified computations/reference tests and cultural methodology review (moonrise/moonset, choghadiya, monthly calendar variants, Janam Kundli, planetary data).
7. [ ] Consider editorially sourced festival, mantra and chalisa content only with proper sources/licenses and without fabricated daily predictions.
8. [ ] Admin dashboard requires restricted app_metadata/role-based access, real audit trails, backups and publishing workflows; do not fake admin controls.
9. [ ] Connect GA4 only after owner supplies/links actual stream; never invent measurement ID. Lighthouse and WCAG 2.2 AA targets require real-browser audit to claim.

## Security approach
- Keep existing Supabase project and RLS; add ownership-policy migrations for any new user data.
- Never embed any privileged keys or Google Client Secret in browser or repository.
- Consent gates for personal birth profiles, and explicit exclusions when not implemented.
- A service worker must bypass auth, Supabase endpoints, private dashboard and API.
- No paid services or purchases authorized.

## Release evidence
Record subsequent GitHub workflow IDs, public URL observations and unverified claims in this file, using independent tests.
