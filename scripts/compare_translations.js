const fs = require('fs');

const content = fs.readFileSync(
  'd:/Main Files/drispro/drisopro/src/locales/translations.ts',
  'utf8',
);

// Use a regex or simple parsing to extract en and ar objects.
// Since it's a TS file with a specific structure, we can try to extract the objects.
// A more robust way is to use a TS parser, but let's try a simple approach first.

function getObject(key, str) {
  let start = str.indexOf(key + ': {');
  if (start === -1) return null;
  start += key.length + 2;
  let count = 0;
  let end = start;
  for (let i = start; i < str.length; i++) {
    if (str[i] === '{') count++;
    if (str[i] === '}') {
      if (count === 0) {
        end = i + 1;
        break;
      }
      count--;
    }
  }
  return str.substring(start, end);
}

// This is a bit too complex for a scratch script without a proper parser.
// Let's just use grep to find keys and compare.
