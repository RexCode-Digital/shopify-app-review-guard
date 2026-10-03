import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { analyze } from '../src/analyzer.js';
const cli = path.resolve('src/cli.js'), action = path.resolve('dist/index.js');
function fixture(t, config = 'application_url="https://example.test"\n') {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'review-hardening-')); t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  fs.writeFileSync(path.join(root,'shopify.app.toml'),config); return root;
}
test('rejects malformed TOML without exposing parser source',t=>{
 const root=fixture(t,'client_secret="never-output-secret"\ninvalid = [\n'); assert.throws(()=>analyze(root),/Invalid Shopify app TOML/);
 const result=spawnSync(process.execPath,[cli,'check','--path',root],{encoding:'utf8'});assert.equal(result.status,2);assert.ok(!result.stderr.includes('never-output-secret'));
});
test('comments and wrong tables cannot satisfy compliance subscriptions',t=>{
 const root=fixture(t,'application_url="https://example.test"\n# customers/data_request customers/redact shop/redact\n[webhooks]\ncompliance_topics=["customers/data_request","customers/redact","shop/redact"]\n');
 assert.equal(analyze(root).findings.filter(f=>f.ruleId==='AR-COMPLIANCE-001').length,3);
 fs.appendFileSync(path.join(root,'shopify.app.toml'),'[[webhooks.subscriptions]]\nuri="/webhooks"\ncompliance_topics=["customers/data_request","customers/redact","shop/redact"]\n');
 assert.equal(analyze(root).findings.filter(f=>f.ruleId==='AR-COMPLIANCE-001').length,0);
});
test('URL parsing rejects substring localhost and IP bypasses',t=>{
 for(const url of ['http://localhost.evil.test','http://evil.test/127.0.0.1','ftp://127.0.0.1','not-a-url','https://user:password@example.test']){
  const root=fixture(t,`application_url="${url}"\n[auth]\nredirect_urls=["${url}"]\n`);const ids=analyze(root).findings.map(f=>f.ruleId);assert.ok(ids.includes('AR-CONFIG-002'),url);assert.ok(ids.includes('AR-CONFIG-004'),url);
 }
 assert.ok(!analyze(fixture(t,'application_url="http://[::1]:3000"\n')).findings.some(f=>f.ruleId==='AR-CONFIG-002'));
});
test('partial and invalid manifests retain unverified external checks',t=>{
 const root=fixture(t); const file=path.join(root,'.app-review-guard.json');
 fs.writeFileSync(file,JSON.stringify({listing:{supportUrl:true}}));assert.equal(analyze(root).findings.filter(f=>f.ruleId.startsWith('AR-LISTING-')).length,3);
 for(const value of [{}, {listing:{supportUrl:'true'}},null]){fs.writeFileSync(file,JSON.stringify(value));const r=analyze(root);assert.equal(r.findings.filter(f=>f.status==='NEEDS_REVIEW'&&f.ruleId.startsWith('AR-LISTING-')).length,4);assert.ok(r.findings.some(f=>f.ruleId==='AR-LISTING-001'));}
});
test('env variants are detected and oversized files reported',t=>{
 const root=fixture(t);fs.writeFileSync(path.join(root,'.env.production'),'SECRET=not-output');fs.writeFileSync(path.join(root,'large.js'),'x'.repeat(1024*1024+1));const r=analyze(root);assert.ok(r.findings.some(f=>f.file==='.env.production'));assert.ok(r.skipped.some(f=>f.file==='large.js'));assert.ok(!JSON.stringify(r).includes('not-output'));
});
test('file and manifest symlinks never read external content',t=>{
 const root=fixture(t),outside=fixture(t);fs.writeFileSync(path.join(outside,'secret.js'),'const client_secret="external-secret-value"');
 try{fs.symlinkSync(path.join(outside,'secret.js'),path.join(root,'linked.js'));}catch(e){if(e.code==='EPERM')return t.skip('Symlink privileges unavailable');throw e;}
 assert.ok(!analyze(root).findings.some(f=>f.ruleId==='AR-AUTH-004'));fs.symlinkSync(path.join(outside,'secret.js'),path.join(root,'.app-review-guard.json'));assert.throws(()=>analyze(root),/Symbolic link/);
});
test('CLI help, invalid flags, format and policy have explicit exit codes',t=>{
 const root=fixture(t);assert.equal(spawnSync(process.execPath,[cli,'--help']).status,0);
 for(const args of [['--fail-on','typo'],['--format','typo'],['--config'],['--bogus']]) assert.equal(spawnSync(process.execPath,[cli,'check','--path',root,...args]).status,2);
 assert.equal(spawnSync(process.execPath,[cli,'check','--path',root,'--fail-on','none']).status,0);
 assert.equal(spawnSync(process.execPath,[cli,'check','--path',root,'--fail-on','high']).status,1);
});
test('bundled Action emits real multiline JSON and applies strict policy',t=>{
 const root=fixture(t),output=path.join(root,'outputs');fs.writeFileSync(output,'');
 const result=spawnSync(process.execPath,[action],{cwd:root,encoding:'utf8',env:{...process.env,INPUT_PATH:root,INPUT_FORMAT:'json',INPUT_FAIL_ON:'none',GITHUB_OUTPUT:output}});assert.equal(result.status,0,result.stderr);
 const text=fs.readFileSync(output,'utf8');const m=text.match(/report<<([^\n]+)\n([\s\S]*?)\n\1\n/);assert.ok(m);assert.equal(JSON.parse(m[2]).evidenceVersion,'2026-10');assert.ok(!text.includes('%0A'));
 const invalid=spawnSync(process.execPath,[action],{env:{...process.env,INPUT_PATH:root,INPUT_FAIL_ON:'typo'}});assert.equal(invalid.status,2);
});

test('documentation cannot stand in for runtime verification evidence',t=>{
 const root=fixture(t,'application_url="https://example.test"\nembedded=true\n[webhooks]\napi_version="2026-10"\n');fs.writeFileSync(path.join(root,'README.md'),'authenticate.webhook timingSafeEqual X-Shopify-Webhook-Id sessionToken');const ids=analyze(root).findings.map(f=>f.ruleId);assert.ok(ids.includes('AR-WEBHOOK-001'));assert.ok(ids.includes('AR-AUTH-001'));assert.ok(ids.includes('AR-WEBHOOK-004'));
});
