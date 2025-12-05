# Directory Digest

Directory Digest is a Visual Studio Code extension that adds powerful directory content management capabilities. It allows you to combine text files within a directory into a single digest file or create an organized structure of your directory contents—all with just three clicks.

![Banner](assets/Banner.png)

## Demo

Watch this short demo video to see Directory Digest in action:

![Demo Video](assets/Usage.gif)

If the thumbnail doesn't play in your browser, open the raw video directly:

[Direct demo video link](https://raw.githubusercontent.com/arcmoonstudios/directory-digest/main/assets/Usage.mp4)

## Features

### Combine Files

--Description:-- Appends the content of all text files within a selected directory (recursively) into a new file named after the directory (e.g., `.MyDirectory.txt`). Non-text files and specified directories are excluded.

Supported text formats include common language files (`.js`, `.ts`, `.py`, `.md` etc.) and now `.toon` files are also treated as text content.

--How to Use:--

1. Left-click to select a directory in the Explorer pane.
2. Right-click to open the context menu.
3. Left-click on "Directory Digest: Combine Files".

### Concatenate Entirety

--Description:-- Recursively processes all subdirectories and files within a selected directory, creating a tree structure file and saving the directory contents to an organized output directory named after the selected directory with a dot prefix (e.g., `.MyDirectory`).

--How to Use:--

1. Left-click to select a directory in the Explorer pane.
2. Right-click to open the context menu.
3. Left-click on "Directory Digest: Concatenate Entirety".

Note: The `Concatenate Entirety` option now writes Markdown output files (`.md`) and uses a standardized header and code-fence format for each generated file. Each generated file begins with the following header and contains the concatenated file contents in language-tagged fenced blocks ordered alphabetically by file path.

Top-level file header:

## {Name of Directory}

### Concatenated Directory Files

Each grouped/concatenated entry begins with `### File: path/to/file.ext` followed by a fenced code block that uses the file extension as the language tag (e.g., js or txt). Entries are separated with a `---` horizontal rule. Example (conceptual):

### File: docs/index.md

```md
# Intro
...
```

---

### File: docs/guide.txt

```text
Guide text content...
```

Example: Running `Concatenate Entirety` on `./docs` creates `./docs/.docs/docs.md` and per-directory `.md` files within `.docs/`.

### New Configuration-Based Functionality

#### 1. Multiple Output Formats

- **Text** (default): Traditional text format with headers
- **Markdown**: GitHub-flavored markdown with syntax highlighting
- **JSON**: Structured JSON output for programmatic use

#### 2. Pattern Matching & Filtering

- Glob pattern support via `minimatch` library
- Include patterns: `directoryDigest.includePatterns`
- Exclude patterns: `directoryDigest.excludePatterns`
- Example: `["*.ts", "*.js", "src/**/*.py"]`

#### 3. Configurable Limits

- **Max File Size**: `directoryDigest.maxFileSize` (default: 1MB)
- **Max Depth**: `directoryDigest.maxDepth` (default: 10 levels)
- **Note**: `directoryDigest.maxDepth` is inclusive (e.g., a value of `10` processes levels 0..9).
- Prevents system overload on large directories

#### 4. .ddconfig File Support

Project-specific configuration file with additional settings:

```json
{
  "includeDirectories": ["src", "docs"],

If a `.ddconfig` file is not present in the workspace, the extension will attempt to use a `.ddconfig.example` file as a helpful fallback.
  "excludeDirectories": ["temp", "cache"],
  "includeFiles": ["README.md", "CHANGELOG.md"],
  "excludeFiles": ["package-lock.json"],
  "includePatterns": ["*.ts", "*.js", "*.md"],
  "excludePatterns": ["*.test.*", "*.spec.*", "**/node_modules/**"]
}
```

#### 5. Progress Indicators

- Real-time progress tracking with file count
- Cancellation support for long operations
- Visual progress bars in VS Code notifications

#### 6. Enhanced Error Handling

- User-friendly error messages
- Retry functionality with progress indicators
- Comprehensive logging and error recovery

#### 7. Command Updates

- **Combine Files**: Creates output in `.{FolderName}Files/` directory
- **Create Structure**: Maintains existing 0L directory behavior

## Backward Compatibility

All existing functionality is preserved with sensible defaults. No breaking changes to existing workflows.

## Logging

Uses `winston` for logging, with logs saved to `extension.log` in the workspace directory.

## Requirements

- Visual Studio Code version 1.95.0 or higher
- Node.js 16.0 or higher (for development)
- pnpm package manager (for development)

## Extension Settings

This extension contributes the following settings:

### `directoryDigest.outputFormat`

- --Type:-- `string`
- --Description:-- Specify the output format for directory digest files
- --Default:-- `"Text"`
- --Enum:-- `["Text", "Markdown", "JSON"]`

### `directoryDigest.maxFileSize`

- --Type:-- `number`
- --Description:-- Maximum file size in bytes to process (default: 1MB)
- --Default:-- `1048576`

### `directoryDigest.maxDepth`

- --Type:-- `number`
- --Description:-- Maximum directory depth to traverse
- --Default:-- `10`

### `directoryDigest.includePatterns`

- --Type:-- `string[]`
- --Description:-- Glob patterns for files to include (empty array includes all)
- --Default:-- `[]`
- --Examples:-- `["*.ts", "*.js", "src/**/*.py"]`

### `directoryDigest.excludePatterns`

- --Type:-- `string[]`
- --Description:-- Glob patterns for files to exclude
- --Default:-- `[]`
- --Examples:-- `["*.test.*", "*.spec.*", "**/node_modules/**"]`

### `directoryDigest.configFilePath`

- --Type:-- `string`
- --Description:-- Path to the optional configuration file for include/exclude settings
- --Default:-- `".ddconfig"`

### `directoryDigest.appendContent.excludedFileExtensions`

- --Type:-- `string[]`
- --Description:-- Specify file extensions to exclude from processing (e.g., binaries, images, documents)
- --Default:-- `[".env", ".ini", ".cfg", ".config", ".lock", ".toml", ".yaml", ".yml", ".exe", ".dll", ".so", ".dylib", ".class", ".pyc", ".pyo", ".pyd", ".obj", ".o", ".a", ".lib", ".out", ".rlib", ".rmeta", ".jar", ".war", ".ear", ".egg", ".wheel", ".whl", ".gem", ".ttf", ".otf", ".woff", ".woff2", ".eot", ".swp", ".cache", ".tmp", ".temp", ".swo", ".bin", ".dat", ".db", ".sqlite", ".sqlite3", ".mdb", ".pdb", ".ilk", ".exp", ".map", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".ico", ".mp3", ".mp4", ".wav", ".avi", ".mov", ".zip", ".rar", ".7z", ".tar", ".gz", ".tgz", ".bz2", ".iml", ".idea", ".project", ".classpath", ".settings", ".vscode", ".vs", ".suo", ".user", ".sln", ".xcodeproj", ".xcworkspace", ".DS_Store"]`
- --Examples:-- `[".exe", ".pdf", ".jpg"]`

### `directoryDigest.appendContent.excludedDirectories`

- --Type:-- `string[]`
- --Description:-- Specify directories to exclude from processing (e.g., version control, dependencies)
- --Default:-- `[ ".git", ".svn", ".hg", ".bzr", "CVS", "node_modules", "target", "build", "dist", "bin", "obj", "out", "__pycache__", ".pytest_cache", ".tox", ".venv", "venv", "env", "Lib", "Scripts", "site-packages", "classes", "META-INF", "WEB-INF", "bower_components", "jspm_packages", ".npm", ".yarn", "vendor/bundle", ".bundle", "packages", "Debug", "Release", "x86", "x64", "AnyCPU", ".idea", ".vscode", ".vs", ".settings", ".project", ".classpath", "logs", "log", "tmp", "temp", "cache", ".cache", "docs", "doc", "documentation", "coverage", ".nyc_output", "htmlcov", ".github", ".gitlab", ".circleci", ".jenkins", ".docker", ".history", ".grunt", ".sass-cache", "bower_components", "jspm_packages", "public/hot", "storage", "compiled", "uploads", "vendor", "Cargo.lock", "Cargo.toml"]`
- --Examples:-- `["node_modules", ".git", "dist"]`

## Configuring Exclusions

You can customize these settings in your VS Code `settings.json`:

```json
{
  "directoryDigest.appendContent.excludedFileExtensions": [".log", ".tmp"],
  "directoryDigest.appendContent.excludedDirectories": ["node_modules", "dist"]
}
```

## Packaging a VSIX

If you need to generate a .vsix file for manual testing or to publish to the VS Code Marketplace without relying on your root dev toolchain, use the included packaging helper which creates a clean temporary package and runs the official `vsce` packager inside it.

Run:

```powershell
pnpm run package:vsix
```

This will create a minimal package in a temporary folder, install production dependencies in that folder, and produce `DirectoryDigest-<version>.vsix` at the repository root. This script avoids numerous dependency issues you might otherwise see when running `vsce package` at the repository root.


## Usage

### Accessing the Extension

The primary way to use Directory Digest is through the Explorer context menu:

1. Left-click to select a directory in the Explorer pane.
2. Right-click to open the context menu.
3. Left-click on one of the Directory Digest options:
   - --Directory Digest: Combine Files--
   - --Directory Digest: Concatenate Entirety--

### Commands (For Advanced Users)

While the extension is primarily intended to be used via the context menu, commands are available via the Command Palette:

- --Combine Files:-- `Directory Digest: Combine Files`
- --Concatenate Entirety:-- `Directory Digest: Concatenate Entirety`

### Keybindings (Not Recommended)

Keybindings are available, but using the context menu is the recommended approach. They are only active when a folder is selected in the Explorer.

- --Combine Files:--
  - Windows/Linux: `Ctrl`+`Shift`+`D`
  - macOS: `Cmd`+`Shift`+`D`
- --Concatenate Entirety:--
  - Windows/Linux: `Ctrl`+`Shift`+`O`
  - macOS: `Cmd`+`Shift`+`O`

## Development

This extension is built with modern TypeScript and uses:

- --TypeScript 5.9.2-- with Node16 module resolution
- --ESLint 9.36.0-- with flat config format
- --pnpm-- for package management
- --esbuild-- for bundling
- --Mocha-- for testing

### Building from Source

```bash
# Install dependencies
pnpm install

# Compile TypeScript
pnpm run compile

# Run linting
pnpm run lint

# Bundle for production
pnpm run bundle

# Run tests (requires closing VS Code first)
pnpm run test

# Full build pipeline
pnpm run vscode:prepublish
```

### Technical Notes

- The extension uses CommonJS module format for VS Code compatibility
- All imports use explicit `.js` extensions for proper module resolution
- Cross-platform compatibility ensured with `rimraf` for file operations
- Modern ESLint v9 flat configuration eliminates deprecation warnings

## Known Issues

- --Maximum Directory Depth:-- The extension processes directories up to a depth of 10 levels to prevent infinite recursion.
- --Large Directories:-- Processing very large directories may impact performance.
- --Test Execution:-- Extension tests require closing all VS Code instances before running.

## Release Notes

### 0.2.3 (Latest)

Critical bug fix release:

- Fixed TypeScript syntax error in extension code that prevented proper compilation
- Resolved missing comma in file extensions array that caused build failures
- Ensures extension loads and functions correctly in VS Code

### 0.2.2

Enhanced file support and demo improvements:

- Added support for modern JavaScript/TypeScript file extensions (.mjs, .cjs, .jsx, .tsx)
- Improved README with embedded GIF demo for better user experience
- Updated documentation and GitHub Pages demo site
- Optimized package size and distribution

### 0.2.0

Major technical improvements and bug fixes:

- Fixed critical VS Code extension activation issues
- Migrated to modern ESLint v9 configuration
- Updated TypeScript to use non-deprecated module resolution
- Improved cross-platform compatibility
- Enhanced build pipeline reliability

### 0.1.3

Added multiple output formats, pattern matching, and configuration options.

### 0.1.1

Updated README.md with proper commands and technical usage.

### 0.1.0

Initial release of Directory Digest.

All detailed changes are documented in [CHANGELOG.md](CHANGELOG.md).
