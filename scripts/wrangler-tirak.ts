/** Isolated Wrangler OAuth storage named tirak. Never reuses inherited credentials. */
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
const [backendArg, ...args] = process.argv.slice(2);
if (!backendArg || !args.length) throw new Error('Usage: bun scripts/wrangler-tirak.ts BACKEND_ROOT login|login-deploy|whoami|bundle|d1 ...');
const backend = resolve(backendArg);
const cli = join(backend, 'node_modules/wrangler/bin/wrangler.js');
if (!existsSync(cli)) throw new Error('Install backend Wrangler dependencies with Bun first.');
if (existsSync(join(homedir(), '.wrangler'))) throw new Error('Legacy ~/.wrangler overrides XDG isolation. Use an account-scoped API token or resolve that legacy profile before continuing; nothing was changed.');
const profile = join(homedir(), '.config', 'tirak', 'wrangler');
mkdirSync(profile, { recursive: true, mode: 0o700 });
const emptyEnv = join(profile, 'empty.env');
writeFileSync(emptyEnv, '', { mode: 0o600 });
const env: NodeJS.ProcessEnv = { ...process.env, XDG_CONFIG_HOME: profile, WRANGLER_SEND_METRICS: 'false' };
for (const key of Object.keys(env)) {
  if (/^(CLOUDFLARE|CF)_/.test(key) || key === 'WRANGLER_API_ENVIRONMENT') delete env[key];
}
// Explicit empty --env-file prevents implicit dotenv credentials; Bunx uses the supported Wrangler CLI runtime.
const command = args[0];
if (!['login', 'login-deploy', 'whoami', 'bundle', 'd1'].includes(command)) throw new Error('This verification profile permits only login, whoami, local dry-run bundling and D1 inspection.');
if (command !== 'd1' && args.length !== 1) throw new Error('Login and identity inspection accept no target overrides.');
if (command === 'd1') {
  const configText = readFileSync(join(backend, 'wrangler.toml'), 'utf8');
  const defaultConfig = configText.split('[[d1_databases]]')[1]?.split('[[env.')[0] || '';
  const database = defaultConfig.match(/database_name\s*=\s*"([^"]+)"/)?.[1];
  if (database !== 'tirak-development' || args[2] !== database || !/^account_id\s*=\s*"2c0c96c68f0ee73b6d980054557bca5b"\s*$/m.test(configText)) throw new Error('Pinned Tirak account and default database must match the inspected live backend.');
  const allowedFlags = new Set(['--remote', '--json', '--command']);
  for (let i = 3; i < args.length; i++) {
    if (!allowedFlags.has(args[i])) throw new Error('Unsupported verification query argument.');
    if (args[i] === '--command') i++;
  }
  if (args.filter(arg => arg === '--command').length !== 1 || !args.includes('--remote')) throw new Error('Exactly one remote SELECT is required.');
  const sqlIndex = args.indexOf('--command');
  const sql = args[sqlIndex + 1] || '';
  if (args[1] !== 'execute' || sqlIndex < 0 || !/^\s*SELECT\b/i.test(sql) || /;\s*\S|--|\/\*|\b(insert|update|delete|drop|alter|create|replace|attach|pragma)\b/i.test(sql)) {
    throw new Error('D1 verification accepts a single SELECT statement only.');
  }
  if (args.includes('--env') || args.includes('-e') || args.some(a => a.startsWith('--config') || a.startsWith('--file'))) throw new Error('Target overrides are prohibited. Use the pinned backend default config after verifying its DB binding.');
}
if (command === 'd1' && !existsSync(join(profile, '.wrangler', 'config', 'default.toml'))) throw new Error('Complete isolated tirak login before any live D1 query. No default-scope login or inherited credentials will be used.');
const globals = ['--env-file', emptyEnv];
if (!command.startsWith('login')) globals.push('--config', join(backend, 'wrangler.toml'));
const loginArgs = command.startsWith('login') ? ['login', '--browser=false', '--scopes', 'account:read', 'user:read', 'd1:write', ...(command === 'login-deploy' ? ['workers_scripts:write', 'workers_kv:write', 'queues:write'] : [])]
  : command === 'bundle' ? ['deploy', '--dry-run', '--outdir', join(backend, '.wrangler', 'store-candidate-bundle')]
  : args;
console.log('Wrangler credential profile: tirak (isolated XDG storage; D1 OAuth grants write capability, wrapper permits SELECT only).');
const result = spawnSync('bun', ['x', '--no-install', 'wrangler', ...loginArgs, ...globals], { cwd: backend, env, stdio: 'inherit' });
process.exit(result.status ?? 1);
