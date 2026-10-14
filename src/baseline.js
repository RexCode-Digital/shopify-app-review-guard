import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { safeFile } from './files.js';

export const DEFAULT_BASELINE = '.app-review-guard-baseline.json';

export function findingFingerprint(finding) {
  const identity = [finding.ruleId, finding.file, finding.title].join('\0');
  return crypto.createHash('sha256').update(identity).digest('hex');
}

export function loadBaseline(root, selected = undefined) {
  const relative = selected ?? DEFAULT_BASELINE, file = path.resolve(root, relative);
  if (!fs.existsSync(file)) return null;
  const raw = safeFile(root, file);
  let value;
  try { value = JSON.parse(raw); } catch { throw new Error('Baseline must be valid JSON; contents were not printed'); }
  if (!value || value.schemaVersion !== 1 || !Array.isArray(value.entries) || value.entries.some(entry => !entry || typeof entry.fingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(entry.fingerprint) || typeof entry.ruleId !== 'string' || typeof entry.file !== 'string' || typeof entry.title !== 'string')) throw new Error('Baseline format is invalid; create a new baseline');
  return { file: relative, entries: value.entries };
}

export function createBaseline(report) {
  const entries = [...new Map(report.findings.map(finding => [findingFingerprint(finding), { fingerprint: findingFingerprint(finding), ruleId: finding.ruleId, file: finding.file, title: finding.title }])).values()]
    .sort((left, right) => `${left.ruleId}:${left.file}:${left.title}`.localeCompare(`${right.ruleId}:${right.file}:${right.title}`));
  return { schemaVersion: 1, toolVersion: report.toolVersion, evidenceVersion: report.evidenceVersion, entries };
}

export function writeBaseline(root, selected, value) {
  const relative = selected ?? DEFAULT_BASELINE;
  if (path.isAbsolute(relative) || relative.split(/[\\/]/).includes('..')) throw new Error('Baseline path must stay inside the selected app root');
  const file = path.resolve(root, relative), parent = path.dirname(file);
  const parentRelative = path.relative(root, parent);
  if (parentRelative === '..' || parentRelative.startsWith(`..${path.sep}`) || path.isAbsolute(parentRelative)) throw new Error('Baseline path must stay inside the selected app root');
  let current = root;
  for (const part of parentRelative ? parentRelative.split(path.sep) : []) {
    current = path.join(current, part);
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('Baseline path cannot contain symbolic links');
  }
  if (fs.existsSync(file)) safeFile(root, file);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return relative;
}

export function classifyAgainstBaseline(findings, baseline) {
  if (!baseline) return { findings: findings.map(finding => ({ ...finding, lifecycle: 'UNCHANGED' })), resolvedFindings: [], enabled: false };
  const currentCounts = new Map();
  for (const finding of findings) { const key = findingFingerprint(finding); currentCounts.set(key, (currentCounts.get(key) ?? 0) + 1); }
  const seen = new Map();
  const classified = findings.map(finding => {
    const fingerprint = findingFingerprint(finding), prior = seen.get(fingerprint) ?? 0;
    seen.set(fingerprint, prior + 1);
    const existing = baseline.entries.some(entry => entry.fingerprint === fingerprint);
    return { ...finding, fingerprint, lifecycle: existing ? 'EXISTING' : 'NEW' };
  });
  const resolvedFindings = baseline.entries.filter(entry => !currentCounts.has(entry.fingerprint)).map(entry => ({ ...entry, status: 'RESOLVED', lifecycle: 'RESOLVED', severity: 'info', confidence: 'baseline', rationale: 'This finding was present in the saved baseline and is no longer detected.', remediation: 'No action is required unless the underlying risk returns.', evidence: null, evidenceVersion: null }));
  return { findings: classified, resolvedFindings, enabled: true };
}
