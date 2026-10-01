#!/usr/bin/env node
import fs from 'node:fs';
import { analyze } from './analyzer.js';
import { human, sarif, shouldFail } from './output.js';
const args = process.argv.slice(2); const command = args[0] && !args[0].startsWith('-') ? args.shift() : 'check';
function value(name, fallback) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; }
if (args.includes('--version') || command === '--version' || command === '-v') { console.log('0.1.0'); process.exit(0); }
if (command === 'rules') { console.log('AR-CONFIG-* AR-COMPLIANCE-* AR-WEBHOOK-* AR-AUTH-* AR-SECURITY-* AR-API-* AR-BILLING-* AR-DATA-* AR-LISTING-* AR-REVIEW-*'); process.exit(0); }
if (command === 'explain') { console.log('Use the rule reference: https://github.com/efegokdemir/shopify-app-review-guard/blob/main/docs/rule-reference.md'); process.exit(0); }
if (command !== 'check') { console.error(`Unknown command: ${command}`); process.exit(2); }
try { const report = analyze(value('--path', '.'), { config: value('--config'), showUnmapped: args.includes('--show-unmapped') }); const format = value('--format', 'human'); const threshold = value('--fail-on', 'high'); const output = format === 'json' ? JSON.stringify(report, null, 2) : format === 'sarif' ? JSON.stringify(sarif(report), null, 2) : human(report); if (value('--output')) fs.writeFileSync(value('--output'), output + '\n'); else console.log(output); process.exit(shouldFail(report, threshold, args.includes('--strict')) ? 1 : 0); } catch (error) { console.error(`Shopify App Review Guard: ${error.message}`); process.exit(2); }
