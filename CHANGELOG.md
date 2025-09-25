# Change Log

All notable changes to the "Directory Digest" extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-01-24

## [0.2.2] - 2025-09-25

### v0.2.2 Added

- GitHub Pages demo site and a playable demo page so the project's demo video can be played inline (added `docs/index.html`).
- Added a compressed demo video asset and GitHub Pages copy (smaller `assets/Usage.mp4` in `docs/assets/`) and a committed compressed copy in the repo for convenient distribution.

### v0.2.2 Changed

- Treat `.mjs`, `.cjs`, `.jsx`, and `.tsx` files as text sources so they are read and concatenated by the "Combine Files" and "Concatenate Entirety" commands.
- README demo image updated to use a clickable thumbnail linking to the raw demo video (improves compatibility with GitHub's README rendering).

### v0.2.2 Fixed

- Replaced the original large demo video with a compressed version and removed the large binary from the repository history (history was rewritten and force-pushed to remove the large file from reachable refs). A local backup was retained during the operation.

### v0.2.0 Fixed

- **CRITICAL**: Fixed VS Code extension activation error by removing `"type": "module"` from package.json
- **ESLint Migration**: Migrated from deprecated ESLint v8 to modern ESLint v9 flat config format
- **TypeScript Configuration**: Updated to use modern `Node16` module resolution (removed deprecated options)
- **Module System**: Resolved ES module vs CommonJS conflicts for VS Code extension compatibility
- **Cross-platform Compatibility**: Ensured all build scripts work correctly on Windows, macOS, and Linux
- **Import Resolution**: Fixed all TypeScript imports to use proper `.js` extensions for Node16 compatibility
- **Type Safety**: Removed unused imports and fixed type annotations throughout codebase

### v0.2.0 Changed

- **ESLint Configuration**: Renamed `eslint.config.js` to `eslint.config.mjs` to eliminate module type warnings
- **Build Pipeline**: All build steps now run without errors, warnings, or deprecated options
- **TypeScript**: Updated module resolution to use modern, non-deprecated settings
- **Dependencies**: All TypeScript ESLint dependencies are properly configured and working

### v0.2.0 Technical Improvements

- Eliminated all deprecation warnings from TypeScript compiler
- Fixed module resolution issues that prevented extension activation
- Improved build pipeline reliability and cross-platform compatibility
- Enhanced type safety and import resolution throughout the codebase
- Modernized tooling configuration to use current best practices

### v0.2.0 Testing

- Verified extension loads successfully in VS Code extension development host
- Confirmed all build steps (compile, lint, bundle, test) pass without errors
- Validated cross-platform script compatibility
- Tested complete build pipeline from source to packaged extension

## [0.1.3] - 2024-12-24

### v0.1.3 Added

- **Multiple Output Formats**: Support for Text, Markdown, and JSON output formats
- **Advanced Pattern Matching**: Glob pattern support using minimatch library for include/exclude filtering
- **Project Configuration**: Optional `.ddconfig` file support for project-specific settings
- **Configurable Limits**: File size limits (default 1MB) and directory depth limits (default 10 levels)
- **Enhanced Progress Tracking**: Real-time progress indicators with file count and percentage
- **Cancellation Support**: Ability to cancel long-running operations
- **Retry Functionality**: User-friendly error handling with retry options
- **Dot-Directory Output**: "Combine Files" command now creates output in `.{FolderName}Files/` directory

### v0.1.3 Changed

- **Package Manager**: Migrated from npm/yarn to pnpm for better dependency management
- **Command Behavior**: "Combine Files" now outputs to hidden dot-prefixed directories
- **Error Handling**: Enhanced user experience with detailed error messages and retry options
- **Progress Reporting**: Improved progress indicators with cancellation support

### v0.1.3 Updated Dependencies

- **ESLint**: Upgraded from v8.56.0 to v9.36.0 (removed deprecated version)
- **TypeScript**: Updated to v5.9.0
- **Mocha**: Updated to v10.8.0
- **Added**: minimatch v10.0.3 for pattern matching
- **Added**: @eslint/js v9.36.0 for modern ESLint configuration

### v0.1.3 Technical Improvements

- Enhanced TypeScript interfaces for configuration management
- Improved error handling and logging throughout the extension
- Better memory management and performance optimizations
- Comprehensive pattern matching for file filtering
- Project-specific configuration file support

## [0.1.1] - 2024-11-14

### v0.1.1 Added

- Commands to the extension page on VS Code

### v0.1.1 Changed

- Updated README.md with proper commands and technical usage

## [0.1.0] - 2024-11-13

### v0.1.0 Added

- Initial release of Directory Digest
- Two main commands:
  - "Combine Files": Merges multiple text files into a single digest
  - "Create 0L Structure": Generates organized directory structure
- Comprehensive error handling with Winston logging
- Progress indicators for long-running operations
- Support for special characters in file paths
- Configurable file and directory exclusions
- Recursive directory processing
- Cancel operation support

### v0.1.0 Technical

- Built with TypeScript and VS Code Extension API
- Implemented efficient file processing with proper error handling
- Added extensive configuration options for customization
- Integrated Winston logger for debugging and error tracking

## [0.0.1] - 2024-11-12 [BETA]

### v0.0.1 Added

- Beta testing release
- Basic file combination functionality
- Initial directory structure processing
- Preliminary configuration options

### v0.0.1 Technical

- Established project structure
- Set up development environment
- Implemented core file processing logic

## [Unreleased]

### Changed

- Renamed "Create 0L Structure" command to "Concatenate Entirety"
- Changed output directory from "0L" to ".{directory-name}" for better organization
- Fixed bug in appendAllToOutputDir to properly record parent directory names in file headers

### Planned

- Additional file processing options
- Enhanced progress visualization
- Performance optimizations for large directories
- Additional customization options
