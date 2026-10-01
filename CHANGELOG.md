# Changelog

## 0.1.1

- Fixed the GitHub Action distribution entrypoint so the Action loads its source modules correctly from `dist/index.js`.
- Added conservative scanner regression coverage for configuration selection, severity policies, environment files, empty repositories, and symlink safety.
- This is the recommended release. The historical `v0.1.0` release remains unchanged and is not recommended.

## 0.1.0

- Added deterministic offline App Store and production-readiness preflight CLI.
- Added configuration, compliance webhook, webhook security, authentication, credential, data, billing, API, and listing-manifest checks.
- Added human, JSON, and SARIF output plus a bundled GitHub Action.
- Added versioned official-source evidence links and documented limitations.
