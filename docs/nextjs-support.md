# Next.js webhook route support

Review Guard can associate configured HTTPS webhook destinations with conventional Next.js route files. Shopify sends HTTPS deliveries as HTTP `POST` requests and signs the raw request body; a route match or a verifier-like name alone is not treated as proof.

## Supported patterns

| Router | Recognised files | Handler used for webhook review | Route mapping |
| --- | --- | --- | --- |
| App Router | `app/**/route.{js,jsx,ts,tsx}` and `src/app/**/route.{js,jsx,ts,tsx}` | A single exported `POST` function or block-bodied `POST` arrow handler | Route groups such as `(admin)` are omitted. `[shop]` matches one path segment; `[...path]` and `[[...path]]` match catch-all paths. |
| Pages Router | `pages/api/**/*.{js,jsx,ts,tsx}` and `src/pages/api/**/*` | A single default function or block-bodied default arrow handler | The `api` prefix is included. `[shop]`, `[...path]`, `[[...path]]`, and `index` follow the Pages Router URL convention. |

App Router methods are checked separately. A `GET` handler cannot authenticate a configured Shopify `POST` delivery. Pages API Routes use a default export; when the handler explicitly checks `req.method`, the scanner requires evidence that `POST` is accepted.

## Verification evidence

For App Router manual HMAC checks, the scanner recognises route-local use of `request.text()` or `request.arrayBuffer()`, SHA-256 HMAC construction, the `X-Shopify-Hmac-Sha256` header, and `timingSafeEqual`.

Next.js Pages API Routes enable body parsing by default. When a route attempts manual HMAC verification, the scanner reports `AR-WEBHOOK-002` unless the route exports `config.api.bodyParser = false`. It recognises manual raw-body evidence only when that setting is present and the route visibly reads the request stream. Parsed `req.body` is not accepted as the raw request body.

Direct Shopify framework verifier calls are recognised only when the associated package can be linked to that route, including the supported React Router/Remix `authenticate.webhook` export pattern. Custom imported helpers and abstractions the scanner cannot trace stay `NEEDS_REVIEW`. Comments, documentation, test files outside the selected app root, other endpoint handlers, and helpers that are merely named `verify` do not establish a pass.

## Limitations

The scanner recognises the default `.js`, `.jsx`, `.ts`, and `.tsx` extensions. It does not resolve Next.js rewrites, proxy configuration, exported handler aliases, custom `pageExtensions`, parallel routes, or intercepting routes. It does not execute or type-check application code. A `PASS` is a static source signal; it does not prove that the deployed application uses the matched route or secret.

## GitHub Action

The current released Action can be pinned to the immutable v0.2.0 commit:

```yaml
name: Shopify App Review Guard

on: [pull_request]

permissions:
  contents: read

jobs:
  review-guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: RexCode-Digital/shopify-app-review-guard@886a729183227ab742effcf7dfea32bbe9756e09 # v0.2.0
        with:
          path: .
          fail-on: high
```

The pinned v0.2.0 Action does not include the Next.js support in this unreleased change. Next.js checks become available in an Action release that contains this implementation. The Action runs on Node.js 24 and only needs `contents: read`.

## References

- Shopify: [Verify webhook deliveries](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries)
- Shopify: [Webhook delivery structure](https://shopify.dev/docs/apps/build/webhooks/delivery-structure)
- Next.js: [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- Next.js: [Route Groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)
- Next.js: [Dynamic Routes](https://nextjs.org/docs/pages/building-your-application/routing/dynamic-routes)
- Next.js: [Pages Router API Routes and body parser configuration](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)
