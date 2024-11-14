# Directory Digest

![LordXyn](https://tinypic.host/images/2024/09/30/LordXyn.jpeg)s

`directory-digest` is a VS Code extension designed to generate digest files from the contents of directories. It can append the combined content of text files within a directory to a new file or recursively process all files in a directory structure. This can be especially useful for creating summaries or backups of directory contents.

## Features

### Single Directory Processing
- **Command**: `Append content to file`
- **Description**: Appends the content of all text files within a selected directory into a new file named after the directory (e.g., `MyDirectory.txt`). Non-text files and specified directories are excluded.
  
### Recursive Directory Processing
- **Command**: `Append all to 0L`
- **Description**: Recursively processes all subdirectories and files within a selected directory, creating a tree structure file and saving the directory contents to an organized output directory (`0L`). This command supports progress tracking and cancellation.

### Logging
- This extension uses **winston** logging for tracking processes, with logs saved to `extension.log`.

## Requirements

This extension relies on the following dependencies:
- **tree** command (for generating tree structure files on supported systems). Make sure `tree` is installed on your system:
  ```bash
  sudo apt install tree  # For Linux
  brew install tree      # For macOS

## Extension Settings

The following settings are available to customize excluded files and directories:

### Excluded File Extensions
- **Setting**: `appendContent.excludedFileExtensions`
- **Default**: `[".env", ".otf", ".ttf", ".woff", ".woff2"]`
- **Use**: Excludes files with these extensions from processing.

### Excluded Directories
- **Setting**: `appendContent.excludedDirectories`
- **Default**: `["node_modules", ".git", ".svn", "CVS"]`
- **Use**: Excludes these directories from processing.

Example configuration in `settings.json`:
```json
"appendContent.excludedFileExtensions": [".log", ".tmp"],
"appendContent.excludedDirectories": ["node_modules", "dist"]
````
## Known Issues

- **Tree Command Dependency**: If `tree` is not installed, recursive directory processing will skip tree generation.
- **Large Directories**: Processing very large directory structures may impact performance. You can cancel the operation if needed.

## Release Notes

### 1.0.0
- Initial release with single and recursive directory processing commands.

### 1.1.0
- Added configuration settings for excluded files and directories.
- Improved logging with **winston** for better issue tracking.

---

## Following Extension Guidelines

Please refer to [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines) to ensure best practices are followed.

## Additional Tips for Markdown Editing in VS Code

- **Split the editor**: `Cmd+\` on macOS or `Ctrl+\` on Windows/Linux.
- **Toggle preview**: `Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows/Linux.

**Enjoy using Directory Digest!**