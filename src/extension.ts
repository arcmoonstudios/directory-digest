// src/extension.ts

import * as vscode from 'vscode';
import * as path from 'path';
import * as fsPromises from 'fs/promises';
import * as winston from 'winston';
import { excludedFileExtensions, excludedDirectories } from './config';

// Configure Logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
    ),
    transports: [
        new winston.transports.File({ filename: 'extension.log' }),
        new winston.transports.Console()
    ]
});

// Helper functions that were previously not exported
export function sanitizeFilename(filename: string): string {
    const ext = path.extname(filename);
    const basename = path.basename(filename, ext);
    const sanitized = basename.replace(/[^a-zA-Z0-9-]/g, '_');
    return `${sanitized}${ext}`;
}

export function shouldExcludeDirectory(dirName: string): boolean {
    return excludedDirectories.some(excl => {
        if (excl.includes('*')) {
            const regex = new RegExp(`^${excl.replace(/\*/g, '.*')}$`);
            return regex.test(dirName);
        }
        return excl === dirName;
    });
}

export function shouldExcludeFile(fileName: string): boolean {
    const fileExt = path.extname(fileName).toLowerCase();
    return excludedFileExtensions.some(excl => {
        if (excl.includes('*')) {
            const regex = new RegExp(`^${excl.replace(/\*/g, '.*')}$`);
            return regex.test(fileExt);
        }
        return fileExt === excl;
    });
}

export function isTextFile(filePath: string): boolean {
    const textFileExtensions = [
        '.txt', '.md', '.js', '.ts', '.json', '.html', '.css', '.py', '.java', '.c', '.cpp',
        '.rs', '.go', '.rb', '.php', '.sql', '.xml', '.yaml', '.yml', '.toml', '.ini'
    ];
    return textFileExtensions.includes(path.extname(filePath).toLowerCase());
}

/**
 * Creates a single file containing all directory contents
 */
export async function appendDirectoryContent(selectedDir: string): Promise<void> {
    const dirName = path.basename(selectedDir);
    const outputFile = path.join(selectedDir, `${sanitizeFilename(dirName)}.txt`);

    try {
        await fsPromises.writeFile(outputFile, '');
        logger.info(`Initialized output file: ${outputFile}`);

        async function processFile(filePath: string): Promise<void> {
            try {
                if (isTextFile(filePath)) {
                    const content = await fsPromises.readFile(filePath, 'utf-8');
                    const relPath = path.relative(selectedDir, filePath);
                    const header = `\nFile: ${relPath}\n${'='.repeat(relPath.length + 6)}\n`;
                    await fsPromises.appendFile(outputFile, header + content + '\n\n');
                    logger.info(`Appended content from ${filePath}`);
                }
            } catch (err) {
                logger.error(`Failed to process file ${filePath}: ${err}`);
            }
        }

        async function processDirectory(dir: string): Promise<void> {
            try {
                const entries = await fsPromises.readdir(dir, { withFileTypes: true });
                const processPromises = entries.map(async (entry) => {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isSymbolicLink()) {
                        return;
                    }
                    if (entry.isDirectory() && !shouldExcludeDirectory(entry.name)) {
                        await processDirectory(fullPath);
                    } else if (entry.isFile() && !shouldExcludeFile(entry.name)) {
                        await processFile(fullPath);
                    }
                });
                await Promise.all(processPromises);
            } catch (err) {
                logger.error(`Failed to process directory ${dir}: ${err}`);
            }
        }

        await processDirectory(selectedDir);
        logger.info(`Successfully processed directory: ${selectedDir}`);

    } catch (err) {
        logger.error(`Failed to process directory: ${err}`);
        throw err;
    }
}

/**
 * Creates organized structure in 0L directory
 */
export async function appendAllToOutputDir(selectedDir: string): Promise<void> {
    const outputDir = path.join(selectedDir, '0L');
    const treeFile = path.join(outputDir, 'tree.txt');

    try {
        await fsPromises.mkdir(outputDir, { recursive: true });
        await fsPromises.writeFile(treeFile, '');
        logger.info(`Created output directory: ${outputDir}`);

        async function processFile(dir: string, filePath: string): Promise<void> {
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
                } else {
                    const header = `\n[${path.basename(filePath)}]binary\n${'='.repeat(path.basename(filePath).length + 8)}\n`;
                    await fsPromises.appendFile(outputFile, header);
                    await fsPromises.appendFile(treeFile, header);
                    logger.info(`Processed binary file: ${filePath}`);
                }
            } catch (err) {
                logger.error(`Failed to process file ${filePath}: ${err}`);
            }
        }

        async function processDirectory(dir: string, depth: number = 0): Promise<void> {
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
                    } else if (entry.isFile() && !shouldExcludeFile(entry.name)) {
                        await processFile(dir, fullPath);
                    }
                });
                await Promise.all(processPromises);
            } catch (err) {
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

    } catch (err) {
        logger.error(`Operation failed: ${err}`);
        throw err;
    }
}

export function activate(context: vscode.ExtensionContext) {
    logger.info('Directory Digest extension activated.');

    const appendContent = vscode.commands.registerCommand('extension.appendDirectoryContent', async (uri: vscode.Uri) => {
        try {
            let targetDir: string;
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

            const startTime = Date.now();
            await appendDirectoryContent(targetDir);
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            
            vscode.window.showInformationMessage(
                `Directory content appended successfully! (${duration}s)`
            );

        } catch (err) {
            vscode.window.showErrorMessage(`Failed to process directory: ${err}`);
        }
    });

    const appendToOutputDir = vscode.commands.registerCommand('extension.appendAllToOutputDir', async (uri: vscode.Uri) => {
        try {
            let targetDir: string;
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

            const startTime = Date.now();
            await appendAllToOutputDir(targetDir);
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            
            vscode.window.showInformationMessage(
                `Directory organized in 0L successfully! (${duration}s)`
            );

        } catch (err) {
            vscode.window.showErrorMessage(`Failed to organize directory: ${err}`);
        }
    });

    context.subscriptions.push(appendContent, appendToOutputDir);
}

export function deactivate() {
    logger.info('Directory Digest extension deactivated.');
}