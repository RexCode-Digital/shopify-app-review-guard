# Shopify App Review Guard

**Preflight Shopify App Store and production-readiness risks before submission.**

[![npm](https://img.shields.io/npm/v/shopify-app-review-guard?logo=npm)](https://www.npmjs.com/package/shopify-app-review-guard)
[![CI](https://github.com/efegokdemir/shopify-app-review-guard/actions/workflows/ci.yml/badge.svg)](https://github.com/efegokdemir/shopify-app-review-guard/actions/workflows/ci.yml)
[![CodeQL](https://github.com/efegokdemir/shopify-app-review-guard/actions/workflows/codeql.yml/badge.svg)](https://github.com/efegokdemir/shopify-app-review-guard/actions/workflows/codeql.yml)
[![license](https://img.shields.io/github/license/efegokdemir/shopify-app-review-guard)](LICENSE)

Shopify App Review Guard is an offline, deterministic, read-only CLI and GitHub Action. It checks repository evidence for configuration, compliance webhooks, webhook security, authentication, credentials, protected-data signals, billing, API usage, and listing items that need Partner Dashboard verification.

No Shopify credentials. No telemetry. No source upload. No repository code execution. No AI API. Unofficial open-source tooling; not affiliated with or endorsed by Shopify.

## Quick start

```bash
npx shopify-app-review-guard check
npx shopify-app-review-guard check --format json
npx shopify-app-review-guard check --format sarif
```

Exit codes are `0` when the selected policy passes, `1` when findings meet `--fail-on`, and `2` for scanner or configuration errors.

## GitHub Action

```yaml
name: Shopify App Review Guard

on: [pull_request]

permissions:
  contents: read

jobs:
  review-guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4
      - uses: efegokdemir/shopify-app-review-guard@<immutable SHA> # v0.1.0
        with:
          fail-on: high
```

Pin the full commit SHA for high-assurance workflows. A release tag is easier to read but movable; a SHA is the immutable reference reviewed by your team.

## What it checks

Rules are intentionally high precision and conservative. The result model distinguishes `PASS`, `FAIL`, `WARN`, `NEEDS_REVIEW`, `UNKNOWN`, and `SKIPPED`; absence of a recognizable pattern is not silently treated as proof of compliance.

- Shopify app configuration and production URL signals
- `customers/data_request`, `customers/redact`, and `shop/redact` configuration
- raw-body HMAC verification, timing-safe comparisons, and duplicate delivery handling
- embedded authentication and Admin API credential handling
- obvious committed secrets and dangerous dynamic execution signals
- protected customer-data and billing signals
- lightweight listing manifest and manual-check tracking
- JSON and SARIF 2.1.0 output with stable rule IDs

This complements, rather than duplicates, the other RexCode tools:

- [ChangeGuard](https://github.com/efegokdemir/shopify-app-changeguard) reviews meaningful configuration changes.
- [Scope Guard](https://github.com/efegokdemir/shopify-scope-guard) audits declared access scopes against repository evidence.
- [Upgrade Guard](https://github.com/efegokdemir/shopify-upgrade-guard) detects API and platform migration risks.
- App Review Guard preflights App Store and production-readiness requirements.

## Listing manifest

External listing and Partner Dashboard requirements cannot be proven from source. An optional `.app-review-guard.yml` records which items still need human verification. Unchecked values become `NEEDS_REVIEW`, never `FAIL`.

```yaml
listing:
  privacyPolicyUrl: true
  supportUrl: true
  testInstructions: true
  emergencyContact: true
```

## Evidence and limitations

Shopify-specific findings carry an official source URL and bundled evidence version. See [the evidence model](docs/evidence-model.md), [rule reference](docs/rule-reference.md), and [limitations](docs/limitations.md). Current source references include Shopify's [App Store requirements](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements), [submission checklist](https://shopify.dev/docs/apps/launch/app-store-review/submit-app-for-review), [privacy requirements](https://shopify.dev/docs/apps/launch/privacy-requirements), [access tokens](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens), and [webhook verification](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries).

The tool is a preflight assistant. It cannot guarantee App Store approval, prove live behaviour, inspect Partner Dashboard state, measure latency, or replace Shopify review, runtime testing, CodeQL, or legal advice.

## Development

```bash
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm pack --dry-run
```

## Security and license

Report vulnerabilities privately using [SECURITY.md](SECURITY.md). Never include credentials, customer data, or private keys in issues. MIT licensed. Shopify trademarks belong to their owners.
