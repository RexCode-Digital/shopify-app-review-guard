import fs from 'node:fs';
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.js', "import '../src/action.js';\n");
console.log('dist/index.js generated');
