const CODE = /\.(?:[cm]?[jt]sx?|graphql|gql)$/i;

export function maskComments(text) {
  let out = '', quote = '', escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (quote) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; out += ch; continue; }
    if (ch === '/' && next === '/') {
      out += '  '; i++;
      while (i + 1 < text.length && text[i + 1] !== '\n') { out += ' '; i++; }
      continue;
    }
    if (ch === '/' && next === '*') {
      out += '  '; i++;
      while (i + 1 < text.length && !(text[i] === '*' && text[i + 1] === '/')) { out += text[i] === '\n' ? '\n' : ' '; i++; }
      if (i + 1 < text.length) { out += '  '; i++; }
      continue;
    }
    out += ch;
  }
  return out;
}

export function classifyDestination(uri, applicationUrl) {
  if (typeof uri !== 'string' || !uri.trim()) return { transport: 'unknown', pathname: null };
  const value = uri.trim();
  if (/^arn:aws(?:-us-gov|-cn)?:events:[^:]+:\d{12}:event-bus\//i.test(value)) return { transport: 'eventbridge', pathname: null };
  if (/^(?:pubsub|googlepubsub|gcp-pubsub):\/\//i.test(value)) return { transport: 'pubsub', pathname: null };
  try {
    const url = new URL(value, applicationUrl);
    if (url.protocol === 'https:' && !url.username && !url.password) return { transport: 'https', pathname: cleanPath(url.pathname) };
    if (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return { transport: 'development', pathname: cleanPath(url.pathname) };
  } catch { /* A computed or unsupported destination cannot establish the transport. */ }
  return { transport: 'unknown', pathname: null };
}

function cleanPath(value) { const normalized = `/${String(value).split('/').filter(Boolean).join('/')}`; return normalized === '/' ? '/' : normalized; }

export function routeCandidates(files) {
  const candidates = [];
  for (const file of files) {
    if (!CODE.test(file.file)) continue;
    const source = maskComments(file.text);
    const found = new Map();
    const matcher = /\b(?:app|router|server|fastify|webhookRouter)\s*\.\s*(?:post|route)\s*\(\s*(['"`])([^'"`]+)\1/g;
    for (const match of source.matchAll(matcher)) if (!/[${}]/.test(match[2])) found.set(cleanPath(match[2]), source.slice(0, match.index).split('\n').length);
    const routeFile = frameworkRoute(file.file, source);
    if (routeFile) found.set(routeFile, source.slice(0, source.indexOf('export')).split('\n').length);
    for (const [route, line] of found) candidates.push({ file: file.file, route, source, line });
  }
  return candidates;
}

function frameworkRoute(file, source) {
  if (!/\bexport\s+(?:const|async\s+function)\s+action\b/.test(source)) return null;
  const normalized = file.replaceAll('\\', '/');
  const match = normalized.match(/(?:^|\/)app\/routes\/(.+)\.(?:[cm]?[jt]sx?)$/i);
  if (!match) return null;
  let route = match[1].replaceAll('.', '/').replace(/\([^/]+\)\//g, '').replace(/^_+|_+$/g, '');
  route = route.split('/').filter(Boolean).map(part => part.startsWith('$') ? ':' + part.slice(1) : part).join('/');
  return cleanPath(route);
}

function matchesRoute(pattern, actual) {
  if (!pattern || !actual) return false;
  const escaped = pattern.split('/').map(part => part.startsWith(':') || part === '*' ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('/');
  return new RegExp(`^${escaped}/?$`).test(actual);
}

function routeAuth(source, allSource) {
  const reactRouter = /\bauthenticate\s*\.\s*webhook\s*\(/.test(source) && /@shopify\/shopify-app-(?:react-router|remix)\/server/.test(allSource);
  const apiLibrary = /\b(?:shopify\s*\.\s*)?webhooks\s*\.\s*validate\s*\(/.test(source) && /@shopify\/shopify-api/.test(allSource);
  const manualHmac = /(?:x-shopify-hmac-sha256|shopify-hmac-sha256)/i.test(source)
    && /createHmac\s*\(\s*['"]sha256['"]/.test(source)
    && /\.update\s*\(\s*(?:rawBody|rawRequestBody|req\.(?:rawBody|body)|request\.(?:rawBody|body))/i.test(source)
    && /timingSafeEqual\s*\(/i.test(source);
  return reactRouter || apiLibrary || manualHmac;
}

export function reviewDeliveries({ files, endpoints, applicationUrl, allSource }) {
  const candidates = routeCandidates(files), findings = [];
  const deliveries = endpoints.length ? endpoints : candidates
    .filter(candidate => /webhook|events/i.test(candidate.route) || /authenticate\s*\.\s*webhook|x-shopify-(?:hmac|webhook)|shopify-hmac-sha256/i.test(candidate.source))
    .map(candidate => ({ uri: candidate.route, kind: 'inferred' }));
  for (let i = 0; i < deliveries.length; i++) {
    const delivery = deliveries[i], destination = classifyDestination(delivery.uri, delivery.applicationUrl ?? applicationUrl);
    if (destination.transport === 'eventbridge' || destination.transport === 'pubsub') {
      findings.push({ ruleId: 'AR-EVENTS-004', severity: 'medium', status: 'NEEDS_REVIEW', title: 'Cloud event destination requires provider-side review', rationale: 'Shopify does not require HTTPS HMAC verification for EventBridge or Pub/Sub deliveries; static repository analysis cannot verify the cloud resource policy or delivery identity.', remediation: 'Verify the event bus resource policy, consumer identity, retry handling, and idempotent processing in the cloud provider.', file: delivery.file ?? 'repository', confidence: 'manual', evidence: 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries' });
      findings.push({ ruleId: 'AR-WEBHOOK-004', severity: 'low', status: 'NEEDS_REVIEW', title: 'Duplicate-delivery handling requires provider route review', rationale: 'Cloud event deliveries can be retried; static repository analysis cannot associate the destination with one consumer handler.', remediation: 'Verify that the consumer processes duplicate messages idempotently.', file: delivery.file ?? 'repository', confidence: 'manual', evidence: 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries' });
      continue;
    }
    if (!['https', 'development'].includes(destination.transport)) {
      findings.push({ ruleId: 'AR-WEBHOOK-001', severity: 'high', status: 'NEEDS_REVIEW', title: 'Delivery authentication requires route review', rationale: 'The configured delivery transport or route could not be associated with a statically recognised HTTPS handler.', remediation: 'Confirm the delivery transport and verify the specific handler with Shopify’s supported framework helper or raw-body HMAC procedure.', file: delivery.file ?? 'repository', confidence: 'low', evidence: 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries' });
      continue;
    }
    const matched = destination.pathname ? candidates.filter(candidate => matchesRoute(candidate.route, destination.pathname)) : [];
    const uniqueFiles = new Set(matched.map(candidate => candidate.file));
    const associated = matched.length === 1 && uniqueFiles.size === 1 && candidates.filter(item => item.file === matched[0].file).length === 1 ? matched[0] : null;
    if (!associated || !routeAuth(associated.source, allSource)) {
      findings.push({ ruleId: 'AR-WEBHOOK-001', severity: 'high', status: 'NEEDS_REVIEW', title: 'Delivery authentication evidence is not linked to this route', rationale: 'A configured HTTPS delivery could not be connected to one route with a recognised Shopify verifier. Evidence in another handler does not cover this destination.', remediation: 'Trace this route to its handler and verify each HTTPS delivery with Shopify’s framework helper or raw-body HMAC procedure.', file: associated?.file ?? delivery.file ?? 'repository', line: associated?.line, confidence: associated ? 'medium' : 'low', evidence: 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries' });
    } else {
      findings.push({ ruleId: 'AR-WEBHOOK-001', severity: 'info', status: 'PASS', title: 'Recognisable delivery verifier is present on the matched route', rationale: 'A Shopify framework verifier or raw-body HMAC pattern was found on the one statically matched route. This is source evidence, not runtime verification.', remediation: 'Confirm the deployed route uses this handler and the expected secret.', file: associated.file, line: associated.line, confidence: 'medium', evidence: 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries' });
    }
    const routeSource = associated?.source ?? '';
    if (associated && /(?:shopify-webhook-id|x-shopify-webhook-id|idempoten|dedup|duplicate)/i.test(routeSource)) {
      findings.push({ ruleId: 'AR-WEBHOOK-004', severity: 'info', status: 'PASS', title: 'Duplicate-delivery handling signal is present on the matched route', rationale: 'An idempotency or delivery-ID pattern is present on this route; the persistent behaviour cannot be proven statically.', remediation: 'Verify retries remain safe against the production data store.', file: associated.file, line: associated.line, confidence: 'medium', evidence: 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries' });
    } else {
      findings.push({ ruleId: 'AR-WEBHOOK-004', severity: 'low', status: 'NEEDS_REVIEW', title: 'Duplicate-delivery handling is not evident on this route', rationale: 'Shopify retries failed deliveries and may deliver an event more than once; no route-local idempotency signal was found.', remediation: 'Verify that processing is idempotent or deduplicates deliveries using Shopify’s delivery ID.', file: associated?.file ?? delivery.file ?? 'repository', line: associated?.line, confidence: associated ? 'medium' : 'low', evidence: 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries' });
    }
    if (associated && /(?:express|bodyParser)\.json\s*\(/.test(routeSource) && !/rawBody|verify\s*[:=]/i.test(routeSource)) {
      findings.push({ ruleId: 'AR-WEBHOOK-002', severity: 'high', status: 'WARN', title: 'JSON parsing may run before this delivery route', rationale: 'A JSON body parser appears before or alongside the matched route without recognisable raw-body capture.', remediation: 'Capture the raw request body before parsing and verify the HMAC against those bytes.', file: associated.file, line: associated.line, confidence: 'medium', evidence: 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries' });
    }
    if (associated && /(?:signature\s*===|===\s*signature|signature\s*==|==\s*signature)/i.test(routeSource) && !/timingSafeEqual/i.test(routeSource)) {
      findings.push({ ruleId: 'AR-WEBHOOK-003', severity: 'medium', status: 'WARN', title: 'Direct signature comparison appears on this route', rationale: 'A direct signature comparison was detected without a timing-safe comparison in the matched route.', remediation: 'Use Shopify’s verifier or a timing-safe comparison after decoding both signatures.', file: associated.file, line: associated.line, confidence: 'medium', evidence: 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries' });
    }
  }
  return findings;
}

export function codeFiles(files) { return files.filter(file => CODE.test(file.file)).map(file => ({ ...file, text: maskComments(file.text) })); }
