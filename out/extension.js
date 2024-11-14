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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const winston = __importStar(require("winston"));
const config_1 = require("./config");
// Configure Logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)),
    transports: [
        new winston.transports.File({ filename: 'extension.log' }),
        new winston.transports.Console()
    ]
});
// Helper functions that were previously not exported
function sanitizeFilename(filename) {
    const ext = path.extname(filename);
    const basename = path.basename(filename, ext);
    const sanitized = basename.replace(/[^a-zA-Z0-9-]/g, '_');
    return `${sanitized}${ext}`;
}
function shouldExcludeDirectory(dirName) {
    return config_1.excludedDirectories.some(excl => {
        if (excl.includes('*')) {
            const regex = new RegExp(`^${excl.replace(/\*/g, '.*')}$`);
            return regex.test(dirName);
        }
        return excl === dirName;
    });
}
function shouldExcludeFile(fileName) {
    const fileExt = path.extname(fileName).toLowerCase();
    return config_1.excludedFileExtensions.some(excl => {
        if (excl.includes('*')) {
            const regex = new RegExp(`^${excl.replace(/\*/g, '.*')}$`);
            return regex.test(fileExt);
        }
        return fileExt === excl;
    });
}
function isTextFile(filePath) {
    const textFileExtensions = [
        '.txt', '.md', '.js', '.ts', '.json', '.html', '.css', '.py', '.java', '.c', '.cpp',
        '.rs', '.go', '.rb', '.php', '.sql', '.xml', '.yaml', '.yml', '.toml', '.ini'
    ];
    return textFileExtensions.includes(path.extname(filePath).toLowerCase());
}
/**
 * Creates a single file containing all directory contents
 */
async function appendDirectoryContent(selectedDir) {
    const dirName = path.basename(selectedDir);
    const outputFile = path.join(selectedDir, `${sanitizeFilename(dirName)}.txt`);
    try {
        await fsPromises.writeFile(outputFile, '');
        logger.info(`Initialized output file: ${outputFile}`);
        async function processFile(filePath) {
            try {
                if (isTextFile(filePath)) {
                    const content = await fsPromises.readFile(filePath, 'utf-8');
                    const relPath = path.relative(selectedDir, filePath);
                    const header = `\nFile: ${relPath}\n${'='.repeat(relPath.length + 6)}\n`;
                    await fsPromises.appendFile(outputFile, header + content + '\n\n');
                    logger.info(`Appended content from ${filePath}`);
                }
            }
            catch (err) {
                logger.error(`Failed to process file ${filePath}: ${err}`);
            }
        }
        async function processDirectory(dir) {
            try {
                const entries = await fsPromises.readdir(dir, { withFileTypes: true });
                const processPromises = entries.map(async (entry) => {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isSymbolicLink()) {
                        return;
                    }
                    if (entry.isDirectory() && !shouldExcludeDirectory(entry.name)) {
                        await processDirectory(fullPath);
                    }
                    else if (entry.isFile() && !shouldExcludeFile(entry.name)) {
                        await processFile(fullPath);
                    }
                });
                await Promise.all(processPromises);
            }
            catch (err) {
                logger.error(`Failed to process directory ${dir}: ${err}`);
            }
        }
        await processDirectory(selectedDir);
        logger.info(`Successfully processed directory: ${selectedDir}`);
    }
    catch (err) {
        logger.error(`Failed to process directory: ${err}`);
        throw err;
    }
}
/**
 * Creates organized structure in 0L directory
 */
async function appendAllToOutputDir(selectedDir) {
    const outputDir = path.join(selectedDir, '0L');
    const treeFile = path.join(outputDir, 'tree.txt');
    try {
        await fsPromises.mkdir(outputDir, { recursive: true });
        await fsPromises.writeFile(treeFile, '');
        logger.info(`Created output directory: ${outputDir}`);
        async function processFile(dir, filePath) {
            try {
                const relativeDir = path.relative(selectedDir, dir);
                const parentName = sanitizeFilename(path.basename(dir));
                const outputFile = path.join(outputDir, `${parentName}.txt`);
                if (isTextFile(filePath)) {
                    const content = await fsPromises.readFile(filePath, 'utf-8');
                    const header = `\nDirectory: ${relativeDir}\nFile: ${path.basename(filePath)}\n${'='.repeat(path.basename(filePath).length + 6)}\n`;
                    await fsPromises.appendFile(outputFile, header + content + '\n\n');
                    await fsPromises.appendFile(treeFile, header + content + '\n\n');
                    logger.info(`Processed text file: ${filePath}`);
                }
                else {
                    const header = `\n[${path.basename(filePath)}]binary\n${'='.repeat(path.basename(filePath).length + 8)}\n`;
                    await fsPromises.appendFile(outputFile, header);
                    await fsPromises.appendFile(treeFile, header);
                    logger.info(`Processed binary file: ${filePath}`);
                }
            }
            catch (err) {
                logger.error(`Failed to process file ${filePath}: ${err}`);
            }
        }
        async function processDirectory(dir, depth = 0) {
            if (depth > 10) {
                logger.warn(`Maximum depth reached at: ${dir}`);
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
                logger.error(`Failed to process directory ${dir}: ${err}`);
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
                logger.info(`Removed empty file: ${filePath}`);
            }
        }));
        logger.info(`Successfully processed directory: ${selectedDir}`);
    }
    catch (err) {
        logger.error(`Operation failed: ${err}`);
        throw err;
    }
}
function activate(context) {
    logger.info('Directory Digest extension activated.');
    const appendContent = vscode.commands.registerCommand('extension.appendDirectoryContent', async (uri) => {
        try {
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
            const startTime = Date.now();
            await appendDirectoryContent(targetDir);
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            vscode.window.showInformationMessage(`Directory content appended successfully! (${duration}s)`);
        }
        catch (err) {
            vscode.window.showErrorMessage(`Failed to process directory: ${err}`);
        }
    });
    const appendToOutputDir = vscode.commands.registerCommand('extension.appendAllToOutputDir', async (uri) => {
        try {
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
            const startTime = Date.now();
            await appendAllToOutputDir(targetDir);
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            vscode.window.showInformationMessage(`Directory organized in 0L successfully! (${duration}s)`);
        }
        catch (err) {
            vscode.window.showErrorMessage(`Failed to organize directory: ${err}`);
        }
    });
    context.subscriptions.push(appendContent, appendToOutputDir);
}
function deactivate() {
    logger.info('Directory Digest extension deactivated.');
}
//# sourceMappingURL=extension.js.map