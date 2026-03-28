/**
 * CI/CD version stamping script.
 * Generates public/version.json with build metadata.
 * Run: node scripts/update-version.js
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');

let gitSha = 'unknown';
try {
  gitSha = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
} catch {
  // Not a git repo or git not available
}

const timestamp = Date.now();
const versionData = {
  v: `${gitSha}-${timestamp}`,
  timestamp,
  deployed: new Date().toISOString(),
  environment: process.env.VERCEL ? 'vercel' : process.env.NODE_ENV || 'development',
  git: gitSha,
};

writeFileSync(resolve(publicDir, 'version.json'), JSON.stringify(versionData, null, 2));
console.log(`✅ version.json generated: ${versionData.v}`);
