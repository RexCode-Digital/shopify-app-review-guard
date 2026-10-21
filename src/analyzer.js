import { TOOL_VERSION } from './version.js';
import fs from 'node:fs';
import path from 'node:path';
import TOML from '@iarna/toml';
import { readFiles, safeFile } from './files.js';
import { codeFiles, reviewDeliveries } from './webhook-review.js';
import { classifyAgainstBaseline, loadBaseline } from './baseline.js';

export const EVIDENCE_VERSION = '2026-10';
const CONFIG = /shopify\.app(?:\.[^./]+)?\.toml$/;
const SKIP = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.next', 'vendor']);
const TOPICS = ['customers/data_request', 'customers/redact', 'shop/redact'];
const source = {
  requirements: 'https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements',
  submit: 'https://shopify.dev/docs/apps/launch/app-store-review/submit-app-for-review',
  privacy: 'https://shopify.dev/docs/apps/launch/privacy-requirements',
  auth: 'https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens',
  webhooks: 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries',
  events: 'https://shopify.dev/docs/apps/build/events/subscribe',
  appBridge: 'https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements#use-the-latest-version-of-shopify-app-bridge'
};

function finding(ruleId, severity, status, title, rationale, remediation, file, line, confidence = 'medium', evidence = source.requirements) {
  return { ruleId, severity, status, title, rationale, remediation, file, line: line || undefined, confidence, evidence, evidenceVersion: EVIDENCE_VERSION };
}
function lineOf(text, needle) { const i = text.indexOf(needle); return i < 0 ? undefined : text.slice(0, i).split('\n').length; }
function configs(files) { return files.filter(f => CONFIG.test(f.file)); }
function hasAny(files, re) { return files.some(f => re.test(f.text)); }
function allText(files) { return files.map(f => f.text).join('\n'); }
const LISTING_ITEMS = ['privacyPolicyUrl', 'supportUrl', 'testInstructions', 'emergencyContact'];
function manifest(root) {
  const names = ['.app-review-guard.yml', '.app-review-guard.yaml', '.app-review-guard.json'].filter(n => fs.existsSync(path.join(root,n)));
  if (names.length > 1) throw new Error('Multiple listing manifests found; keep one');
  if (!names.length) return null;
  const file = names[0], raw = safeFile(root, path.join(root, file));
  try {
    let value;
    if (file.endsWith('.json')) value = JSON.parse(raw);
    else {
      // A deliberately narrow boolean listing manifest, not arbitrary YAML.
      const lines = raw.split(/\r?\n/).filter(line => line.trim() && !line.trim().startsWith('#'));
      if (lines.shift()?.trim() !== 'listing:') throw new Error();
      const listing = {};
      for (const line of lines) {
        const m = line.match(/^ {2}([A-Za-z0-9_-]+):\s*(true|false)\s*(?:#.*)?$/);
        if (!m || Object.hasOwn(listing, m[1])) throw new Error();
        listing[m[1]] = m[2] === 'true';
      }
      value = { listing };
    }
    if (!value || typeof value !== 'object' || Array.isArray(value) || !value.listing || typeof value.listing !== 'object' || Array.isArray(value.listing) || Object.values(value.listing).some(v => typeof v !== 'boolean')) throw new Error();
    return { file, value };
  } catch { return { file, value: null }; }
}
function parseApp(text) {
  let data;
  try { data = TOML.parse(text); } catch { throw new Error('Invalid Shopify app TOML; contents were not printed'); }
  if (data.application_url !== undefined && typeof data.application_url !== 'string') throw new Error('application_url must be a string');
  if (data.embedded !== undefined && typeof data.embedded !== 'boolean') throw new Error('embedded must be a boolean');
  for (const key of ['auth','webhooks','events','build']) if (data[key] !== undefined && (!data[key] || typeof data[key] !== 'object' || Array.isArray(data[key]))) throw new Error(`${key} must be a table`);
  if (data.auth?.redirect_urls !== undefined && (!Array.isArray(data.auth.redirect_urls) || data.auth.redirect_urls.some(v => typeof v !== 'string'))) throw new Error('auth.redirect_urls must be an array of strings');
  if (data.webhooks?.api_version !== undefined && typeof data.webhooks.api_version !== 'string') throw new Error('webhooks.api_version must be a string');
  if (data.webhooks?.subscriptions !== undefined && !Array.isArray(data.webhooks.subscriptions)) throw new Error('webhooks.subscriptions must be an array of tables');
  for (const subscription of data.webhooks?.subscriptions ?? []) {
    if (!subscription || typeof subscription !== 'object' || Array.isArray(subscription)) throw new Error('Webhook subscription must be a table');
    if (subscription.compliance_topics !== undefined && (!Array.isArray(subscription.compliance_topics) || subscription.compliance_topics.some(v => typeof v !== 'string'))) throw new Error('compliance_topics must be an array of strings');
    if (subscription.uri !== undefined && typeof subscription.uri !== 'string') throw new Error('Webhook uri must be a string');
  }
  if (data.events?.api_version !== undefined && typeof data.events.api_version !== 'string') throw new Error('events.api_version must be a string');
  if (data.events?.subscription !== undefined && !Array.isArray(data.events.subscription)) throw new Error('events.subscription must be an array of tables');
  for (const subscription of data.events?.subscription ?? []) {
    if (!subscription || typeof subscription !== 'object' || Array.isArray(subscription)) throw new Error('Events subscription must be a table');
    for (const key of ['handle','topic','uri','query','query_filter']) if (subscription[key] !== undefined && typeof subscription[key] !== 'string') throw new Error(`Events ${key} must be a string`);
    for (const key of ['actions','triggers']) if (subscription[key] !== undefined && (!Array.isArray(subscription[key]) || subscription[key].some(value => typeof value !== 'string'))) throw new Error(`Events ${key} must be an array of strings`);
  }
  return data;
}
function urlInfo(value) {
  try { const url = new URL(value); const local = ['localhost','127.0.0.1','[::1]'].includes(url.hostname); return { secure: url.protocol === 'https:' && !url.username && !url.password, local: url.protocol === 'http:' && local, development: local || /(?:^|\.)ngrok\.(?:io|app)$/.test(url.hostname) }; }
  catch { return { secure: false, local: false, development: false }; }
}
export function analyze(root = '.', options = {}) {
  let repo = path.resolve(root); let { files, skipped } = readFiles(repo); let cs;
  if (options.config) {
    const selected = path.resolve(repo, options.config), text = safeFile(repo, selected);
    repo = path.dirname(selected); ({ files, skipped } = readFiles(repo));
    cs = [{ file: path.relative(repo, selected).replaceAll(path.sep, '/'), text }];
  } else {
    const discovered = configs(files), appRoots = [...new Set(discovered.map(c => path.dirname(path.join(repo, c.file))))];
    if (appRoots.length > 1) throw new Error('Multiple Shopify app roots were found; pass --path for one app or select a configuration with --config.');
    if (appRoots.length === 1 && appRoots[0] !== repo) { repo = appRoots[0]; ({ files, skipped } = readFiles(repo)); }
    cs = configs(files);
  }
  const findings = [];
  const parsedConfigs = cs.map(c => ({ ...c, data: parseApp(c.text) }));
  if (!cs.length) findings.push(finding('AR-CONFIG-001', 'high', 'FAIL', 'Shopify app configuration was not found', 'No shopify.app*.toml file was discovered.', 'Add and validate the Shopify CLI app configuration for the intended deployment.', 'repository', undefined, 'high'));
  for (const c of parsedConfigs) {
    const t = c.text; const url = c.data.application_url;
    if (!url) findings.push(finding('AR-CONFIG-002', 'high', 'FAIL', 'Application URL is missing', 'The configuration does not declare application_url.', 'Set a production HTTPS application_url in the deployed app configuration.', c.file, undefined, 'high'));
    else if (!urlInfo(url).secure && !urlInfo(url).local) findings.push(finding('AR-CONFIG-002', 'high', 'FAIL', 'Application URL is not HTTPS', 'A non-local application URL uses an insecure scheme.', 'Use an HTTPS application URL for production.', c.file, lineOf(t, 'application_url'), 'high'));
    if (urlInfo(url).development && !/development|dev/i.test(c.file)) findings.push(finding('AR-CONFIG-003', 'medium', 'WARN', 'Development URL appears in app configuration', 'The URL looks like a local or tunnel endpoint.', 'Confirm this is intentionally a development configuration and do not submit it as production.', c.file, lineOf(t, 'application_url'), 'high'));
    const redirects = c.data.auth?.redirect_urls ?? [];
    if (redirects.some(value => !urlInfo(value).secure && !urlInfo(value).local)) findings.push(finding('AR-CONFIG-004', 'high', 'FAIL', 'OAuth redirect URL is not HTTPS', 'A non-local redirect URL uses HTTP.', 'Use HTTPS redirect URLs outside local development.', c.file, lineOf(t, 'http://'), 'high'));
    if (c.data.build?.automatically_update_urls_on_dev === true && !/development|dev/i.test(c.file)) findings.push(finding('AR-CONFIG-006', 'medium', 'WARN', 'Development URL auto-update is enabled', 'The configuration enables Shopify CLI URL mutation in a non-obvious production configuration.', 'Keep automatic development URL updates isolated to development configuration.', c.file, lineOf(t, 'automatically_update_urls_on_dev'), 'medium'));
    if (c.data.webhooks && !c.data.webhooks.api_version) findings.push(finding('AR-CONFIG-007', 'low', 'NEEDS_REVIEW', 'Webhook API version is not evident', 'Webhook configuration exists but no explicit API version was detected.', 'Confirm the configured version against current Shopify documentation.', c.file, undefined, 'medium', source.webhooks));
    for (const topic of TOPICS) if (!(c.data.webhooks?.subscriptions ?? []).some(s => s.compliance_topics?.includes(topic) && typeof s.uri === 'string' && s.uri.trim())) findings.push(finding('AR-COMPLIANCE-001', 'high', 'FAIL', `Mandatory compliance topic is not configured: ${topic}`, 'Shopify requires App Store distributed apps to subscribe to the three compliance topics.', 'Add the topic to Shopify app configuration and implement its handler.', c.file, undefined, 'high', source.submit));
  }
  const code = codeFiles(files);
  const text = allText(code), credentialText = allText(files);
  const compliance = TOPICS.filter(topic => hasAny(code, new RegExp(topic.replace('/', '[/:._-]'), 'i')));
  for (const topic of TOPICS) if (compliance.includes(topic)) findings.push(finding('AR-COMPLIANCE-002', 'medium', 'NEEDS_REVIEW', `Compliance handler evidence found for ${topic}`, 'A topic-like route or handler was detected, but static analysis cannot prove runtime routing, authentication, or deletion semantics.', 'Verify routing, Shopify delivery authentication, and the handler response/retention behaviour.', 'repository', undefined, 'medium', source.privacy));
  const deliveryEndpoints = [];
  for (const config of parsedConfigs) {
    const subscriptions = config.data.events?.subscription ?? [];
    if (subscriptions.some(subscription => subscription.query) && !config.data.events?.api_version) findings.push(finding('AR-EVENTS-001', 'medium', 'NEEDS_REVIEW', 'Events query API version is not explicit', 'An Events subscription defines a GraphQL query but the [events].api_version used to validate and run it is not visible.', 'Set [events].api_version and validate the query against that Shopify API version.', config.file, undefined, 'high', source.events));
    for (let i = 0; i < subscriptions.length; i++) {
      const subscription = subscriptions[i], label = `Events subscription ${i + 1}`;
      if (!subscription.handle || !subscription.topic || !subscription.actions?.length || !subscription.uri) findings.push(finding('AR-EVENTS-002', 'high', 'WARN', `${label} is missing a required field`, 'Shopify Events subscriptions require a handle, topic, action, and delivery URI.', 'Complete the required subscription fields and validate them with the supported Shopify CLI.', config.file, undefined, 'high', source.events));
      if (subscription.actions?.includes('update') && !subscription.triggers?.length) findings.push(finding('AR-EVENTS-002', 'high', 'WARN', `${label} update triggers are missing`, 'Shopify requires triggers when an Events subscription includes the update action.', 'Add the field paths that should trigger update deliveries.', config.file, undefined, 'high', source.events));
      if (subscription.query_filter && !subscription.query) findings.push(finding('AR-EVENTS-003', 'medium', 'WARN', `${label} filter has no query`, 'Shopify evaluates query_filter against the result of the configured query.', 'Add the required GraphQL query or remove the filter.', config.file, undefined, 'high', source.events));
      deliveryEndpoints.push({ uri: subscription.uri, kind: 'events', file: config.file, applicationUrl: config.data.application_url });
    }
    const classic = config.data.webhooks?.subscriptions ?? [];
    for (const subscription of classic) deliveryEndpoints.push({ uri: subscription.uri, kind: 'webhook', file: config.file, applicationUrl: config.data.application_url });
  }
  findings.push(...reviewDeliveries({ files: code, endpoints: deliveryEndpoints }));
  const embedded = parsedConfigs.some(c => c.data.embedded === true);
  if (embedded && !/session token|sessionToken|id_token|token.exchange|token-exchange|authenticate\./i.test(text)) findings.push(finding('AR-AUTH-001', 'high', 'NEEDS_REVIEW', 'Embedded authentication evidence is not evident', 'The app is configured as embedded but no recognizable session-token or token-exchange pattern was found.', 'Verify embedded requests with Shopify-supported authentication helpers and session tokens.', 'repository', undefined, 'medium', source.auth));
  if (embedded && !hasLatestAppBridgeScript(files)) findings.push(finding('AR-APP-BRIDGE-001', 'medium', 'NEEDS_REVIEW', 'Latest App Bridge script evidence is not visible', 'The app is configured as embedded, but no recognizable latest app-bridge.js script tag was found in scanned HTML or JSX. A framework may inject the script at runtime, which static analysis cannot determine.', 'Verify that the latest Shopify App Bridge script is loaded before other scripts in every embedded document.', 'repository', undefined, 'medium', source.appBridge));
  if (/X-Shopify-Access-Token|admin\/api|graphql\.json/i.test(text) && !/authenticate|session|token.exchange|accessToken/i.test(text)) findings.push(finding('AR-AUTH-002', 'high', 'NEEDS_REVIEW', 'Admin API access may be unauthenticated', 'Admin API-like requests were found without nearby authentication evidence.', 'Trace the request path and require authenticated Shopify credentials server-side.', 'repository', undefined, 'low', source.auth));
  if (/(api_secret|client_secret|access_token|admin_api_access_token)\s*[:=]\s*["'][^"']{12,}/i.test(credentialText) || /shpat_[a-z0-9]+/i.test(credentialText)) findings.push(finding('AR-AUTH-004', 'high', 'FAIL', 'Potential hardcoded Shopify credential', 'A credential-like assignment or Shopify access-token pattern was detected. The value is intentionally not printed.', 'Remove the credential, rotate it, and load secrets from the deployment secret store.', 'repository', undefined, 'high', source.auth));
  for (const f of files) if (/^\.env(?:\.|$)/i.test(path.basename(f.file)) && !/^\.env\.example$/i.test(path.basename(f.file))) findings.push(finding('AR-SECURITY-001', 'high', 'NEEDS_REVIEW', 'Environment file is present in the scanned repository', 'Environment files commonly contain credentials; static analysis cannot determine whether this file is committed or sanitized.', 'Ensure secret-bearing environment files are ignored and never committed.', f.file, undefined, 'medium', source.requirements));
  if (/child_process\.(?:exec|execSync|spawn)|eval\s*\(/.test(text)) findings.push(finding('AR-SECURITY-002', 'medium', 'NEEDS_REVIEW', 'Dynamic execution requires security review', 'A command execution or eval-like pattern was found; this tool does not replace CodeQL or a full SAST review.', 'Review inputs, trust boundaries, and use CodeQL/Semgrep for deeper analysis.', 'repository', undefined, 'medium', source.requirements));
  if (/customer|order|email|phone|address|Customer|Order/i.test(text)) findings.push(finding('AR-DATA-001', 'medium', 'NEEDS_REVIEW', 'Protected customer data signals detected', 'Customer, order, or contact-data patterns appear in the repository.', 'Verify protected-data access status, privacy disclosures, retention, and listing requirements in Partner Dashboard.', 'repository', undefined, 'low', source.privacy));
  if (/billing|recurringApplicationCharge|appSubscription|oneTimePurchase|createAppSubscription/i.test(text)) findings.push(finding('AR-BILLING-001', 'medium', 'NEEDS_REVIEW', 'Billing implementation detected', 'Billing code is present, but static analysis cannot prove approval, decline, reinstall, or plan-change lifecycle behaviour.', 'Test the complete billing lifecycle and verify pricing/listing declarations.', 'repository', undefined, 'medium', source.requirements));
  if (/REST Admin API|admin\/api\/\d{4}-\d{2}/i.test(text)) findings.push(finding('AR-API-004', 'low', 'NEEDS_REVIEW', 'REST Admin API usage requires review', 'REST Admin API references were found. This is a review signal, not an upgrade analysis.', 'Confirm the API choice and current Shopify guidance; use Shopify Upgrade Guard for migration analysis.', 'repository', undefined, 'medium', source.requirements));
  const m = manifest(repo);
  if (m && !m.value) findings.push(finding('AR-LISTING-001', 'low', 'WARN', 'Listing manifest could not be parsed', 'The optional manifest is not valid supported JSON/YAML.', 'Fix the manifest; all unverified listing requirements remain manual.', m.file, undefined, 'high', source.submit));
  for (const item of LISTING_ITEMS) {
    const declared = m?.value?.listing?.[item] === true;
    findings.push(finding(`AR-LISTING-${item.toUpperCase()}`, 'medium', 'NEEDS_REVIEW', `Listing item requires manual verification: ${item}`, declared ? 'The optional manifest records this item as declared, but the scanner cannot verify its accuracy or Partner Dashboard state.' : 'No affirmative declaration was found for this external listing requirement.', 'Verify the item against the published listing and current Partner Dashboard state.', m?.file ?? '.app-review-guard.yml', undefined, 'manual', source.submit));
  }
  if (options.showUnmapped && files.some(f => /shopify/i.test(f.text))) findings.push(finding('AR-REVIEW-001', 'low', 'UNKNOWN', 'Some Shopify behaviour may be outside supported static patterns', 'Static analysis cannot understand every framework abstraction or runtime path.', 'Review UNKNOWN/NEEDS_REVIEW items and use runtime testing before submission.', 'repository', undefined, 'low', source.submit));
  findings.sort((a, b) => `${a.ruleId}:${a.file}:${a.title}`.localeCompare(`${b.ruleId}:${b.file}:${b.title}`));
  const baseline = options.baseline === false ? null : loadBaseline(repo, options.baseline);
  const comparison = classifyAgainstBaseline(findings, baseline), reportFindings = comparison.findings;
  const counts = Object.fromEntries(['PASS', 'FAIL', 'WARN', 'NEEDS_REVIEW', 'UNKNOWN', 'SKIPPED'].map(s => [s, reportFindings.filter(f => f.status === s).length]));
  return { toolVersion: TOOL_VERSION, evidenceVersion: EVIDENCE_VERSION, target: 'Shopify App Store / production readiness', root: repo, configurations: parsedConfigs.map(config => config.file), summary: { ...counts, findingCount: reportFindings.length, newFindingCount: reportFindings.filter(f => f.lifecycle === 'NEW').length, resolvedFindingCount: comparison.resolvedFindings.length }, findings: reportFindings, resolvedFindings: comparison.resolvedFindings, baseline: { enabled: comparison.enabled, file: baseline?.file ?? null }, manualChecks: reportFindings.filter(f => f.status === 'NEEDS_REVIEW').map(f => f.ruleId), skipped };
}

function hasLatestAppBridgeScript(files) {
  return files.some(file => {
    if (!/\.(?:html?|[jt]sx)$/i.test(file.file)) return false;
    const pattern = /<script\b[^>]*\bsrc\s*=\s*(["'])https:\/\/cdn\.shopify\.com\/shopifycloud\/app-bridge\.js\1[^>]*>/gi;
    for (const match of file.text.matchAll(pattern)) {
      if (!insideComment(file.text, match.index)) return true;
    }
    return false;
  });
}

function insideComment(source, index) {
  if (source.lastIndexOf('<!--', index) > source.lastIndexOf('-->', index)) return true;
  if (source.lastIndexOf('/*', index) > source.lastIndexOf('*/', index)) return true;
  const lineStart = source.lastIndexOf('\n', index - 1) + 1;
  const prefix = source.slice(lineStart, index);
  const marker = prefix.lastIndexOf('//');
  if (marker < 0) return false;
  const before = prefix.slice(0, marker);
  return before.trim() === '' || /[;{}]\s*$/.test(before);
}
