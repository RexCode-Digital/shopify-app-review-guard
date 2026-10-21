# Limitations

Static analysis cannot prove actual Shopify Partner Dashboard configuration, App Store listing state, merchant installation behaviour, runtime latency, production billing lifecycle, Shopify approval status, protected-data approval status, all framework-specific runtime behaviour, or every custom abstraction. Webhook checks associate a configured HTTPS destination only with one recognised source route; ambiguous routing remains `NEEDS_REVIEW`. A route-local helper signal does not prove deployed runtime verification.

Shopify requires HMAC verification for HTTPS deliveries. EventBridge and Google Cloud Pub/Sub deliveries do not require Shopify HMAC; their cloud resource policies and consumer identity need provider-side review. Event duplicate-delivery checks remain manual when the consumer cannot be linked to one route.

Next.js support is limited to conventional App Router `route` files and Pages Router `pages/api` files with statically recognisable handlers. App Router route groups and dynamic segments are normalised for matching. Pages API body parsing is enabled by default; manual HMAC evidence is not accepted as raw-body verification unless the route disables parsing and visibly reads the request stream. Export aliases, rewrites, custom `pageExtensions`, parallel/intercepting routes, and imported custom helpers that cannot be traced remain `NEEDS_REVIEW`.

Baselines classify findings by rule, file, and title. They are a gradual-adoption aid, not evidence that an existing risk is safe. Existing findings remain in reports; newly detected findings still affect the configured failure policy. Listing-manifest declarations remain `NEEDS_REVIEW` because the scanner cannot verify an external attestation.

`NEEDS_REVIEW` means the repository evidence is incomplete or the requirement is external. It is not a failure verdict. Run the tool alongside development-store testing, Shopify's current submission checklist, runtime security testing, and appropriate human review.
