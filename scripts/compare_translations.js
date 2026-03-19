import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const cwd = process.cwd();

function extractLocaleObject(source, localeName) {
  const prefix = `export const ${localeName} = `;
  const start = source.indexOf(prefix);
  const end = source.lastIndexOf('} as const;');

  if (start === -1 || end === -1) {
    throw new Error(`Unable to parse ${localeName} locale source.`);
  }

  return JSON.parse(source.slice(start + prefix.length, end + 1).trim());
}

function flattenKeys(value, prefix = '') {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, nested]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    return flattenKeys(nested, nextPrefix);
  });
}

async function readLocale(localeName) {
  const filePath = path.join(cwd, 'src', 'locales', `${localeName}.ts`);
  const source = await fs.readFile(filePath, 'utf8');
  return extractLocaleObject(source, localeName);
}

function getMissingKeys(sourceKeys, comparisonKeys) {
  const comparisonSet = new Set(comparisonKeys);
  return sourceKeys.filter((key) => !comparisonSet.has(key));
}

async function main() {
  const [en, ar] = await Promise.all([readLocale('en'), readLocale('ar')]);
  const enKeys = flattenKeys(en).sort();
  const arKeys = flattenKeys(ar).sort();
  const missingInArabic = getMissingKeys(enKeys, arKeys);
  const missingInEnglish = getMissingKeys(arKeys, enKeys);

  if (missingInArabic.length === 0 && missingInEnglish.length === 0) {
    console.log('Translation keys are in sync.');
    return;
  }

  if (missingInArabic.length > 0) {
    console.error('Missing in Arabic locale:');
    for (const key of missingInArabic) {
      console.error(`- ${key}`);
    }
  }

  if (missingInEnglish.length > 0) {
    console.error('Missing in English locale:');
    for (const key of missingInEnglish) {
      console.error(`- ${key}`);
    }
  }

  process.exitCode = 1;
}

await main();
