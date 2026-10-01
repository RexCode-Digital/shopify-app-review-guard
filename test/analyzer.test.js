import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { analyze } from '../src/analyzer.js';
import { sarif, shouldFail } from '../src/output.js';

function fixture(config, code = '') { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'review-guard-')); fs.writeFileSync(path.join(dir, 'shopify.app.toml'), config); fs.writeFileSync(path.join(dir, 'app.js'), code); return dir; }
test('reports missing compliance configuration and external listing checks', () => { const report = analyze(fixture('application_url = "https://example.test"\nembedded = true\n')); assert.ok(report.findings.some(f => f.ruleId === 'AR-COMPLIANCE-001')); assert.ok(report.findings.some(f => f.status === 'NEEDS_REVIEW')); assert.equal(report.toolVersion, '0.1.0'); });
test('recognizes compliance topics and webhook security signals', () => { const dir = fixture('application_url = "https://example.test"\n[webhooks]\napi_version = "2026-10"\ncompliance_topics = ["customers/data_request", "customers/redact", "shop/redact"]\n', 'export function webhook(req) { const rawBody = req.rawBody; const signature = req.headers["X-Shopify-Hmac-SHA256"]; crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(signature)); const id = req.headers["X-Shopify-Webhook-Id"]; }'); const report = analyze(dir); assert.equal(report.findings.filter(f => f.ruleId === 'AR-COMPLIANCE-001').length, 0); assert.ok(!report.findings.some(f => f.ruleId === 'AR-WEBHOOK-001')); });
test('redacts secret values and produces valid SARIF shape', () => { const report = analyze(fixture('application_url = "http://localhost:3000"\n', 'const client_secret = "this-is-not-output-and-is-long";')); const json = JSON.stringify(report); assert.ok(!json.includes('this-is-not-output-and-is-long')); assert.equal(sarif(report).version, '2.1.0'); assert.equal(shouldFail(report, 'high'), true); });
