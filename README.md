# Shopify App Review Guard

Review Shopify app repositories for App Store and production-readiness evidence, including supported webhook patterns.

**RexCode Open Source · Shopify developer tools**

[![npm](https://img.shields.io/npm/v/shopify-app-review-guard?logo=npm)](https://www.npmjs.com/package/shopify-app-review-guard)
[![CI](https://github.com/RexCode-Digital/shopify-app-review-guard/actions/workflows/ci.yml/badge.svg)](https://github.com/RexCode-Digital/shopify-app-review-guard/actions/workflows/ci.yml)
[![CodeQL](https://github.com/RexCode-Digital/shopify-app-review-guard/actions/workflows/codeql.yml/badge.svg)](https://github.com/RexCode-Digital/shopify-app-review-guard/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/RexCode-Digital/shopify-app-review-guard/badge)](https://securityscorecards.dev/viewer/?uri=github.com/RexCode-Digital/shopify-app-review-guard)
[![Node.js 22+](https://img.shields.io/badge/Node.js-22+-22B8B2?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MIT licence](https://img.shields.io/github/license/RexCode-Digital/shopify-app-review-guard)](LICENSE)

App Review Guard is an offline, deterministic CLI and GitHub Action. It separates findings supported by repository evidence from checks that still need human or Partner Dashboard verification.

## Features

- Checks app configuration, mandatory compliance subscriptions, authentication and credential signals.
- Analyses supported Shopify Events and webhook security patterns, including Next.js App Router and Pages Router routes.
- Reports listing and production requirements for manual verification.
- Emits human, Markdown, JSON and SARIF reports with stable rule IDs.

## Install and run

Requires Node.js 22 or later.

```bash
npm install --save-dev shopify-app-review-guard
npx shopify-app-review-guard check
```

Choose a monorepo app root explicitly with `--path` or `--config`. See the [Next.js support matrix](docs/nextjs-support.md) for route-matching boundaries.

## GitHub Action

Pin the released v0.3.0 commit:

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
      - uses: RexCode-Digital/shopify-app-review-guard@83498086f93ccceaeec938003f3167b905fedbe5 # v0.3.0
        with:
          fail-on: high
```

Inputs are `path`, `config`, `baseline`, `fail-on`, `format`, `strict` and `show-unmapped`. Outputs include policy outcome, finding/new/resolved counts, severity counts, rendered report and rule IDs. See [action.yml](action.yml).

## Example output

```text
Shopify App Review Guard
PASS   0  WARN   0  FAIL   3  REVIEW   7  UNKNOWN   0

FAIL AR-COMPLIANCE-001
Mandatory compliance topic is not configured: customers/data_request
  Shopify requires App Store distributed apps to subscribe to the three compliance topics.

Static analysis found 7 item(s) requiring manual verification.
This report does not guarantee Shopify App Store approval.
```

This shortened output comes from a synthetic app configuration with no compliance webhooks or visible runtime verification patterns.

## Supported capabilities and evidence

The v0.3.0 release includes route-associated raw-body webhook HMAC evidence for supported Next.js App Router and Pages API patterns. The [Next.js support guide](docs/nextjs-support.md) documents route association and the cases that remain for review. Other checks use bounded repository patterns, versioned Shopify sources and an optional listing manifest.

## Limitations and privacy

This is a preflight tool, not an approval or security guarantee. It cannot inspect the Partner Dashboard, prove live runtime behaviour, verify every route/helper association, or establish that a listing declaration is true. Scans do not call Shopify, execute repository code, require credentials or upload source. Review manual and unknown results, and test webhook verification at runtime.

## Documentation

- [Evidence model](docs/evidence-model.md)
- [Rule reference](docs/rule-reference.md)
- [Next.js support](docs/nextjs-support.md)
- [Limitations](docs/limitations.md)

## Related RexCode OSS tools

- [ChangeGuard](https://github.com/RexCode-Digital/shopify-app-changeguard) reviews Shopify app configuration changes.
- [Shopify Upgrade Guard](https://github.com/RexCode-Digital/shopify-upgrade-guard) checks documented API and platform migrations.
- [Shopify Scope Guard](https://github.com/RexCode-Digital/shopify-scope-guard) reviews requested scopes against static evidence.

See the [combined workflow](https://github.com/RexCode-Digital/shopify-app-changeguard/blob/main/docs/ecosystem-workflow.md) to run all four published Actions together. The Action example pins the v0.3.0 release that added the documented Next.js route checks.

## Contributing and support

Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [RexCode Open Source standards](https://github.com/RexCode-Digital/.github/blob/main/docs/oss/standards.md). Use [SUPPORT.md](SUPPORT.md) or the [issue tracker](https://github.com/RexCode-Digital/shopify-app-review-guard/issues) for safe support questions.

## Security

Report suspected vulnerabilities privately through [SECURITY.md](SECURITY.md). Do not include credentials, merchant data or production secrets in public issues.

## Licence and affiliation

MIT licensed. Shopify's names and marks belong to Shopify. App Review Guard is independent open-source software, not affiliated with, endorsed by, or certified by Shopify.