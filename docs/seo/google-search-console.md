# Google Search publication checklist

OlnkTR generates its crawler files from the trusted `APP_URL` deployment setting:

- `https://your-domain.example/robots.txt`
- `https://your-domain.example/sitemap.xml`

The sitemap contains the public marketing routes and only active, published, indexable creator profiles. Drafts, private or unlisted pages, hidden or moderated profiles, inactive accounts, and published snapshots configured as `noindex,nofollow` are excluded.

## Production prerequisites

1. Set `APP_URL` to the public HTTPS origin, without an internal Docker hostname. Example: `APP_URL=https://olnk.tr`.
2. Terminate TLS at the production reverse proxy or hosting platform and redirect HTTP to HTTPS there.
3. Confirm that unauthenticated requests to `/`, `/robots.txt`, `/sitemap.xml`, and one published profile return successfully over HTTPS.
4. Confirm that `/dashboard`, `/admin`, authentication routes, and API routes are absent from the sitemap and carry or inherit `noindex` where they render HTML.
5. Run a production Lighthouse audit and test the deployed URL with PageSpeed Insights. Local results are useful during development, but Google field data requires a publicly reachable deployment.

## Add and verify the Search Console property

The recommended property for the primary domain is a **Domain property**, because it covers HTTP/HTTPS and subdomains. Google requires DNS verification for a Domain property.

1. Open [Google Search Console](https://search.google.com/search-console/).
2. Select **Add property**, choose **Domain**, enter only the domain name, and add the TXT record supplied by Google to the DNS provider.
3. Wait for DNS propagation, then select **Verify**.

For a URL-prefix property, OlnkTR also supports Google's HTML meta-tag method. Copy only the token from Google's `content` value into:

```dotenv
GOOGLE_SITE_VERIFICATION="your-google-token"
```

Redeploy and inspect the homepage HTML for `google-site-verification` before clicking **Verify**. Keep the token configured: Google periodically rechecks ownership. See Google's current [property setup](https://support.google.com/webmasters/answer/34592) and [ownership verification](https://support.google.com/webmasters/answer/9008080) documentation.

## Submit the sitemap

1. Open the verified property in Search Console.
2. Open **Sitemaps**.
3. Submit `https://your-domain.example/sitemap.xml` (or enter `sitemap.xml` when the UI already supplies the origin).
4. Wait for the status to become successful and review any discovered URL or fetch errors.

The sitemap is also declared in `robots.txt`, but Search Console submission provides processing diagnostics. Google documents sitemap limits and submission methods in [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

## Inspect and request indexing

1. Paste the complete HTTPS homepage URL into Search Console's URL Inspection bar.
2. Run **Test live URL** and resolve any crawl or indexing problem.
3. Select **Request indexing**.
4. Repeat for a small number of high-value public routes if needed; use the sitemap for bulk discovery.

An indexing request is not a ranking or inclusion guarantee. Google's [URL Inspection documentation](https://support.google.com/webmasters/answer/9012289) explains the live test, quotas, and indexing request behavior.

## Ongoing checks

- Review Page indexing, Core Web Vitals, HTTPS, Security issues, and Manual actions reports.
- Keep titles and descriptions useful and unique; avoid publishing thin or duplicated profile content.
- Publish a page again after changing its SEO configuration so the immutable public snapshot receives the change.
- Do not add draft/editor URLs or authenticated application routes to the sitemap.
- When the sitemap approaches 50,000 URLs or 50 MB uncompressed, split it into sitemap files and submit a sitemap index as required by Google.

