# Changelog

## 0.1.4

- Refine npm search metadata and the Action description for Shopify App Store review-readiness checks.
- Refresh the pinned Action release and remove the duplicate self-reference from related tools.

## 0.1.3

- Refresh published npm metadata to the canonical RexCode-Digital repository and issue tracker.
- Preserve the existing package name, license, author attribution, and runtime behavior.

## 0.1.2

- Declare Node 24 for the GitHub Action, matching current runner support; CLI engines remain Node >=20.

- Parse actual TOML and validate config types, URLs, and compliance subscriptions.
- Do not allow documentation or incomplete listing manifests to satisfy implementation checks.
- Include environment-file variants, reject file/config/manifest symlinks, and bound file analysis.
- Validate CLI/Action policies and write multiline JSON outputs safely.
- Ship and independently test a self-contained Action bundle; preserve historical v0.1.0 and corrected v0.1.1 releases.
- Validate clean installs and source-only coverage on supported Node versions.

## 0.1.1

- Fixed the GitHub Action distribution entrypoint so the Action loads its source modules correctly from `dist/index.js`.
- Added conservative scanner regression coverage for configuration selection, severity policies, environment files, empty repositories, and symlink safety.
- This corrected the early release. The historical `v0.1.0` release remains unchanged and is not recommended.

## 0.1.0

- Added deterministic offline App Store and production-readiness preflight CLI.
- Added configuration, compliance webhook, webhook security, authentication, credential, data, billing, API, and listing-manifest checks.
- Added human, JSON, and SARIF output plus a bundled GitHub Action.
- Added versioned official-source evidence links and documented limitations.
