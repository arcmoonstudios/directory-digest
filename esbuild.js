/* eslint-env node */
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['./out/extension.js'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  minify: true,
}).catch(() => process.exit(1));

