// src/extension.ts

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { minimatch } from 'minimatch';
import { logger } from './utils/logger.js';
import { copyAssetToFolder } from './utils/assets.js';
import { excludedFileExtensions, excludedDirectories } from './config.js';

// Configuration interfaces
interface DigestConfig {
    outputFormat: 'Text' | 'Markdown' | 'JSON';
    maxFileSize: number;
    maxDepth: number;
    includePatterns: string[];
    excludePatterns: string[];
    configFilePath: string;
    excludedFileExtensions: string[];
    excludedDirectories: string[];
}

interface ConfigFile {
    includeDirectories?: string[];
    excludeDirectories?: string[];
    includeFiles?: string[];
    excludeFiles?: string[];
    includePatterns?: string[];
    excludePatterns?: string[];
}

interface FileEntry {
    path: string;
    relativePath: string;
    content?: string;
    size: number;
    isDirectory: boolean;
}

interface ProgressContext {
    report: (value: { message?: string; increment?: number }) => void;
    token: vscode.CancellationToken;
}

/**
 * Loads configuration from VS Code settings
 */
function loadConfiguration(): DigestConfig {
    const config = vscode.workspace.getConfiguration('directoryDigest');

    return {
        outputFormat: config.get<'Text' | 'Markdown' | 'JSON'>('outputFormat', 'Text'),
        maxFileSize: config.get<number>('maxFileSize', 1048576), // 1MB default
        maxDepth: config.get<number>('maxDepth', 10),
        includePatterns: config.get<string[]>('includePatterns', []),
        excludePatterns: config.get<string[]>('excludePatterns', []),
        configFilePath: config.get<string>('configFilePath', '.ddconfig'),
        excludedFileExtensions: config.get<string[]>('appendContent.excludedFileExtensions', excludedFileExtensions),
        excludedDirectories: config.get<string[]>('appendContent.excludedDirectories', excludedDirectories)
    };
}

// Prevent editor warnings for __dirname in environments where it's not typed

/**
 * Loads and parses .ddconfig file if it exists
 */
async function loadConfigFile(baseDir: string, configFileName: string): Promise<ConfigFile | null> {
    const configPath = path.join(baseDir, configFileName);
    
    try {
        const configContent = await fsPromises.readFile(configPath, 'utf-8');
        const configData = JSON.parse(configContent) as ConfigFile;
        logger.info(`Loaded config file: ${configPath}`);
        return configData;
    } catch (err) {
        // If file not found and the requested file was the default .ddconfig,
        // automatically attempt to load .ddconfig.example as a useful fallback.
        if ((err as { code?: string }).code === 'ENOENT' && configFileName === '.ddconfig') {
            const examplePath = path.join(baseDir, '.ddconfig.example');
            try {
                const exampleContent = await fsPromises.readFile(examplePath, 'utf-8');
                const exampleData = JSON.parse(exampleContent) as ConfigFile;
                logger.info(`Loaded example config file: ${examplePath}`);
                return exampleData;
            } catch (exampleErr) {
                if ((exampleErr as { code?: string }).code !== 'ENOENT') {
                    logger.warn(`Failed to load example config file ${examplePath}: ${exampleErr}`);
                }
                return null;
            }
        }
        if ((err as { code?: string }).code !== 'ENOENT') {
            logger.warn(`Failed to load config file ${configPath}: ${err}`);
        }
        return null;
    }
}

/**
 * Shows user-friendly error message with retry option
 */
async function showErrorWithRetry(message: string, error: unknown): Promise<boolean> {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const action = await vscode.window.showErrorMessage(
        `${message}: ${errorMsg}`,
        'Retry',
        'Cancel'
    );
    return action === 'Retry';
}

// Helper functions that were previously not exported
export function sanitizeFilename(filename: string): string {
    const ext = path.extname(filename);
    const basename = path.basename(filename, ext);
    const sanitized = basename.replace(/[^a-zA-Z0-9-]/g, '_');
    return `${sanitized}${ext}`;
}

export function shouldExcludeDirectory(dirName: string, config?: DigestConfig, configFile?: ConfigFile | null): boolean {
    const exclusions = config?.excludedDirectories || excludedDirectories;
    
    // Check config file exclusions
    if (configFile?.excludeDirectories?.includes(dirName)) {
        return true;
    }
    
    return exclusions.some((excl: string) => {
        if (excl.includes('*')) {
            const regex = new RegExp(`^${excl.replace(/\*/g, '.*')}$`);
            return regex.test(dirName);
        }
        return excl === dirName;
    });
}

export function shouldExcludeFile(fileName: string, config?: DigestConfig, configFile?: ConfigFile | null): boolean {
    const fileExt = path.extname(fileName).toLowerCase();
    const exclusions = config?.excludedFileExtensions || excludedFileExtensions;
    
    // Check config file exclusions
    if (configFile?.excludeFiles?.includes(fileName)) {
        return true;
    }
    
    return exclusions.some((excl: string) => {
        if (excl.includes('*')) {
            const regex = new RegExp(`^${excl.replace(/\*/g, '.*')}$`);
            return regex.test(fileExt);
        }
        return fileExt === excl;
    });
}

/**
 * Checks if a file matches the include/exclude patterns
 */
function matchesPatterns(filePath: string, config: DigestConfig, configFile?: ConfigFile | null): boolean {
    const relativePath = filePath;
    
    // Check config file patterns first
    if (configFile?.includePatterns?.length) {
        const matchesInclude = configFile.includePatterns.some(pattern => minimatch(relativePath, pattern));
        if (!matchesInclude) return false;
    }
    
    if (configFile?.excludePatterns?.length) {
        const matchesExclude = configFile.excludePatterns.some(pattern => minimatch(relativePath, pattern));
        if (matchesExclude) return false;
    }
    
    // Check VS Code config patterns
    if (config.includePatterns.length > 0) {
        const matchesInclude = config.includePatterns.some(pattern => minimatch(relativePath, pattern));
        if (!matchesInclude) return false;
    }
    
    if (config.excludePatterns.length > 0) {
        const matchesExclude = config.excludePatterns.some(pattern => minimatch(relativePath, pattern));
        if (matchesExclude) return false;
    }
    
    return true;
}

/**
 * Checks if file size is within limits
 */
async function isFileSizeAllowed(filePath: string, maxFileSize: number): Promise<boolean> {
    try {
        const stats = await fsPromises.stat(filePath);
        return stats.size <= maxFileSize;
    } catch (err) {
        logger.warn(`Failed to check file size for ${filePath}: ${err}`);
        return false;
    }
}

export function isTextFile(filePath: string): boolean {
    const textFileExtensions = [
        '.txt', '.md', '.js', '.ts', '.mjs', '.cjs', '.jsx', '.tsx', '.json', '.html', '.css',
        '.rs', '.go', '.rb', '.php', '.py', '.java', '.c', '.cpp', '.cu', '.cuh', '.h', '.hpp',
        '.cs', '.swift', '.sh', '.bash', '.zsh', '.ps1', '.pl', '.rb', '.lua', '.r', '.scala',
        '.kt', '.kts', '.gradle', '.groovy', '.makefile', 'makefile', '.dockerfile', 'dockerfile',
        '.graphql', '.gql', '.csv', '.toon',
        '.sql', '.xml', '.yaml', '.yml', '.toml', '.ini',


    ];
    return textFileExtensions.includes(path.extname(filePath).toLowerCase());
}

/**
 * Formats file entry content based on the specified output format
 */
function formatFileEntry(entry: FileEntry, format: 'Text' | 'Markdown' | 'JSON'): string {
    switch (format) {
        case 'Markdown':
            if (entry.isDirectory) {
                return `## Directory: ${entry.relativePath}\n\n`;
            } else {
                const extension = path.extname(entry.path).slice(1) || 'text';
                return `### File: ${entry.relativePath}\n\n\`\`\`${extension}\n${entry.content || ''}\n\`\`\`\n\n`;
            }

        case 'JSON':
            return JSON.stringify(entry, null, 2) + '\n';

        // No explicit 'TOON' format—.toon files are treated as plain text content and will
        // be formatted using the general 'Text' or 'Markdown' format, depending on settings.

        case 'Text':
        default:
            if (entry.isDirectory) {
                return `\nDirectory: ${entry.relativePath}\n${'='.repeat(entry.relativePath.length + 11)}\n\n`;
            } else {
                const header = `\nFile: ${entry.relativePath}\n${'='.repeat(entry.relativePath.length + 6)}\n`;
                return header + (entry.content || '') + '\n\n';
            }
    }
}

/**
 * Gets the appropriate file extension for the output format
 */
function getOutputExtension(format: 'Text' | 'Markdown' | 'JSON'): string {
    switch (format) {
        case 'Markdown': return '.md';
        case 'JSON': return '.json';
        case 'Text':
        default: return '.txt';
    }
}

/**
 * Wraps JSON output with proper structure
 */
function wrapJSONOutput(entries: FileEntry[], dirName: string): string {
    const output = {
        directory: dirName,
        generated: new Date().toISOString(),
        entries: entries
    };
    return JSON.stringify(output, null, 2);
}

/**
 * Creates a single file containing all directory contents with enhanced configuration support
 */
export async function appendDirectoryContent(selectedDir: string, progressContext?: ProgressContext): Promise<void> {
    const config = loadConfiguration();
    const configFile = await loadConfigFile(selectedDir, config.configFilePath);
    // If a user selects a `src` directory, prefer the parent directory name for generated output
    let dirName = path.basename(selectedDir);
    if (dirName.toLowerCase() === 'src') {
        const parent = path.basename(path.dirname(selectedDir));
        if (parent) dirName = parent;
    }
    const outputExtension = getOutputExtension(config.outputFormat);
    
    // Create dot-prefixed directory for output
    const dotDirName = `.${sanitizeFilename(dirName)}Files`;
    const outputDir = path.join(selectedDir, dotDirName);
    const outputFile = path.join(outputDir, `${sanitizeFilename(dirName)}${outputExtension}`);
    
    const entries: FileEntry[] = [];
    logger.info(`appendAllToOutputDir maxDepth=${config.maxDepth}`);
    let processedFiles = 0;
    let totalFiles = 0;

    // Check if path exists and is a directory
    let dirExists = false;
    try {
        const stats = await fsPromises.stat(selectedDir);
        dirExists = stats.isDirectory();
    } catch (err: unknown) {
        if ((err as { code?: string }).code !== 'ENOENT') {
            throw err;
        }
        // For ENOENT, dirExists remains false
    }

    if (!dirExists) {
        // Create empty output for non-existent directory
        await fsPromises.mkdir(outputDir, { recursive: true });
        logger.info(`Created output directory for non-existent directory: ${outputDir}`);
        
        const outputContent = '';
        
        await fsPromises.writeFile(outputFile, outputContent, 'utf-8');
        // Copy bundled icon next to the generated output so users see the icon next to .ddconfig
        try {
            // If configFilePath is the default (.ddconfig) and exists in the selectedDir, copy icon there;
            // otherwise, copy icon next to the generated output file.
            const targetFolder = path.dirname(outputFile);
            // Use context from extension activation; if not available, skip (this function is exported, not closure-bound)
            // We'll attempt to get the extension context via vscode.extensions API as a fallback
            const ext = vscode.extensions.getExtension('arcmoonstudios.directory-digest');
            if (ext) {
                interface ExtWithCtx {
                    exports?: { __vscode_extension_context?: vscode.ExtensionContext };
                }
                const ctx = (ext as ExtWithCtx).exports?.__vscode_extension_context;
                if (ctx) {
                    await copyAssetToFolder(ctx, path.join('assets', 'icon.png'), targetFolder);
                } else {
                    // no context exported; try to copy using extensionPath directly
                    try {
                        const fakeCtx = { extensionPath: path.join(__dirname, '..') } as vscode.ExtensionContext;
                        await copyAssetToFolder(fakeCtx, path.join('assets', 'icon.png'), targetFolder);
                    } catch (err) {
                        // reference err to satisfy linters
                        void err;
                        // continue silently
                    }
                }
            }
        } catch (err) {
            logger.warn(`Failed to copy icon to output folder: ${err}`);
        }
        logger.info(`Created empty digest for non-existent directory: ${outputFile}`);
        
        progressContext?.report({ message: 'Created empty digest for non-existent directory' });
        return;
    }

    // First pass: count total files for progress tracking
    async function countFiles(dir: string, depth: number = 0): Promise<number> {
        // Allow directories up to the configured maxDepth (inclusive), where depth=0 is the
        // root directory. Return 0 only when depth exceeds the maximum.
        if (depth > config.maxDepth) {
            return 0;
        }

        try {
            const dirEntries = await fsPromises.readdir(dir, { withFileTypes: true });
            let count = 0;

            for (const entry of dirEntries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(selectedDir, fullPath);

                if (entry.isSymbolicLink()) {
                    continue;
                }

                if (entry.isDirectory()) {
                    if (!shouldExcludeDirectory(entry.name, config, configFile ?? undefined)) {
                        count += await countFiles(fullPath, depth + 1);
                    }
                } else if (entry.isFile()) {
                    if (!shouldExcludeFile(entry.name, config, configFile ?? undefined) &&
                        matchesPatterns(relativePath, config, configFile ?? undefined) &&
                        await isFileSizeAllowed(fullPath, config.maxFileSize)) {
                        count++;
                    }
                }
            }
            return count;
        } catch (err) {
            logger.error(`Failed to count files in directory ${dir}: ${err}`);
            return 0;
        }
    }

    async function processFile(filePath: string): Promise<void> {
        try {
            const relativePath = path.relative(selectedDir, filePath);
            
            if (!await isFileSizeAllowed(filePath, config.maxFileSize)) {
                logger.warn(`File ${filePath} exceeds size limit (${config.maxFileSize} bytes)`);
                return;
            }

            if (!matchesPatterns(relativePath, config, configFile ?? undefined)) {
                return;
            }

            let content = '';
            if (isTextFile(filePath)) {
                try {
                    content = await fsPromises.readFile(filePath, 'utf-8');
                } catch (err) {
                    logger.error(`Failed to read file content ${filePath}: ${err}`);
                    content = `[Error reading file: ${err}]`;
                }
            }

            const stats = await fsPromises.stat(filePath);
            const entry: FileEntry = {
                path: filePath,
                relativePath,
                content,
                size: stats.size,
                isDirectory: false
            };

            entries.push(entry);
            processedFiles++;
            
            const progressPercent = (processedFiles / totalFiles) * 100;
            progressContext?.report({
                message: `Processed ${processedFiles}/${totalFiles} files (${progressPercent.toFixed(1)}%)`,
                increment: (1 / totalFiles) * 100
            });
            
            logger.info(`Processed file: ${filePath}`);
        } catch (err) {
            logger.error(`Failed to process file ${filePath}: ${err}`);
        }
    }

    async function processDirectory(dir: string, depth: number = 0): Promise<void> {
        // Allow processing for depth values <= config.maxDepth; bail out only when
        // we exceed the configured maximum depth.
        if (depth > config.maxDepth) {
            logger.warn(`Maximum depth (${config.maxDepth}) reached at: ${dir}`);
            return;
        }

        try {
            const dirEntries = await fsPromises.readdir(dir, { withFileTypes: true }) as fs.Dirent[];
            const processPromises = dirEntries.map(async (entry: fs.Dirent) => {
                if (progressContext?.token.isCancellationRequested) {
                    throw new Error('Operation was cancelled by user');
                }

                const fullPath = path.join(dir, entry.name);
                if (entry.isSymbolicLink()) {
                    return;
                }
                
                if (entry.isDirectory() && !shouldExcludeDirectory(entry.name, config, configFile)) {
                    await processDirectory(fullPath, depth + 1);
                } else if (entry.isFile() && !shouldExcludeFile(entry.name, config, configFile)) {
                    await processFile(fullPath);
                }
            });
            await Promise.all(processPromises);
        } catch (err) {
            if (err instanceof Error && err.message.includes('cancelled')) {
                throw err;
            }
            logger.error(`Failed to process directory ${dir}: ${err}`);
        }
    }

    try {
        // First pass: count total files for progress tracking
        totalFiles = await countFiles(selectedDir);
        progressContext?.report({ message: `Processing ${totalFiles} files...` });

        await processDirectory(selectedDir);

        // Now create output directory and write
        await fsPromises.mkdir(outputDir, { recursive: true });
        logger.info(`Created output directory: ${outputDir}`);

        // Write output based on format
        let outputContent = '';
        if (config.outputFormat === 'JSON') {
            outputContent = wrapJSONOutput(entries, dirName);
        } else {
            entries.forEach(entry => {
                outputContent += formatFileEntry(entry, config.outputFormat);
            });
        }

        await fsPromises.writeFile(outputFile, outputContent, 'utf-8');
        progressContext?.report({ message: 'Writing output file...', increment: 0 });
        
        logger.info(`Successfully processed ${processedFiles} files and created: ${outputFile}`);

    } catch (err) {
        logger.error(`Failed to process directory: ${err}`);
        throw err;
    }
}

/**
 * Concatenates all files into organized structure in .{dirName} directory
 */
export async function appendAllToOutputDir(selectedDir: string): Promise<void> {
    const config = loadConfiguration();
    const configFile = await loadConfigFile(selectedDir, config.configFilePath);
    // If a user selects a `src` directory, prefer the parent directory name for generated output
    let dirName = path.basename(selectedDir);
    if (dirName.toLowerCase() === 'src') {
        const parent = path.basename(path.dirname(selectedDir));
        if (parent) dirName = parent;
    }
    const outputDir = path.join(selectedDir, `.${sanitizeFilename(dirName)}`);
    const treeFile = path.join(outputDir, `${sanitizeFilename(dirName)}.md`);

    const entries: FileEntry[] = [];
    try {
        async function processDirectory(dir: string, depth: number = 0): Promise<void> {
            // Note: we treat maxDepth as inclusive (a value of `10` allows 10 levels deep). If the
            // current depth exceeds the configured maximum, stop traversing. This matches tests'
            // expectation that a maxDepth of 10 includes deep-9 (depth value 10).
            if (depth > config.maxDepth) return;
            try {
                const dirEntries = await fsPromises.readdir(dir, { withFileTypes: true }) as fs.Dirent[];
                for (const entry of dirEntries) {
                    const fullPath = path.join(dir, entry.name);
                    const relativePath = path.relative(selectedDir, fullPath);
                    if (entry.isSymbolicLink()) continue;
                    if (entry.isDirectory()) {
                        // Skip the output directory if it already exists (avoid self-inclusion)
                        if (path.resolve(fullPath) === path.resolve(outputDir)) {
                            continue;
                        }
                        if (!shouldExcludeDirectory(entry.name, config, configFile ?? undefined)) {
                            await processDirectory(fullPath, depth + 1);
                        }
                    } else if (entry.isFile()) {
                        if (!shouldExcludeFile(entry.name, config, configFile ?? undefined) && matchesPatterns(relativePath, config, configFile ?? undefined) && await isFileSizeAllowed(fullPath, config.maxFileSize)) {
                            let content = '';
                            if (isTextFile(fullPath)) {
                                try {
                                    content = await fsPromises.readFile(fullPath, 'utf-8');
                                } catch (err) {
                                    logger.warn(`Failed to read file ${fullPath}: ${err}`);
                                    content = `[Error reading file: ${err}]`;
                                }
                            }
                            const stats = await fsPromises.stat(fullPath);
                            entries.push({
                                path: fullPath,
                                relativePath: relativePath.replace(/\\/g, '/'),
                                content,
                                size: stats.size,
                                isDirectory: false
                            });
                        }
                    }
                }
            } catch (err) {
                logger.error(`Failed to process directory ${dir}: ${err}`);
            }
        }

        await processDirectory(selectedDir);
        // Create output directory after processing to avoid including it in the traversal
        await fsPromises.mkdir(outputDir, { recursive: true });
        logger.info(`Created output directory: ${outputDir}`);

        // Sort entries alphabetically by relativePath
        entries.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
        logger.info(`Collected ${entries.length} file entries for output`);
        if (entries.length > 0) {
            logger.info(`First entry: ${entries[0].relativePath}; Last entry: ${entries[entries.length - 1].relativePath}`);
        }

        // Build per-directory groups
        const groups: { [dir: string]: FileEntry[] } = {};
        for (const e of entries) {
            const parentDir = path.dirname(e.relativePath) === '.' ? '' : path.dirname(e.relativePath);
            if (!groups[parentDir]) groups[parentDir] = [];
            groups[parentDir].push(e);
        }

        // Helper to sanitize lines for lint-free output (trim trailing spaces)
        const sanitizeContent = (content: string) => content.split('\n').map(l => l.replace(/\s+$/g, '')).join('\n');

        // Build the markdown header
        const header = `# ${dirName}\n\n## Concatenated Directory Files\n\n`;

        // Write tree file: contains everything
        let treeContent = header;
        for (const group of Object.keys(groups).sort()) {
            const files = groups[group].sort((a, b) => a.relativePath.localeCompare(b.relativePath));
            for (const fileEntry of files) {
                const lang = path.extname(fileEntry.path).replace('.', '') || 'text';
                const content = sanitizeContent(fileEntry.content || '');
                treeContent += `\n\n### File: ${fileEntry.relativePath}\n\n\`\`\`${lang}\n${content}\n\`\`\`\n\n---\n\n`;
            }
        }
        await fsPromises.writeFile(treeFile, treeContent, 'utf-8');

        // Write per-directory files
        for (const [group, files] of Object.entries(groups)) {
            const parentName = group === '' ? sanitizeFilename(dirName) : sanitizeFilename(path.basename(group));
            const outPath = path.join(outputDir, `${parentName}.md`);
            let fileContent = header;
            const fSorted = files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
            for (const fileEntry of fSorted) {
                const lang = path.extname(fileEntry.path).replace('.', '') || 'text';
                const content = sanitizeContent(fileEntry.content || '');
                fileContent += `\n\n### File: ${fileEntry.relativePath}\n\n\`\`\`${lang}\n${content}\n\`\`\`\n\n---\n\n`;
            }
            await fsPromises.writeFile(outPath, fileContent, 'utf-8');
        }

        // Remove any empty files (should not happen but safe-guard)
        const files = await fsPromises.readdir(outputDir);
    await Promise.all(files.map(async (file: string) => {
            const filePath = path.join(outputDir, file);
            const stat = await fsPromises.stat(filePath);
            if (stat.size === 0) {
                await fsPromises.unlink(filePath);
                logger.info(`Removed empty file: ${filePath}`);
            }
        }));

        logger.info(`Successfully processed directory: ${selectedDir}`);
    } catch (err) {
        logger.error(`Operation failed: ${err}`);
        throw err;
    }
}

export function activate(context: vscode.ExtensionContext) {
    logger.info('Directory Digest extension activated.');

    const appendContent = vscode.commands.registerCommand('extension.appendDirectoryContent', async (uri: vscode.Uri) => {
        let targetDir: string | undefined = undefined;
        
        try {
            if (uri) {
                targetDir = uri.fsPath;
            } else {
                const selected = await vscode.window.showOpenDialog({
                    canSelectFolders: true,
                    canSelectMany: false,
                    openLabel: 'Select Directory'
                });
                
                if (!selected || selected.length === 0) {
                    vscode.window.showWarningMessage('No directory selected.');
                    return;
                }
                targetDir = selected[0].fsPath;
            }

            const processWithProgress = async (): Promise<void> => {
                return await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Directory Digest",
                    cancellable: true
                }, async (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => {
                    progress.report({ message: "Initializing directory scan..." });
                    
                    const progressContext: ProgressContext = {
                        report: progress.report.bind(progress),
                        token: token
                    };
                    
                    const startTime = Date.now();
                    await appendDirectoryContent(targetDir!, progressContext);
                    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                    
                    if (!token.isCancellationRequested) {
                        vscode.window.showInformationMessage(
                            `Directory content processed successfully! (${duration}s)`
                        );
                    }
                });
            };

            await processWithProgress();

        } catch (err) {
            logger.error(`Command execution failed: ${err}`);
            const shouldRetry = await showErrorWithRetry('Failed to process directory', err);
            if (shouldRetry && targetDir) {
                // Retry the operation
                try {
                    await vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: "Directory Digest (Retry)",
                        cancellable: true
                    }, async (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => {
                        const progressContext: ProgressContext = {
                            report: progress.report.bind(progress),
                            token: token
                        };
                        await appendDirectoryContent(targetDir!, progressContext);
                    });
                    
                    vscode.window.showInformationMessage('Directory processed successfully on retry!');
                } catch (retryErr) {
                    vscode.window.showErrorMessage(`Retry failed: ${retryErr}`);
                }
            }
        }
    });

    const appendToOutputDir = vscode.commands.registerCommand('extension.appendAllToOutputDir', async (uri: vscode.Uri) => {
        let targetDir: string | undefined;
        
        if (uri) {
            targetDir = uri.fsPath;
        } else {
            const selected = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Select Directory'
            });
            
            if (!selected || selected.length === 0) {
                vscode.window.showWarningMessage('No directory selected.');
                return;
            }
            targetDir = selected[0].fsPath;
        }
        
        const dirName = path.basename(targetDir!);
        
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Directory Digest - Create Markdown",
                cancellable: false
            }, async (progress: vscode.Progress<{ message?: string; increment?: number }>) => {
                progress.report({ message: "Concatenating directory contents..." });
                
                const startTime = Date.now();
                await appendAllToOutputDir(targetDir!);
                const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                
                vscode.window.showInformationMessage(
                    `Directory concatenated in .${dirName} successfully! (${duration}s)`
                );
            });
        } catch (err) {
            logger.error(`Command execution failed: ${err}`);
            const shouldRetry = await showErrorWithRetry('Failed to organize directory', err);
            if (shouldRetry) {
                // Retry the operation
                try {
                    await vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: "Directory Digest - Create Markdown (Retry)",
                        cancellable: false
                    }, async (progress: vscode.Progress<{ message?: string; increment?: number }>) => {
                        progress.report({ message: "Retrying directory concatenation..." });
                        await appendAllToOutputDir(targetDir!);
                    });

                    vscode.window.showInformationMessage(`Directory concatenated successfully on retry in .${dirName}!`);
                } catch (retryErr) {
                    vscode.window.showErrorMessage(`Retry failed: ${retryErr}`);
                }
            }
        }
    });

    context.subscriptions.push(appendContent, appendToOutputDir);
}

export function deactivate() {
    logger.info('Directory Digest extension deactivated.');
}
