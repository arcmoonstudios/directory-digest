import * as path from 'path';
import * as fs from 'fs/promises';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { appendDirectoryContent, appendAllToOutputDir } from '../../extension';

interface FileSystemError extends Error {
    code?: string;
}

suite('Directory Digest Extension Test Suite', () => {
    const testFixturesDir = path.join(__dirname, '..', '..', 'test-fixtures');
    const directoryTestDir = path.join(testFixturesDir, 'directory-test');
    const recursiveTestDir = path.join(testFixturesDir, 'recursive-test');
    const excludeTestDir = path.join(testFixturesDir, 'exclude-test');
    const specialCharsDir = path.join(testFixturesDir, 'special-chars-test');

    suiteSetup(async () => {
        try {
            console.log('Test setup starting...');
            console.log('Available extensions:', vscode.extensions.all.map(e => e.id));
            
            const extensionId = 'ArcMoonStudios.directory-digest';
            console.log('Looking for extension:', extensionId);
            
            const ext = vscode.extensions.getExtension(extensionId);
            console.log('Extension found:', ext ? 'yes' : 'no');
            
            if (!ext) {
                throw new Error(`Extension ${extensionId} not found. Available extensions: ${vscode.extensions.all.map(e => e.id).join(', ')}`);
            }

            console.log('Activating extension...');
            await ext.activate();
            console.log('Extension activated successfully');
            
            // Give VS Code a moment to register commands
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('Setting up test environment...');
            await setupTestEnvironment();
            console.log('Test setup completed successfully');
        } catch (error) {
            console.error('Failed to setup test suite:', error);
            throw error;
        }
    });

    suiteTeardown(async () => {
        await cleanupTestDirectories();
    });

    /**
     * Helper function to create test files and directories
     */
    async function createTestFile(dirPath: string, fileName: string, content: string): Promise<void> {
        await fs.mkdir(dirPath, { recursive: true });
        await fs.writeFile(path.join(dirPath, fileName), content);
    }

    /**
     * Helper function to create test environment
     */
    async function setupTestEnvironment(): Promise<void> {
        // Create base test directories
        await Promise.all([
            fs.mkdir(directoryTestDir, { recursive: true }),
            fs.mkdir(recursiveTestDir, { recursive: true }),
            fs.mkdir(excludeTestDir, { recursive: true }),
            fs.mkdir(specialCharsDir, { recursive: true })
        ]);

        // Setup directory test files
        await createTestFile(directoryTestDir, 'test1.txt', 'Test content 1');
        await createTestFile(directoryTestDir, 'test2.txt', 'Test content 2');
        await createTestFile(directoryTestDir, 'test.exe', 'Binary content');
        await createTestFile(path.join(directoryTestDir, 'subfolder'), 'subtest.txt', 'Subfolder content');

        // Setup exclude test files
        await createTestFile(excludeTestDir, 'include.txt', 'Include this content');
        await createTestFile(excludeTestDir, 'exclude.exe', 'Exclude this content');
        await createTestFile(excludeTestDir, '.env', 'SECRET=test');
        await createTestFile(path.join(excludeTestDir, 'node_modules'), 'should_not_process.txt', 'Should not process');

        // Setup recursive test structure
        let currentDir = recursiveTestDir;
        for (let i = 0; i < 5; i++) {
            currentDir = path.join(currentDir, `level-${i}`);
            await createTestFile(currentDir, 'test.txt', `Level ${i} test content`);
            await createTestFile(currentDir, `extra${i}.txt`, `Extra content ${i}`);
        }

        // Setup special characters test
        const specialDir = path.join(specialCharsDir, 'special@#$chars');
        await createTestFile(specialDir, 'test.txt', 'Special characters test');
        await createTestFile(specialDir, 'test2@#.txt', 'More special characters');
        await createTestFile(path.join(specialDir, 'sub@folder'), 'sub@test.txt', 'Special subfolder content');
    }

    /**
     * Helper function to clean up test directories
     */
    async function cleanupTestDirectories(): Promise<void> {
        const dirs = [directoryTestDir, recursiveTestDir, excludeTestDir, specialCharsDir];
        for (const dir of dirs) {
            try {
                await fs.rm(dir, { recursive: true, force: true });
            } catch (err) {
                const fsError = err as FileSystemError;
                if (fsError.code !== 'ENOENT') {
                    throw err;
                }
            }
        }
    }

    suite('Command Registration Tests', () => {
        test('commands should be registered', async () => {
            const commands = await vscode.commands.getCommands(true);
            console.log('Available commands:', commands); // For debugging

            const expectedCommands = [
                'extension.appendDirectoryContent',
                'extension.appendAllToOutputDir'
            ];

            for (const cmd of expectedCommands) {
                assert.strictEqual(
                    commands.includes(cmd),
                    true,
                    `Command "${cmd}" not found in available commands: ${commands.join(', ')}`
                );
            }
        });
    });

    suite('Append Directory Content Tests', () => {
        test('should create a single file with directory contents', async () => {
            await appendDirectoryContent(directoryTestDir);

            const outputFile = path.join(directoryTestDir, 'directory-test.txt');
            const exists = await fs.access(outputFile).then(() => true).catch(() => false);
            assert.strictEqual(exists, true, 'Output file should be created');

            const content = await fs.readFile(outputFile, 'utf8');
            assert.ok(content.includes('Test content 1'), 'Should contain content from first file');
            assert.ok(content.includes('Test content 2'), 'Should contain content from second file');
            assert.ok(content.includes('Subfolder content'), 'Should contain subfolder content');
            assert.ok(!content.includes('Binary content'), 'Should not contain binary file content');
        });

        test('should handle file exclusions correctly', async () => {
            await appendDirectoryContent(excludeTestDir);

            const outputFile = path.join(excludeTestDir, 'exclude-test.txt');
            const content = await fs.readFile(outputFile, 'utf8');

            assert.ok(content.includes('Include this content'), 'Should include non-excluded content');
            assert.ok(!content.includes('Exclude this content'), 'Should not include excluded content');
            assert.ok(!content.includes('SECRET=test'), 'Should not include env file content');
            assert.ok(!content.includes('Should not process'), 'Should not include content from excluded directories');
        });

        test('should preserve directory structure information', async () => {
            await appendDirectoryContent(recursiveTestDir);

            const outputFile = path.join(recursiveTestDir, 'recursive-test.txt');
            const content = await fs.readFile(outputFile, 'utf8');

            for (let i = 0; i < 5; i++) {
                assert.ok(content.includes(`Level ${i} test content`), `Should contain content from level ${i}`);
                assert.ok(content.includes(`level-${i}`), `Should contain directory path for level ${i}`);
                assert.ok(content.includes(`Extra content ${i}`), `Should contain extra content from level ${i}`);
            }
        });

        test('should handle special characters in filenames and paths', async () => {
            await appendDirectoryContent(specialCharsDir);

            const outputFile = path.join(specialCharsDir, 'special-chars-test.txt');
            const exists = await fs.access(outputFile).then(() => true).catch(() => false);
            assert.strictEqual(exists, true, 'Sanitized output file should exist');

            const content = await fs.readFile(outputFile, 'utf8');
            assert.ok(content.includes('Special characters test'), 'Should contain main content');
            assert.ok(content.includes('More special characters'), 'Should contain content from special character files');
            assert.ok(content.includes('Special subfolder content'), 'Should contain content from special character subfolders');
        });
    });

    suite('Append All To Output Directory Tests', () => {
        test('should create organized structure in output directory', async () => {
            await appendAllToOutputDir(recursiveTestDir);

            const outputDir = path.join(recursiveTestDir, '0L');
            const treeFile = path.join(outputDir, 'tree.txt');

            const outputExists = await fs.access(outputDir).then(() => true).catch(() => false);
            const treeExists = await fs.access(treeFile).then(() => true).catch(() => false);

            assert.strictEqual(outputExists, true, 'Output directory should exist');
            assert.strictEqual(treeExists, true, 'Tree file should exist');

            const treeContent = await fs.readFile(treeFile, 'utf8');
            for (let i = 0; i < 5; i++) {
                assert.ok(treeContent.includes(`Level ${i} test content`), `Should contain content from level ${i}`);
                assert.ok(treeContent.includes(`Extra content ${i}`), `Should contain extra content from level ${i}`);
            }

            for (let i = 0; i < 5; i++) {
                const levelFile = path.join(outputDir, `level-${i}.txt`);
                const exists = await fs.access(levelFile).then(() => true).catch(() => false);
                assert.strictEqual(exists, true, `Level ${i} file should exist`);
                
                const content = await fs.readFile(levelFile, 'utf8');
                assert.ok(content.includes(`Level ${i} test content`), `Level file should contain its content`);
            }
        });

        test('should handle empty directories', async () => {
            const emptyDir = path.join(recursiveTestDir, 'empty-dir');
            await fs.mkdir(emptyDir, { recursive: true });

            await appendAllToOutputDir(recursiveTestDir);

            const outputDir = path.join(recursiveTestDir, '0L');
            const emptyDirOutput = path.join(outputDir, 'empty-dir.txt');
            
            const exists = await fs.access(emptyDirOutput).then(() => true).catch(() => false);
            assert.strictEqual(exists, false, 'Empty directory file should not be created');
        });

        test('should handle file exclusions in output directory', async () => {
            await appendAllToOutputDir(excludeTestDir);

            const outputDir = path.join(excludeTestDir, '0L');
            const treeFile = path.join(outputDir, 'tree.txt');
            const content = await fs.readFile(treeFile, 'utf8');

            assert.ok(content.includes('Include this content'), 'Should include non-excluded content');
            assert.ok(!content.includes('Exclude this content'), 'Should not include excluded content');
            assert.ok(!content.includes('SECRET=test'), 'Should not include env file content');
            assert.ok(!content.includes('Should not process'), 'Should not include content from excluded directories');
        });

        test('should handle special characters in output directory', async () => {
            await appendAllToOutputDir(specialCharsDir);

            const outputDir = path.join(specialCharsDir, '0L');
            const treeFile = path.join(outputDir, 'tree.txt');
            const dirContent = await fs.readdir(outputDir);

            const treeContent = await fs.readFile(treeFile, 'utf8');
            assert.ok(treeContent.includes('Special characters test'), 'Tree should contain special characters content');
            assert.ok(treeContent.includes('More special characters'), 'Tree should contain additional special content');
            assert.ok(treeContent.includes('Special subfolder content'), 'Tree should contain subfolder content');

            const sanitizedFiles = dirContent.filter(f => f !== 'tree.txt');
            assert.ok(sanitizedFiles.every(f => /^[a-zA-Z0-9-_]+\.txt$/.test(f)), 'All files should have sanitized names');
            
            let foundContent = false;
            for (const file of sanitizedFiles) {
                const content = await fs.readFile(path.join(outputDir, file), 'utf8');
                if (content.includes('Special characters test')) {
                    foundContent = true;
                    break;
                }
            }
            assert.ok(foundContent, 'Special characters content should be preserved in sanitized files');
        });

        test('should handle maximum directory depth', async () => {
            let currentDir = recursiveTestDir;
            for (let i = 0; i < 15; i++) {
                currentDir = path.join(currentDir, `deep-${i}`);
                await createTestFile(currentDir, 'test.txt', `Deep level ${i} content`);
            }

            await appendAllToOutputDir(recursiveTestDir);

            const outputDir = path.join(recursiveTestDir, '0L');
            const treeFile = path.join(outputDir, 'tree.txt');
            const treeContent = await fs.readFile(treeFile, 'utf8');

            for (let i = 0; i < 10; i++) {
                assert.ok(
                    treeContent.includes(`Deep level ${i} content`),
                    `Should contain content from depth ${i}`
                );
            }

            for (let i = 11; i < 15; i++) {
                assert.ok(
                    !treeContent.includes(`Deep level ${i} content`),
                    `Should not contain content from depth ${i}`
                );
            }
        });
    });

    suite('Error Handling Tests', () => {
        test('should handle non-existent directory gracefully', async () => {
            const nonExistentDir = path.join(testFixturesDir, 'non-existent-dir');
            try {
                await appendDirectoryContent(nonExistentDir);
                assert.fail('Expected error for non-existent directory');
            } catch (err) {
                assert.ok(err instanceof Error, 'Should throw an error for non-existent directory');
            }
        });

        test('should handle permission errors gracefully', async () => {
            const protectedDir = path.join(testFixturesDir, 'protected-dir');
            await fs.mkdir(protectedDir, { recursive: true });
            await fs.chmod(protectedDir, 0o000);

            try {
                await appendDirectoryContent(protectedDir);
                assert.fail('Expected error for permission denied');
            } catch (err) {
                assert.ok(err instanceof Error, 'Should throw an error for permission denied');
            } finally {
                await fs.chmod(protectedDir, 0o755);
                await fs.rm(protectedDir, { recursive: true, force: true });
            }
        });
    });
});
