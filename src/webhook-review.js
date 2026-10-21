const CODE = /\.(?:[cm]?[jt]sx?|graphql|gql)$/i;
const SOURCE = /\.(?:[cm]?[jt]sx?)$/i;
const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

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

function maskStrings(text) {
  let out = '', quote = '', escaped = false;
  for (const ch of text) {
    if (quote) {
      out += ch === '\n' ? '\n' : ' ';
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = '';
    } else if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch; out += ' ';
    } else out += ch;
  }
  return out;
}

function cleanPath(value) {
  const normalized = `/${String(value).split('/').filter(Boolean).join('/')}`;
  return normalized === '/' ? '/' : normalized;
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

function lineAt(source, index) { return source.slice(0, index).split('\n').length; }

function matchingDelimiter(source, start, open, close) {
  if (source[start] !== open) return -1;
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    if (source[i] === open) depth++;
    else if (source[i] === close && --depth === 0) return i;
  }
  return -1;
}

function skipSpace(source, index) {
  while (index < source.length && /\s/.test(source[index])) index++;
  return index;
}

function functionBody(source, syntax, start, nameEnd) {
  const paramsOpen = syntax.indexOf('(', nameEnd);
  if (paramsOpen < 0) return null;
  const paramsClose = matchingDelimiter(syntax, paramsOpen, '(', ')');
  if (paramsClose < 0) return null;
  let bodyOpen = skipSpace(syntax, paramsClose + 1);
  if (syntax[bodyOpen] === ':') {
    const semicolon = syntax.indexOf(';', bodyOpen);
    bodyOpen = syntax.indexOf('{', bodyOpen);
    if (bodyOpen < 0 || (semicolon >= 0 && semicolon < bodyOpen)) return null;
  }
  if (syntax[bodyOpen] !== '{') return null;
  const bodyClose = matchingDelimiter(syntax, bodyOpen, '{', '}');
  if (bodyClose < 0) return null;
  return { text: source.slice(start, bodyClose + 1), start };
}

function exportedFunction(source, syntax, method) {
  const results = [];
  const pattern = new RegExp(`\\bexport\\s+(?:async\\s+)?function\\s+${method}\\b`, 'g');
  for (const match of syntax.matchAll(pattern)) {
    const result = functionBody(source, syntax, match.index, match.index + match[0].length);
    if (result) results.push(result);
  }
  return results;
}

function exportedArrow(source, syntax, method) {
  const results = [];
  const pattern = new RegExp(`\\bexport\\s+(?:const|let|var)\\s+${method}\\s*=`, 'g');
  for (const match of syntax.matchAll(pattern)) {
    let cursor = skipSpace(syntax, match.index + match[0].length);
    if (/^async\s+function\b/.test(syntax.slice(cursor))) {
      const functionAt = syntax.indexOf('function', cursor), nameEnd = functionAt + 'function'.length;
      const result = functionBody(source, syntax, match.index, nameEnd);
      if (result) results.push(result);
      continue;
    }
    if (syntax.startsWith('function', cursor)) {
      const result = functionBody(source, syntax, match.index, cursor + 'function'.length);
      if (result) results.push(result);
      continue;
    }
    if (/^async\s+\(/.test(syntax.slice(cursor))) cursor = skipSpace(syntax, cursor + 'async'.length);
    let paramsClose;
    if (syntax[cursor] === '(') paramsClose = matchingDelimiter(syntax, cursor, '(', ')');
    else {
      const parameter = syntax.slice(cursor).match(/^[A-Za-z_$][\w$]*/);
      if (parameter) paramsClose = cursor + parameter[0].length - 1;
    }
    if (paramsClose === undefined || paramsClose < 0) continue;
    const arrow = syntax.indexOf('=>', paramsClose + 1);
    if (arrow < 0) continue;
    const bodyOpen = skipSpace(syntax, arrow + 2);
    if (syntax[bodyOpen] !== '{') continue;
    const bodyClose = matchingDelimiter(syntax, bodyOpen, '{', '}');
    if (bodyClose >= 0) results.push({ text: source.slice(match.index, bodyClose + 1), start: match.index });
  }
  return results;
}

function exportedMethod(source, syntax, method) {
  return [...exportedFunction(source, syntax, method), ...exportedArrow(source, syntax, method)];
}

function nextSegments(value) {
  const parts = [];
  const segments = value.split('/').filter(Boolean);
  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index];
    if (/^\([^/]+\)$/.test(segment)) continue; // Route groups do not appear in the URL.
    if (segment.startsWith('@') || /^\((?:\.{1,3})\)/.test(segment)) return null; // Parallel/intercepting routes need explicit review.
    const optionalCatchAll = segment.match(/^\[\[\.\.\.([A-Za-z0-9_-]+)\]\]$/);
    const catchAll = segment.match(/^\[\.\.\.([A-Za-z0-9_-]+)\]$/);
    const dynamic = segment.match(/^\[([A-Za-z0-9_-]+)\]$/);
    if ((optionalCatchAll || catchAll) && index !== segments.length - 1) return null;
    if (optionalCatchAll) parts.push('**');
    else if (catchAll) parts.push('*');
    else if (dynamic) parts.push(`:${dynamic[1]}`);
    else if (segment.includes('[') || segment.includes(']')) return null;
    else parts.push(segment);
  }
  return cleanPath(parts.join('/'));
}

function appRoute(file) {
  if (!SOURCE.test(file)) return null;
  const normalized = file.replaceAll('\\', '/'), parts = normalized.split('/');
  if (!/^route\.(?:js|jsx|ts|tsx)$/i.test(parts.at(-1) ?? '')) return null;
  let appIndex = -1;
  for (let i = 0; i < parts.length - 1; i++) if (parts[i] === 'app') appIndex = i;
  if (appIndex < 0) return null;
  const route = nextSegments(parts.slice(appIndex + 1, -1).join('/'));
  return route === null ? null : { route, rootIndex: appIndex };
}

function pagesApiRoute(file) {
  if (!SOURCE.test(file)) return null;
  const parts = file.replaceAll('\\', '/').split('/');
  if (!/\.(?:js|jsx|ts|tsx)$/i.test(parts.at(-1) ?? '')) return null;
  let apiIndex = -1;
  for (let i = 0; i < parts.length - 1; i++) if (parts[i] === 'pages' && parts[i + 1] === 'api') apiIndex = i + 1;
  if (apiIndex < 0) return null;
  const filename = parts.at(-1).replace(/\.(?:js|jsx|ts|tsx)$/i, '');
  const directories = parts.slice(apiIndex + 1, -1);
  const segments = ['api', ...directories, ...(filename === 'index' ? [] : [filename])];
  const route = nextSegments(segments.join('/'));
  return route === null ? null : { route, rootIndex: apiIndex - 1 };
}

function nextCandidate(file, source, syntax, framework, route, details = {}) {
  return {
    file, route, source, moduleSource: source, framework,
    line: details.handler?.start !== undefined ? lineAt(source, details.handler.start) : 1,
    handlerSource: details.handler?.text ?? '',
    methods: details.methods ?? [],
    handlerKnown: Boolean(details.handler),
    methodSupported: Boolean(details.methodSupported),
    bodyParserDisabled: details.bodyParserDisabled === true,
    bodyParserDefault: details.bodyParserDisabled !== true,
    ambiguousHandler: details.ambiguousHandler === true
  };
}

function appRouteCandidate(file, source, syntax, route) {
  const methods = [...METHODS].filter(method => new RegExp(`\\bexport\\s+(?:async\\s+)?function\\s+${method}\\b|\\bexport\\s+(?:const|let|var)\\s+${method}\\s*=`, 'g').test(syntax));
  const handlers = exportedMethod(source, syntax, 'POST');
  return nextCandidate(file.file, source, syntax, 'next-app-router', route, {
    methods,
    handler: handlers.length === 1 ? handlers[0] : null,
    methodSupported: handlers.length === 1,
    ambiguousHandler: handlers.length > 1
  });
}

function pagesDefaultHandler(source, syntax) {
  const results = [];
  const functionPattern = /\bexport\s+default\s+(?:async\s+)?function\b/g;
  for (const match of syntax.matchAll(functionPattern)) {
    const result = functionBody(source, syntax, match.index, match.index + match[0].length);
    if (result) results.push(result);
  }
  const arrowPattern = /\bexport\s+default\s+(?:async\s+)?(?=\(|[A-Za-z_$])/g;
  for (const match of syntax.matchAll(arrowPattern)) {
    let cursor = skipSpace(syntax, match.index + match[0].length);
    if (/^async\s+/.test(syntax.slice(cursor))) cursor = skipSpace(syntax, cursor + 'async'.length);
    if (/^function\b/.test(syntax.slice(cursor))) continue;
    let paramsClose;
    if (syntax[cursor] === '(') paramsClose = matchingDelimiter(syntax, cursor, '(', ')');
    else {
      const parameter = syntax.slice(cursor).match(/^[A-Za-z_$][\w$]*/);
      if (parameter) paramsClose = cursor + parameter[0].length - 1;
    }
    if (paramsClose === undefined || paramsClose < 0) continue;
    const arrow = syntax.indexOf('=>', paramsClose + 1);
    if (arrow < 0) continue;
    const semicolon = syntax.indexOf(';', paramsClose + 1);
    if (semicolon >= 0 && semicolon < arrow) continue;
    const bodyOpen = skipSpace(syntax, arrow + 2);
    if (syntax[bodyOpen] !== '{') continue;
    const bodyClose = matchingDelimiter(syntax, bodyOpen, '{', '}');
    if (bodyClose >= 0) results.push({ text: source.slice(match.index, bodyClose + 1), start: match.index });
  }
  return results;
}

function pagesBodyParserDisabled(source, syntax) {
  const pattern = /\bexport\s+(?:const|let|var)\s+config\s*=/g;
  for (const match of syntax.matchAll(pattern)) {
    const objectOpen = syntax.indexOf('{', match.index + match[0].length);
    if (objectOpen < 0) continue;
    const objectClose = matchingDelimiter(syntax, objectOpen, '{', '}');
    if (objectClose < 0) continue;
    const config = syntax.slice(objectOpen, objectClose + 1), api = /\bapi\s*:\s*\{/.exec(config);
    if (!api) continue;
    const apiOpen = config.indexOf('{', api.index), apiClose = matchingDelimiter(config, apiOpen, '{', '}');
    if (apiClose >= 0 && /\bbodyParser\s*:\s*false\b/.test(config.slice(apiOpen, apiClose + 1))) return true;
  }
  return false;
}

function pagesHandlerSupportsPost(handler) {
  const source = maskComments(handler), syntax = maskStrings(source);
  const methodChecks = [...syntax.matchAll(/\b(?:req|request)\s*\.\s*method\s*(?:={2,3}|!={1,2})\s*/g)];
  const explicitMethodCheck = methodChecks.length > 0 || [...syntax.matchAll(/\bswitch\s*\(\s*(?:req|request)\s*\.\s*method\s*\)/g)].length > 0;
  if (!explicitMethodCheck) return true;
  for (const match of methodChecks) {
    const literal = source.slice(match.index + match[0].length).match(/^(['"])([A-Z]+)\1/i);
    if (literal?.[2]?.toUpperCase() === 'POST') return true;
  }
  for (const match of syntax.matchAll(/\bswitch\s*\(\s*(?:req|request)\s*\.\s*method\s*\)\s*\{/g)) {
    const open = syntax.indexOf('{', match.index), close = matchingDelimiter(syntax, open, '{', '}');
    if (close < 0) continue;
    const body = syntax.slice(open + 1, close);
    for (const label of body.matchAll(/\bcase\s+/g)) {
      const offset = open + 1 + label.index + label[0].length;
      const literal = source.slice(offset).match(/^(['"])([A-Z]+)\1\s*:/i);
      if (literal?.[2]?.toUpperCase() === 'POST') return true;
    }
  }
  return false;
}

function pagesCandidate(file, source, syntax, route) {
  const handlers = pagesDefaultHandler(source, syntax), bodyParserDisabled = pagesBodyParserDisabled(source, syntax);
  const handler = handlers.length === 1 ? handlers[0] : null;
  return nextCandidate(file.file, source, syntax, 'next-pages-router', route, {
    methods: ['POST'], handler,
    methodSupported: Boolean(handler) && pagesHandlerSupportsPost(handler.text), ambiguousHandler: handlers.length > 1,
    bodyParserDisabled
  });
}

function frameworkRoute(file, source) {
  if (!/\bexport\s+(?:const|async\s+function)\s+action\b/.test(maskStrings(source))) return null;
  const normalized = file.replaceAll('\\', '/');
  const match = normalized.match(/(?:^|\/)app\/routes\/(.+)\.(?:[cm]?[jt]sx?)$/i);
  if (!match) return null;
  let route = match[1].replaceAll('.', '/').replace(/\([^/]+\)\//g, '').replace(/^_+|_+$/g, '');
  route = route.split('/').filter(Boolean).map(part => part.startsWith('$') ? ':' + part.slice(1) : part).join('/');
  return cleanPath(route);
}

function routeCandidates(files) {
  const candidates = [];
  for (const file of files) {
    if (!CODE.test(file.file)) continue;
    const source = maskComments(file.text), syntax = maskStrings(source);
    const app = appRoute(file.file);
    if (app) candidates.push(appRouteCandidate(file, source, syntax, app.route));
    const pages = pagesApiRoute(file.file);
    if (pages) candidates.push(pagesCandidate(file, source, syntax, pages.route));

    const express = /\b(?:app|router|server|fastify|webhookRouter)\s*\.\s*(?:post|route)\s*\(/g;
    for (const match of syntax.matchAll(express)) {
      const open = syntax.indexOf('(', match.index), literal = source.slice(open + 1).match(/^\s*(['"`])([^'"`]+)\1/);
      if (!literal || /[${}]/.test(literal[2])) continue;
      const routeMatch = { index: match.index };
      const close = matchingDelimiter(syntax, open, '(', ')');
      if (close < 0) continue;
      candidates.push({ file: file.file, route: cleanPath(literal[2]), source, moduleSource: source,
        handlerSource: expressHandlerSource(source, syntax, routeMatch, open, close), line: lineAt(source, match.index), framework: 'express',
        registrationOffset: match.index, methods: ['POST'], methodSupported: true, handlerKnown: true, bodyParserDefault: false, bodyParserDisabled: false });
    }

    const routeFile = frameworkRoute(file.file, source);
    if (routeFile) candidates.push({ file: file.file, route: routeFile, source, moduleSource: source,
      handlerSource: source, line: 1, framework: 'remix', methods: ['POST'], methodSupported: true,
      handlerKnown: true, bodyParserDefault: false, bodyParserDisabled: false });
  }
  return candidates;
}

function matchesRoute(pattern, actual) {
  if (!pattern || !actual) return false;
  const parts = pattern.split('/').filter(Boolean);
  let source = '^';
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === '**') { source += '(?:/.*)?'; continue; }
    if (part === '*') { source += '/.+(?:/.*)?'; continue; }
    source += '/';
    if (part.startsWith(':')) source += '[^/]+';
    else source += part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  source += '/?$';
  return new RegExp(source).test(cleanPath(actual));
}

function pageRawBodyConfig(route) {
  if (route.framework !== 'next-pages-router') return true;
  const handler = route.handlerSource ?? '';
  const readsRawStream = /for\s+await\s*\([^)]*\s+of\s+req\b/.test(handler)
    || /\breq\s*\.\s*on\s*\(\s*['"]data['"]/.test(handler);
  return route.bodyParserDisabled && readsRawStream;
}

function pagesRawBodyInput(handler) {
  const source = maskComments(handler), syntax = maskStrings(source), chunkArrays = new Set();
  for (const declaration of syntax.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\[\s*\]/g)) chunkArrays.add(declaration[1]);
  const streamChunks = new Set();
  for (const loop of syntax.matchAll(/\bfor\s+await\s*\(\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s+of\s+req\s*\)/g)) {
    const chunk = loop[1], open = syntax.indexOf('(', loop.index), close = matchingDelimiter(syntax, open, '(', ')');
    if (close < 0) continue;
    const bodyStart = skipSpace(syntax, close + 1);
    let bodyEnd;
    if (syntax[bodyStart] === '{') {
      const blockEnd = matchingDelimiter(syntax, bodyStart, '{', '}');
      if (blockEnd < 0) continue;
      bodyEnd = blockEnd;
    } else {
      const semicolon = syntax.indexOf(';', bodyStart), newline = syntax.indexOf('\n', bodyStart);
      bodyEnd = [semicolon, newline].filter(index => index >= 0).sort((a, b) => a - b)[0] ?? syntax.length;
    }
    const body = syntax.slice(bodyStart, bodyEnd);
    for (const array of chunkArrays) if (new RegExp(`\\b${array}\\s*\\.\\s*push\\s*\\(\\s*(?:Buffer\\s*\\.\\s*from\\s*\\(\\s*)?${chunk}\\s*\\)?\\s*\\)`).test(body)) streamChunks.add(array);
  }
  for (const event of source.matchAll(/\breq\s*\.\s*on\s*\(\s*(['"])data\1\s*,\s*/g)) {
    const callOpen = syntax.indexOf('(', event.index), callClose = matchingDelimiter(syntax, callOpen, '(', ')');
    if (callClose < 0) continue;
    const callbackStart = event.index + event[0].length;
    const callbackText = syntax.slice(callbackStart, callClose);
    const callback = callbackText.match(/^(?:async\s+)?(?:\(\s*([A-Za-z_$][\w$]*)\s*\)|([A-Za-z_$][\w$]*))\s*=>/);
    if (!callback) continue;
    const chunk = callback[1] ?? callback[2];
    const arrow = callbackText.indexOf('=>'), bodyStart = skipSpace(callbackText, arrow + 2);
    let bodyEnd = callbackText.length;
    if (callbackText[bodyStart] === '{') {
      const blockEnd = matchingDelimiter(callbackText, bodyStart, '{', '}');
      if (blockEnd < 0) continue;
      bodyEnd = blockEnd;
    }
    const body = callbackText.slice(bodyStart, bodyEnd);
    for (const array of chunkArrays) if (new RegExp(`\\b${array}\\s*\\.\\s*push\\s*\\(\\s*(?:Buffer\\s*\\.\\s*from\\s*\\(\\s*)?${chunk}\\s*\\)?\\s*\\)`).test(body)) streamChunks.add(array);
  }
  if (!streamChunks.size) return false;
  const rawBodies = new Set();
  for (const match of syntax.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*Buffer\s*\.\s*concat\s*\(\s*([A-Za-z_$][\w$]*)\s*\)/g)) {
    if (streamChunks.has(match[2])) rawBodies.add(match[1]);
  }
  for (const match of syntax.matchAll(/\.\s*update\s*\(\s*([A-Za-z_$][\w$]*)\s*\)/g)) if (rawBodies.has(match[1])) return true;
  for (const match of syntax.matchAll(/\.\s*update\s*\(\s*Buffer\s*\.\s*concat\s*\(\s*([A-Za-z_$][\w$]*)\s*\)\s*\)/g)) if (streamChunks.has(match[1])) return true;
  return false;
}

function posixNormalize(value) {
  const parts = [];
  for (const part of value.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') { if (!parts.length) return null; parts.pop(); }
    else parts.push(part);
  }
  return parts.join('/');
}

function importSpecifiers(source) {
  const cleaned = maskComments(source), syntax = maskStrings(cleaned), results = [];
  for (const match of syntax.matchAll(/\bimport\b/g)) {
    let cursor = skipSpace(syntax, match.index + match[0].length);
    if (syntax[cursor] === '(') continue;
    let specifierStart = cursor;
    if (cleaned[cursor] !== '"' && cleaned[cursor] !== "'") {
      const from = syntax.indexOf('from', cursor);
      if (from < 0 || from - cursor > 500 || /[=;]/.test(syntax.slice(cursor, from))) continue;
      specifierStart = skipSpace(cleaned, from + 'from'.length);
    }
    const quote = cleaned[specifierStart];
    if (quote !== '"' && quote !== "'") continue;
    let end = specifierStart + 1, escaped = false;
    for (; end < cleaned.length; end++) {
      if (escaped) escaped = false;
      else if (cleaned[end] === '\\') escaped = true;
      else if (cleaned[end] === quote) break;
    }
    if (end < cleaned.length) results.push(cleaned.slice(specifierStart + 1, end));
  }
  return results;
}

function localImports(route, files) {
  const source = route.moduleSource ?? route.source ?? '', results = [];
  for (const specifier of importSpecifiers(source)) {
    let base;
    if (specifier.startsWith('.')) base = posixNormalize(`${route.file.split('/').slice(0, -1).join('/')}/${specifier}`);
    else if (specifier.startsWith('~/')) {
      const parts = route.file.split('/');
      const appIndex = parts.lastIndexOf('app');
      if (appIndex < 0) continue;
      base = posixNormalize(`${parts.slice(0, appIndex + 1).join('/')}/${specifier.slice(2)}`);
    } else continue;
    if (!base) continue;
    const candidates = [base, ...['.js','.jsx','.ts','.tsx','.mjs','.cjs','.mts','.cts'].map(ext => `${base}${ext}`),
      ...['.js','.jsx','.ts','.tsx','.mjs','.cjs','.mts','.cts'].map(ext => `${base}/index${ext}`)];
    for (const candidate of candidates) {
      const found = files.find(file => file.file === candidate);
      if (found) { results.push(found.text); break; }
    }
  }
  return results;
}

function localFunction(source, syntax, name) {
  const functionPattern = new RegExp(`\\b(?:async\\s+)?function\\s+${name}\\b`, 'g');
  for (const match of syntax.matchAll(functionPattern)) {
    const result = functionBody(source, syntax, match.index, match.index + match[0].length);
    if (result) return result.text;
  }
  const arrowPattern = new RegExp(`\\b(?:const|let|var)\\s+${name}\\s*=`, 'g');
  for (const match of syntax.matchAll(arrowPattern)) {
    let cursor = skipSpace(syntax, match.index + match[0].length);
    if (/^async\s+/.test(syntax.slice(cursor))) cursor = skipSpace(syntax, cursor + 'async'.length);
    if (syntax.startsWith('function', cursor)) {
      const result = functionBody(source, syntax, match.index, cursor + 'function'.length);
      if (result) return result.text;
      continue;
    }
    let paramsClose;
    if (syntax[cursor] === '(') paramsClose = matchingDelimiter(syntax, cursor, '(', ')');
    else {
      const parameter = syntax.slice(cursor).match(/^[A-Za-z_$][\w$]*/);
      if (parameter) paramsClose = cursor + parameter[0].length - 1;
    }
    if (paramsClose === undefined || paramsClose < 0) continue;
    const arrow = syntax.indexOf('=>', paramsClose + 1), bodyOpen = arrow >= 0 ? skipSpace(syntax, arrow + 2) : -1;
    if (bodyOpen < 0 || syntax[bodyOpen] !== '{') continue;
    const bodyClose = matchingDelimiter(syntax, bodyOpen, '{', '}');
    if (bodyClose >= 0) return source.slice(match.index, bodyClose + 1);
  }
  return null;
}

function expressHandlerSource(source, syntax, match, open, close) {
  const registration = source.slice(match.index, close + 1), call = syntax.slice(open + 1, close);
  const firstComma = call.indexOf(',');
  if (firstComma < 0) return registration;
  const tail = call.slice(firstComma + 1), names = new Set();
  for (const candidate of tail.matchAll(/\b([A-Za-z_$][\w$]*)\b/g)) {
    const name = candidate[1];
    if (['async', 'await', 'function', 'return', 'req', 'request', 'res', 'response', 'next', 'true', 'false', 'null', 'undefined'].includes(name)) continue;
    const helper = localFunction(source, syntax, name);
    if (helper) names.add(helper);
  }
  return [registration, ...names].join('\n');
}

function expressionEnd(syntax, start) {
  let parentheses = 0, brackets = 0, braces = 0;
  for (let index = start; index < syntax.length; index++) {
    const character = syntax[index];
    if (character === ';' && parentheses === 0 && brackets === 0 && braces === 0) return index;
    if (character === '\n' && parentheses === 0 && brackets === 0 && braces === 0) {
      const next = skipSpace(syntax, index + 1);
      if (syntax[next] !== '.') return index;
    }
    if (character === '}' && braces === 0 && parentheses === 0 && brackets === 0) return index;
    if (character === '(') parentheses++;
    else if (character === ')' && parentheses > 0) parentheses--;
    else if (character === '[') brackets++;
    else if (character === ']' && brackets > 0) brackets--;
    else if (character === '{') braces++;
    else if (character === '}' && braces > 0) braces--;
  }
  return syntax.length;
}

function callArgumentRanges(syntax, open) {
  const close = matchingDelimiter(syntax, open, '(', ')');
  if (close < 0) return [];
  const ranges = [];
  let start = open + 1, parentheses = 0, brackets = 0, braces = 0;
  for (let index = open + 1; index < close; index++) {
    const character = syntax[index];
    if (character === ',' && parentheses === 0 && brackets === 0 && braces === 0) {
      ranges.push({ start, end: index }); start = index + 1; continue;
    }
    if (character === '(') parentheses++;
    else if (character === ')' && parentheses > 0) parentheses--;
    else if (character === '[') brackets++;
    else if (character === ']' && brackets > 0) brackets--;
    else if (character === '{') braces++;
    else if (character === '}' && braces > 0) braces--;
  }
  if (start < close || ranges.length) ranges.push({ start, end: close });
  return ranges;
}

function hmacHeaderVariables(handler, syntax) {
  const names = new Set();
  const patterns = [
    /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(?:(?:request|req)\s*\.\s*)?headers\s*\.\s*get\s*\(/gi,
    /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(?:(?:request|req)\s*\.\s*)?headers\s*\[/gi,
  ];
  for (const pattern of patterns) for (const match of syntax.matchAll(pattern)) {
    const openCharacter = /get\s*\($/i.test(match[0]) ? '(' : '[';
    const open = syntax.lastIndexOf(openCharacter, match.index + match[0].length - 1);
    const close = matchingDelimiter(syntax, open, openCharacter, openCharacter === '(' ? ')' : ']');
    if (close >= 0 && /^\s*(['"])x-shopify-hmac-sha256\1\s*$/i.test(handler.slice(open + 1, close))) names.add(match[1]);
  }
  return names;
}

function rawBodyUpdate(update, framework, requestBodyVariables, namedUpdateVariables, expressRawParser, pagesRawBodyReady) {
  const value = update.trim();
  if (/^await\s+(?:request|req)\s*\.\s*(?:text|arrayBuffer)\s*\(/i.test(value)
    || /\b(?:request|req)\s*\.\s*(?:rawBody|rawRequestBody)\b/i.test(value)) return true;
  if (/^Buffer\s*\.\s*concat\s*\(/i.test(value)) return framework === 'next-pages-router' && pagesRawBodyReady;
  if (/^(?:req|request)\s*\.\s*body$/i.test(value) && framework === 'express' && expressRawParser) return true;
  const identifier = value.match(/^([A-Za-z_$][\w$]*)$/)?.[1];
  if (!identifier) return false;
  return requestBodyVariables.has(identifier)
    || (framework === 'next-pages-router' && pagesRawBodyReady && namedUpdateVariables.has(identifier))
    || (framework === 'express' && (expressRawParser || namedUpdateVariables.has(identifier)) && namedUpdateVariables.has(identifier));
}

function computedHmacVariables(handler, syntax, framework, requestBodyVariables, namedUpdateVariables, expressRawParser, pagesRawBodyReady) {
  const names = new Set();
  for (const match of syntax.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(?:crypto\s*\.\s*)?createHmac\s*\(/g)) {
    const open = syntax.indexOf('(', match.index + match[0].lastIndexOf('('));
    const close = matchingDelimiter(syntax, open, '(', ')');
    if (close < 0 || !/^\s*(['"])sha256\1\s*,/i.test(handler.slice(open + 1, close))) continue;
    const end = expressionEnd(syntax, close + 1);
    const chain = syntax.slice(close + 1, end);
    const updateCalls = [...chain.matchAll(/\.\s*update\s*\(/g)];
    for (const updateMatch of updateCalls) {
      const updateOpen = chain.indexOf('(', updateMatch.index + updateMatch[0].lastIndexOf('('));
      const updateClose = matchingDelimiter(chain, updateOpen, '(', ')');
      if (updateClose < 0) continue;
      const updateStart = close + 1 + updateOpen + 1;
      const updateEnd = close + 1 + updateClose;
      if (!rawBodyUpdate(handler.slice(updateStart, updateEnd), framework, requestBodyVariables, namedUpdateVariables, expressRawParser, pagesRawBodyReady)) continue;
      const digestTail = chain.slice(updateClose + 1);
      for (const digestMatch of digestTail.matchAll(/\.\s*digest\s*\(/g)) {
        const digestOpen = digestTail.indexOf('(', digestMatch.index + digestMatch[0].lastIndexOf('('));
        const digestClose = matchingDelimiter(digestTail, digestOpen, '(', ')');
        if (digestClose < 0) continue;
        const digestStart = close + 1 + updateClose + 1 + digestOpen + 1;
        const digestEnd = close + 1 + updateClose + 1 + digestClose;
        if (/^\s*(['"])base64\1\s*$/i.test(handler.slice(digestStart, digestEnd))) names.add(match[1]);
      }
    }
  }
  return names;
}

function bufferAliases(names, syntax) {
  const aliases = new Set(names), buffers = new Set();
  let changed = true;
  while (changed) {
    changed = false;
    for (const match of syntax.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*Buffer\s*\.\s*from\s*\(/g)) {
      const open = syntax.indexOf('(', match.index + match[0].lastIndexOf('('));
      const args = callArgumentRanges(syntax, open);
      if (!args.length) continue;
      const first = syntax.slice(args[0].start, args[0].end).trim();
      if (/^[A-Za-z_$][\w$]*$/.test(first) && aliases.has(first) && !aliases.has(match[1])) {
        aliases.add(match[1]); buffers.add(match[1]); changed = true;
      }
    }
  }
  return buffers;
}

function timingSafeComparisonUsesShopifyHmac(handler, syntax, headerVariables, digestVariables) {
  const headerBuffers = bufferAliases(headerVariables, syntax);
  const digestBuffers = bufferAliases(digestVariables, syntax);
  const unwrap = value => {
    let expression = value.trim(), changed = true;
    while (changed && expression.startsWith('(') && expression.endsWith(')')) {
      changed = matchingDelimiter(expression, 0, '(', ')') === expression.length - 1;
      if (changed) expression = expression.slice(1, -1).trim();
    }
    return expression;
  };
  const headerCall = /^(?:(?:request|req)\s*\.\s*)?headers\s*(?:\.\s*get\s*\(\s*(['"])x-shopify-hmac-sha256\1\s*\)|\[\s*(['"])x-shopify-hmac-sha256\2\s*\])$/i;
  const usesBuffer = (range, variables, buffers, directHeader) => {
    const expression = unwrap(handler.slice(range.start, range.end));
    if (/^[A-Za-z_$][\w$]*$/.test(expression)) return buffers.has(expression);
    const expressionSyntax = unwrap(syntax.slice(range.start, range.end));
    const call = expressionSyntax.match(/^Buffer\s*\.\s*from\s*\(/);
    if (!call) return false;
    const open = expressionSyntax.indexOf('('), args = callArgumentRanges(expressionSyntax, open);
    if (!args.length) return false;
    const value = unwrap(expression.slice(args[0].start, args[0].end));
    return variables.has(value) || (directHeader && headerCall.test(value));
  };
  for (const match of syntax.matchAll(/\btimingSafeEqual\s*\(/g)) {
    const open = syntax.indexOf('(', match.index + match[0].lastIndexOf('('));
    const args = callArgumentRanges(syntax, open);
    if (args.length !== 2) continue;
    const headerAt = range => usesBuffer(range, headerVariables, headerBuffers, true);
    const digestAt = range => usesBuffer(range, digestVariables, digestBuffers, false);
    if ((headerAt(args[0]) && digestAt(args[1])) || (headerAt(args[1]) && digestAt(args[0]))) return true;
  }
  return false;
}

function hasShopifyAuthenticator(source) {
  const cleaned = maskComments(source), syntax = maskStrings(cleaned);
  const importPattern = /\bimport\s*\{([^}]+)\}\s*from\s*(['"])(@shopify\/shopify-app-(?:react-router|remix)\/server)\2/g;
  let creator = null;
  for (const match of cleaned.matchAll(importPattern)) {
    const imported = match[1].match(/\bshopifyApp\b(?:\s+as\s+([A-Za-z_$][\w$]*))?/);
    if (imported) { creator = imported[1] ?? 'shopifyApp'; break; }
  }
  if (!creator) return false;
  const appInstances = new Set([...syntax.matchAll(new RegExp(`\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*${creator}\\s*\\(`, 'g'))].map(match => match[1]));
  for (const match of syntax.matchAll(/\b(?:export\s+)?(?:const|let|var)\s+authenticate\s*=\s*([A-Za-z_$][\w$]*)\s*\.\s*authenticate\b/g)) {
    if (!appInstances.has(match[1])) continue;
    if (/\bexport\s+(?:const|let|var)\s+authenticate\b/.test(syntax)
      || /\bexport\s*\{[^}]*\bauthenticate\b/.test(syntax)) return true;
  }
  return false;
}

function routeAuth(route, files) {
  const handler = route.handlerSource ?? '', moduleSource = route.moduleSource ?? route.source ?? '';
  const handlerSyntax = maskStrings(handler);
  const relatedModules = [moduleSource, ...localImports(route, files)];
  const hasPackage = (source, packagePattern) => importSpecifiers(source).some(specifier => packagePattern.test(specifier));
  const reactRouter = /\bauthenticate\s*\.\s*webhook\s*\(/.test(handlerSyntax)
    && relatedModules.some(source => hasPackage(source, /^@shopify\/shopify-app-(?:react-router|remix)\/server$/)
      && hasShopifyAuthenticator(source));
  const apiLibraryCall = /\b(?:shopify\s*\.\s*)?webhooks\s*\.\s*validate\s*\(/.test(handlerSyntax)
    && relatedModules.some(source => hasPackage(source, /^@shopify\/shopify-api(?:\/.*)?$/));
  const requestBodyVariables = new Set();
  for (const match of handlerSyntax.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+(?:request|req)\.(?:text|arrayBuffer)\s*\(/g)) requestBodyVariables.add(match[1]);
  const namedUpdate = [...handlerSyntax.matchAll(/\.update\s*\(\s*(rawBody|rawRequestBody|bodyBuffer|rawBuffer)\s*\)/ig)];
  const expressPrelude = route.framework === 'express' && route.registrationOffset !== undefined
    ? moduleSource.slice(0, route.registrationOffset) : '';
  const expressRawParser = route.framework === 'express' && /express\.(?:raw|text)\s*\(/.test(`${expressPrelude}\n${handler}`);
  const rawPropertyInput = route.framework === 'express' && /\.update\s*\(\s*req\.(?:rawBody|rawRequestBody)\s*\)/i.test(handlerSyntax);
  const expressRawProperty = route.framework === 'express' && /\b(?:rawBody|rawRequestBody)\s*=\s*req\.(?:rawBody|rawRequestBody)\b/i.test(handlerSyntax);
  const genericRawBodyInput = /\.update\s*\(\s*(?:await\s+request\.(?:text|arrayBuffer)\s*\(|Buffer\.concat\s*\()/i.test(handlerSyntax)
    || [...requestBodyVariables].some(name => new RegExp(`\\.update\\s*\\(\\s*${name}\\s*\\)`).test(handlerSyntax))
    || (namedUpdate.length > 0 && (route.framework === 'next-pages-router' || (route.framework === 'express' && (expressRawParser || expressRawProperty))))
    || rawPropertyInput;
  const rawBodyInput = route.framework === 'next-pages-router' ? pagesRawBodyInput(handler) : genericRawBodyInput;
  const rawBodyArgument = /\brawBody\s*:\s*(?:rawBody|rawRequestBody|bodyBuffer|rawBuffer|await\s+request\.(?:text|arrayBuffer)\s*\(|Buffer\.concat\s*\()/i.test(handlerSyntax)
    || [...requestBodyVariables].some(name => new RegExp(`\\brawBody\\s*:\\s*${name}\\b`).test(handlerSyntax))
    || (route.framework === 'express' && expressRawParser && /\brawBody\s*:\s*req\.body\b/i.test(handlerSyntax));
  const rawInput = rawBodyInput || (/\bwebhooks\s*\.\s*validate\s*\(/.test(handlerSyntax) && rawBodyArgument);
  const hasHeader = [...handlerSyntax.matchAll(/\bheaders\s*\.\s*get\s*\(/g)].some(match => {
    const open = handlerSyntax.indexOf('(', match.index);
    return /^\s*(['"])x-shopify-hmac-sha256\1/i.test(handler.slice(open + 1));
  }) || [...handlerSyntax.matchAll(/\bheaders\s*\[/g)].some(match => {
    const open = handlerSyntax.indexOf('[', match.index);
    return /^\s*(['"])x-shopify-hmac-sha256\1/i.test(handler.slice(open + 1));
  });
  const sha256Hmac = [...handlerSyntax.matchAll(/\bcreateHmac\s*\(/g)].some(match => {
    const open = handlerSyntax.indexOf('(', match.index);
    return /^\s*(['"])sha256\1/i.test(handler.slice(open + 1));
  });
  const namedUpdateVariables = new Set(namedUpdate.map(match => match[1]));
  const pagesRawBodyReady = route.framework === 'next-pages-router' && pagesRawBodyInput(handler);
  const digestVariables = computedHmacVariables(handler, handlerSyntax, route.framework, requestBodyVariables, namedUpdateVariables, expressRawParser, pagesRawBodyReady);
  const headerVariables = hmacHeaderVariables(handler, handlerSyntax);
  const hmac = hasHeader && rawBodyInput && digestVariables.size > 0
    && timingSafeComparisonUsesShopifyHmac(handler, handlerSyntax, headerVariables, digestVariables);
  const usesParsedBody = /\.update\s*\(\s*(?:req|request)\.body\s*\)/i.test(handlerSyntax)
    || /\brawBody\s*:\s*(?:req|request)\.body\b/i.test(handlerSyntax);
  const parsedBodyInput = usesParsedBody && !(route.framework === 'express' && expressRawParser);
  const library = apiLibraryCall && (rawBodyArgument || (route.framework === 'express' && !parsedBodyInput));
  const verified = (reactRouter || library || hmac) && pageRawBodyConfig(route) && !parsedBodyInput;
  const helperCall = /\b(?:verify|validate|authenticate|check|assert)[\w$]*\s*\(/i.test(handlerSyntax)
    || /\b(?:shopify\s*\.\s*)?webhooks\s*\.\s*validate\s*\(/.test(handlerSyntax)
    || /\bauthenticate\s*\.\s*webhook\s*\(/.test(handlerSyntax);
  const verificationAttempt = hasHeader || sha256Hmac || helperCall;
  return { verified, helperCall, verificationAttempt, parsedBodyInput, rawBodyAttempt: hasHeader && sha256Hmac };
}

function destinationFinding(file, line, rationale, remediation, evidence, confidence = 'medium') {
  return { ruleId: 'AR-WEBHOOK-001', severity: 'high', status: 'NEEDS_REVIEW', title: 'Delivery authentication evidence requires route review', rationale, remediation, file, line, confidence, evidence };
}

export function reviewDeliveries({ files, endpoints, applicationUrl }) {
  const candidates = routeCandidates(files), findings = [];
  const deliveries = endpoints.length ? endpoints : candidates
    .filter(candidate => /webhook|events/i.test(candidate.route) || /authenticate\s*\.\s*webhook|x-shopify-(?:hmac|webhook)|shopify-hmac-sha256/i.test(candidate.handlerSource || candidate.source))
    .map(candidate => ({ uri: candidate.route, kind: 'inferred' }));
  for (const delivery of deliveries) {
    const destination = classifyDestination(delivery.uri, delivery.applicationUrl ?? applicationUrl);
    if (destination.transport === 'eventbridge' || destination.transport === 'pubsub') {
      findings.push({ ruleId: 'AR-EVENTS-004', severity: 'medium', status: 'NEEDS_REVIEW', title: 'Cloud event destination requires provider-side review', rationale: 'Shopify does not require HTTPS HMAC verification for EventBridge or Pub/Sub deliveries; static repository analysis cannot verify the cloud resource policy or delivery identity.', remediation: 'Verify the event bus resource policy, consumer identity, retry handling, and idempotent processing in the cloud provider.', file: delivery.file ?? 'repository', confidence: 'manual', evidence: 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries' });
      findings.push({ ruleId: 'AR-WEBHOOK-004', severity: 'low', status: 'NEEDS_REVIEW', title: 'Duplicate-delivery handling requires provider route review', rationale: 'Cloud event deliveries can be retried; static repository analysis cannot associate the destination with one consumer handler.', remediation: 'Verify that the consumer processes duplicate messages idempotently.', file: delivery.file ?? 'repository', confidence: 'manual', evidence: 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries' });
      continue;
    }
    if (!['https', 'development'].includes(destination.transport)) {
      findings.push(destinationFinding(delivery.file ?? 'repository', undefined, 'The configured delivery transport or route could not be associated with a statically recognised HTTPS handler.', 'Confirm the delivery transport and verify the specific handler with Shopify’s supported framework helper or raw-body HMAC procedure.', 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries', 'low'));
      continue;
    }
    const matched = destination.pathname ? candidates.filter(candidate => matchesRoute(candidate.route, destination.pathname)) : [];
    const associated = matched.length === 1 ? matched[0] : null;
    if (!associated) {
      const reason = matched.length > 1
        ? 'More than one route pattern matches this configured destination, so the request handler is ambiguous.'
        : 'A configured HTTPS delivery could not be connected to a supported route file or registration.';
      findings.push(destinationFinding(delivery.file ?? 'repository', undefined, reason, 'Trace this destination to one handler and verify each HTTPS delivery with Shopify’s framework helper or raw-body HMAC procedure.', 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries', 'low'));
      findings.push({ ruleId: 'AR-WEBHOOK-004', severity: 'low', status: 'NEEDS_REVIEW', title: 'Duplicate-delivery handling is not linked to this route', rationale: 'No unique route was associated with the configured delivery, so route-local duplicate handling could not be assessed.', remediation: 'Verify that processing is idempotent or deduplicates deliveries using Shopify’s delivery ID.', file: delivery.file ?? 'repository', confidence: 'low', evidence: 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries' });
      continue;
    }
    if (!associated.methodSupported || !associated.handlerKnown) {
      const methods = associated.methods.length ? ` Only ${associated.methods.join(', ')} handlers were recognised.` : '';
      findings.push(destinationFinding(associated.file, associated.line, `The matched route does not expose one statically recognised POST handler.${methods}`, 'Confirm that this URL accepts Shopify’s HTTP POST delivery and trace any exported handler alias manually.', 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries', 'low'));
      continue;
    }
    const auth = routeAuth(associated, files), routeSource = associated.handlerSource;
    if (auth.verified) {
      findings.push({ ruleId: 'AR-WEBHOOK-001', severity: 'info', status: 'PASS', title: 'Recognisable delivery verifier is present on the matched route', rationale: 'A Shopify framework verifier or route-local raw-body HMAC pattern was found on the one statically matched POST handler. This is source evidence, not runtime verification.', remediation: 'Confirm the deployed route uses this handler and the expected secret.', file: associated.file, line: associated.line, confidence: 'medium', evidence: 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries' });
    } else {
      const rationale = auth.helperCall
        ? 'A custom or imported verification helper is called on this route, but its implementation could not be traced confidently to Shopify HMAC verification.'
        : 'The matched POST handler does not contain a recognised Shopify verifier or route-local raw-body HMAC check.';
      findings.push(destinationFinding(associated.file, associated.line, rationale, 'Trace this handler and verify the original request body with Shopify’s supported helper or HMAC procedure before processing the payload.', 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries', 'medium'));
    }
    if (associated.framework === 'next-pages-router' && associated.bodyParserDefault && (auth.rawBodyAttempt || auth.parsedBodyInput)) {
      findings.push({ ruleId: 'AR-WEBHOOK-002', severity: 'high', status: 'WARN', title: 'Pages API body parsing may precede webhook verification', rationale: 'Next.js Pages API Routes enable body parsing by default. The matched route attempts HMAC verification without declaring `api.bodyParser: false`, so the original request bytes may no longer be available.', remediation: 'Disable the Pages API body parser for this route and read the request stream before computing the HMAC.', file: associated.file, line: associated.line, confidence: 'high', evidence: 'https://nextjs.org/docs/pages/building-your-application/routing/api-routes' });
    }
    if (associated.framework === 'express' && /(?:express|bodyParser)\.json\s*\(/.test(routeSource) && !/rawBody|verify\s*[:=]/i.test(routeSource)) {
      findings.push({ ruleId: 'AR-WEBHOOK-002', severity: 'high', status: 'WARN', title: 'JSON parsing may run before this delivery route', rationale: 'A JSON body parser appears before or alongside the matched route without recognisable raw-body capture.', remediation: 'Capture the raw request body before parsing and verify the HMAC against those bytes.', file: associated.file, line: associated.line, confidence: 'medium', evidence: 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries' });
    }
    if (/(?:shopify-webhook-id|x-shopify-webhook-id|idempoten|dedup|duplicate)/i.test(routeSource)) {
      findings.push({ ruleId: 'AR-WEBHOOK-004', severity: 'info', status: 'PASS', title: 'Duplicate-delivery handling signal is present on the matched route', rationale: 'An idempotency or delivery-ID pattern is present on this route; the persistent behaviour cannot be proven statically.', remediation: 'Verify retries remain safe against the production data store.', file: associated.file, line: associated.line, confidence: 'medium', evidence: 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries' });
    } else {
      findings.push({ ruleId: 'AR-WEBHOOK-004', severity: 'low', status: 'NEEDS_REVIEW', title: 'Duplicate-delivery handling is not evident on this route', rationale: 'Shopify retries failed deliveries and may deliver an event more than once; no route-local idempotency signal was found.', remediation: 'Verify that processing is idempotent or deduplicates deliveries using Shopify’s delivery ID.', file: associated.file, line: associated.line, confidence: 'medium', evidence: 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries' });
    }
    if (/(?:signature\s*===|===\s*signature|signature\s*==|==\s*signature)/i.test(routeSource) && !/timingSafeEqual/i.test(routeSource)) {
      findings.push({ ruleId: 'AR-WEBHOOK-003', severity: 'medium', status: 'WARN', title: 'Direct signature comparison appears on this route', rationale: 'A direct signature comparison was detected without a timing-safe comparison in the matched route.', remediation: 'Use Shopify’s verifier or a timing-safe comparison after decoding both signatures.', file: associated.file, line: associated.line, confidence: 'medium', evidence: 'https://shopify.dev/docs/apps/build/webhooks/verify-deliveries' });
    }
  }
  return findings;
}

export function codeFiles(files) { return files.filter(file => CODE.test(file.file)).map(file => ({ ...file, text: maskComments(file.text) })); }
