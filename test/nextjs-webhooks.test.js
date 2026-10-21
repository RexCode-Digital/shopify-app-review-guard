import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { analyze } from '../src/analyzer.js';

function fixture(t, routes, endpoints = ['/api/webhooks']) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'review-next-webhook-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const subscriptions = endpoints.map(uri => `[[webhooks.subscriptions]]\nuri = "${uri}"\n`).join('\n');
  fs.writeFileSync(path.join(root, 'shopify.app.toml'), `application_url = "https://shop.example.test"\n[webhooks]\n${subscriptions}`);
  for (const [file, source] of Object.entries(routes)) {
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, source);
  }
  return root;
}

function webhookFinding(root, status) {
  const findings = analyze(root).findings.filter(finding => finding.ruleId === 'AR-WEBHOOK-001');
  if (status) assert.ok(findings.some(finding => finding.status === status), JSON.stringify(findings));
  return findings;
}

const appRouterVerifier = `import { createHmac, timingSafeEqual } from 'node:crypto';
export async function POST(request: Request) {
  const rawBody = await request.text();
  const received = request.headers.get('x-shopify-hmac-sha256');
  const digest = createHmac('sha256', process.env.SHOPIFY_API_SECRET).update(rawBody).digest('base64');
  return timingSafeEqual(Buffer.from(received, 'base64'), Buffer.from(digest, 'base64'));
}
export async function GET(request: Request) { return new Response(request.url); }
`;

test('maps App Router route groups and dynamic segments to the exported POST handler', t => {
  const root = fixture(t, { 'src/app/(admin)/(webhooks)/api/webhooks/[shop]/route.tsx': appRouterVerifier }, ['/api/webhooks/example-shop']);
  const findings = webhookFinding(root, 'PASS');
  assert.ok(findings.some(finding => finding.file === 'src/app/(admin)/(webhooks)/api/webhooks/[shop]/route.tsx'));
});

test('supports nested catch-all App Router routes and JavaScript route extensions', t => {
  const root = fixture(t, { 'app/api/webhooks/[...path]/route.js': appRouterVerifier }, ['/api/webhooks/shops/example/products/1']);
  assert.equal(webhookFinding(root, 'PASS').length, 1);
});

test('matches an optional catch-all at both the base and nested path', t => {
  const root = fixture(t, { 'app/api/webhooks/[[...path]]/route.tsx': appRouterVerifier }, ['/api/webhooks']);
  assert.equal(webhookFinding(root, 'PASS').length, 1);
  const nested = fixture(t, { 'app/api/webhooks/[[...path]]/route.tsx': appRouterVerifier }, ['/api/webhooks/a/b']);
  assert.equal(webhookFinding(nested, 'PASS').length, 1);
});

test('a GET verifier does not count for a configured Shopify POST delivery', t => {
  const root = fixture(t, { 'app/api/webhooks/route.ts': `import { createHmac, timingSafeEqual } from 'node:crypto';
export async function GET(request: Request) {
  const rawBody = await request.text();
  const digest = createHmac('sha256', secret).update(rawBody).digest('base64');
  return timingSafeEqual(Buffer.from(request.headers.get('x-shopify-hmac-sha256')), Buffer.from(digest));
}
` });
  const findings = webhookFinding(root, 'NEEDS_REVIEW');
  assert.ok(findings[0].rationale.includes('POST handler'));
});

test('a POST handler in the same file is evaluated independently from GET', t => {
  const root = fixture(t, { 'app/api/webhooks/route.ts': appRouterVerifier });
  assert.equal(webhookFinding(root, 'PASS').length, 1);
});

test('a Next.js POST route without an HMAC verifier remains for review', t => {
  const root = fixture(t, { 'app/api/webhooks/route.js': `export async function POST(request) {
  const payload = await request.json();
  return Response.json({ received: Boolean(payload) });
}` });
  webhookFinding(root, 'NEEDS_REVIEW');
});

test('manual HMAC evidence must compare the raw-body base64 digest with the Shopify header', t => {
  const disconnected = fixture(t, { 'app/api/webhooks/route.ts': `import { createHmac, timingSafeEqual } from 'node:crypto';
export async function POST(request: Request) {
  const rawBody = await request.text();
  const received = request.headers.get('x-shopify-hmac-sha256');
  const digest = createHmac('sha256', secret).update(rawBody).digest('base64');
  return timingSafeEqual(Buffer.from('fixed-a'), Buffer.from('fixed-b'));
}` });
  const disconnectedFindings = webhookFinding(disconnected, 'NEEDS_REVIEW');
  assert.ok(!disconnectedFindings.some(finding => finding.status === 'PASS'));

  const wrongEncoding = fixture(t, { 'app/api/webhooks/route.ts': `import { createHmac, timingSafeEqual } from 'node:crypto';
export async function POST(request: Request) {
  const rawBody = await request.text();
  const received = request.headers.get('x-shopify-hmac-sha256');
  const digest = createHmac('sha256', secret).update(rawBody).digest('hex');
  return timingSafeEqual(Buffer.from(received), Buffer.from(digest));
}` });
  const wrongEncodingFindings = webhookFinding(wrongEncoding, 'NEEDS_REVIEW');
  assert.ok(!wrongEncodingFindings.some(finding => finding.status === 'PASS'));

  const alteredDigest = fixture(t, { 'app/api/webhooks/route.ts': `import { createHmac, timingSafeEqual } from 'node:crypto';
export async function POST(request: Request) {
  const rawBody = await request.text();
  const received = request.headers.get('x-shopify-hmac-sha256');
  const digest = createHmac('sha256', secret).update(rawBody).digest('base64');
  return timingSafeEqual(Buffer.from(received), Buffer.from(digest + 'suffix'));
}` });
  assert.ok(!webhookFinding(alteredDigest, 'NEEDS_REVIEW').some(finding => finding.status === 'PASS'));

  const mutableDigest = fixture(t, { 'app/api/webhooks/route.ts': `import { createHmac, timingSafeEqual } from 'node:crypto';
export async function POST(request: Request) {
  const rawBody = await request.text();
  const received = request.headers.get('x-shopify-hmac-sha256');
  let digest = createHmac('sha256', secret).update(rawBody).digest('base64');
  digest = 'untrusted';
  return timingSafeEqual(Buffer.from(received), Buffer.from(digest));
}` });
  assert.ok(!webhookFinding(mutableDigest, 'NEEDS_REVIEW').some(finding => finding.status === 'PASS'));

  const preparedBuffers = fixture(t, { 'app/api/webhooks/route.ts': `import { createHmac, timingSafeEqual } from 'node:crypto';
export async function POST(request: Request) {
  const rawBody = await request.text();
  const provided = request.headers.get('x-shopify-hmac-sha256');
  const computed = createHmac('sha256', secret).update(rawBody).digest('base64');
  const providedBuf = Buffer.from(provided, 'utf8');
  const computedBuf = Buffer.from(computed, 'utf8');
  return timingSafeEqual(providedBuf, computedBuf);
}` });
  assert.equal(webhookFinding(preparedBuffers, 'PASS').length, 1);
});

test('custom verifier names with dollar signs remain recognised for review', t => {
  const root = fixture(t, { 'app/api/webhooks/route.ts': `export async function POST(request: Request) {
  return verify$Custom(request);
}` });
  const findings = webhookFinding(root, 'NEEDS_REVIEW');
  assert.ok(findings[0].rationale.includes('custom or imported verification helper'));
});

test('security examples inside strings and comments do not authenticate a route', t => {
  const root = fixture(t, { 'app/api/webhooks/route.ts': `export async function POST(request: Request) {
  // createHmac('sha256').update(rawBody); timingSafeEqual(signature, digest)
  const example = "request.headers.get('x-shopify-hmac-sha256') createHmac('sha256').update(rawBody) timingSafeEqual(a, b)";
  return Response.json({ received: Boolean(request) });
}` });
  webhookFinding(root, 'NEEDS_REVIEW');
});

test('verification code in an unrelated module does not cover the configured route', t => {
  const root = fixture(t, {
    'app/api/webhooks/route.ts': `export async function POST(request: Request) { return Response.json(await request.json()); }`,
    'lib/other-webhook.ts': `export function verifyShopifyWebhook(request) {
  const signature = request.headers.get('x-shopify-hmac-sha256');
  const digest = createHmac('sha256', secret).update(request.body).digest('base64');
  return timingSafeEqual(signature, digest);
}`
  });
  const findings = webhookFinding(root, 'NEEDS_REVIEW');
  assert.ok(!findings.some(finding => finding.status === 'PASS'));
});

test('Pages API raw stream HMAC passes only when body parsing is disabled', t => {
  const source = `import { createHmac, timingSafeEqual } from 'node:crypto';
export const config = { api: { bodyParser: false } };
export default async function handler(req, res) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const rawBody = Buffer.concat(chunks);
  const digest = createHmac('sha256', process.env.SHOPIFY_API_SECRET).update(rawBody).digest('base64');
  const signature = req.headers['x-shopify-hmac-sha256'];
  const valid = timingSafeEqual(Buffer.from(signature, 'base64'), Buffer.from(digest, 'base64'));
  return res.status(valid ? 200 : 401).end();
}`;
  const root = fixture(t, { 'src/pages/api/webhooks/[shop].ts': source }, ['/api/webhooks/acme']);
  const findings = webhookFinding(root, 'PASS');
  assert.equal(findings.length, 1);
  assert.ok(!analyze(root).findings.some(finding => finding.ruleId === 'AR-WEBHOOK-002'));
});

test('reading stream chunks without hashing the aggregated bytes does not pass', t => {
  const root = fixture(t, { 'pages/api/webhooks.js': `import { createHmac, timingSafeEqual } from 'node:crypto';
export const config = { api: { bodyParser: false } };
export default async function handler(req, res) {
  const chunks = [];
  for await (const chunk of req) { console.log(chunk); }
  const rawBody = Buffer.concat(chunks);
  const digest = createHmac('sha256', secret).update(rawBody).digest('base64');
  return timingSafeEqual(Buffer.from(req.headers['x-shopify-hmac-sha256']), Buffer.from(digest));
}` });
  webhookFinding(root, 'NEEDS_REVIEW');
  assert.ok(!analyze(root).findings.some(finding => finding.ruleId === 'AR-WEBHOOK-001' && finding.status === 'PASS'));
});

test('non-default route extensions are left for manual review', t => {
  const root = fixture(t, { 'app/api/webhooks/route.mjs': appRouterVerifier });
  const findings = webhookFinding(root, 'NEEDS_REVIEW');
  assert.ok(!findings.some(finding => finding.status === 'PASS'));
});

test('Pages API default body parsing is reported when HMAC uses parsed req.body', t => {
  const source = `import { createHmac, timingSafeEqual } from 'node:crypto';
export default function handler(req, res) {
  const digest = createHmac('sha256', process.env.SHOPIFY_API_SECRET).update(req.body).digest('base64');
  const signature = req.headers['x-shopify-hmac-sha256'];
  return timingSafeEqual(Buffer.from(signature, 'base64'), Buffer.from(digest, 'base64')) ? res.status(200).end() : res.status(401).end();
}`;
  const root = fixture(t, { 'pages/api/webhooks.js': source });
  webhookFinding(root, 'NEEDS_REVIEW');
  const parsing = analyze(root).findings.find(finding => finding.ruleId === 'AR-WEBHOOK-002');
  assert.ok(parsing);
  assert.equal(parsing.status, 'WARN');
  assert.equal(parsing.file, 'pages/api/webhooks.js');
});

test('Pages API index directories remain part of nested route paths', t => {
  const root = fixture(t, { 'pages/api/index/[shop].tsx': `export default function handler(req, res) { return res.status(200).end(); }` }, ['/api/index/example-shop']);
  const findings = webhookFinding(root, 'NEEDS_REVIEW');
  assert.ok(findings.some(finding => finding.file === 'pages/api/index/[shop].tsx'));
});

test('bodyParser false does not turn parsed req.body into raw-body evidence', t => {
  const root = fixture(t, { 'pages/api/webhooks.ts': `import { createHmac, timingSafeEqual } from 'node:crypto';
export const config = { api: { bodyParser: false } };
export default function handler(req, res) {
  const digest = createHmac('sha256', secret).update(req.body).digest('base64');
  const signature = req.headers['x-shopify-hmac-sha256'];
  return timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}` });
  webhookFinding(root, 'NEEDS_REVIEW');
  assert.ok(!analyze(root).findings.some(finding => finding.ruleId === 'AR-WEBHOOK-001' && finding.status === 'PASS'));
});

test('a Pages API route that only handles GET does not verify a Shopify POST', t => {
  const root = fixture(t, { 'pages/api/webhooks.js': `import { createHmac, timingSafeEqual } from 'node:crypto';
export const config = { api: { bodyParser: false } };
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const chunks = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const rawBody = Buffer.concat(chunks);
    const digest = createHmac('sha256', secret).update(rawBody).digest('base64');
    return timingSafeEqual(Buffer.from(req.headers['x-shopify-hmac-sha256']), Buffer.from(digest));
  }
}` });
  const findings = webhookFinding(root, 'NEEDS_REVIEW');
  assert.ok(findings[0].rationale.includes('POST handler'));
});

test('an imported custom verifier remains for review when its implementation is not trusted as a built-in helper', t => {
  const root = fixture(t, {
    'app/api/webhooks/route.ts': `import { verifyShopifyWebhook } from './security';
export async function POST(request: Request) { return verifyShopifyWebhook(request); }`,
    'app/api/webhooks/security.ts': `export async function verifyShopifyWebhook(request) {
  const rawBody = await request.text();
  return rawBody.length > 0;
}`
  });
  const findings = webhookFinding(root, 'NEEDS_REVIEW');
  assert.ok(findings.some(finding => finding.rationale.includes('could not be traced confidently')));
  assert.ok(!findings.some(finding => finding.status === 'PASS'));
});

test('evidence in another webhook route does not authenticate an imported helper on this route', t => {
  const root = fixture(t, {
    'app/api/webhooks/secure/route.ts': appRouterVerifier,
    'app/api/webhooks/custom/route.ts': `import { verifyShopifyWebhook } from '../security';
export async function POST(request: Request) { return verifyShopifyWebhook(request); }`,
    'app/api/webhooks/security.ts': `export async function verifyShopifyWebhook(request) {
  const rawBody = await request.text();
  return rawBody.length > 0;
}`
  }, ['/api/webhooks/secure', '/api/webhooks/custom']);
  const findings = analyze(root).findings.filter(finding => finding.ruleId === 'AR-WEBHOOK-001');
  assert.equal(findings.filter(finding => finding.status === 'PASS').length, 1);
  assert.equal(findings.filter(finding => finding.status === 'NEEDS_REVIEW').length, 1);
  assert.ok(findings.some(finding => finding.file === 'app/api/webhooks/custom/route.ts' && finding.status === 'NEEDS_REVIEW'));
});

test('ambiguous Next.js route patterns never produce a verifier pass', t => {
  const root = fixture(t, {
    'app/(admin)/api/webhooks/[shop]/route.ts': appRouterVerifier,
    'app/(staff)/api/webhooks/[tenant]/route.ts': appRouterVerifier
  }, ['/api/webhooks/example-shop']);
  const findings = webhookFinding(root, 'NEEDS_REVIEW');
  assert.ok(findings[0].rationale.includes('More than one route pattern'));
});

test('React Router webhook helper remains recognised through the local Shopify server module', t => {
  const root = fixture(t, {
    'app/routes/webhooks.tsx': `import { authenticate } from '../shopify.server';
export const action = async ({ request }) => {
  const { topic } = await authenticate.webhook(request);
  return new Response(topic);
};`,
    'app/shopify.server.ts': `import { shopifyApp } from '@shopify/shopify-app-react-router/server';
const shopify = shopifyApp({});
export const authenticate = shopify.authenticate;`
  }, ['/webhooks']);
  assert.equal(webhookFinding(root, 'PASS').length, 1);
});

test('an unused Shopify server import does not authenticate an unrelated helper', t => {
  const root = fixture(t, {
    'app/api/webhooks/route.ts': `import { authenticate } from '../../shopify.server';
export async function POST(request: Request) { return authenticate.webhook(request); }`,
    'app/shopify.server.ts': `import { shopifyApp } from '@shopify/shopify-app-react-router/server';
const shopify = {};
export const authenticate = shopify.authenticate;`
  });
  const findings = webhookFinding(root, 'NEEDS_REVIEW');
  assert.ok(!findings.some(finding => finding.status === 'PASS'));
});

test('an Express handler declared in the same module remains route-associated', t => {
  const root = fixture(t, { 'server.js': `import { createHmac, timingSafeEqual } from 'node:crypto';
function verifyWebhook(req, res) {
  const digest = createHmac('sha256', secret).update(req.rawBody).digest('base64');
  const signature = req.headers['x-shopify-hmac-sha256'];
  return timingSafeEqual(Buffer.from(signature, 'base64'), Buffer.from(digest, 'base64'));
}
app.post('/api/webhooks', verifyWebhook);` });
  assert.equal(webhookFinding(root, 'PASS').length, 1);
});

test('parallel and intercepting App Router segments are not guessed into URL paths', t => {
  const root = fixture(t, { 'app/@modal/api/webhooks/route.ts': appRouterVerifier });
  const findings = webhookFinding(root, 'NEEDS_REVIEW');
  assert.ok(findings[0].rationale.includes('could not be connected'));
});

test('non-final catch-all segments are left for manual review', t => {
  const root = fixture(t, { 'app/api/[...path]/route/route.ts': appRouterVerifier });
  webhookFinding(root, 'NEEDS_REVIEW');
  assert.ok(!analyze(root).findings.some(finding => finding.ruleId === 'AR-WEBHOOK-001' && finding.status === 'PASS'));
});
