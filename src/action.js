import { analyze } from './analyzer.js';
import { human, sarif, shouldFail, validateOptions } from './output.js';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
const input = name => process.env[`INPUT_${name.toUpperCase().replaceAll('-', '_')}`];
try {
  const format = input('format') || 'human', threshold = input('fail-on') || 'high';
  validateOptions(format, threshold);
  for (const name of ['strict','show-unmapped']) if (input(name) && !['true','false'].includes(input(name))) throw new Error(`${name} must be true or false`);
  const report = analyze(input('path') || '.', { config: input('config') || undefined, showUnmapped: input('show-unmapped') === 'true' });
  const output = format === 'json' ? JSON.stringify(report,null,2) : format === 'sarif' ? JSON.stringify(sarif(report),null,2) : human(report);
  const stop = randomUUID(); console.log(`::stop-commands::${stop}\n${output}\n::${stop}::`);
  const failed = shouldFail(report, threshold, input('strict') === 'true');
  const set = (key,value) => { if (process.env.GITHUB_OUTPUT) { const delimiter = randomUUID(); fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}<<${delimiter}\n${value}\n${delimiter}\n`); } };
  const s = report.summary;
  for (const [key,value] of Object.entries({ outcome: failed ? 'failure' : 'success', 'finding-count': s.findingCount, 'fail-count': s.FAIL, 'warning-count': s.WARN, 'review-count': s.NEEDS_REVIEW, 'unknown-count': s.UNKNOWN, 'rule-ids': [...new Set(report.findings.map(f=>f.ruleId))].join(','), report: output })) set(key,value);
  process.exitCode = failed ? 1 : 0;
} catch (error) { console.error(`App Review Guard scanner error: ${String(error.message).replace(/[\r\n]/g, ' ')}`); process.exitCode = 2; }
