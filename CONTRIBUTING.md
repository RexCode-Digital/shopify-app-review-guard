# Contributing

Contributions are welcome around official evidence references, privacy-safe fixtures, supported Node/TypeScript framework patterns, false-positive reduction, and output stability.

## Contribution terms

You retain copyright in your contributions. By submitting a contribution, you agree that it is provided under the same MIT licence that applies to this project. You confirm that you have the right to submit the contribution. Disclose any third-party code or assets and identify their applicable licences before including them.

Use Node.js 20 or newer. Run `npm ci`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm audit --omit=dev --audit-level=high`, and `git diff --check` before opening a pull request. Add a regression test for every rule change. Never add credentials, tokens, merchant data, or source-upload behaviour.
