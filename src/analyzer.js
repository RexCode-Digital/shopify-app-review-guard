import fs from 'node:fs';
import path from 'node:path';

export const EVIDENCE_VERSION = '2026-10';
const CONFIG = /shopify\.app(?:\.[^./]+)?\.toml$/;
const SKIP = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.next', 'vendor']);
const TOPICS = ['customers/data_request', 'customers/redact', 'shop/redact'];
const source = {
  requirements: 'https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements',
  submit: 'https://shopify.dev/docs/apps/launch/app-store-review/submit-app-for-review',
  privacy: 'https://shopify.dev/docs/apps/launch/privacy-requirements',
  auth: 'https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens',
  webhooks: 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries'
};

function finding(ruleId, severity, status, title, rationale, remediation, file, line, confidence = 'medium', evidence = source.requirements) {
  return { ruleId, severity, status, title, rationale, remediation, file, line: line || undefined, confidence, evidence, evidenceVersion: EVIDENCE_VERSION };
}
function lineOf(text, needle) { const i = text.indexOf(needle); return i < 0 ? undefined : text.slice(0, i).split('\n').length; }
function walk(root) {
  const out = [];
  function visit(dir) {
    let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (SKIP.has(e.name) || e.name.startsWith('.')) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) visit(p); else if (/\.(?:[cm]?[jt]sx?|json|toml|ya?ml|md|env|txt|graphql)$/i.test(e.name)) out.push(p);
    }
  }
  visit(root); return out;
}
function readFiles(root) {
  return walk(root).map(file => { let text = ''; try { text = fs.readFileSync(file, 'utf8'); } catch {} return { file: path.relative(root, file) || path.basename(file), abs: file, text }; });
}
function configs(files) { return files.filter(f => CONFIG.test(f.file)); }
function hasAny(files, re) { return files.some(f => re.test(f.text)); }
function configValue(configText, key) { const m = configText.match(new RegExp(`^\\s*${key.replace('.', '\\s*\\.\\s*')}\\s*=\\s*([^\\n#]+)`, 'm')); return m?.[1].trim().replace(/^['"]|['"]$/g, ''); }
function allText(files) { return files.map(f => f.text).join('\n'); }
function manifest(root) {
  for (const n of ['.app-review-guard.yml', '.app-review-guard.yaml', '.app-review-guard.json']) {
    const p = path.join(root, n); if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf8');
        if (n.endsWith('.json')) return { file: n, value: JSON.parse(raw) };
        const listing = {}; for (const line of raw.split(/\r?\n/)) { const m = line.match(/^\s{2}([A-Za-z0-9_-]+):\s*(true|false)\s*$/); if (m) listing[m[1]] = m[2] === 'true'; }
        return { file: n, value: Object.keys(listing).length ? { listing } : null };
      } catch { return { file: n, value: null }; }
    }
  }
  return null;
}
function manual(ruleId, title, rationale, remediation, file = '.app-review-guard.yml') { return finding(ruleId, 'medium', 'NEEDS_REVIEW', title, rationale, remediation, file, undefined, 'manual', source.submit); }

export function analyze(root = '.', options = {}) {
  const repo = path.resolve(root); const files = readFiles(repo); const cs = configs(files); const findings = [];
  if (!cs.length) findings.push(finding('AR-CONFIG-001', 'high', 'FAIL', 'Shopify app configuration was not found', 'No shopify.app*.toml file was discovered.', 'Add and validate the Shopify CLI app configuration for the intended deployment.', 'repository', undefined, 'high'));
  for (const c of cs) {
    const t = c.text; const url = configValue(t, 'application_url');
    if (!url) findings.push(finding('AR-CONFIG-002', 'high', 'FAIL', 'Application URL is missing', 'The configuration does not declare application_url.', 'Set a production HTTPS application_url in the deployed app configuration.', c.file, undefined, 'high'));
    else if (!/^https:\/\//i.test(url) && !/^http:\/\/localhost|127\.0\.0\.1/i.test(url)) findings.push(finding('AR-CONFIG-002', 'high', 'FAIL', 'Application URL is not HTTPS', 'A non-local application URL uses an insecure scheme.', 'Use an HTTPS application URL for production.', c.file, lineOf(t, 'application_url'), 'high'));
    if (/localhost|127\.0\.0\.1|\.ngrok\./i.test(url || '') && !/development|dev/i.test(c.file)) findings.push(finding('AR-CONFIG-003', 'medium', 'WARN', 'Development URL appears in app configuration', 'The URL looks like a local or tunnel endpoint.', 'Confirm this is intentionally a development configuration and do not submit it as production.', c.file, lineOf(t, 'application_url'), 'high'));
    const redirects = t.match(/redirect_urls\s*=\s*\[([\s\S]*?)\]/m)?.[1] || '';
    if (/http:\/\/(?!localhost|127\.0\.0\.1)/i.test(redirects)) findings.push(finding('AR-CONFIG-004', 'high', 'FAIL', 'OAuth redirect URL is not HTTPS', 'A non-local redirect URL uses HTTP.', 'Use HTTPS redirect URLs outside local development.', c.file, lineOf(t, 'http://'), 'high'));
    if (/automatically_update_urls_on_dev\s*=\s*true/i.test(t) && !/development|dev/i.test(c.file)) findings.push(finding('AR-CONFIG-006', 'medium', 'WARN', 'Development URL auto-update is enabled', 'The configuration enables Shopify CLI URL mutation in a non-obvious production configuration.', 'Keep automatic development URL updates isolated to development configuration.', c.file, lineOf(t, 'automatically_update_urls_on_dev'), 'medium'));
    if (!/api_version\s*=/.test(t) && /webhooks\s*=|\[webhooks\./.test(t)) findings.push(finding('AR-CONFIG-007', 'low', 'NEEDS_REVIEW', 'Webhook API version is not evident', 'Webhook configuration exists but no explicit API version was detected.', 'Confirm the configured version against current Shopify documentation.', c.file, undefined, 'medium', source.webhooks));
    for (const topic of TOPICS) if (!t.includes(topic)) findings.push(finding('AR-COMPLIANCE-001', 'high', 'FAIL', `Mandatory compliance topic is not configured: ${topic}`, 'Shopify requires App Store distributed apps to subscribe to the three compliance topics.', 'Add the topic to Shopify app configuration and implement its handler.', c.file, undefined, 'high', source.submit));
  }
  const text = allText(files); const code = files.filter(f => !CONFIG.test(f.file));
  const compliance = TOPICS.filter(topic => hasAny(code, new RegExp(topic.replace('/', '[/:._-]'), 'i')));
  for (const topic of TOPICS) if (compliance.includes(topic)) findings.push(finding('AR-COMPLIANCE-002', 'medium', 'NEEDS_REVIEW', `Compliance handler evidence found for ${topic}`, 'A topic-like route or handler was detected, but static analysis cannot prove runtime routing, authentication, or deletion semantics.', 'repository', undefined, 'medium', source.privacy));
  const webhook = /webhook|X-Shopify-Hmac-SHA256|shopify\.webhooks/i.test(text);
  if (webhook && !/X-Shopify-Hmac-SHA256|authenticate\.webhook|validateWebhook|verify.*hmac/i.test(text)) findings.push(finding('AR-WEBHOOK-001', 'high', 'NEEDS_REVIEW', 'Webhook authentication evidence was not found', 'Webhook-related code exists without a recognizable Shopify verification helper or HMAC check.', 'Verify every delivery using the official framework helper or the raw-body HMAC procedure.', 'repository', undefined, 'medium', source.webhooks));
  if (webhook && /express\.json\s*\(\)|bodyParser\.json\s*\(\)/.test(text) && !/rawBody|verify\s*[:=]/.test(text)) findings.push(finding('AR-WEBHOOK-002', 'high', 'WARN', 'Raw-body handling may occur after body parsing', 'JSON body parsing appears alongside webhook code without recognizable raw-body capture.', 'Capture the raw request body before parsing and verify the HMAC against it.', 'repository', undefined, 'medium', source.webhooks));
  if (webhook && /===\s*(?:expected|signature)|signature\s*===|==\s*signature/.test(text) && !/timingSafeEqual/i.test(text)) findings.push(finding('AR-WEBHOOK-003', 'medium', 'WARN', 'Non-timing-safe signature comparison detected', 'A direct signature comparison appears in webhook-related code.', 'Use the official verifier or a timing-safe comparison after decoding both signatures.', 'repository', undefined, 'medium', source.webhooks));
  if (webhook && !/X-Shopify-Webhook-Id|idempoten|dedup|duplicate/i.test(text)) findings.push(finding('AR-WEBHOOK-004', 'low', 'NEEDS_REVIEW', 'Duplicate delivery handling is not evident', 'Shopify may retry deliveries; no recognizable idempotency or webhook ID handling was found.', 'Use idempotent processing or persist X-Shopify-Webhook-Id before processing.', 'repository', undefined, 'medium', source.webhooks));
  const embedded = cs.some(c => /embedded\s*=\s*true/i.test(c.text));
  if (embedded && !/session token|sessionToken|id_token|token.exchange|token-exchange|authenticate\./i.test(text)) findings.push(finding('AR-AUTH-001', 'high', 'NEEDS_REVIEW', 'Embedded authentication evidence is not evident', 'The app is configured as embedded but no recognizable session-token or token-exchange pattern was found.', 'Verify embedded requests with Shopify-supported authentication helpers and session tokens.', 'repository', undefined, 'medium', source.auth));
  if (/X-Shopify-Access-Token|admin\/api|graphql\.json/i.test(text) && !/authenticate|session|token.exchange|accessToken/i.test(text)) findings.push(finding('AR-AUTH-002', 'high', 'NEEDS_REVIEW', 'Admin API access may be unauthenticated', 'Admin API-like requests were found without nearby authentication evidence.', 'Trace the request path and require authenticated Shopify credentials server-side.', 'repository', undefined, 'low', source.auth));
  if (/(api_secret|client_secret|access_token|admin_api_access_token)\s*[:=]\s*["'][^"']{12,}/i.test(text) || /shpat_[a-z0-9]+/i.test(text)) findings.push(finding('AR-AUTH-004', 'high', 'FAIL', 'Potential hardcoded Shopify credential', 'A credential-like assignment or Shopify access-token pattern was detected. The value is intentionally not printed.', 'Remove the credential, rotate it, and load secrets from the deployment secret store.', 'repository', undefined, 'high', source.auth));
  for (const f of files) if (/^\.env(?:\.|$)/i.test(path.basename(f.file)) && !/^\.env\.example$/i.test(path.basename(f.file))) findings.push(finding('AR-SECURITY-001', 'high', 'NEEDS_REVIEW', 'Environment file is present in the scanned repository', 'Environment files commonly contain credentials; static analysis cannot determine whether this file is committed or sanitized.', 'Ensure secret-bearing environment files are ignored and never committed.', f.file, undefined, 'medium', source.requirements));
  if (/child_process\.(?:exec|execSync|spawn)|eval\s*\(/.test(text)) findings.push(finding('AR-SECURITY-002', 'medium', 'NEEDS_REVIEW', 'Dynamic execution requires security review', 'A command execution or eval-like pattern was found; this tool does not replace CodeQL or a full SAST review.', 'Review inputs, trust boundaries, and use CodeQL/Semgrep for deeper analysis.', 'repository', undefined, 'medium', source.requirements));
  if (/customer|order|email|phone|address|Customer|Order/i.test(text)) findings.push(finding('AR-DATA-001', 'medium', 'NEEDS_REVIEW', 'Protected customer data signals detected', 'Customer, order, or contact-data patterns appear in the repository.', 'Verify protected-data access status, privacy disclosures, retention, and listing requirements in Partner Dashboard.', 'repository', undefined, 'low', source.privacy));
  if (/billing|recurringApplicationCharge|appSubscription|oneTimePurchase|createAppSubscription/i.test(text)) findings.push(finding('AR-BILLING-001', 'medium', 'NEEDS_REVIEW', 'Billing implementation detected', 'Billing code is present, but static analysis cannot prove approval, decline, reinstall, or plan-change lifecycle behaviour.', 'Test the complete billing lifecycle and verify pricing/listing declarations.', 'repository', undefined, 'medium', source.requirements));
  if (/REST Admin API|admin\/api\/\d{4}-\d{2}/i.test(text)) findings.push(finding('AR-API-004', 'low', 'NEEDS_REVIEW', 'REST Admin API usage requires review', 'REST Admin API references were found. This is a review signal, not an upgrade analysis.', 'Confirm the API choice and current Shopify guidance; use Shopify Upgrade Guard for migration analysis.', 'repository', undefined, 'medium', source.requirements));
  const m = manifest(repo);
  if (!m) for (const item of ['privacyPolicyUrl', 'supportUrl', 'testInstructions', 'emergencyContact']) findings.push(manual(`AR-LISTING-${item.toUpperCase()}`, `Listing item requires manual verification: ${item}`, 'This item is controlled by Shopify Partner Dashboard or listing content, not repository code.', 'Verify it in the App Store review checklist and Partner Dashboard.'));
  else if (!m.value) findings.push(finding('AR-LISTING-001', 'low', 'WARN', 'Listing manifest could not be parsed', 'The optional manifest exists but is not valid JSON/YAML supported by this version.', 'Fix the manifest or remove it; unchecked listing items remain manual.', m.file, undefined, 'high', source.submit));
  else for (const [key, value] of Object.entries(m.value.listing || {})) if (value !== true) findings.push(manual(`AR-LISTING-${key.toUpperCase()}`, `Listing item requires manual verification: ${key}`, 'The manifest explicitly leaves this external requirement unchecked.', 'Verify it in the Shopify Partner Dashboard.'));
  if (options.showUnmapped && files.some(f => /shopify/i.test(f.text))) findings.push(finding('AR-REVIEW-001', 'low', 'UNKNOWN', 'Some Shopify behaviour may be outside supported static patterns', 'Static analysis cannot understand every framework abstraction or runtime path.', 'Review UNKNOWN/NEEDS_REVIEW items and use runtime testing before submission.', 'repository', undefined, 'low', source.submit));
  findings.sort((a, b) => `${a.ruleId}:${a.file}`.localeCompare(`${b.ruleId}:${b.file}`));
  const counts = Object.fromEntries(['PASS', 'FAIL', 'WARN', 'NEEDS_REVIEW', 'UNKNOWN', 'SKIPPED'].map(s => [s, findings.filter(f => f.status === s).length]));
  return { toolVersion: '0.1.0', evidenceVersion: EVIDENCE_VERSION, target: 'Shopify App Store / production readiness', root: repo, summary: { ...counts, findingCount: findings.length }, findings, manualChecks: findings.filter(f => f.status === 'NEEDS_REVIEW').map(f => f.ruleId), skipped: [] };
}
