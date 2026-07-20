import { cpSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'public');
const candidates = [resolve(root, 'dist'), resolve(root, '.output')];
const explicitTarget = process.env.TIRAK_PWA_OUTPUT_DIR
  ? resolve(root, process.env.TIRAK_PWA_OUTPUT_DIR)
  : null;
if (explicitTarget && !explicitTarget.startsWith(`${root}/`)) {
  throw new Error('explicit PWA output directory must be inside the project root');
}
const target = explicitTarget || candidates.find((candidate) => existsSync(candidate));

if (!existsSync(source)) throw new Error('public asset directory is missing');
if (!target || !existsSync(target)) throw new Error('no built output directory exists; run the web export before copying PWA assets');
if (readdirSync(source).length === 0) throw new Error('public asset directory is empty');

cpSync(source, target, { recursive: true, force: true });
console.log(`Copied PWA assets from ${source} to ${target}`);
