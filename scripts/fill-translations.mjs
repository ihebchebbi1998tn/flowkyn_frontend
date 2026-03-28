import fs from 'node:fs';
import path from 'node:path';

const LOCALES_DIR = path.resolve(process.cwd(), 'src', 'i18n');
const LOCALES = ['en', 'fr', 'de', 'es'];

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}

function flattenObj(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flattenObj(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

function unflattenObj(flat) {
  const out = {};
  for (const [key, val] of Object.entries(flat)) {
    const parts = key.split('.');
    let cur = out;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
  }
  return out;
}

function getMissingKeys(sourceFlat, targetFlat) {
  const missing = [];
  for (const key of Object.keys(sourceFlat)) {
    if (!(key in targetFlat)) {
      missing.push(key);
    }
  }
  return missing;
}

function fillWithEnglish(targetFlat, sourceFlat, missingKeys) {
  for (const key of missingKeys) {
    targetFlat[key] = sourceFlat[key];
  }
}

function main() {
  // Load English as source
  const enPath = path.join(LOCALES_DIR, 'en.json');
  const enFlat = flattenObj(readJson(enPath));

  // Process each other locale
  for (const lng of ['fr', 'de', 'es']) {
    const lngPath = path.join(LOCALES_DIR, `${lng}.json`);
    const lngData = readJson(lngPath);
    const lngFlat = flattenObj(lngData);

    const missing = getMissingKeys(enFlat, lngFlat);
    console.log(`${lng}: found ${missing.length} missing keys`);

    if (missing.length > 0) {
      fillWithEnglish(lngFlat, enFlat, missing);
      const unflatted = unflattenObj(lngFlat);
      writeJson(lngPath, unflatted);
      console.log(`${lng}: filled and saved`);
    }
  }

  console.log('Translation fill complete');
}

main();
