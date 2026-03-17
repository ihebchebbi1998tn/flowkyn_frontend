import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'src');
const LOCALES_DIR = path.resolve(process.cwd(), 'src', 'i18n');
const LOCALES = ['en', 'fr', 'de'];

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function flattenKeys(obj, prefix = '', out = new Set()) {
  if (!obj || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flattenKeys(v, key, out);
    } else {
      out.add(key);
    }
  }
  return out;
}

function walk(dir, cb) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, cb);
    else cb(p);
  }
}

function isCodeFile(p) {
  return p.endsWith('.ts') || p.endsWith('.tsx') || p.endsWith('.js') || p.endsWith('.jsx');
}

function scanFileForKeys(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const used = [];

  // t('key') / t("key")
  const reLiteral = /\bt\(\s*(['"])([^'"\\]*(?:\\.[^'"\\]*)*)\1/g;
  for (const m of text.matchAll(reLiteral)) {
    const raw = m[2];
    const key = raw.replace(/\\(['"\\])/g, '$1');
    if (key) used.push({ key, kind: 'literal' });
  }

  // t(`prefix.${x}.suffix`) → capture static prefix/suffix to flag as dynamic usage
  const reTemplate = /\bt\(\s*`([^`$\\]*(?:\\.[^`$\\]*)*)\$\{[^}]+\}([^`\\]*(?:\\.[^`\\]*)*)`\s*/g;
  for (const m of text.matchAll(reTemplate)) {
    const pre = m[1]?.replace(/\\`/g, '`') ?? '';
    const post = m[2]?.replace(/\\`/g, '`') ?? '';
    used.push({ key: `${pre}\${…}${post}`, kind: 'template' });
  }

  // defaultValue usage can hide missing keys in non-en locales
  const hasDefaultValue = /\bt\(\s*(['"`])/.test(text) && /defaultValue\s*:/.test(text);

  return { used, hasDefaultValue };
}

function main() {
  const localeKeySets = {};
  for (const lng of LOCALES) {
    const p = path.join(LOCALES_DIR, `${lng}.json`);
    localeKeySets[lng] = flattenKeys(readJson(p));
  }

  const usage = new Map(); // key -> { files:Set, kinds:Set }
  const dynamicUsage = [];
  const defaultValueFiles = new Set();

  walk(ROOT, (p) => {
    if (!isCodeFile(p)) return;
    const { used, hasDefaultValue } = scanFileForKeys(p);
    if (hasDefaultValue) defaultValueFiles.add(path.relative(process.cwd(), p));
    for (const u of used) {
      if (u.kind === 'template') {
        dynamicUsage.push({ pattern: u.key, file: path.relative(process.cwd(), p) });
        continue;
      }
      const key = u.key;
      if (!usage.has(key)) usage.set(key, { files: new Set(), kinds: new Set() });
      usage.get(key).files.add(path.relative(process.cwd(), p));
      usage.get(key).kinds.add(u.kind);
    }
  });

  const usedKeys = [...usage.keys()].sort();

  const missing = {};
  for (const lng of LOCALES) missing[lng] = [];

  for (const key of usedKeys) {
    for (const lng of LOCALES) {
      if (!localeKeySets[lng].has(key)) {
        missing[lng].push(key);
      }
    }
  }

  const topMissing = (arr) => arr.slice(0, 200);
  const report = {
    scanned: {
      root: path.relative(process.cwd(), ROOT),
      locales: LOCALES,
      totalUsedKeys: usedKeys.length,
      dynamicPatterns: dynamicUsage.length,
      filesWithDefaultValue: defaultValueFiles.size,
    },
    missing: {
      en: { count: missing.en.length, sample: topMissing(missing.en), all: missing.en },
      fr: { count: missing.fr.length, sample: topMissing(missing.fr), all: missing.fr },
      de: { count: missing.de.length, sample: topMissing(missing.de), all: missing.de },
    },
    whereUsed: {},
    dynamicUsage: dynamicUsage.slice(0, 200),
    filesWithDefaultValue: [...defaultValueFiles].sort(),
  };

  // include "where used" only for missing keys (first ~300)
  const missingUnion = new Set([...missing.en, ...missing.fr, ...missing.de]);
  const missingUnionList = [...missingUnion].sort().slice(0, 300);
  for (const key of missingUnionList) {
    const meta = usage.get(key);
    report.whereUsed[key] = meta ? [...meta.files].sort() : [];
  }

  const outPath = path.resolve(process.cwd(), 'i18n-audit-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
  console.log(`Used keys: ${usedKeys.length}`);
  for (const lng of LOCALES) {
    console.log(`${lng}: missing ${missing[lng].length}`);
  }
  console.log(`Dynamic patterns (sampled): ${report.dynamicUsage.length}`);
  console.log(`Files with defaultValue: ${defaultValueFiles.size}`);
}

main();

