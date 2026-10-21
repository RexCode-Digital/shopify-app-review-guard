# Evidence model

The scanner bundles a small, versioned evidence registry in its rule metadata. Ordinary scans are offline and do not fetch Shopify documentation. Each Shopify-specific finding includes an official Shopify source URL, the evidence version (`2026-10`), and a confidence level. Framework-specific webhook findings also link to the relevant framework documentation where it defines request-body parsing or route conventions.

Evidence is deliberately separate from detection logic in the report model so maintainers can update sources and requirement notes without changing every detector. Refreshes must be based on official Shopify documentation, reviewed with a regression fixture, and recorded in the changelog. Stale or ambiguous requirements become `NEEDS_REVIEW`, not an invented pass or failure.

The project does not copy Shopify's AI self-review implementation and is not Shopify's official reviewer. Its differentiators are deterministic local analysis, offline operation, versioned evidence, JSON/SARIF output, and an open-source rule implementation. Next.js webhook checks use Shopify's official delivery-verification guidance and Next.js route conventions; they remain source signals, not proof of deployed behavior.
