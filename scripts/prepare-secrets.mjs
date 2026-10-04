import fs from 'node:fs';
import { randomBytes } from 'node:crypto';

const directory = '.private';
const file = `${directory}/cloudflare-secrets.json`;
fs.mkdirSync(directory, { recursive: true });
if (!fs.existsSync(file)) {
  fs.writeFileSync(file, JSON.stringify({
    ADMIN_PASSWORD: `INB-${randomBytes(15).toString('base64url')}`,
    ADMIN_SESSION_SECRET: randomBytes(48).toString('hex'),
  }, null, 2), { flag: 'wx', mode: 0o600 });
}
const secrets = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!secrets.ADMIN_PASSWORD || !secrets.ADMIN_SESSION_SECRET) {
  throw new Error('Local secrets file is incomplete.');
}
fs.writeFileSync('.dev.vars', Object.entries(secrets)
  .map(([name, value]) => `${name}=${JSON.stringify(value)}`).join('\n'), { mode: 0o600 });
console.log('Local credentials prepared in .private/cloudflare-secrets.json and .dev.vars. Values are not printed.');
