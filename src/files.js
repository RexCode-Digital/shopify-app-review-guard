import fs from 'node:fs';
import path from 'node:path';
const SKIP = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.next', 'vendor']);
export function safeFile(root, file) {
  const relative = path.relative(root, file);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error('Input file must be inside the scan root');
  let current = root;
  for (const part of relative.split(path.sep)) { current = path.join(current, part); if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Symbolic link inputs are not supported'); }
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.size > 1024 * 1024) throw new Error('Input must be a regular file up to 1 MiB');
  return fs.readFileSync(file, 'utf8');
}
export function readFiles(root) {
  if (!fs.lstatSync(root).isDirectory()) throw new Error('Scan root must be a regular directory');
  const files = [], skipped = [];
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(dir, entry.name), file = path.relative(root, absolute).replaceAll(path.sep, '/');
      if (entry.isSymbolicLink()) { skipped.push({ file, reason: 'Symbolic link' }); continue; }
      if (entry.isDirectory()) { if (!SKIP.has(entry.name) && !entry.name.startsWith('.')) visit(absolute); continue; }
      if (!entry.isFile() || (!/\.(?:[cm]?[jt]sx?|html?|json|toml|ya?ml|md|txt|graphql)$/i.test(entry.name) && !/^\.env(?:\.|$)/i.test(entry.name))) continue;
      if (files.length >= 2000 || fs.lstatSync(absolute).size > 1024 * 1024) { skipped.push({ file, reason: 'Analysis limit' }); continue; }
      files.push({ file, abs: absolute, text: safeFile(root, absolute) });
    }
  }
  visit(root); return { files, skipped };
}
