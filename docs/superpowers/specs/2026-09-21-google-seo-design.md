# Google SEO and Admin Pagination Design

OlnkTR will expose Google-facing metadata from a single trusted origin (`APP_URL`) and will never advertise private application routes or non-public profiles. The admin user directory will use server-side pagination with 100 users per page while preserving filters in the URL.

The sitemap will contain indexable marketing pages plus profiles that have an active publication, public visibility, an active profile, and an active owning account. Published SEO configuration remains authoritative: a snapshot marked `noindex,nofollow` is excluded. Robots directives will allow public content, block authentication/application/API surfaces, and advertise the sitemap. Root and route metadata will provide canonicals, Open Graph/Twitter data, and optional Google Search Console verification through `GOOGLE_SITE_VERIFICATION`.

Google Search Console account registration, DNS/HTML ownership confirmation, sitemap submission, URL inspection, TLS termination, and hosted PageSpeed Insights require the deployed domain and owner account. The repository will document these deployment-side steps and enforce trusted URL generation without claiming to perform external account actions.

