# Directory Digest

Directory Digest is a Visual Studio Code extension that adds powerful directory content management capabilities. It allows you to combine text files within a directory into a single digest file or create an organized structure of your directory contents—all with just three clicks.

![LordXyn](https://tinypic.host/images/2024/09/30/LordXyn.jpeg)

## Features

### Combine Files

**Description:** Appends the content of all text files within a selected directory (recursively) into a new file named after the directory (e.g., `MyDirectory.txt`). Non-text files and specified directories are excluded.

**How to Use:**

1. Left-click to select a directory in the Explorer pane.
2. Right-click to open the context menu.
3. Left-click on "Directory Digest: Combine Files".

### Create 0L Structure

**Description:** Recursively processes all subdirectories and files within a selected directory, creating a tree structure file and saving the directory contents to an organized output directory (`0L`).

**How to Use:**

1. Left-click to select a directory in the Explorer pane.
2. Right-click to open the context menu.
3. Left-click on "Directory Digest: Create 0L Structure".

## Logging

Uses `winston` for logging, with logs saved to `extension.log` in the workspace directory.

## Requirements

Visual Studio Code version 1.95.0 or higher.

## Extension Settings

This extension contributes the following settings:

### `directoryDigest.appendContent.excludedFileExtensions`

* **Type:** `string[]`
* **Description:** Specify file extensions to exclude from processing (e.g., binaries, images, documents).
* **Examples:** `[".exe", ".pdf", ".jpg"]`

### `directoryDigest.appendContent.excludedDirectories`

* **Type:** `string[]`
* **Description:** Specify directories to exclude from processing (e.g., version control, dependencies).
* **Examples:** `["node_modules", ".git", "dist"]`


## Configuring Exclusions

You can customize these settings in your VS Code `settings.json`:

```json
{
  "directoryDigest.appendContent.excludedFileExtensions": [".log", ".tmp"],
  "directoryDigest.appendContent.excludedDirectories": ["node_modules", "dist"]
}
````

## Usage

### Accessing the Extension

The primary way to use Directory Digest is through the Explorer context menu:

1. Left-click to select a directory in the Explorer pane.
2. Right-click to open the context menu.
3. Left-click on one of the Directory Digest options:
    * **Directory Digest: Combine Files**
    * **Directory Digest: Create 0L Structure**

## Commands (For Advanced Users)

While the extension is primarily intended to be used via the context menu, commands are available via the Command Palette:

* **Combine Files:** `Directory Digest: Combine Files`
* **Create 0L Structure:** `Directory Digest: Create 0L Structure`

## Keybindings (Not Recommended)

Keybindings are available, but using the context menu is the recommended approach. They are only active when a folder is selected in the Explorer.

* **Combine Files:** 
    * Windows/Linux: <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd>
    * macOS: <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd>
* **Create 0L Structure:**
    * Windows/Linux: <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>O</kbd>
    * macOS: <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>O</kbd>

## Known Issues

* **Maximum Directory Depth:** The extension processes directories up to a depth of 10 levels to prevent infinite recursion.
* **Large Directories:** Processing very large directories may impact performance.

## Release Notes

### 0.1.0

Initial release of Directory Digest.
