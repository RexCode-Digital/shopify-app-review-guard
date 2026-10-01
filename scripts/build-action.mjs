import fs from 'node:fs';
fs.mkdirSync('dist', { recursive: true });
fs.copyFileSync('src/action.js', 'dist/index.js');
console.log('dist/index.js generated');
