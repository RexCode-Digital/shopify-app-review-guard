# Limitations

Static analysis cannot prove actual Shopify Partner Dashboard configuration, App Store listing state, merchant installation behaviour, runtime latency, production billing lifecycle, Shopify approval status, protected-data approval status, all framework-specific runtime behaviour, or every custom abstraction. Webhook checks associate a configured HTTPS destination only with one recognised source route; ambiguous routing remains `NEEDS_REVIEW`. A route-local helper signal does not prove deployed runtime verification.

Shopify requires HMAC verification for HTTPS deliveries. EventBridge and Google Cloud Pub/Sub deliveries do not require Shopify HMAC; their cloud resource policies and consumer identity need provider-side review. Event duplicate-delivery checks remain manual when the consumer cannot be linked to one route.

Baselines classify findings by rule, file, and title. They are a gradual-adoption aid, not evidence that an existing risk is safe. Existing findings remain in reports; newly detected findings still affect the configured failure policy. Listing-manifest declarations remain `NEEDS_REVIEW` because the scanner cannot verify an external attestation.

`NEEDS_REVIEW` means the repository evidence is incomplete or the requirement is external. It is not a failure verdict. Run the tool alongside development-store testing, Shopify's current submission checklist, runtime security testing, and appropriate human review.
