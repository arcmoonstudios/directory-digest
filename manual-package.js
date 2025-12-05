const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create a temporary directory structure for packaging
const tempDir = 'temp-package';
if (fs.existsSync(tempDir)) {
    execSync(`rmdir /s /q ${tempDir}`, { shell: true });
}
fs.mkdirSync(tempDir);

// Copy essential files
const filesToCopy = [
    'package.json',
    'README.md',
    'CHANGELOG.md',
    'LICENSE',
    '.vscodeignore'
];

const dirsToCopy = [
    'dist',
    'assets'
];

// Copy files
filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(tempDir, file));
    }
});

// Copy directories
dirsToCopy.forEach(dir => {
    if (fs.existsSync(dir)) {
        execSync(`xcopy "${dir}" "${path.join(tempDir, dir)}" /E /I /H /Y`, { shell: true });
    }
});

console.log('Created temporary package structure');
console.log('Files in temp package:', fs.readdirSync(tempDir));