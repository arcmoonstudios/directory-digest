/* src/config.ts */
/**
 * @file Centralized configuration for file and directory exclusion rules.
 * @packageDocumentation
 *
 * @remarks
 * # Directory Digest – Exclusion Configuration Module
 *▫~•◦------------------------------------------------------------‣
 *
 * This module is designed for integration into ArcMoon Code Analysis System to achieve consistent and efficient file system traversal by defining global exclusion rules.
 *
 * ### Key Capabilities
 * - **File Extension Exclusion:** Provides a comprehensive list of file extensions that should be ignored during scans, such as compiled binaries, archives, and temporary files.
 * - **Directory Exclusion:** Defines a set of directory names (e.g., build outputs, version control folders, package manager caches) to be excluded from processing.
 * - **Specific Filename Exclusion:** Lists explicit filenames (like lockfiles or system-generated artifacts) that are to be bypassed by tools.
 *
 * ### Architectural Notes
 * This module centralizes configuration for file system traversal and analysis tools. It is consumed by modules responsible for scanning, indexing, or processing codebases to ensure adherence to a unified exclusion policy. The constant arrays are designed for direct import and immutability.
 *
 * @see {@link CodeScannerModule} for modules consuming these configurations.
 * @see {@link FileSystemIntegrityChecker} for related validation contexts.
 * 
/*▫~•◦------------------------------------------------------------------------------------‣
 * © 2025 ArcMoon Studios ◦ SPDX-License-Identifier MIT OR Apache-2.0 ◦ Author: Lord Xyn ✶
 *///•------------------------------------------------------------------------------------‣

export const excludedFileExtensions: string[] = [
  '.env', '.ini', '.cfg', '.config', '.lock',
  '.exe', '.dll', '.so', '.dylib', '.class', '.pyc', '.pyo', '.pyd',
  '.obj', '.o', '.a', '.lib', '.out', '.rlib', '.rmeta',
  '.jar', '.war', '.ear', '.egg', '.wheel', '.whl', '.gem',
  '.ttf', '.otf', '.woff', '.woff2', '.eot',
  '.swp', '.cache', '.tmp', '.temp', '.swo',
  '.bin', '.dat', '.db', '.sqlite', '.sqlite3', '.mdb',
  '.pdb', '.ilk', '.exp', '.map',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico',
  '.mp3', '.mp4', '.wav', '.avi', '.mov',
  '.zip', '.rar', '.7z', '.tar', '.gz', '.tgz', '.bz2',
  '.iml', '.idea', '.project', '.classpath', '.settings',
  '.vscode', '.vs', '.suo', '.user', '.sln', '.xcodeproj',
  '.xcworkspace', '.DS_Store',
  '.pdf', '.svg', '.webp', '.heic', '.avif',
  '.tsbuildinfo',
  '.lcov', '.gcno', '.gcda',
  '.nupkg', '.rpm', '.deb', '.apk', '.dmg', '.iso', '.msi', '.pkg', '.appimage', '.snap',
  '.ipynb', '.bak', '.orig', '.rej', '.log'
];

export const excludedDirectories: string[] = [
  '0L', '.git', '.svn', '.hg', '.bzr', 'CVS',
  'node_modules', 'target', 'build', 'dist', 'bin', 'obj', 'out',
  '__pycache__', '.pytest_cache', '.tox', '.venv', 'venv', 'env', 'Lib', 'Scripts', 'site-packages',
  'classes', 'META-INF', 'WEB-INF',
  'bower_components', 'jspm_packages', '.npm', '.yarn',
  'vendor/bundle', '.bundle',
  'packages', 'Debug', 'Release', 'x86', 'x64', 'AnyCPU',
  '.idea', '.vscode', '.vs', '.settings', '.project', '.classpath',
  'logs', 'log', 'tmp', 'temp', 'cache', '.cache',
  'docs', 'doc', 'documentation',
  'coverage', '.nyc_output', 'htmlcov',
  '.github', '.gitlab', '.circleci', '.jenkins',
  '.docker',
  '.history', '.grunt', '.sass-cache',
  'public/hot', 'storage', 'compiled', 'uploads', 'vendor',
  '.pnpm', '.pnpm-store', '.yarn/cache', '.yarn/unplugged', '.yarn/releases', '.yarn/plugins',
  '.next', '.nuxt', '.svelte-kit', '.astro', '.docusaurus', '.vite', '.vitepress', '.parcel-cache', '.rollup.cache', '.storybook', 'storybook-static',
  '.gradle', 'gradle', '.mvn', 'Pods', 'DerivedData', '.build', '.swiftpm', 'Carthage/Build', '.cxx',
  'bazel-bin', 'bazel-out', 'bazel-testlogs', 'buck-out', '.buckd',
  '.serverless', '.aws-sam', '.terraform', '.terragrunt-cache', '.pulumi', 'cdk.out',
  '.mypy_cache', '.ruff_cache', '.nox', '.hypothesis', '.ipynb_checkpoints', '.pybuilder',
  '$RECYCLE.BIN', 'System Volume Information', '.Trashes', '.Trash', '.Trash-*', '.Spotlight-V100', '.fseventsd', 'lost+found'
];

export const excludedFileNames: string[] = [
  'Cargo.lock', 'gradle.lockfile', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock',
  'composer.lock', 'Gemfile.lock', 'Podfile.lock', 'Package.resolved', 'go.sum', 'Pipfile.lock', 'poetry.lock',
  'Thumbs.db', 'desktop.ini', '.DS_Store',
  'npm-debug.log', 'yarn-error.log', 'lerna-debug.log'
];
