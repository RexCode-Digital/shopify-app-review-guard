import fs from 'node:fs';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
fs.writeFileSync('src/version.js',`// Generated from package.json.\nexport const TOOL_VERSION = ${JSON.stringify(version)};\n`);
