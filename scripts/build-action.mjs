import { build } from 'esbuild';
await build({ entryPoints: ['src/action.js'], bundle: true, platform: 'node', target: 'node24', format: 'esm', banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" }, outfile: 'dist/index.js', minify: false });
console.log('Bundled Node 24-compatible Action to dist/index.js');
