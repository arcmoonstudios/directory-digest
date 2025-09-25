const fs = require('fs');
const path = require('path');

const hookSrc = path.join(__dirname, 'pre-commit.js');
const gitHookDir = path.join(process.cwd(), '.git', 'hooks');
const hookDest = path.join(gitHookDir, 'pre-commit');

function ensureExecutable(filePath) {
  try {
    fs.chmodSync(filePath, 0o755);
  } catch (e) {
    // ignore - reference the binding to satisfy linters
    void e;
  }
}

if (!fs.existsSync(hookSrc)) {
  console.error('Hook source not found:', hookSrc);
  process.exit(1);
}

if (!fs.existsSync(gitHookDir)) {
  console.log('.git/hooks not found. Skipping hook installation (not a git repo?)');
  process.exit(0);
}

fs.copyFileSync(hookSrc, hookDest);
ensureExecutable(hookDest);
console.log('Installed pre-commit hook to', hookDest);
process.exit(0);
