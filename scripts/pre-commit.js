#!/usr/bin/env node
const { execSync } = require('child_process');
const { existsSync } = require('fs');

try {
  // Clean logs and test artifacts before commit
  if (existsSync('package.json')) {
    execSync('pnpm run -w -s clean-logs', { stdio: 'inherit' });
  }
} catch (err) {
  // Don't block commit on cleanup failures
  console.error('pre-commit hook: failed to clean logs', err);
}

// You can add additional checks here (lint/test) but keep it fast
process.exit(0);
