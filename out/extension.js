"use strict";
// src/extension.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeFilename = sanitizeFilename;
exports.shouldExcludeDirectory = shouldExcludeDirectory;
exports.shouldExcludeFile = shouldExcludeFile;
exports.isTextFile = isTextFile;
exports.appendDirectoryContent = appendDirectoryContent;
exports.appendAllToOutputDir = appendAllToOutputDir;
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fsPromises = __importStar(require("fs/promises"));
const minimatch_1 = require("minimatch");
const logger_js_1 = require("./utils/logger.js");
const config_js_1 = require("./config.js");
/**
 * Loads configuration from VS Code settings
 */
function loadConfiguration() {
    const config = vscode.workspace.getConfiguration('directoryDigest');
    return {
        outputFormat: config.get('outputFormat', 'Text'),
        maxFileSize: config.get('maxFileSize', 1048576), // 1MB default
        maxDepth: config.get('maxDepth', 10),
        includePatterns: config.get('includePatterns', []),
        excludePatterns: config.get('excludePatterns', []),
        configFilePath: config.get('configFilePath', '.ddconfig'),
        excludedFileExtensions: config.get('appendContent.excludedFileExtensions', config_js_1.excludedFileExtensions),
        excludedDirectories: config.get('appendContent.excludedDirectories', config_js_1.excludedDirectories)
    };
}
/**
 * Loads and parses .ddconfig file if it exists
 */
async function loadConfigFile(baseDir, configFileName) {
    const configPath = path.join(baseDir, configFileName);
    try {
        const configContent = await fsPromises.readFile(configPath, 'utf-8');
        const configData = JSON.parse(configContent);
        logger_js_1.logger.info(`Loaded config file: ${configPath}`);
        return configData;
    }
    catch (err) {
        if (err.code !== 'ENOENT') {
            logger_js_1.logger.warn(`Failed to load config file ${configPath}: ${err}`);
        }
        return null;
    }
}
/**
 * Shows user-friendly error message with retry option
 */
async function showErrorWithRetry(message, error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const action = await vscode.window.showErrorMessage(`${message}: ${errorMsg}`, 'Retry', 'Cancel');
    return action === 'Retry';
}
// Helper functions that were previously not exported
function sanitizeFilename(filename) {
    const ext = path.extname(filename);
    const basename = path.basename(filename, ext);
    const sanitized = basename.replace(/[^a-zA-Z0-9-]/g, '_');
    return `${sanitized}${ext}`;
}
function shouldExcludeDirectory(dirName, config, configFile) {
    const exclusions = config?.excludedDirectories || config_js_1.excludedDirectories;
    // Check config file exclusions
    if (configFile?.excludeDirectories?.includes(dirName)) {
        return true;
    }
    return exclusions.some((excl) => {
        if (excl.includes('*')) {
            const regex = new RegExp(`^${excl.replace(/\*/g, '.*')}$`);
            return regex.test(dirName);
        }
        return excl === dirName;
    });
}
function shouldExcludeFile(fileName, config, configFile) {
    const fileExt = path.extname(fileName).toLowerCase();
    const exclusions = config?.excludedFileExtensions || config_js_1.excludedFileExtensions;
    // Check config file exclusions
    if (configFile?.excludeFiles?.includes(fileName)) {
        return true;
    }
    return exclusions.some((excl) => {
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
function matchesPatterns(filePath, config, configFile) {
    const relativePath = filePath;
    // Check config file patterns first
    if (configFile?.includePatterns?.length) {
        const matchesInclude = configFile.includePatterns.some(pattern => (0, minimatch_1.minimatch)(relativePath, pattern));
        if (!matchesInclude)
            return false;
    }
    if (configFile?.excludePatterns?.length) {
        const matchesExclude = configFile.excludePatterns.some(pattern => (0, minimatch_1.minimatch)(relativePath, pattern));
        if (matchesExclude)
            return false;
    }
    // Check VS Code config patterns
    if (config.includePatterns.length > 0) {
        const matchesInclude = config.includePatterns.some(pattern => (0, minimatch_1.minimatch)(relativePath, pattern));
        if (!matchesInclude)
            return false;
    }
    if (config.excludePatterns.length > 0) {
        const matchesExclude = config.excludePatterns.some(pattern => (0, minimatch_1.minimatch)(relativePath, pattern));
        if (matchesExclude)
            return false;
    }
    return true;
}
/**
 * Checks if file size is within limits
 */
async function isFileSizeAllowed(filePath, maxFileSize) {
    try {
        const stats = await fsPromises.stat(filePath);
        return stats.size <= maxFileSize;
    }
    catch (err) {
        logger_js_1.logger.warn(`Failed to check file size for ${filePath}: ${err}`);
        return false;
    }
}
function isTextFile(filePath) {
    const textFileExtensions = [
        '.txt', '.md', '.js', '.ts', '.json', '.html', '.css', '.py', '.java', '.c', '.cpp',
        '.rs', '.go', '.rb', '.php', '.sql', '.xml', '.yaml', '.yml', '.toml', '.ini'
    ];
    return textFileExtensions.includes(path.extname(filePath).toLowerCase());
}
/**
 * Formats file entry content based on the specified output format
 */
function formatFileEntry(entry, format) {
    switch (format) {
        case 'Markdown':
            if (entry.isDirectory) {
                return `## Directory: ${entry.relativePath}\n\n`;
            }
            else {
                const extension = path.extname(entry.path).slice(1) || 'text';
                return `### File: ${entry.relativePath}\n\n\`\`\`${extension}\n${entry.content || ''}\n\`\`\`\n\n`;
            }
        case 'JSON':
            return JSON.stringify(entry, null, 2) + '\n';
        case 'Text':
        default:
            if (entry.isDirectory) {
                return `\nDirectory: ${entry.relativePath}\n${'='.repeat(entry.relativePath.length + 11)}\n\n`;
            }
            else {
                const header = `\nFile: ${entry.relativePath}\n${'='.repeat(entry.relativePath.length + 6)}\n`;
                return header + (entry.content || '') + '\n\n';
            }
    }
}
/**
 * Gets the appropriate file extension for the output format
 */
function getOutputExtension(format) {
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
function wrapJSONOutput(entries, dirName) {
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
async function appendDirectoryContent(selectedDir, progressContext) {
    const config = loadConfiguration();
    const configFile = await loadConfigFile(selectedDir, config.configFilePath);
    const dirName = path.basename(selectedDir);
    const outputExtension = getOutputExtension(config.outputFormat);
    // Create dot-prefixed directory for output
    const dotDirName = `.${sanitizeFilename(dirName)}Files`;
    const outputDir = path.join(selectedDir, dotDirName);
    const outputFile = path.join(outputDir, `${sanitizeFilename(dirName)}${outputExtension}`);
    const entries = [];
    let processedFiles = 0;
    let totalFiles = 0;
    // Check if path exists and is a directory
    let dirExists = false;
    try {
        const stats = await fsPromises.stat(selectedDir);
        dirExists = stats.isDirectory();
    }
    catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
        // For ENOENT, dirExists remains false
    }
    if (!dirExists) {
        // Create empty output for non-existent directory
        await fsPromises.mkdir(outputDir, { recursive: true });
        logger_js_1.logger.info(`Created output directory for non-existent directory: ${outputDir}`);
        const outputContent = '';
        await fsPromises.writeFile(outputFile, outputContent, 'utf-8');
        logger_js_1.logger.info(`Created empty digest for non-existent directory: ${outputFile}`);
        progressContext?.report({ message: 'Created empty digest for non-existent directory' });
        return;
    }
    // First pass: count total files for progress tracking
    async function countFiles(dir, depth = 0) {
        if (depth >= config.maxDepth) {
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
                }
                else if (entry.isFile()) {
                    if (!shouldExcludeFile(entry.name, config, configFile ?? undefined) &&
                        matchesPatterns(relativePath, config, configFile ?? undefined) &&
                        await isFileSizeAllowed(fullPath, config.maxFileSize)) {
                        count++;
                    }
                }
            }
            return count;
        }
        catch (err) {
            logger_js_1.logger.error(`Failed to count files in directory ${dir}: ${err}`);
            return 0;
        }
    }
    async function processFile(filePath) {
        try {
            const relativePath = path.relative(selectedDir, filePath);
            if (!await isFileSizeAllowed(filePath, config.maxFileSize)) {
                logger_js_1.logger.warn(`File ${filePath} exceeds size limit (${config.maxFileSize} bytes)`);
                return;
            }
            if (!matchesPatterns(relativePath, config, configFile ?? undefined)) {
                return;
            }
            let content = '';
            if (isTextFile(filePath)) {
                try {
                    content = await fsPromises.readFile(filePath, 'utf-8');
                }
                catch (err) {
                    logger_js_1.logger.error(`Failed to read file content ${filePath}: ${err}`);
                    content = `[Error reading file: ${err}]`;
                }
            }
            const stats = await fsPromises.stat(filePath);
            const entry = {
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
            logger_js_1.logger.info(`Processed file: ${filePath}`);
        }
        catch (err) {
            logger_js_1.logger.error(`Failed to process file ${filePath}: ${err}`);
        }
    }
    async function processDirectory(dir, depth = 0) {
        if (depth >= config.maxDepth) {
            logger_js_1.logger.warn(`Maximum depth (${config.maxDepth}) reached at: ${dir}`);
            return;
        }
        try {
            const dirEntries = await fsPromises.readdir(dir, { withFileTypes: true });
            const processPromises = dirEntries.map(async (entry) => {
                if (progressContext?.token.isCancellationRequested) {
                    throw new Error('Operation was cancelled by user');
                }
                const fullPath = path.join(dir, entry.name);
                if (entry.isSymbolicLink()) {
                    return;
                }
                if (entry.isDirectory() && !shouldExcludeDirectory(entry.name, config, configFile)) {
                    await processDirectory(fullPath, depth + 1);
                }
                else if (entry.isFile() && !shouldExcludeFile(entry.name, config, configFile)) {
                    await processFile(fullPath);
                }
            });
            await Promise.all(processPromises);
        }
        catch (err) {
            if (err instanceof Error && err.message.includes('cancelled')) {
                throw err;
            }
            logger_js_1.logger.error(`Failed to process directory ${dir}: ${err}`);
        }
    }
    try {
        // First pass: count total files for progress tracking
        totalFiles = await countFiles(selectedDir);
        progressContext?.report({ message: `Processing ${totalFiles} files...` });
        await processDirectory(selectedDir);
        // Now create output directory and write
        await fsPromises.mkdir(outputDir, { recursive: true });
        logger_js_1.logger.info(`Created output directory: ${outputDir}`);
        // Write output based on format
        let outputContent = '';
        if (config.outputFormat === 'JSON') {
            outputContent = wrapJSONOutput(entries, dirName);
        }
        else {
            entries.forEach(entry => {
                outputContent += formatFileEntry(entry, config.outputFormat);
            });
        }
        await fsPromises.writeFile(outputFile, outputContent, 'utf-8');
        progressContext?.report({ message: 'Writing output file...', increment: 0 });
        logger_js_1.logger.info(`Successfully processed ${processedFiles} files and created: ${outputFile}`);
    }
    catch (err) {
        logger_js_1.logger.error(`Failed to process directory: ${err}`);
        throw err;
    }
}
/**
 * Concatenates all files into organized structure in .{dirName} directory
 */
async function appendAllToOutputDir(selectedDir) {
    const dirName = path.basename(selectedDir);
    const outputDir = path.join(selectedDir, `.${sanitizeFilename(dirName)}`);
    const treeFile = path.join(outputDir, `${sanitizeFilename(dirName)}.txt`);
    try {
        await fsPromises.mkdir(outputDir, { recursive: true });
        await fsPromises.writeFile(treeFile, '');
        logger_js_1.logger.info(`Created output directory: ${outputDir}`);
        async function processFile(dir, filePath) {
            try {
                const relativeDir = path.relative(selectedDir, dir) || dirName;
                const parentName = sanitizeFilename(path.basename(dir));
                const outputFile = path.join(outputDir, `${parentName}.txt`);
                if (isTextFile(filePath)) {
                    const content = await fsPromises.readFile(filePath, 'utf-8');
                    const header = `\nDirectory: ${relativeDir}\nFile: ${path.basename(filePath)}\n${'='.repeat(path.basename(filePath).length + 6)}\n`;
                    await fsPromises.appendFile(outputFile, header + content + '\n\n');
                    await fsPromises.appendFile(treeFile, header + content + '\n\n');
                    logger_js_1.logger.info(`Processed text file: ${filePath}`);
                }
                else {
                    const header = `\n[${path.basename(filePath)}]binary\n${'='.repeat(path.basename(filePath).length + 8)}\n`;
                    await fsPromises.appendFile(outputFile, header);
                    await fsPromises.appendFile(treeFile, header);
                    logger_js_1.logger.info(`Processed binary file: ${filePath}`);
                }
            }
            catch (err) {
                logger_js_1.logger.error(`Failed to process file ${filePath}: ${err}`);
            }
        }
        async function processDirectory(dir, depth = 0) {
            if (depth > 10) {
                logger_js_1.logger.warn(`Maximum depth reached at: ${dir}`);
                return;
            }
            try {
                const entries = await fsPromises.readdir(dir, { withFileTypes: true });
                const processPromises = entries.map(async (entry) => {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isSymbolicLink()) {
                        return;
                    }
                    if (entry.isDirectory() && !shouldExcludeDirectory(entry.name)) {
                        await processDirectory(fullPath, depth + 1);
                    }
                    else if (entry.isFile() && !shouldExcludeFile(entry.name)) {
                        await processFile(dir, fullPath);
                    }
                });
                await Promise.all(processPromises);
            }
            catch (err) {
                logger_js_1.logger.error(`Failed to process directory ${dir}: ${err}`);
            }
        }
        await processDirectory(selectedDir);
        // Clean up empty files
        const files = await fsPromises.readdir(outputDir);
        await Promise.all(files.map(async (file) => {
            const filePath = path.join(outputDir, file);
            const stat = await fsPromises.stat(filePath);
            if (stat.size === 0) {
                await fsPromises.unlink(filePath);
                logger_js_1.logger.info(`Removed empty file: ${filePath}`);
            }
        }));
        logger_js_1.logger.info(`Successfully processed directory: ${selectedDir}`);
    }
    catch (err) {
        logger_js_1.logger.error(`Operation failed: ${err}`);
        throw err;
    }
}
function activate(context) {
    logger_js_1.logger.info('Directory Digest extension activated.');
    const appendContent = vscode.commands.registerCommand('extension.appendDirectoryContent', async (uri) => {
        let targetDir = undefined;
        try {
            if (uri) {
                targetDir = uri.fsPath;
            }
            else {
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
            const processWithProgress = async () => {
                return await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Directory Digest",
                    cancellable: true
                }, async (progress, token) => {
                    progress.report({ message: "Initializing directory scan..." });
                    const progressContext = {
                        report: progress.report.bind(progress),
                        token: token
                    };
                    const startTime = Date.now();
                    await appendDirectoryContent(targetDir, progressContext);
                    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                    if (!token.isCancellationRequested) {
                        vscode.window.showInformationMessage(`Directory content processed successfully! (${duration}s)`);
                    }
                });
            };
            await processWithProgress();
        }
        catch (err) {
            logger_js_1.logger.error(`Command execution failed: ${err}`);
            const shouldRetry = await showErrorWithRetry('Failed to process directory', err);
            if (shouldRetry && targetDir) {
                // Retry the operation
                try {
                    await vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: "Directory Digest (Retry)",
                        cancellable: true
                    }, async (progress, token) => {
                        const progressContext = {
                            report: progress.report.bind(progress),
                            token: token
                        };
                        await appendDirectoryContent(targetDir, progressContext);
                    });
                    vscode.window.showInformationMessage('Directory processed successfully on retry!');
                }
                catch (retryErr) {
                    vscode.window.showErrorMessage(`Retry failed: ${retryErr}`);
                }
            }
        }
    });
    const appendToOutputDir = vscode.commands.registerCommand('extension.appendAllToOutputDir', async (uri) => {
        let targetDir;
        if (uri) {
            targetDir = uri.fsPath;
        }
        else {
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
        const dirName = path.basename(targetDir);
        try {
            const processWithProgress = async () => {
                return await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Directory Digest - Concatenate Entirety",
                    cancellable: false
                }, async (progress) => {
                    progress.report({ message: "Concatenating directory contents..." });
                    const startTime = Date.now();
                    await appendAllToOutputDir(targetDir);
                    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                    vscode.window.showInformationMessage(`Directory concatenated in .${dirName} successfully! (${duration}s)`);
                });
            };
            await processWithProgress();
        }
        catch (err) {
            logger_js_1.logger.error(`Command execution failed: ${err}`);
            const shouldRetry = await showErrorWithRetry('Failed to organize directory', err);
            if (shouldRetry) {
                // Retry the operation
                try {
                    await vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: "Directory Digest - Concatenate Entirety (Retry)",
                        cancellable: false
                    }, async (progress) => {
                        progress.report({ message: "Retrying directory concatenation..." });
                        await appendAllToOutputDir(targetDir);
                    });
                    vscode.window.showInformationMessage(`Directory concatenated successfully on retry in .${dirName}!`);
                }
                catch (retryErr) {
                    vscode.window.showErrorMessage(`Retry failed: ${retryErr}`);
                }
            }
        }
    });
    context.subscriptions.push(appendContent, appendToOutputDir);
}
function deactivate() {
    logger_js_1.logger.info('Directory Digest extension deactivated.');
}
//# sourceMappingURL=extension.js.map