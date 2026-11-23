# Tithi Darshan — Organic Search Launch Notes (23 Nov 2026)

Live website: https://hindu-tithi-darshan.pages.dev/

## Implemented
- Twelve city sunrise-based daily Panchang routes, plus educational guide pages.
- Google-facing canonical URL, sitemap.xml and robots.txt use the live Cloudflare domain.
- Rolling 60-day pages with daily scheduled GitHub Actions.
- Four factual Hindi guides: Nakshatra, Amavasya/Purnima, Ekadashi, when a Tithi changes.
- Distinct evergreen city landing-page canonicals and internal links to guides.
- OpenSEO 50-page technical audit: no critical issues; long titles and one short description identified and corrected in generator on Nov 23. Audit covered 50 of ~844 public pages, not the full site.
- IndexNow verification key stored in dist/ and seven new/changed URLs submitted successfully; this notification reaches participating search engines **not Google**.

## Google Search Console follow-up
- Use the URL-prefix property: `https://hindu-tithi-darshan.pages.dev/`.
- Sitemap: `https://hindu-tithi-darshan.pages.dev/sitemap.xml`.
- Check Sitemaps status and Pages/Indexing report after Google processes the sitemap. Submission is not guaranteed indexing.
- Use URL Inspection on the homepage, city hubs, and genuinely useful guides, not all generated calendar dates.
- To read real GSC impressions/clicks in OpenSEO, connect the Google account and select the exact property at https://app.openseo.so/p/026795ce-80c1-46db-b939-5fc01ff48608/search-performance.
- OpenSEO dashboard: https://app.openseo.so/p/026795ce-80c1-46db-b939-5fc01ff48608

## Next editorial priorities
1. Verify regional festival dates using authoritative local Panchang references; never infer festivals from tithi alone.
2. Add source-attributed, high-quality answers for city-specific questions backed by calculations and explanations rather than hundreds of keyword-swapped pages.
3. Review mobile usability, actual traffic/query data, and the Pages report weekly; improve pages with genuine impressions but weak CTR.
4. Where older date pages are no longer useful, keep valid historical archives, but do not overindex repetitive pages solely to expand sitemap count.
5. Maintain clear methodology, limitations, attribution, and correction policy; no guaranteed ranking or indexing claims.

## Validation
The 50-page technical audit is a sample, not proof that every page is error-free. GSC verification and indexing states must be confirmed in the Google account. The Cloudflare Pages production build may lag behind the latest GitHub commits.
