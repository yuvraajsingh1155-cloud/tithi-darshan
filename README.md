# तिथि दर्शन — Hindi Hindu Panchang website

A **zero-paid-API**, static Hindi Panchang website with real sunrise-based astronomy, 12 Indian cities, automated daily publishing, SEO pages and editorially checked festival notices.

## Features

- Today’s tithi, paksha and ending time, weekday, nakshatra, yoga, karana, moon & sun sign.
- City-specific sunrise/sunset, Rahu Kaal, Yamaganda, Gulika, Abhijit, Brahma Muhurta.
- Answers “आज कौन सी तिथि है?”, “आज क्या खास है?”, “आज क्या करें?” with careful traditional vs astronomical distinctions.
- 12 Indian cities including Delhi, Lucknow, Hardoi, Varanasi, Mumbai, Kolkata etc.
- Pre-rendered HTML (no client-side fetching), rolling two-month window with preserved date archive, semantic headings, page metadata, JSON-LD `WebPage`/`BreadcrumbList`, sitemap, robots and canonical URLs when `SITE_URL` is set.
- GitHub Actions nightly/backup schedule to regenerate and commit static output, which triggers Cloudflare Pages Git deployment.
- Source transparency: [methodology](templates/method.html), calculation engine and tests.

## Local run

```bash
python -m pip install -r requirements.txt
python scripts/build.py --today 2026-11-23 --days 14
python -m http.server 8080 --directory dist
```

Open `http://localhost:8080` in your browser. `--days 14` is a fast local preview; omit it to generate the current rolling publish window (7 past days + 60 future days for all cities); archived dated pages remain preserved on later builds.

Run tests with `python -m pytest -q` (pytest is for developers only).

## Go live for free: GitHub + Cloudflare Pages

1. Create a **new GitHub repository** (for example `tithi-darshan`) separate from your wrestling-news project. Upload all repository files including `dist/` and `.github/workflows/`. If uploading through Git CLI, preserve the hidden `.github/` folder.
   On Windows, after creating an **empty** GitHub repository, open PowerShell inside the extracted `tithi-darshan` folder and run:

   ```powershell
   git init
   git add .
   git commit -m "Initial Tithi Darshan website"
   git branch -M main
   git remote add origin https://github.com/yuvraajsingh1155-cloud/tithi-darshan.git
   git push -u origin main
   ```

   Your connected GitHub username is `yuvraajsingh1155-cloud`. Git must be installed and GitHub account login may be required. Do not initialize the repository with a README if you want the simplest first push. On Windows you can run the included `publish-windows.ps1` script after the empty repository exists. See `DEPLOY-NEXT.md` for connected-account status and exact Cloudflare links.

2. Create a Cloudflare **Workers & Pages → Create → Pages → Connect to Git** project pointing at the new repository and branch `main`.
3. Cloudflare build settings: **Build command: `exit 0`**, **Build output directory: `dist`**, **Root directory: `/`**. The static files are generated upstream by GitHub Actions so Cloudflare needs neither Python nor paid API keys.
4. The GitHub daily workflow already sets `SITE_URL=https://hindu-tithi-darshan.pages.dev` (the confirmed production URL), ensuring canonical and sitemap links match the live site.
5. Go to GitHub **Actions → Daily Hindi Panchang Publish → Run workflow** when needed. It rebuilds the site with your exact URL in the `<link rel="canonical">` tags and `sitemap.xml`, commits the results to `main` and Cloudflare auto-deploys the push. Ensure Actions has `contents: write` permission. Verify your Cloudflare integration receives the bot push.
6. Submit `https://your-real-site.pages.dev/sitemap.xml` to **Google Search Console** (free). Verify property ownership first using DNS or Google's supported methods. Optional analytics can be added later for free if available.

This is a schedule-based system, **not a guaranteed real-time publish SLA**. GitHub Actions schedules can be delayed and public-repo schedules may be disabled after inactivity. The homepage JS redirects visitors to the correctly precomputed calendar date if the homepage deployment is stale (within its 60-day buffer). Watch failed workflow notifications.

**Important:** Choose **Git integration** for this automated version. Cloudflare says you cannot switch an existing Direct Upload project to Git integration later. The live Cloudflare Pages site and GitHub repository have now been created. The Google Search Console property and indexing still require separate verification/submission.

## Editorial quality safeguards

- Astronomical dates do **not** automatically prove festival observances. Edit `data/festivals.json` after verification, with URLs, for additional festivals. No festival is invented on other days.
- General daily Abhijit/Brahma time is **not** a suitable wedding or housewarming recommendation.
- Calendar details can differ by region, school and computation conventions. Public source/method disclosed.
- Do not mass-publish auto-generated religious advice that is unverified or misleading. Review first.

## No recurring paid API

Python, Swiss Ephemeris, GitHub Actions (subject to current free-tier usage rules), and Cloudflare Pages (subject to applicable free-tier limits) can be used without buying a daily Panchang API. Custom domain registration is an optional cost. Prices/quotas can change.

## Copyright and license

The `pyswisseph` Python package and underlying Swiss Ephemeris use AGPL / dual-license terms. If using this project publicly, **publish the corresponding source under an AGPL-3.0-compatible license** and meet the Swiss Ephemeris / Astrodienst attribution and license obligations, or obtain a suitable commercial license. See [Swiss Ephemeris](https://www.astro.com/swisseph/) and [GNU AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html). For a private/proprietary deployment, review these obligations before use.

Astronomical numbers are independently calculated; the festival data references its sources rather than copying long copyrighted text.

## Architecture

`data/cities.json` → `scripts/panchang.py` → `scripts/build.py` + `templates/` → `dist/` → GitHub Action → Cloudflare Pages. Public Panchang pages are static HTML/CSS/JS and require no paid astronomy API. Login, private reports and authenticated Kundli matching use a free-tier Supabase project (quota limits apply).

## Live production website

- Website: https://hindu-tithi-darshan.pages.dev/
- Google Search Console property: verify the newly launched `hindu-tithi-darshan.pages.dev` URL-prefix property; prior verification of a different domain does not establish this new property.
- Google sitemap: https://hindu-tithi-darshan.pages.dev/sitemap.xml (published; submit in Search Console for this exact new property; indexing may take time).
- Cloudflare Pages deploys from `main` with output `dist`.
- Please do not remove the Google Search Console HTML verification tag in `templates/base.html`.

## Reliable Cloudflare daily publication (optional deploy hook)

GitHub Actions rebuilds Panchang data twice daily. On some installations, a push created with the built-in GitHub Actions token does not immediately start a Cloudflare Pages deployment. This workflow supports an optional deploy hook to request a Pages rebuild after generated files are committed. Configure it only if automated production refreshing does not happen reliably:

1. Cloudflare dashboard → Workers & Pages → **tithi-darshan** → Settings → Builds & deployments → Deploy hooks → Add hook for **main**.
2. Copy the private hook URL. GitHub repo → Settings → Secrets and variables → Actions → **Secrets** → New repository secret: `CLOUDFLARE_DEPLOY_HOOK` = the hook URL. Never publish the hook URL to the repository.
3. Test via Actions → Daily Hindi Panchang Publish → Run workflow, then verify `https://hindu-tithi-darshan.pages.dev/build-info.json` reflects the latest `generated_at_utc` value in GitHub `dist/build-info.json`.

No paid APIs are required; GitHub Actions and Cloudflare Pages free usage limits apply. The last GitHub source change and bot output have been deployed via Git integration, but continuous bot-triggered redeploys should be verified independently.

## New articles and Hindu-themed navigation (November 2026)
The website now includes original, locally hosted deity-inspired SVG illustrations and a Hindi editorial publishing system.

**Adding a new article later:** open `data/articles.json` in GitHub, choose Edit, copy one existing `articles` object and change its unique lower-case hyphenated `slug`, human-reviewed `title`, `summary`, appropriate existing `category`, `keywords` (synonyms and reader phrases, not keyword stuffing), `published` and `updated` dates, and well-written `sections`. Set `status: "draft"` while working; only change to `"published"` after review. Commit the change. GitHub Actions rebuilds and updates `/lekh/<slug>/`, `/lekh/`, its `/vishay/<category>/` topic hub, homepage newest articles, related links, and `sitemap.xml` automatically. **No manual page linking is necessary.** It may take time for Cloudflare to deploy and Google to index a new article.

The `/lekh/` page supports Hindi keyword search **on the website** by matching title, summary, synonyms and category. Google search visibility is a separate process and ranking is **not guaranteed** by keywords or publishing.

Site routes: `/devi-devta/` (illustrated deity gallery), `/kundli-milan/` (traditional 36-guna explanation), `/vishay/manglik-dosh/`, `/lekh/` (article search), and `/lekh/<slug>/`. The `/kundli-milan/` page now offers a signed-in **36-point, eight-koota traditional matching calculator** for two people with already-known Nakshatra and Moon sign. Score requests run in the authenticated `kundli-match` Supabase Edge Function, and optional saves stay isolated using RLS. Birth date/time/place-to-chart generation, planetary analysis and Manglik calculation are not yet implemented. The calculator is cultural guidance, not a scientific predictor of marital success.

Only original symbolism is illustrated. No claim is made that all families or sampradayas represent deities identically. Articles should distinguish cultural beliefs from scientific evidence and avoid fear-based or deterministic marriage claims.



## Account, Google Login and user privacy (24 Nov 2026)

- Live sign-in: https://hindu-tithi-darshan.pages.dev/mera-account/
- Google OAuth enabled in Supabase and the start-of-consent redirect to Google tested successfully. Public availability still depends on the Google Cloud OAuth Audience (Testing vs In production) and each user's ability to complete Google consent.
- Supabase project reference: `ipqejplvpmznhhtcmozz`; the frontend includes **only the public publishable key**, never an OAuth secret.
- A signed-in visitor may edit their preferred rashi and name, save 36-guna reports, export their own profile and reports as JSON, delete individual reports, or request permanent account deletion by entering their email and confirming. Permanent account deletion runs only in a protected Supabase Edge Function: `delete-account`. The `profiles` and `saved_kundli_reports` rows reference `auth.users` with ON DELETE CASCADE.
- Both public user tables have RLS. The `saved_kundli_reports` table has an index covering `(user_id, created_at DESC)` for personal history queries. Database security advisor reported no findings on 24 Nov 2026.
- Every deployment CI job checks JavaScript and matching-engine tests, confirms Google provider state, and probes that **unauthenticated matching and account-deletion requests return HTTP 401**. This is not a substitute for an owner-operated Google end-to-end test or a real-user deletion test.
- Google Search Console is connected in OpenSEO, with the correct URL-prefix property selected and owner permission. As of 24 Nov the last 28-day GSC report showed zero rows, consistent with a recently launched site (no ranking guarantee). Google Analytics GA4 is **not connected** yet and requires a user-owned GA4 web stream measurement ID before deployment.
- Avoid unreviewed automatic religious claims and unnecessary collection of private birth details. Keep the site's source/license notices intact.
