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

`data/cities.json` → `scripts/panchang.py` → `scripts/build.py` + `templates/` → `dist/` → GitHub Action → Cloudflare Pages. Front-end is static HTML/CSS/JS and works without server/database/API keys.

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
