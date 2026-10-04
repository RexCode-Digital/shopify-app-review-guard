#!/usr/bin/env node
import { TOOL_VERSION } from './version.js';
import fs from 'node:fs';
import { analyze } from './analyzer.js';
import { human, sarif, shouldFail, validateOptions } from './output.js';
const args = process.argv.slice(2);
const help = 'Usage: shopify-app-review-guard check [--path DIR] [--config FILE] [--format human|json|sarif] [--fail-on none|low|medium|high] [--strict] [--show-unmapped] [--output FILE]\n       shopify-app-review-guard rules|explain|--version';
if (args.includes('--help') || args.includes('-h')) { console.log(help); process.exit(0); }
if (args.includes('--version') || args.includes('-v')) { console.log(TOOL_VERSION); process.exit(0); }
const command = args[0] && !args[0].startsWith('-') ? args.shift() : 'check';
try {
  if (command === 'rules') { console.log('AR-CONFIG-* AR-COMPLIANCE-* AR-WEBHOOK-* AR-AUTH-* AR-SECURITY-* AR-API-* AR-BILLING-* AR-DATA-* AR-LISTING-* AR-REVIEW-*'); process.exit(0); }
  if (command === 'explain') { console.log('Rule reference: https://github.com/RexCode-Digital/shopify-app-review-guard/blob/main/docs/rule-reference.md'); process.exit(0); }
  if (command !== 'check') throw new Error(`Unknown command: ${command}`);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (['--strict','--show-unmapped'].includes(arg)) { options[arg.slice(2)] = true; continue; }
    if (!['--path','--config','--format','--fail-on','--output'].includes(arg)) throw new Error(`Unknown argument: ${arg}`);
    if (!args[i+1] || args[i+1].startsWith('-')) throw new Error(`Missing value for ${arg}`);
    options[arg.slice(2)] = args[++i];
  }
  const format = options.format ?? 'human', threshold = options['fail-on'] ?? 'high';
  validateOptions(format, threshold);
  const report = analyze(options.path ?? '.', { config: options.config, showUnmapped: options['show-unmapped'] });
  const output = format === 'json' ? JSON.stringify(report,null,2) : format === 'sarif' ? JSON.stringify(sarif(report),null,2) : human(report);
  if (options.output) fs.writeFileSync(options.output, output+'\n'); else console.log(output);
  process.exitCode = shouldFail(report, threshold, options.strict) ? 1 : 0;
} catch (error) { console.error(`Shopify App Review Guard: ${error.message}`); process.exitCode = 2; }
