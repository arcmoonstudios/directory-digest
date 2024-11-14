# Change Log

All notable changes to the "Directory Digest" extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2024-11-14
### Added
- Commands to the extension page on VS Code

### Changed
- Updated README.md with proper commands and technical usage

## [0.1.0] - 2024-11-13
### Added
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

### Technical
- Built with TypeScript and VS Code Extension API
- Implemented efficient file processing with proper error handling
- Added extensive configuration options for customization
- Integrated Winston logger for debugging and error tracking

## [0.0.1] - 2024-11-12 [BETA]
### Added
- Beta testing release
- Basic file combination functionality
- Initial directory structure processing
- Preliminary configuration options

### Technical
- Established project structure
- Set up development environment
- Implemented core file processing logic

## [Unreleased]
### Planned
- Additional file processing options
- Enhanced progress visualization
- Performance optimizations for large directories
- Additional customization options