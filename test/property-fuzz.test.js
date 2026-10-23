import test from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { analyze } from '../src/analyzer.js';
import { classifyDestination, reviewDeliveries } from '../src/webhook-review.js';

const characters = [...'abcdefghijklmnopqrstuvwxyz0123456789_.-'];
const segment = fc.array(fc.constantFrom(...characters), { minLength: 1, maxLength: 18 })
  .map((value) => `r${value.join('')}`);
const atom = fc.array(fc.constantFrom(...[...'abcdefghijklmnopqrstuvwxyz0123456789_-']), { minLength: 1, maxLength: 14 })
  .map((value) => value.join(''));
const options = { seed: 20261026, numRuns: 100, endOnFailure: true };

test('exact generated Next.js webhook routes match once and near-matches stay unassociated', () => {
  fc.assert(fc.property(segment, (route) => {
    const file = `app/api/${route}/route.ts`;
    const files = [{ file, text: 'export async function POST(request: Request) { return new Response("ok"); }' }];
    const exact = reviewDeliveries({
      files,
      endpoints: [{ uri: `https://shop.example.test/api/${route}` }],
    });
    assert.deepEqual(exact.map((finding) => finding.ruleId), ['AR-WEBHOOK-001', 'AR-WEBHOOK-004']);
    assert.ok(exact.every((finding) => finding.file === file));

    const near = reviewDeliveries({
      files,
      endpoints: [{ uri: `https://shop.example.test/api/${route}-unrelated` }],
    });
    assert.equal(near.some((finding) => finding.file === file), false);
    assert.ok(near.every((finding) => finding.file === 'repository'));
  }), options);
});

test('HTTPS destination path normalization is deterministic for bounded path inputs', () => {
  fc.assert(fc.property(
    fc.array(segment, { minLength: 1, maxLength: 8 }),
    atom,
    (parts, token) => {
      const rawPath = `/hooks//${parts.join('/')}//?token=${token}`;
      const first = classifyDestination(rawPath, 'https://shop.example.test/base');
      const second = classifyDestination(rawPath, 'https://shop.example.test/base');
      assert.deepEqual(first, second);
      assert.deepEqual(first, { transport: 'https', pathname: `/hooks/${parts.join('/')}` });
    },
  ), options);
});

test('malformed Shopify TOML fails with a redacted error for bounded values', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'review-toml-property-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = path.join(root, 'shopify.app.toml');
  fc.assert(fc.property(atom, (value) => {
    const sentinel = `SYNTHETIC_SECRET_${value}`;
    fs.writeFileSync(file, `application_url = "https://example.test/${value}"\n[webhooks\napi_version = "2026-10"\n# ${sentinel}\n`);
    assert.throws(() => analyze(root), (error) => {
      assert.equal(error.message, 'Invalid Shopify app TOML; contents were not printed');
      assert.equal(error.message.includes(sentinel), false);
      return true;
    });
  }), options);
});
