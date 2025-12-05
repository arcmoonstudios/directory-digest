#!/usr/bin/env node
const { execSync } = require('child_process');

function getStagedFiles() {
  try {
    const out = execSync('git diff --cached --name-only --diff-filter=ACMRT', { encoding: 'utf8' });
    return out.split('\n').map(s => s.trim()).filter(Boolean);
  } catch (err) {
    return [];
  }
}

function getStagedFileContent(file) {
  try {
    return execSync(`git show :"${file}"`, { encoding: 'utf8' });
  } catch (err) {
    // fall back to disk file if not in index
    try {
      return require('fs').readFileSync(file, 'utf8');
    } catch (e) {
      return '';
    }
  }
}

const staged = getStagedFiles();
if (staged.length === 0) process.exit(0);

const GH_PAT_REGEX = /ghp_[A-Za-z0-9_]{36}/g;
const LONG_BASE64_OR_HEX = /[A-Za-z0-9+/=]{40,}|[A-Fa-f0-9]{40,}/g;

let found = false;
for (const file of staged) {
  const content = getStagedFileContent(file);
  if (!content) continue;

  const ghMatch = content.match(GH_PAT_REGEX);
  if (ghMatch && ghMatch.length) {
    console.error(`Potential GitHub PAT found in staged file: ${file} -> ${ghMatch[0]}`);
    found = true;
  }

  const longMatch = content.match(LONG_BASE64_OR_HEX);
  if (longMatch && longMatch.length) {
    // show up to 3 matches per file
    const display = longMatch.slice(0, 3).map(s => `${s.slice(0, 12)}...${s.slice(-6)}`);
    console.error(`Long token-like string(s) found in: ${file} -> ${display.join(', ')}`);
    found = true;
  }
}

if (found) {
  console.error('Commit aborted: possible secret/token found in staged files. Revoke/rotate the token if accidental and remove it from commits.');
  process.exit(1);
}
process.exit(0);
