# Shopify App Review Guard

**Preflight Shopify App Store and production-readiness risks before submission.**

[![npm](https://img.shields.io/npm/v/shopify-app-review-guard?logo=npm)](https://www.npmjs.com/package/shopify-app-review-guard)
[![CI](https://github.com/efegokdemir/shopify-app-review-guard/actions/workflows/ci.yml/badge.svg)](https://github.com/efegokdemir/shopify-app-review-guard/actions/workflows/ci.yml)
[![CodeQL](https://github.com/efegokdemir/shopify-app-review-guard/actions/workflows/codeql.yml/badge.svg)](https://github.com/efegokdemir/shopify-app-review-guard/actions/workflows/codeql.yml)
[![license](https://img.shields.io/github/license/efegokdemir/shopify-app-review-guard)](LICENSE)

Shopify App Review Guard is an offline, deterministic, read-only CLI and GitHub Action. It checks repository evidence for configuration, compliance webhooks, webhook security, authentication, credentials, protected-data signals, billing, API usage, and listing items that need Partner Dashboard verification.

No Shopify credentials. No telemetry. No source upload. No repository code execution. No AI API. Unofficial open-source tooling; not affiliated with or endorsed by Shopify.

Part of the **RexCode Shopify developer tools** suite. Requires Node.js 20 or later for the CLI. [Releases](https://github.com/efegokdemir/shopify-app-review-guard/releases) · [npm](https://www.npmjs.com/package/shopify-app-review-guard) · [Marketplace](https://github.com/marketplace/actions/shopify-app-review-guard)

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
      # Current patch release; resolve to an immutable SHA below.
      - uses: efegokdemir/shopify-app-review-guard@v0.1.2
        with:
          fail-on: high
```

## What it checks

Rules report deterministic signals with explicit confidence. Repository-wide heuristics need human review and cannot prove runtime compliance. The result model distinguishes `PASS`, `FAIL`, `WARN`, `NEEDS_REVIEW`, `UNKNOWN`, and `SKIPPED`; absence of a recognizable pattern is not silently treated as proof of compliance.

- Shopify app configuration and production URL signals
- `customers/data_request`, `customers/redact`, and `shop/redact` configuration
- raw-body HMAC verification, timing-safe comparisons, and duplicate delivery handling
- embedded authentication and Admin API credential handling
- potential hardcoded credentials, environment files, and dynamic execution signals
- protected customer-data and billing signals
- lightweight listing manifest and manual-check tracking
- JSON and SARIF 2.1.0 output with stable rule IDs

## Related tools

This complements, rather than duplicates, the other RexCode tools:

- [ChangeGuard](https://github.com/efegokdemir/shopify-app-changeguard) reviews meaningful configuration changes.
- [Scope Guard](https://github.com/efegokdemir/shopify-scope-guard) audits declared access scopes against repository evidence.
- [Upgrade Guard](https://github.com/efegokdemir/shopify-upgrade-guard) detects API and platform migration risks.
- App Review Guard preflights App Store and production-readiness requirements.

GitHub Marketplace: [Shopify App Review Guard](https://github.com/marketplace/actions/shopify-app-review-guard)

## Why

A configuration mistake or missing compliance subscription can delay submission. Other requirements live in Shopify dashboards or need runtime tests. Review Guard separates deterministic repository findings from items requiring manual verification.

## CLI and configuration

```bash
npm install --save-dev shopify-app-review-guard
npx shopify-app-review-guard check --path apps/my-app --config shopify.app.production.toml
npx shopify-app-review-guard check --fail-on medium --strict
npx shopify-app-review-guard check --format sarif --output review.sarif
npx shopify-app-review-guard --help
```

`--config` selects a TOML file relative to `--path`. `--fail-on` accepts `none`, `low`, `medium`, or `high`; `--strict` includes `NEEDS_REVIEW` findings at that threshold. Unknown flags, malformed configuration, and invalid policies exit 2. TOML comments and strings in unrelated tables do not satisfy configured compliance subscriptions.

The Action supports `path`, `config`, `format`, `fail-on`, `strict`, and `show-unmapped`. Outputs are `outcome`, `finding-count`, `fail-count`, `warning-count`, `review-count`, `unknown-count`, `report`, and `rule-ids`. `report` is the rendered multiline report, usable as JSON when `format: json`. The bundled Action runs on Node 20 without installing dependencies in the consumer job.

## Output and scan limits

Human output includes status, rationale, remediation, and official evidence. JSON includes findings, counts, manual checks, and skipped files. SARIF is version 2.1.0. Reads are bounded to 2,000 files and 1 MiB per file; symlinks are not followed. Missing/unreadable roots and unsafe explicit inputs exit 2. Skipped files require manual review. `.env` variants are review signals; the scanner cannot determine whether they are committed or contain live secrets.

Configuration checks parse TOML. Authentication, billing, data and webhook implementation checks recognize source patterns; documentation is not accepted as runtime verification evidence. Matching a helper name cannot prove that every route uses it correctly.

## Listing manifest

External listing and Partner Dashboard requirements cannot be proven from source. An optional `.app-review-guard.yml` records which items still need human verification. False or unspecified required values become `NEEDS_REVIEW`, never `FAIL`. A malformed manifest reports a warning and preserves all manual checks. Values set to `true` are your declaration of verification, not a scanner-certified pass.

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

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the project workflow and [open issues](https://github.com/efegokdemir/shopify-app-review-guard/issues) for current work.

## Security and license

Report vulnerabilities privately using [SECURITY.md](SECURITY.md). Never include credentials, customer data, or private keys in issues. MIT licensed. Shopify trademarks belong to their owners.

## Immutable SHA usage

Resolve the release commit, review it, and replace `@v0.1.2` in the Action example with that full SHA:

```bash
gh api repos/efegokdemir/shopify-app-review-guard/git/ref/tags/v0.1.2 --jq .object.sha
```

Published patch tags are retained; existing minor aliases are movable. A reviewed full commit SHA is the immutable execution reference.
