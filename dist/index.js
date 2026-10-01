import { analyze } from './analyzer.js';
import { human, sarif, shouldFail } from './output.js';
import fs from 'node:fs';
const input = name => process.env[`INPUT_${name.toUpperCase().replaceAll('-', '_')}`];
const report = analyze(input('path') || '.', { showUnmapped: input('show-unmapped') === 'true' }); const format = input('format') || 'human'; const output = format === 'json' ? JSON.stringify(report, null, 2) : format === 'sarif' ? JSON.stringify(sarif(report), null, 2) : human(report); console.log(output);
const summary = report.summary; const set = (k, v) => { const p = process.env.GITHUB_OUTPUT; if (p) fs.appendFileSync(p, `${k}=${String(v).replace(/\n/g, '%0A')}\n`); }; set('outcome', shouldFail(report, input('fail-on') || 'high', input('strict') === 'true') ? 'failure' : 'success'); set('finding-count', summary.findingCount); set('fail-count', summary.FAIL); set('warning-count', summary.WARN); set('review-count', summary.NEEDS_REVIEW); set('unknown-count', summary.UNKNOWN); set('rule-ids', report.findings.map(f => f.ruleId).join(',')); set('report', output); process.exit(shouldFail(report, input('fail-on') || 'high', input('strict') === 'true') ? 1 : 0);
